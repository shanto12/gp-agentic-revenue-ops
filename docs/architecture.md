# Architecture

```
                         ┌──────────────────────────────┐
                         │   Browser (React + Vite)     │
                         │  ─ Signals stream            │
                         │  ─ Agent run timeline        │
                         │  ─ HITL gate UI              │
                         │  ─ Audit log                 │
                         └──────────────┬───────────────┘
                                        │
                                fetch('/api/*')
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │     Netlify Functions (server-side)        │
                  │   ─ /api/health   (status + mode)          │
                  │   ─ /api/agent-run  → Anthropic Messages   │
                  └─────────────────────┬──────────────────────┘
                                        │ (only when key present)
                                        ▼
                                ┌───────────────┐
                                │ api.anthropic │  Sonnet 4.6 (draft)
                                │      .com     │  Haiku  4.5 (enrich, critique)
                                └───────────────┘
```

## Agent state machine

`src/lib/agent-graph.ts` implements a LangGraph-style typed state machine. Order is fixed:

```
Plan → Enrich → ICP Score → RAG → Draft Nurture → Critique → HITL Gate → CRM Write-back
                                                       │
                                                       └── replan if flagged
```

- **Plan** — Sonnet 4.6 produces a typed plan with goal, tools, success criteria.
- **Enrich** — Haiku 4.5 over firmographic fixtures.
- **ICP Score** — deterministic in `src/lib/icp-score.ts`. No model call. Auditable factor list + weights returned.
- **RAG** — deterministic term-overlap retrieval in `src/lib/rag.ts`. No model. Returns `topK` knowledge docs with matched terms and excerpts.
- **Draft Nurture** — Sonnet 4.6 (live mode) or canned (deterministic). Cites brand-voice doc + signals.
- **Critique** — Haiku 4.5 evaluator. Flags forbidden brand-voice terms, scores hallucination risk and ICP confidence.
- **HITL Gate** — UI-only step. Generates a CRM write-back JSON diff. No execution without approval.

## Server-side boundary

The browser never holds an Anthropic key. `/api/agent-run` reads `process.env.ANTHROPIC_API_KEY` and returns `503` when absent so the UI shows a clean "live mode not configured" banner without crashing the agent run. The synthetic deterministic path is the default.

The function is intentionally narrow: it only proxies the **draft step**. Planning, scoring, RAG, critique, and HITL all run in client code over fixtures — auditable, deterministic, and impossible to leak secrets through.

## Security headers

Set in `netlify.toml`:

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Build + deploy

- `npm run verify` runs ESLint → Vitest → `tsc -b && vite build`. CI gate.
- Netlify build command: `npm run build`. Publish: `dist`. Functions: `netlify/functions`.
- `/api/health` and `/api/agent-run` are routed via `netlify.toml` redirects.
- Site ID: `ec7e2da1-fae0-4e91-bb94-b99e1b773308`. Created via the Netlify plugin.
