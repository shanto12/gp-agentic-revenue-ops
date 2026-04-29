# Agentic Marketing Operations Workbench

> **Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All data is synthetic.**

A multi-agent workbench that hunts public buyer-intent signals, scores them against an EOR-buyer ICP, drafts brand-voice-critiqued nurture sequences, and previews audit-grade CRM write-backs — all behind a human-in-the-loop gate. Built as an interview artifact for the **Marketing AI Agent Builder** role.

## Why this demo

The role is explicit: build *autonomous reasoning systems*, not workflows. The first screen of this app is a live signal stream. Click any signal and a multi-agent reasoning chain runs in front of you — Plan → Enrich → ICP Score → RAG → Draft Nurture → Critique → HITL Gate → CRM write-back preview. Every step shows the model that ran it (Claude Sonnet 4.6 vs Claude Haiku 4.5 vs deterministic), latency, tokens, and a JSON I/O panel. Nothing autonomous reaches a real prospect without the gate.

## Stack

- **Vite + React 19 + TypeScript 6** — typed strict, ESLint with `react-hooks` and `typescript-eslint` strict configs.
- **Netlify Functions** for the AI gateway (`/api/agent-run`) and `/api/health`.
- **Claude Sonnet 4.6** for the customer-visible draft step; **Claude Haiku 4.5** for fast enrich + critique.
- **Deterministic ICP scoring** and **client-side RAG** over a synthetic knowledge corpus (ICP doc, brand-voice doc, competitor battlecards).
- **Vitest + Testing Library** for tests; jsdom environment.
- **Strict CSP, no inline scripts**, security headers, deploy-context-scoped env vars.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run verify       # lint + tests + production build
```

`pnpm verify` (or `npm run verify`) runs the gate: ESLint → Vitest → `tsc -b && vite build`.

## Live mode

Drop an `ANTHROPIC_API_KEY` into `.env` (or Netlify env vars) to flip the Draft step into live Claude. Without the key, the app runs in **synthetic deterministic mode** — every screen still works; the canned agent traces are realistic enough to interview from. The demo always opens in degraded mode by default; the recruiter sees that explicitly in the topbar.

## Architecture (one screen)

```
Plan (Sonnet)
  └─→ Enrich (Haiku)
        └─→ ICP Score (deterministic)
              └─→ RAG (deterministic)
                    └─→ Draft Nurture (Sonnet)
                          └─→ Critique (Haiku) ──replan if flagged──┐
                                └─→ HITL Gate (human)               │
                                      └─→ CRM Write-back            │
                                                                     │
        replan loop ◀────────────────────────────────────────────────┘
```

A LangGraph-style state machine lives in `src/lib/agent-graph.ts`. The actual UI builds the run client-side over fixtures so the entire interaction is reproducible without any keys. The Netlify Function only proxies the **draft step** to Claude when live mode is enabled — everything else (planning, scoring, RAG, critique evaluator) is auditable client-side code.

## Brand-safety guardrails

- Every nurture draft is run through an **evaluator** (`src/lib/agent-graph.ts → evaluate()`) that flags forbidden brand-voice terms and surfaces the score in the HITL gate.
- The brand-voice doc (`src/data/brand-voice.ts`) is the **source of truth** for voice. The agent's drafts cite it via `brandVoiceCitations`.
- Battlecards (`src/data/battlecards.ts`) are explicitly tagged "do not name in cold outbound" — the agent will never use them in subject lines.
- The CRM write-back is **always a JSON diff with HITL approval**; nothing executes without explicit consent.

## Repository convention

This app sits under `apps/gp-agentic-revenue-ops/` as a self-contained Vite app with its own Netlify site. The root `package.json` exposes `dev:gp`, `build:gp`, `verify:gp`, `preview:gp`. See the top-level `DEMO_FACTORY_GRAND_PLAN.md` for the full demo factory operating model.

## Disclaimers

- All company names, signals, transcripts, and battlecards are **synthetic**. They are not connected to any real company or product.
- The demo neither claims nor implies any G-P endorsement.
- The visual brand (colors, type) is original and unrelated to G-P trade dress.
