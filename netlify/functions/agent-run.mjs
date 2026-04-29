// Server-side AI boundary, streamed via Server-Sent Events.
//
// Parallel subagent pipeline (4 fan-out subagents + 1 consolidator), all on
// GLM-5.1. Each subagent returns the moment it lands, so the operator sees
// progress while the slowest one is still running. The consolidator then picks
// the winning variant from the 3 nurture drafts.
//
// Subagents:
//   research-enricher  GLM + web_search (count 5, content_size high)
//   draft-compliance   GLM + web_search (count 3, content_size medium)
//   draft-talent       GLM + web_search (count 3, content_size medium)
//   draft-speed        GLM + web_search (count 3, content_size medium)
//   consolidator       GLM (no web_search) — scores variants, picks winner
//
// SSE events emitted (in order):
//   start         { plannedSubagents: 4, modelId: 'glm-5.1' }
//   subagent      { id, status: 'ok'|'error', latencyMs, payload?, error?, usage?, webSearchHitCount? }
//                 (4 of these — one per subagent, fired the moment each lands)
//   consolidating {}
//   consolidator  { winnerVariant, evaluatorScores, rationale, latencyMs }
//   result        { drafts, research, winner, totalLatencyMs, totalUsage, webSearchHitCount }
//   done          {}

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
function badResponse(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const COMMON_VOICE = `You write evidence-led, calm, operator-grade outbound for an Employer of Record (EOR) buyer ICP. Never use marketing jargon (synergy, game-changing, rockstar, limited time, act now). Never name competitors. Always cite the exact public signal that triggered the outreach. Output JSON only matching the requested schema. No markdown fences.`

const NURTURE_SCHEMA = `{
  "rationale": string,
  "brandVoiceCitations": string[],
  "steps": [
    { "channel": "email" | "linkedin" | "ad", "delayHours": number, "subject"?: string, "body": string, "personalisationCitations": string[] }
  ]
}`

const RESEARCH_SCHEMA = `{
  "keyFacts": string[],
  "publicEvidence": [ { "title": string, "link": string, "publishDate": string | null } ],
  "confidence": number
}`

const CONSOLIDATOR_SCHEMA = `{
  "winnerVariant": "compliance" | "talent" | "speed",
  "evaluatorScores": {
    "compliance": { "brandVoiceFit": number, "hallucinationRisk": number, "icpConfidence": number, "flagged": string[] },
    "talent":     { "brandVoiceFit": number, "hallucinationRisk": number, "icpConfidence": number, "flagged": string[] },
    "speed":      { "brandVoiceFit": number, "hallucinationRisk": number, "icpConfidence": number, "flagged": string[] }
  },
  "rationale": string
}`

function ragHitsBlock(ragHits) {
  if (!ragHits || ragHits.length === 0) return '(no RAG hits)'
  return ragHits
    .map((h) => `- [${h.docId}] (${h.kind}) ${h.title}: ${h.excerpt}`)
    .join('\n')
}

function contextBlock({ signal, company, brandVoiceMarkdown, ragHits, icpBand }) {
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
${ragHitsBlock(ragHits)}`
}

// ── Subagent definitions ────────────────────────────────────────────────────

function buildResearchSubagent(ctx) {
  const { company, signal } = ctx
  return {
    id: 'research-enricher',
    temperature: 0.3,
    webSearch: {
      count: '5',
      content_size: 'high',
      search_prompt: `Latest 2026 news on ${company.name} in ${signal.countryFocus}: hiring posts, funding rounds, regulatory filings, executive moves.`,
    },
    system: `You are a research enrichment subagent with web search. ${COMMON_VOICE}`,
    user: `Search the open web for the latest 2026 news on ${company.name} in ${signal.countryFocus}. Focus on hiring posts, funding rounds, regulatory filings, executive moves, and entity-status changes.

Context:
${contextBlock(ctx)}

Return up to 6 keyFacts (one short sentence each, factual, evidence-led) and the public evidence URLs that back them. Confidence is 0-100 and reflects your honest read of evidence quality.

Return JSON only matching this schema. Do not wrap in code fences.

${RESEARCH_SCHEMA}`,
  }
}

function buildDraftSubagent(ctx, lens) {
  const { company, signal } = ctx
  const lensSpec = {
    compliance: {
      pain: 'compliance / regulatory / audit-defensibility',
      hook: `Lead with the regulatory and audit-defensibility pain of operating in ${signal.countryFocus} without a registered entity. Reference the typical 60-90 day compliance pressure curve.`,
      searchPrompt: `Compliance, regulatory filings, payroll classification risk for ${company.name} in ${signal.countryFocus}.`,
    },
    talent: {
      pain: 'talent / hiring-velocity',
      hook: `Lead with hiring velocity. Concrete example: "you can have a Berlin SWE under contract in 5 days." Cite the specific roles in flight.`,
      searchPrompt: `${company.name} hiring posts, open roles, talent demand in ${signal.countryFocus}.`,
    },
    speed: {
      pain: 'speed-to-market / first-mover-advantage',
      hook: `Lead with speed-to-market and first-mover advantage in ${signal.countryFocus}. Reference how slower competitors lose the entry window.`,
      searchPrompt: `Market entry speed, first-mover advantage, expansion timelines for ${company.industry} into ${signal.countryFocus}.`,
    },
  }[lens]

  return {
    id: `draft-${lens}`,
    temperature: 0.4,
    webSearch: {
      count: '3',
      content_size: 'medium',
      search_prompt: lensSpec.searchPrompt,
    },
    system: `You are a nurture-draft subagent with web search. ${COMMON_VOICE}`,
    user: `Draft a 3-step nurture sequence (email, linkedin, email) with delays of 0h, 72h, 168h.

LENS: ${lens} — ${lensSpec.pain}.
${lensSpec.hook}
Cite at least one public-evidence URL discovered via web search inside personalisationCitations of step 1 (use the URL itself).

Context:
${contextBlock(ctx)}

Return JSON only matching this schema. Do not wrap in code fences.

${NURTURE_SCHEMA}`,
  }
}

// ── GLM call helpers ────────────────────────────────────────────────────────

async function runSubagent(apiKey, agent, timeoutMs = 38000) {
  const t0 = Date.now()
  const tools = [
    {
      type: 'web_search',
      web_search: {
        enable: 'True',
        search_engine: 'search-prime',
        search_result: 'True',
        count: agent.webSearch.count,
        content_size: agent.webSearch.content_size,
        search_recency_filter: 'noLimit',
        search_prompt: agent.webSearch.search_prompt,
      },
    },
  ]
  // Per-subagent timeout. If the upstream stalls, abort so the run still closes
  // within Netlify's ~60s streaming cap. The whole run budget is 4 subagents in
  // parallel (~max 38s) + consolidator (~10s) = ~48s, comfortably under 60s.
  const ac = new AbortController()
  const timeoutId = setTimeout(() => ac.abort(), timeoutMs)
  let resp
  try {
    resp = await fetch(glmEndpoint('/chat/completions'), {
      method: 'POST',
      headers: glmHeaders(apiKey),
      signal: ac.signal,
      body: JSON.stringify({
        model: glmModel(),
        max_tokens: 900,
        temperature: agent.temperature,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        tools,
        messages: [
          { role: 'system', content: agent.system },
          { role: 'user', content: agent.user },
        ],
      }),
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const aborted = err?.name === 'AbortError'
    return {
      id: agent.id,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: aborted
        ? `subagent timed out after ${timeoutMs}ms`
        : `fetch failed: ${err?.message ?? 'unknown'}`,
    }
  }
  clearTimeout(timeoutId)
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    return {
      id: agent.id,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `${resp.status}: ${text.slice(0, 200)}`,
    }
  }
  let body
  try {
    body = await resp.json()
  } catch (err) {
    return {
      id: agent.id,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `upstream JSON parse failed: ${err?.message ?? 'unknown'}`,
    }
  }
  const content =
    body.choices?.[0]?.message?.content?.trim() ??
    body.choices?.[0]?.message?.reasoning_content?.trim() ??
    ''
  if (!content) {
    return {
      id: agent.id,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: 'subagent returned empty content',
    }
  }
  let payload
  try {
    payload = parseJsonObject(content)
  } catch (err) {
    return {
      id: agent.id,
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `subagent output not valid JSON: ${err?.message ?? 'unknown'}`,
      raw: content.slice(0, 600),
    }
  }
  const webSearchRaw =
    Array.isArray(body.web_search) && body.web_search.length
      ? body.web_search
      : Array.isArray(body.choices?.[0]?.message?.web_search)
        ? body.choices[0].message.web_search
        : []
  const webSearchHits = webSearchRaw.map((h) => ({
    title: h?.title ?? '',
    link: h?.link ?? '',
    publishDate: h?.publish_date ?? null,
    refer: h?.refer ?? null,
    excerpt: typeof h?.content === 'string' ? h.content.slice(0, 480) : '',
  }))
  return {
    id: agent.id,
    status: 'ok',
    latencyMs: Date.now() - t0,
    payload,
    usage: body.usage ?? null,
    webSearchHits,
    webSearchHitCount: webSearchHits.length,
  }
}

async function runConsolidator(apiKey, { research, drafts, signal, company }) {
  const t0 = Date.now()
  const draftSummaries = Object.entries(drafts)
    .map(([variant, draft]) => {
      if (!draft) return `- ${variant}: (subagent failed, no draft)`
      const head = (draft.steps?.[0]?.body ?? '').slice(0, 600)
      return `- ${variant}:\n  rationale: ${draft.rationale ?? '(none)'}\n  step1Body: ${head}`
    })
    .join('\n')
  const researchBlock = research
    ? `keyFacts: ${JSON.stringify(research.keyFacts ?? [])}\nconfidence: ${research.confidence ?? 'n/a'}`
    : '(research subagent failed)'
  const userPrompt = `You are evaluating 3 nurture-draft variants for ${company.name} in ${signal.countryFocus}.

Research key-facts:
${researchBlock}

Draft variants:
${draftSummaries}

Score each variant 0-100 on brandVoiceFit, hallucinationRisk (0=safe, 100=risky), icpConfidence; flag any forbidden marketing-jargon terms in the body. Pick winnerVariant = the variant with the highest brandVoiceFit AND lowest hallucinationRisk. Tie-break on icpConfidence.

Return JSON only matching this schema. Do not wrap in code fences.

${CONSOLIDATOR_SCHEMA}`
  let resp
  try {
    resp = await fetch(glmEndpoint('/chat/completions'), {
      method: 'POST',
      headers: glmHeaders(apiKey),
      body: JSON.stringify({
        model: glmModel(),
        max_tokens: 800,
        temperature: 0.3,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a brand-voice and hallucination evaluator. ${COMMON_VOICE}`,
          },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `fetch failed: ${err?.message ?? 'unknown'}`,
    }
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `${resp.status}: ${text.slice(0, 200)}`,
    }
  }
  let body
  try {
    body = await resp.json()
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `consolidator JSON parse failed: ${err?.message ?? 'unknown'}`,
    }
  }
  const content =
    body.choices?.[0]?.message?.content?.trim() ??
    body.choices?.[0]?.message?.reasoning_content?.trim() ??
    ''
  if (!content) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: 'consolidator returned empty content',
    }
  }
  let payload
  try {
    payload = parseJsonObject(content)
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: `consolidator output not valid JSON: ${err?.message ?? 'unknown'}`,
    }
  }
  return {
    status: 'ok',
    latencyMs: Date.now() - t0,
    payload,
    usage: body.usage ?? null,
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method !== 'POST') return badResponse(405, 'POST required')

  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    return badResponse(503, 'Live mode not configured. Set GLM_API_KEY in Netlify env to enable.')
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return badResponse(400, 'invalid JSON body')
  }
  const { signal, company, ragHits, brandVoiceMarkdown, icpBand } = payload ?? {}
  if (!signal || !company || !brandVoiceMarkdown) {
    return badResponse(400, 'signal, company, and brandVoiceMarkdown are required')
  }
  const ctx = { signal, company, ragHits, brandVoiceMarkdown, icpBand }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let closed = false
      const send = (event, data) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // controller already closed
        }
      }
      const heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          /* noop */
        }
      }, 6000)

      const t0 = Date.now()
      send('start', { plannedSubagents: 4, modelId: glmModel() })

      const subagentSpecs = [
        buildResearchSubagent(ctx),
        buildDraftSubagent(ctx, 'compliance'),
        buildDraftSubagent(ctx, 'talent'),
        buildDraftSubagent(ctx, 'speed'),
      ]

      // Fire all 4 in parallel. Each emits its own subagent event the moment
      // it lands. Promise.allSettled-style: one failure doesn't take down the run.
      // Per-subagent timeout (38s) bounds the worst case so the consolidator
      // always gets to run within Netlify's 60s streaming cap.
      const settled = {}
      const promises = subagentSpecs.map((spec) =>
        runSubagent(apiKey, spec, 38000)
          .catch((err) => ({
            id: spec.id,
            status: 'error',
            latencyMs: 0,
            error: err?.message ?? 'unknown',
          }))
          .then((result) => {
            settled[spec.id] = result
            const eventPayload = {
              id: result.id,
              status: result.status,
              latencyMs: result.latencyMs,
            }
            if (result.status === 'ok') {
              eventPayload.payload = result.payload
              eventPayload.usage = result.usage
              eventPayload.webSearchHitCount = result.webSearchHitCount
              eventPayload.webSearchHits = result.webSearchHits
            } else {
              eventPayload.error = result.error
            }
            send('subagent', eventPayload)
          }),
      )
      await Promise.all(promises)

      const research = settled['research-enricher']
      const drafts = {
        compliance: settled['draft-compliance']?.status === 'ok'
          ? settled['draft-compliance'].payload
          : null,
        talent: settled['draft-talent']?.status === 'ok'
          ? settled['draft-talent'].payload
          : null,
        speed: settled['draft-speed']?.status === 'ok' ? settled['draft-speed'].payload : null,
      }

      // Collect totalUsage + total web-search hits across the 4 subagents.
      let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      let webSearchHitCount = 0
      for (const id of Object.keys(settled)) {
        const r = settled[id]
        if (r.status !== 'ok') continue
        const u = r.usage ?? {}
        totalUsage = {
          prompt_tokens: totalUsage.prompt_tokens + (u.prompt_tokens ?? 0),
          completion_tokens: totalUsage.completion_tokens + (u.completion_tokens ?? 0),
          total_tokens: totalUsage.total_tokens + (u.total_tokens ?? 0),
        }
        webSearchHitCount += r.webSearchHitCount ?? 0
      }

      send('consolidating', {})
      const consolidator = await runConsolidator(apiKey, {
        research: research?.status === 'ok' ? research.payload : null,
        drafts,
        signal,
        company,
      }).catch((err) => ({
        status: 'error',
        latencyMs: 0,
        error: err?.message ?? 'unknown',
      }))

      let winnerVariant = null
      let evaluatorScores = null
      let consolidatorRationale = null
      if (consolidator.status === 'ok') {
        const p = consolidator.payload ?? {}
        winnerVariant =
          ['compliance', 'talent', 'speed'].includes(p.winnerVariant) && drafts[p.winnerVariant]
            ? p.winnerVariant
            : null
        evaluatorScores = p.evaluatorScores ?? null
        consolidatorRationale = typeof p.rationale === 'string' ? p.rationale : null
        if (consolidator.usage) {
          const u = consolidator.usage
          totalUsage = {
            prompt_tokens: totalUsage.prompt_tokens + (u.prompt_tokens ?? 0),
            completion_tokens: totalUsage.completion_tokens + (u.completion_tokens ?? 0),
            total_tokens: totalUsage.total_tokens + (u.total_tokens ?? 0),
          }
        }
        send('consolidator', {
          winnerVariant,
          evaluatorScores,
          rationale: consolidatorRationale,
          latencyMs: consolidator.latencyMs,
        })
      } else {
        send('consolidator', {
          winnerVariant: null,
          evaluatorScores: null,
          rationale: null,
          latencyMs: consolidator.latencyMs ?? 0,
          error: consolidator.error ?? 'consolidator failed',
        })
      }

      // Fallback winner: if consolidator failed but at least one draft landed,
      // pick the first available variant in canonical order so the UI still
      // has something to show.
      if (!winnerVariant) {
        for (const v of ['compliance', 'talent', 'speed']) {
          if (drafts[v]) {
            winnerVariant = v
            break
          }
        }
      }

      send('result', {
        modelMode: 'live-glm',
        modelId: glmModel(),
        provider: 'z.ai',
        drafts,
        research: research?.status === 'ok' ? research.payload : null,
        winner: winnerVariant
          ? {
              variant: winnerVariant,
              draft: drafts[winnerVariant],
              evaluatorScores: evaluatorScores?.[winnerVariant] ?? null,
              rationale: consolidatorRationale,
            }
          : null,
        totalLatencyMs: Date.now() - t0,
        totalUsage,
        webSearchHitCount,
      })
      send('done', {})
      clearInterval(heartbeat)
      closed = true
      try {
        controller.close()
      } catch {
        /* noop */
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
