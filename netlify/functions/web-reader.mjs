// Web Reader proxy — given a URL, ask GLM-5.1 to fetch and summarize
// the page content using its web_search tool with a domain filter pinned
// to the requested URL. Uses the Coding Plan reader quota.

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

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    const host = u.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '127.0.0.1' ||
      host === '::1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

const SYSTEM = `You are a web reader. Given a URL, summarize the page in JSON only:
{
  "url": string,
  "title": string,
  "summary": string,
  "keyFacts": string[],
  "publishDate": string | null
}`

export default async (req) => {
  if (req.method !== 'POST') return bad(405, 'POST required')

  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    return bad(503, 'Web reader requires GLM_API_KEY in Netlify env.')
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return bad(400, 'invalid JSON body')
  }
  const { url } = payload ?? {}
  if (!url || typeof url !== 'string' || !isAllowedUrl(url)) {
    return bad(400, 'a public http(s) url is required')
  }

  const host = new URL(url).hostname
  const t0 = Date.now()
  let resp
  try {
    resp = await fetch(glmEndpoint('/chat/completions'), {
      method: 'POST',
      headers: glmHeaders(apiKey),
      body: JSON.stringify({
        model: glmModel(),
        max_tokens: 1200,
        temperature: 0.2,
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
              content_size: 'high',
              search_recency_filter: 'noLimit',
              search_domain_filter: host,
              search_prompt: `Read and summarize the content of: ${url}`,
            },
          },
        ],
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Read this URL and return the JSON: ${url}` },
        ],
      }),
    })
  } catch (err) {
    return bad(502, `z.ai upstream fetch failed: ${err?.message ?? 'unknown'}`)
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    return bad(resp.status, `z.ai upstream ${resp.status}: ${text.slice(0, 300)}`)
  }
  const j = await resp.json()
  const content =
    j.choices?.[0]?.message?.content?.trim() ??
    j.choices?.[0]?.message?.reasoning_content?.trim() ??
    ''
  if (!content) return bad(502, 'z.ai returned empty content')
  let parsed
  try {
    parsed = parseJsonObject(content)
  } catch (err) {
    return bad(502, `model output not valid JSON: ${err?.message ?? 'unknown'}`)
  }
  return new Response(
    JSON.stringify({
      modelMode: 'live-glm',
      modelId: glmModel(),
      provider: 'z.ai',
      latencyMs: Date.now() - t0,
      usage: j.usage ?? null,
      page: parsed,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
