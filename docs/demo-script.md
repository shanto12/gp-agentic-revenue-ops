# Demo script — Agentic Marketing Operations Workbench

Three lengths. Pick the one that matches the call.

---

## 90-second version (recruiter / first interview)

> "Open the URL. Top of the screen — that's a live signal stream from synthetic Handelsregister, LinkedIn, OpenCorporates, PitchBook feeds. Each row is a buyer-intent signal scored against an EOR ICP I built. Top row: Lumenscale Robotics, ICP fit 95, posted 12 engineering jobs in Berlin without a German entity. Click it.
>
> [opens Agent Run]
>
> "That's seven reasoning steps the agent ran in about 6 seconds total — Plan, Enrich, ICP Score, RAG retrieval over a synthetic ICP and brand-voice doc, Draft Nurture, Critique, HITL Gate. Each step shows the model — Sonnet 4.6 for reasoning, Haiku 4.5 for fast critique, deterministic for ICP scoring and RAG.
>
> [points to right rail]
>
> "Right rail is the gate. Brand-voice fit 100, hallucination risk 32, ICP confidence 92. Below that is the proposed CRM write-back as a JSON diff — strikethrough is the old value, green is the new. Nothing autonomous touches HubSpot until I approve. That's the whole product surface."

## 5-minute version (hiring manager)

1. **Problem:** "G-P's revenue team is investing in agentic — Aamir Khan's CRO charter is unifying revenue. The Marketing AI Agent Builder role specifically calls out 'autonomous, not workflows' and 'reasoning loops to prevent hallucinations'. So the demo had to feel like an agent, not Zapier."

2. **The signal hunter** (90s in Signals screen): walk through the metrics strip — signals/hr, in-flight runs, approval queue, brand-voice fit. Show filtering by signal type + score floor. Open Lumenscale.

3. **The reasoning chain** (90s in Agent Run): expand each timeline step. Show the JSON output. Highlight the Critique step is using Haiku — the cheap model — to police the Sonnet output. Point at the dashed coral edge in the architecture diagram for the replan loop.

4. **The HITL gate** (45s): brand-voice gauge, hallucination-risk gauge, JSON diff. Approve. Show the audit log entry appear in real time.

5. **The campaign reallocator** (45s): switch to Campaigns. Read the agent's reasoning aloud — "$4,200 from Search to LinkedIn, 3-day rolling CPL 38% better." Show the brand-voice flag on a creative ("rockstar global team" — flagged by the evaluator). Approve.

6. **The architecture screen** (30s): LangGraph state graph + connectors. Point at the model routing rules and the degraded-mode connector dot.

## 15-minute version (technical panel)

Build on the 5-minute version, then:

- **Code walkthrough:** `src/lib/agent-graph.ts` (state machine), `src/lib/icp-score.ts` (deterministic scoring with citations), `src/lib/rag.ts` (term-overlap retrieval over knowledge corpus), `netlify/functions/agent-run.mjs` (server-side AI boundary).
- **Threat model:** `docs/threat-model.md` — server-side keys, no PII ingested, synthetic data, CSP, evaluator on every customer-visible string.
- **Tests:** `npm test` — 13 tests covering ICP scoring bands, RAG ranking, agent graph step ordering, App-level navigation and HITL gate render.
- **Live verify:** `curl -fsSI https://gp-agentic-revenue-ops.netlify.app/`, `curl /api/health` showing degraded mode.
- **What I'd change in production:** see `one-pager.md` "What I'd build next."

## Default talking-track structure (always)

1. Start with the buyer pain G-P actually has (synthetic). 2. Show the realistic scenario. 3. Run the automation. 4. Explain the decisioning + evidence. 5. Show audit + metrics. 6. End with what would change in their real environment.
