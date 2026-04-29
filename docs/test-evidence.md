# Test evidence

Generated from `npm run verify` on 2026-04-28.

## Lint

```
> gp-agentic-revenue-ops@0.1.0 lint
> eslint .
```
(no errors, no warnings)

## Tests

```
 RUN  v4.1.5 /Users/shanto/Documents/demos/apps/gp-agentic-revenue-ops

 ✓ src/lib/icp-score.test.ts (3 tests)
 ✓ src/lib/rag.test.ts (3 tests)
 ✓ src/lib/agent-graph.test.ts (3 tests)
 ✓ src/App.test.tsx (4 tests)

 Test Files  4 passed (4)
      Tests  13 passed (13)
   Duration  ~1.85s
```

## Coverage of the JD's must-haves

| JD requirement | Test |
|---|---|
| ICP scoring | `icp-score.test.ts` covers high-fit case, score-band invariants, small-team penalty |
| RAG retrieval | `rag.test.ts` covers topK ordering, brand-voice doc discovery, kind filtering |
| Agent state graph integrity | `agent-graph.test.ts` covers canonical step order, awaiting_approval landing, brand-voice flag detection |
| HITL gate render | `App.test.tsx` covers Signals landing, disclaimer footer presence, navigation, agent-run open with CRM diff |

## Production build

```
> gp-agentic-revenue-ops@0.1.0 build
> tsc -b && vite build

dist/index.html                   0.71 kB │ gzip:  0.41 kB
dist/assets/index-*.css          19.97 kB │ gzip:  4.55 kB
dist/assets/index-*.js          257.69 kB │ gzip: 80.66 kB

✓ built in 425ms
```

## Live verification (production)

```
$ curl -fsSI https://gp-agentic-revenue-ops.netlify.app/
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self'; ...

$ curl -fsS https://gp-agentic-revenue-ops.netlify.app/api/health
{
  "service": "gp-agentic-revenue-ops",
  "status": "ok",
  "mode": "synthetic-deterministic",
  "dataPolicy": "synthetic-only",
  "checks": [
    { "name": "static_assets", "status": "ok" },
    { "name": "synthetic_data", "status": "ok" },
    { "name": "anthropic_api_key", "status": "absent_degraded_mode_ok" }
  ]
}

$ curl -X POST -H "content-type: application/json" -d '{}' https://gp-agentic-revenue-ops.netlify.app/api/agent-run
HTTP 503  (correct: live mode not configured, demo continues in synthetic deterministic mode)
```
