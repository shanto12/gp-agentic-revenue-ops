# Agentic Marketing Operations Workbench — One-pager

> Independent concept demo for the **Marketing AI Agent Builder** role at Globalization Partners (G-P). Not affiliated with G-P. All data synthetic.

**Live:** https://gp-agentic-revenue-ops.netlify.app
**Repo:** apps/gp-agentic-revenue-ops/ (private)
**Health:** https://gp-agentic-revenue-ops.netlify.app/api/health

## What it is

A multi-agent marketing workbench that hunts public buyer-intent signals, scores them against an EOR-buyer ICP, drafts brand-voice-critiqued nurture sequences, autonomously proposes campaign budget reallocation, and previews audit-grade CRM write-backs — all behind a human-in-the-loop gate.

## Why it matters for this role

Every line of the JD's "Core Responsibilities" lands on a visible UI element on the first screen.

| JD requirement | Where it lives in the demo |
|---|---|
| Crawl web for intent signals → enrich CRM | Signals stream + CRM write-back diff in HITL gate |
| Autonomous campaign management | Campaigns screen with reallocation proposal + reasoning |
| NLP-driven lead nurturing | Nurture sequence drafted by Claude Sonnet 4.6, cited |
| HITL guardrails | Approval gate before any write-back; evaluator scores |
| HubSpot/Salesforce/6sense/GA orchestration | Architecture screen connector strip |
| Reasoning loops to prevent hallucinations | Plan → Critique → Re-plan edge in the state graph |
| LangGraph / CrewAI / Claude / GPT-4o | LangGraph-style state graph with explicit model routing |

## Stack

Vite + React 19 + TypeScript 6, Netlify Functions for the AI gateway, Claude Sonnet 4.6 + Haiku 4.5 routed by cost-quality. Strict CSP. Zero secrets in the bundle. Degraded mode by default; live Claude with `ANTHROPIC_API_KEY`.

## Headline metric (from the demo)

> Reduces a synthetic 12-step ICP-research-to-CRM-update workflow from ~90 minutes of manual SDR effort to a 22-second cited reasoning chain with audit-grade write-back preview, brand-voice critique, and human-in-the-loop approval.

## What I'd build next in a real engagement

- Replace synthetic signal connectors with real Greenhouse/LinkedIn/PitchBook integrations.
- Move the agent state machine to LangGraph proper for replay + step-level rollback.
- Add a vector store for the knowledge corpus (synthetic battlecards → real product knowledge).
- Wire 6sense intent surge data into the ICP scoring weights as a learned feature.
- Add CRM bi-directional sync with HubSpot, with field-level access controls.

## Real-world application & who it's useful for

Why this demo is worth a look beyond the specific G-P role.

- **What this is in plain terms.** A working reference implementation of an autonomous agent that reads the open web for buyer-intent signals, scores them against a target customer profile, drafts brand-safe outbound, and previews CRM updates behind a human approval gate.

- **Who it's useful for.**
  - Sales / marketing / RevOps leaders evaluating "agentic, not automation" patterns for their own pipeline.
  - Founders / operators considering similar internal tooling instead of buying off-the-shelf SDR-as-a-service products.
  - AI / platform engineers looking for a working reference of: GLM-5.1 + web_search grounding, parallel sub-agent fan-out over Server-Sent Events, server-side AI boundary on Netlify, deterministic ICP scoring + brand-voice evaluator + HITL gate, Netlify Blobs-backed real-data caching.
  - Compliance / security reviewers wanting to see what an audit-grade AI workflow looks like in practice — every model call inspectable, every CRM write previewed as a JSON diff, every step replayable.
  - Hiring managers and recruiters evaluating an applied-AI engineer (working demo > deck).

- **Industries where this pattern transfers.** B2B SaaS revenue operations, employer-of-record / global-payroll, financial services compliance workflows, healthcare revenue cycle, regulated marketing in pharma / insurance — anywhere "autonomous + brand-safe + auditable" is the bar.

- **Generalizable architectural ideas worth borrowing.**
  - Server-side AI boundary so the browser never holds a key.
  - Evaluator-gauged HITL gate (brand-voice fit, hallucination risk, ICP confidence) in front of every external write.
  - Parallel sub-agent fan-out via SSE — total latency ≈ slowest single lens.
  - Netlify Blobs as a cheap durable cache for expensive LLM calls, so the next visitor gets fresh-but-instant results.
  - Deterministic-vs-model split: deterministic ICP scoring, RAG retrieval, and CRM diff; model-driven plan, draft, and critique. Each side is testable on its own terms.

- **What it is NOT.** A concept demo. All data is real public-web evidence (cached + refreshable from GLM-5.1 + web_search) — no scraped private data, no proprietary G-P content, no real CRM mutations. Independent work, not affiliated with G-P.

## Business Requirement

What this is and why it exists, framed for an operator or compliance reviewer rather than a marketing audience.

- **Buyer.** The target buyer is an Employer-of-Record (EOR) buyer inside a mid-market, expansion-stage SaaS company — typically a VP of People, a Head of International, or a CFO standing up the company's first 1–3 international hires without opening a foreign entity. Buying triggers are public and observable: a Series B/C round, a new VP of International, a job req in Berlin or Singapore, a SOC 2 / GDPR posture update, an M&A close.

- **Pain G-P's marketing team is solving.** An SDR cannot read the entire open web every morning. By the time a hand-built list of "companies that just announced international expansion" reaches a sequencer, the signal is days stale and the messaging is generic. The team needs (a) autonomous lead enrichment from public buyer-intent signals, (b) brand-safe outbound drafted against an EOR-buyer ICP and G-P's voice, and (c) audit-grade write-backs into the CRM that a compliance reviewer can defend line by line.

- **Agentic, not automation.** A Zapier-style if-this-then-that pipeline cannot decide that a SOC-2 announcement plus a Berlin hiring spree plus a new VP of International together imply a higher-fit moment than any one of them alone. That is a reasoning loop: plan → enrich → score → draft → critique → re-plan. The workbench runs that loop explicitly so the steps, the model, the latency, and the citations are all inspectable rather than buried in a no-code flow.

- **HITL is non-negotiable.** EOR buying touches employment law, tax posture, and data residency in every target country. A hallucinated claim about GDPR coverage or a misattributed funding round is a brand-safety incident, not a typo. Every CRM write-back, every outbound draft, and every budget reallocation in this workbench passes through an explicit approve / edit / reject gate with evaluator scores (brand-voice fit, hallucination risk, ICP confidence) before anything crosses the system boundary.

- **How the four screens map to the JD's Core Responsibilities.**
  - **Signals** — "Crawl the web for buyer-intent signals and enrich CRM records." Live, cited, deduped, ICP-scored.
  - **Agent Run** — "NLP-driven lead nurturing" + "reasoning loops to prevent hallucinations." Plan → Enrich → ICP Score → RAG → Draft → Critique → HITL Gate, with parallel deep-research subagents on demand.
  - **Campaigns** — "Autonomous campaign management." A reallocation proposal with reasoning, brand-voice flag on the creative, and a HITL approval before spend moves.
  - **Architecture** — "Orchestrate HubSpot / Salesforce / 6sense / GA" + "LangGraph / CrewAI / Claude / GPT-4o." The state graph and connector strip make the orchestration boundary, model routing, and write-back contract explicit for a security or compliance reviewer.

## How a hiring manager can run the demo

1. **Open** https://gp-agentic-revenue-ops.netlify.app
2. **Click `Demo Guide`** in the sidebar — full walkthrough + live system status.
3. **Click `Use real data`** in the Signals header — GLM-5.1 + web_search returns 4 real, named mid-market companies expanding internationally from the open web.
4. **Click any signal row** → reasoning timeline runs (Plan → Enrich → ICP Score → RAG → Draft → Critique → HITL Gate → CRM write-back).
5. **Approve** at the right-rail HITL gate. Audit Log updates in real time.

No sign-up. No keys. Server-side AI boundary; browser never holds an API key.

## Disclaimers

Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All company names, signals, transcripts, and battlecards are synthetic.
