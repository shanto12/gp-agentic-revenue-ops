// Deep research with parallel subagent fan-out, streamed as Server-Sent Events.
// Streaming keeps the connection alive past the Netlify Free-tier 10s sync
// timeout — each subagent emits its result the moment it returns from Z.ai.

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
function bad(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const LENSES = [
  {
    id: 'hiring',
    label: 'International hiring & job posts',
    prompt: (ctx) =>
      `Find current evidence that ${ctx.company.name} is hiring in ${ctx.country} or in countries where they have no legal entity. Look at job posts, LinkedIn, Greenhouse, careers pages. Return up to 5 cited findings.`,
  },
  {
    id: 'expansion',
    label: 'Expansion announcements',
    prompt: (ctx) =>
      `Find recent press, blogs, or investor materials announcing ${ctx.company.name}'s expansion into ${ctx.country} or other new markets.`,
  },
  {
    id: 'executive',
    label: 'Executive moves with international remit',
    prompt: (ctx) =>
      `Find recent leadership changes at ${ctx.company.name} that signal international growth: VP/Head of EMEA/APAC/Latam, regional GM. Include the executive name and charter.`,
  },
  {
    id: 'compliance',
    label: 'Regulatory & compliance signals',
    prompt: (ctx) =>
      `Find regulatory filings, license applications, or earnings-call mentions where ${ctx.company.name} flags compliance burden in ${ctx.country} or other markets.`,
  },
]

const SUBAGENT_SYSTEM = `You are a research subagent with web search. Return JSON only:
{
  "summary": string,
  "findings": [ { "title": string, "link": string, "excerpt": string, "publishDate": string | null } ],
  "confidence": number
}`

async function runLens(apiKey, lens, ctx) {
  const t0 = Date.now()
  let resp
  try {
    resp = await fetch(glmEndpoint('/chat/completions'), {
      method: 'POST',
      headers: glmHeaders(apiKey),
      body: JSON.stringify({
        model: glmModel(),
        max_tokens: 900,
        temperature: 0.3,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        tools: [
          {
            type: 'web_search',
            web_search: {
              enable: 'True',
              search_engine: 'search-prime',
              search_result: 'True',
              count: '4',
              content_size: 'medium',
              search_recency_filter: 'noLimit',
              search_prompt: `${lens.label} for ${ctx.company.name}.`,
            },
          },
        ],
        messages: [
          { role: 'system', content: SUBAGENT_SYSTEM },
          { role: 'user', content: lens.prompt(ctx) },
        ],
      }),
    })
  } catch (err) {
    return {
      lens: lens.id,
      label: lens.label,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `fetch failed: ${err?.message ?? 'unknown'}`,
    }
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    return {
      lens: lens.id,
      label: lens.label,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `${resp.status}: ${text.slice(0, 200)}`,
    }
  }
  const j = await resp.json()
  const content =
    j.choices?.[0]?.message?.content?.trim() ??
    j.choices?.[0]?.message?.reasoning_content?.trim() ??
    ''
  let parsed = null
  try {
    parsed = parseJsonObject(content)
  } catch {
    return {
      lens: lens.id,
      label: lens.label,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: 'subagent output not valid JSON',
    }
  }
  return {
    lens: lens.id,
    label: lens.label,
    status: 'ok',
    latencyMs: Date.now() - t0,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 5) : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
    usage: j.usage ?? null,
  }
}

export default async (req) => {
  if (req.method !== 'POST') return bad(405, 'POST required')

  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) return bad(503, 'Deep research requires GLM_API_KEY in Netlify env.')

  let payload
  try {
    payload = await req.json()
  } catch {
    return bad(400, 'invalid JSON body')
  }
  const { company, country } = payload ?? {}
  if (!company?.name || !country) {
    return bad(400, 'company.name and country are required')
  }
  const ctx = { company, country }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }
      const start = Date.now()
      send('start', {
        lensCount: LENSES.length,
        lenses: LENSES.map((l) => ({ id: l.id, label: l.label })),
        modelId: glmModel(),
      })

      // Parallel fan-out — emit each lens result as soon as it returns.
      // Promise.allSettled so a single failure doesn't break the run.
      let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      let successCount = 0
      const promises = LENSES.map((lens) =>
        runLens(apiKey, lens, ctx)
          .then((result) => {
            send('lens', result)
            if (result.status === 'ok') successCount++
            const u = result.usage ?? {}
            totalUsage = {
              prompt_tokens: totalUsage.prompt_tokens + (u.prompt_tokens ?? 0),
              completion_tokens: totalUsage.completion_tokens + (u.completion_tokens ?? 0),
              total_tokens: totalUsage.total_tokens + (u.total_tokens ?? 0),
            }
          })
          .catch((err) => {
            send('lens', {
              lens: lens.id,
              label: lens.label,
              status: 'error',
              latencyMs: 0,
              error: err?.message ?? 'unknown',
            })
          }),
      )

      // Heartbeat while waiting — keeps the Netlify edge proxy from killing the connection.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive\n\n`))
      }, 8000)

      await Promise.all(promises)
      clearInterval(heartbeat)
      send('done', {
        totalLatencyMs: Date.now() - start,
        lensCount: LENSES.length,
        successCount,
        totalUsage,
      })
      controller.close()
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
