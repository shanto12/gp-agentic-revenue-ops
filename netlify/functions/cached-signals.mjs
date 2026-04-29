// Cached signals reader — serves the most recent live-signals payload
// persisted by /api/refresh-signals into the "signals-cache" Netlify Blobs
// store. This is the DEFAULT data source for the app: real public-web data,
// fetched once and reused across visitors until it goes stale.
//
// Response shape:
//   200 { signals, companies, capturedAt, source: "cache" }
//   404 { stale: true }    — missing or older than 24h; client should call
//                            /api/refresh-signals to repopulate.
//
// Synthetic fixtures remain ONLY as a last-resort client-side fallback if
// both this endpoint and /api/refresh-signals fail.

import { getStore } from '@netlify/blobs'

const STORE_NAME = 'signals-cache'
const KEY = 'current'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export default async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonResponse(405, { error: 'GET required' })
  }

  let store
  try {
    store = getStore(STORE_NAME)
  } catch (err) {
    // Blobs not configured (e.g. local dev without netlify dev). Treat as
    // stale so the client triggers a refresh.
    return jsonResponse(404, {
      stale: true,
      reason: `blobs unavailable: ${err?.message ?? 'unknown'}`,
    })
  }

  let payload
  try {
    payload = await store.get(KEY, { type: 'json' })
  } catch (err) {
    return jsonResponse(404, {
      stale: true,
      reason: `blob read failed: ${err?.message ?? 'unknown'}`,
    })
  }

  if (!payload || typeof payload !== 'object') {
    return jsonResponse(404, { stale: true, reason: 'no cached payload' })
  }

  const capturedAt = typeof payload.capturedAt === 'string' ? payload.capturedAt : null
  if (!capturedAt) {
    return jsonResponse(404, { stale: true, reason: 'cached payload missing capturedAt' })
  }

  const ageMs = Date.now() - new Date(capturedAt).getTime()
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > MAX_AGE_MS) {
    return jsonResponse(404, { stale: true, reason: 'cached payload older than 24h', capturedAt })
  }

  const signals = Array.isArray(payload.signals) ? payload.signals : []
  const companies = Array.isArray(payload.companies) ? payload.companies : []
  if (signals.length === 0 || companies.length === 0) {
    return jsonResponse(404, { stale: true, reason: 'cached payload empty' })
  }

  return jsonResponse(200, {
    signals,
    companies,
    capturedAt,
    source: 'cache',
  })
}
