// Refresh signals — fetches a fresh batch of REAL, public-web buyer-intent
// signals via GLM-5.1 + web_search, persists the normalized payload to the
// "signals-cache" Netlify Blobs store under key "current", and streams the
// same SSE event shape as /api/live-signals so the client UX is identical.
//
// The persist step happens BEFORE we emit the `result` event, so by the time
// the streaming client receives the payload, /api/cached-signals will already
// return it on the next visit.
//
// This file is intentionally self-contained — per the master plan, function
// files do not share imports across function siblings. The GLM helpers are
// inlined from live-signals.mjs.

import { getStore } from '@netlify/blobs'

const CODING_BASE = 'https://api.z.ai/api/coding/paas/v4'
const STANDARD_BASE = 'https://api.z.ai/api/paas/v4'
const STORE_NAME = 'signals-cache'
const STORE_KEY = 'current'

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

const FLAGS = {
  US: '🇺🇸', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸',
  NL: '🇳🇱', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', IE: '🇮🇪', PT: '🇵🇹',
  CH: '🇨🇭', AT: '🇦🇹', BE: '🇧🇪', PL: '🇵🇱', CZ: '🇨🇿',
  CA: '🇨🇦', MX: '🇲🇽', BR: '🇧🇷', AR: '🇦🇷', CL: '🇨🇱', CO: '🇨🇴', PE: '🇵🇪',
  AU: '🇦🇺', NZ: '🇳🇿', SG: '🇸🇬', JP: '🇯🇵', KR: '🇰🇷', HK: '🇭🇰', IN: '🇮🇳',
  AE: '🇦🇪', SA: '🇸🇦', IL: '🇮🇱', ZA: '🇿🇦', NG: '🇳🇬', KE: '🇰🇪',
  EU: '🇪🇺',
}
const NAME_TO_ISO = {
  'united states': 'US', 'usa': 'US', 'u.s.': 'US', 'us': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB', 'england': 'GB',
  germany: 'DE', france: 'FR', italy: 'IT', spain: 'ES',
  netherlands: 'NL', sweden: 'SE', norway: 'NO', denmark: 'DK', finland: 'FI',
  ireland: 'IE', portugal: 'PT', switzerland: 'CH', austria: 'AT',
  belgium: 'BE', poland: 'PL',
  canada: 'CA', mexico: 'MX', brazil: 'BR', argentina: 'AR', chile: 'CL',
  australia: 'AU', 'new zealand': 'NZ', singapore: 'SG', japan: 'JP',
  'south korea': 'KR', korea: 'KR', 'hong kong': 'HK', india: 'IN',
  uae: 'AE', 'united arab emirates': 'AE', 'saudi arabia': 'SA',
  israel: 'IL', 'south africa': 'ZA', emea: 'EU', europe: 'EU',
}

function flagFor(countryFocus) {
  if (!countryFocus) return '🌐'
  const lower = countryFocus.toLowerCase().trim()
  if (NAME_TO_ISO[lower] && FLAGS[NAME_TO_ISO[lower]]) return FLAGS[NAME_TO_ISO[lower]]
  for (const key of Object.keys(NAME_TO_ISO)) {
    if (lower.includes(key)) return FLAGS[NAME_TO_ISO[key]]
  }
  const upper = countryFocus.toUpperCase().trim()
  if (FLAGS[upper]) return FLAGS[upper]
  return '🌐'
}

const ALLOWED_TYPES = new Set([
  'HIRING_INTL',
  'FUNDING',
  'EXPANSION',
  'EXEC_HIRE',
  'COMPLIANCE',
])

function normaliseSignals(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s) => s && typeof s === 'object')
    .map((s, i) => {
      const type = ALLOWED_TYPES.has(s.type) ? s.type : 'EXPANSION'
      const companyId = (s.companyId ?? `live-co-${i + 1}`).toString().slice(0, 64)
      const countryFocus = (s.countryFocus ?? 'Global').toString().slice(0, 80)
      return {
        id: `sig-live-${String(i + 1).padStart(3, '0')}`,
        type,
        companyId,
        headline: (s.headline ?? '').toString().slice(0, 240),
        detail: (s.detail ?? '').toString().slice(0, 600),
        sourceUrl: typeof s.sourceUrl === 'string' ? s.sourceUrl : '',
        capturedAt: new Date().toISOString(),
        countryFocus,
        countryFlag: flagFor(countryFocus),
        rawPayload: {
          provider: 'glm-5.1+web_search',
          searchRefer: s.refer ?? null,
        },
      }
    })
    .filter((s) => s.headline && s.companyId)
    .slice(0, 9)
}

function normaliseCompanies(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c && typeof c === 'object')
    .map((c, i) => {
      const hqCountry = (c.hqCountry ?? 'Unknown').toString().slice(0, 80)
      const id = (c.id ?? `live-co-${i + 1}`).toString().slice(0, 64)
      const existing = Array.isArray(c.existingEntities)
        ? c.existingEntities.map((e) => String(e).slice(0, 80)).slice(0, 8)
        : []
      const signals = Array.isArray(c.publicSignals)
        ? c.publicSignals.map((s) => String(s).slice(0, 240)).slice(0, 6)
        : []
      return {
        id,
        name: (c.name ?? 'Unknown').toString().slice(0, 120),
        hqCountry,
        hqFlag: flagFor(hqCountry),
        industry: (c.industry ?? 'Unknown').toString().slice(0, 80),
        employeeBand: (c.employeeBand ?? 'mid-market').toString().slice(0, 80),
        fundingStage: (c.fundingStage ?? 'Unknown').toString().slice(0, 80),
        revenueBand: (c.revenueBand ?? 'undisclosed').toString().slice(0, 60),
        hasGlobalHrFootprint: existing.length > 1,
        existingEntities: existing,
        publicSignals: signals,
      }
    })
    .slice(0, 9)
}

const SYSTEM_PROMPT = `You are a live buyer-intent research agent for an Employer of Record (EOR) marketing team. You search the public web in real time and return ONLY publicly disclosed signals about real, named companies. You never invent companies or signals. If you cannot find enough fresh signals, return what you have. Output JSON only.`

function buildUserPrompt({ countriesHint }) {
  const focus =
    countriesHint && countriesHint.length > 0
      ? countriesHint.join(', ')
      : 'Germany, United Kingdom, Singapore, Brazil'
  return `Find 4 REAL, NAMED mid-market companies (200–5000 employees) that have publicly disclosed an EOR-relevant intent signal in the last 90 days: international hiring, funding for global expansion, new market press, executive hire with global remit, or compliance / regulatory filing. Prefer verifiable URLs.

Target geographies: ${focus}

Return JSON only, with exactly 1 signal per company:
{
  "companies": [
    { "id": string, "name": string, "hqCountry": string, "industry": string, "employeeBand": string, "fundingStage": string, "revenueBand": string, "existingEntities": string[], "publicSignals": string[] }
  ],
  "signals": [
    { "companyId": string, "type": "HIRING_INTL"|"FUNDING"|"EXPANSION"|"EXEC_HIRE"|"COMPLIANCE", "headline": string, "detail": string, "sourceUrl": string, "countryFocus": string }
  ]
}

Be concise. Headlines under 140 chars, details 1-2 sentences. Do not invent URLs.`
}

async function persistToBlobs(payload) {
  // Best-effort write. If Blobs is unavailable (e.g. local dev without
  // netlify dev), we still want the SSE result to reach the client.
  try {
    const store = getStore(STORE_NAME)
    await store.setJSON(STORE_KEY, payload)
    return { persisted: true }
  } catch (err) {
    return { persisted: false, error: err?.message ?? 'unknown' }
  }
}

export default async (req) => {
  if (req.method !== 'POST') return badJson(405, 'POST required')

  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    return badJson(503, 'Refresh signals require GLM_API_KEY in Netlify env.')
  }

  let payload = {}
  try {
    payload = await req.json().catch(() => ({}))
  } catch {
    payload = {}
  }
  const countriesHint = Array.isArray(payload?.countries)
    ? payload.countries.filter((c) => typeof c === 'string').slice(0, 6)
    : null

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event, data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          )
        } catch {
          /* controller closed */
        }
      }
      send('start', { provider: 'z.ai', model: glmModel(), mode: 'live', cache: 'write-through' })

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          /* noop */
        }
      }, 6000)

      try {
        send('progress', { phase: 'searching', note: 'querying public web for fresh signals' })

        const upstream = await fetch(glmEndpoint('/chat/completions'), {
          method: 'POST',
          headers: glmHeaders(apiKey),
          body: JSON.stringify({
            model: glmModel(),
            max_tokens: 1500,
            temperature: 0.3,
            stream: true,
            thinking: { type: 'disabled' },
            response_format: { type: 'json_object' },
            tools: [
              {
                type: 'web_search',
                web_search: {
                  enable: 'True',
                  search_engine: 'search-prime',
                  search_result: 'True',
                  count: '3',
                  content_size: 'low',
                  search_recency_filter: 'noLimit',
                  search_prompt:
                    'Mid-market companies expanding internationally — public hiring/funding/expansion press.',
                },
              },
            ],
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserPrompt({ countriesHint }) },
            ],
          }),
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
        let webHits = []
        let lastNote = 0

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
            if (piece) accumulated += piece
            if (Array.isArray(chunk.web_search) && chunk.web_search.length) {
              webHits = chunk.web_search
            }
            if (accumulated.length - lastNote > 800) {
              lastNote = accumulated.length
              send('progress', {
                phase: 'parsing',
                note: `received ${accumulated.length} characters`,
              })
            }
          }
        }

        if (!accumulated.trim()) {
          send('error', { message: 'z.ai returned empty content' })
          send('done', {})
          clearInterval(heartbeat)
          controller.close()
          return
        }

        let parsed
        try {
          parsed = parseJsonObject(accumulated)
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

        send('progress', { phase: 'enriching', note: 'normalizing payload' })
        const companies = normaliseCompanies(parsed.companies ?? [])
        const signals = normaliseSignals(parsed.signals ?? [])
        const capturedAt = new Date().toISOString()

        // Persist to Netlify Blobs BEFORE emitting `result` so the next
        // /api/cached-signals call already serves this payload.
        const cachePayload = { signals, companies, capturedAt }
        send('progress', { phase: 'caching', note: 'writing payload to signals-cache blob' })
        const persistResult = await persistToBlobs(cachePayload)

        send('result', {
          modelMode: 'live-glm',
          modelId: glmModel(),
          provider: 'z.ai',
          capturedAt,
          companyCount: companies.length,
          signalCount: signals.length,
          webSearchHitCount: webHits.length,
          companies,
          signals,
          cache: persistResult,
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
