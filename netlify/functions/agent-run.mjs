// Server-side AI boundary, streamed via Server-Sent Events.
// Streaming keeps the Netlify edge proxy from killing the connection past
// its inactivity timeout while GLM-5.1 takes its time generating output.
//
// Events emitted (in order):
//   start  { modelId, useWebSearch }
//   delta  { text }                          (incremental, optional)
//   result { draft, webSearchHits, usage }   (final, after JSON parse succeeds)
//   error  { message }                       (terminal, on failure)
//   done   {}                                (always last)

const CODING_BASE = 'https://api.z.ai/api/coding/paas/v4'
const STANDARD_BASE = 'https://api.z.ai/api/paas/v4'

function glmEndpoint(path) {
  const base = process.env.GLM_USE_STANDARD_ENDPOINT === 'true' ? STANDARD_BASE : CODING_BASE
  return `${base}${path}`
}
function glmModel() {
  return process.env.GLM_MODEL ?? 'glm-5.1'
}
function glmHeaders(apiKey) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  }
}
function parseJsonObject(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('no JSON object detected')
  return JSON.parse(trimmed.slice(start, end + 1))
}
function badJson(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const SYSTEM_PROMPT = `You are an autonomous marketing agent that drafts brand-safe nurture sequences for an Employer of Record (EOR) buyer ICP. You write evidence-led, calm, operator-grade outbound. You never use marketing jargon ("synergy", "game-changing", "rockstar", "limited time"). You never name competitors. You always cite the exact public signal that triggered the outreach. Output JSON only matching the requested schema.`

const SCHEMA_HINT = `{
  "rationale": string,
  "brandVoiceCitations": string[],
  "steps": [
    { "channel": "email" | "linkedin" | "ad", "delayHours": number, "subject"?: string, "body": string, "personalisationCitations": string[] }
  ]
}`

function buildUserPrompt({ signal, company, brandVoiceMarkdown, ragHits, icpBand }) {
  return `Public buyer-intent signal:
- type: ${signal.type}
- headline: ${signal.headline}
- detail: ${signal.detail}
- countryFocus: ${signal.countryFocus}

Company context:
- name: ${company.name}
- hqCountry: ${company.hqCountry}
- industry: ${company.industry}
- employeeBand: ${company.employeeBand}
- fundingStage: ${company.fundingStage}
- existingEntities: ${JSON.stringify(company.existingEntities)}
- icpBand: ${icpBand}

Brand-voice doc (must follow):
${brandVoiceMarkdown}

Top RAG hits (cite by docId):
${(ragHits ?? [])
  .map((h) => `- [${h.docId}] (${h.kind}) ${h.title}: ${h.excerpt}`)
  .join('\n')}

Produce a 3-step nurture sequence (email → linkedin → email) with delays of 0h, 72h, 168h.
Return JSON only matching this schema. Do not wrap in code fences. Output the JSON object as the entire message.

${SCHEMA_HINT}`
}

export default async (req) => {
  if (req.method !== 'POST') return badJson(405, 'POST required')

  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    return badJson(503, 'Live mode not configured. Set GLM_API_KEY in Netlify env to enable.')
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return badJson(400, 'invalid JSON body')
  }
  const { signal, company, ragHits, brandVoiceMarkdown, icpBand, useWebSearch = false } =
    payload ?? {}
  if (!signal || !company || !brandVoiceMarkdown) {
    return badJson(400, 'signal, company, and brandVoiceMarkdown are required')
  }

  const userPrompt = buildUserPrompt({ signal, company, brandVoiceMarkdown, ragHits, icpBand })

  const tools = useWebSearch
    ? [
        {
          type: 'web_search',
          web_search: {
            enable: 'True',
            search_engine: 'search-prime',
            search_result: 'True',
            count: '3',
            content_size: 'medium',
            search_recency_filter: 'noLimit',
            search_prompt: `Buyer-intent evidence for ${company.name} in ${signal.countryFocus}.`,
          },
        },
      ]
    : []

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event, data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          )
        } catch {
          // controller already closed
        }
      }

      send('start', { modelId: glmModel(), useWebSearch: tools.length > 0 })

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          /* noop */
        }
      }, 6000)

      try {
        const requestBody = {
          model: glmModel(),
          max_tokens: 1400,
          temperature: 0.4,
          stream: true,
          thinking: { type: 'disabled' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }
        if (tools.length > 0) requestBody.tools = tools
        if (process.env.GLM_FORCE_JSON_MODE === 'true') {
          requestBody.response_format = { type: 'json_object' }
        }

        const upstream = await fetch(glmEndpoint('/chat/completions'), {
          method: 'POST',
          headers: glmHeaders(apiKey),
          body: JSON.stringify(requestBody),
        })

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => '')
          send('error', { message: `z.ai upstream ${upstream.status}: ${text.slice(0, 300)}` })
          send('done', {})
          clearInterval(heartbeat)
          controller.close()
          return
        }

        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''
        let webSearchHits = []
        let usage = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            let chunk
            try {
              chunk = JSON.parse(data)
            } catch {
              continue
            }
            const delta = chunk.choices?.[0]?.delta ?? {}
            const piece =
              (typeof delta.content === 'string' && delta.content) ||
              (typeof delta.reasoning_content === 'string' && delta.reasoning_content) ||
              ''
            if (piece) {
              accumulated += piece
              // Forward small chunks for liveness; client may render or ignore.
              send('delta', { text: piece })
            }
            if (Array.isArray(chunk.web_search) && chunk.web_search.length) {
              webSearchHits = chunk.web_search
            }
            if (chunk.usage) usage = chunk.usage
          }
        }

        if (!accumulated.trim()) {
          send('error', { message: 'z.ai returned empty content' })
          send('done', {})
          clearInterval(heartbeat)
          controller.close()
          return
        }

        let draft
        try {
          draft = parseJsonObject(accumulated)
        } catch (err) {
          send('error', {
            message: `model output not valid JSON: ${err?.message ?? 'unknown'}`,
            raw: accumulated.slice(0, 600),
          })
          send('done', {})
          clearInterval(heartbeat)
          controller.close()
          return
        }

        send('result', {
          modelMode: 'live-glm',
          modelId: glmModel(),
          provider: 'z.ai',
          usage,
          webSearchHits: webSearchHits.map((h) => ({
            title: h.title,
            link: h.link,
            publishDate: h.publish_date ?? null,
            refer: h.refer ?? null,
            excerpt: typeof h.content === 'string' ? h.content.slice(0, 480) : '',
          })),
          draft,
        })
        send('done', {})
      } catch (err) {
        send('error', { message: err?.message ?? 'unknown error' })
        send('done', {})
      } finally {
        clearInterval(heartbeat)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  })
}
