# Design Brief — Agentic Revenue Operations Workbench

Slug: `gp-agentic-revenue-ops`
Public title: **"Agentic Marketing Operations Workbench"** (independent concept demo)
Internal target: G-P **Marketing AI Agent Builder** (Sales role descoped 2026-04-28 by user)
Date: 2026-04-28

## Target interviewer + 30-second hook

Primary: **CMO Heidi Arkinstall** (Forbes CMO Next, ex-IBM/Samsung/PayPal/EA/Logitech, business-first marketer).

The 30-second hook: she opens the URL and sees a live signal stream. One signal — "Lumenscale Robotics just posted 12 jobs in Berlin" — is mid-flight through the agent. She watches the agent plan → enrich → score against the EOR-buyer ICP → retrieve a brand-voice doc → draft a personalized nurture step → critique itself → land at a HITL approval gate with a CRM write-back JSON diff. Every step is cited. Nothing autonomous reaches a real prospect without her digital signature on the gate.

Why this lands: she stated publicly her core philosophy is "be a business person before a marketer." Audit-grade attribution + brand-safe AI + ICP precision are the three things she has to defend to her board. The demo proves all three on the first screen.

Secondary surfaces (toggle):
- **Campaign Reallocator** — three synthetic campaigns, agent reallocates budget with reasoning + brand-voice critique. Hits the JD's "autonomously reallocate budgets or pause underperforming creatives" line directly.
- **Nurture Composer** — paste a synthetic prospect-behavior fixture (page views, downloads, email opens), agent designs a multi-step personalized nurture with NLP-derived intent reasoning. Hits the "NLP to read prospect behavior" line.
- **Architecture + Audit Log** — LangGraph state diagram, RAG corpus, evaluator-loop, HITL gate, full audit history. For the technical screen with CPO GK Konduri / engineering panel.

## Top Marketing JD requirements visibly demonstrated on first screen

Mapped 1:1 to the JD's Core Responsibilities:

1. **Intelligent Research & Segmentation** — signal-stream hunter that crawls synthetic intent feeds (hiring posts, funding, news), dynamically updates ICP segments, enriches CRM records.
2. **Autonomous Campaign Management** — the Campaign Reallocator surface, with reasoning chain visible.
3. **Dynamic Lead Nurturing** — the Nurture Composer surface, NLP-derived intent → multi-step personalized sequence.
4. **Performance & Guardrails** — visible HITL approval gate, brand-voice critique evaluator loop, eval framework metrics in the audit panel.
5. **System Orchestration** — synthetic HubSpot/Salesforce/6sense/GA connectors visible in the architecture diagram; CRM write-back preview shows exact JSON diff before send.

Bonus signals for the qualifications bullets:
- LangGraph-style state graph diagram (named explicitly).
- RAG over a synthetic G-P brand-voice + ICP corpus.
- "Reasoning loops to prevent hallucinations" framing in the agent run UI.
- Claude / GPT-4o cost-quality routing visible in observability.

## Product premise (one sentence)

A multi-agent **marketing** workbench that hunts public buyer-intent signals, scores them against an EOR-buyer ICP, composes brand-voice-critiqued nurture sequences, autonomously reallocates campaign budget, and previews audit-grade CRM write-backs — all behind human-in-the-loop guardrails — modeled as LangGraph-style reasoning loops.

## Primary workflow (what the user clicks first)

`/` → "Live Signal Stream" — scrolling feed of synthetic intent signals (hiring posts, funding rounds, expansion press). User clicks one signal → opens the **Agent Run** view:

1. **Plan** (LLM produces a multi-step plan).
2. **Research** (sub-agent enriches firmographic data).
3. **ICP Score** (deterministic scoring against EOR-buyer ICP).
4. **Battlecard RAG** (retrieves relevant competitor positioning).
5. **Draft outbound** (cited, brand-voice-checked).
6. **Critique** (evaluator agent flags hallucinations or off-brand language).
7. **HITL approve** → CRM write-back preview.

Secondary screen: **Campaign Watcher** — three live synthetic campaigns; agent reallocates budget with reasoning. Tertiary: **Architecture + Audit Log**.

## Visual direction

- **Mood:** "audit-grade calm." Compliance navy (#0E1F3A) + signal coral (#FF5F4E) accent + warm neutrals. Echoes G-P's premium-compliance brand without lifting it.
- **Density:** information-dense like a SOC console — but readable. Recruiter must grasp the workflow within 5 seconds.
- **Typography:** Geist Sans / Inter for UI; Geist Mono for the agent reasoning trace and JSON payloads.
- **Hierarchy:** left sidebar (signal stream) → center (active agent run) → right rail (audit + write-back preview).
- **Motion:** subtle — animate the reasoning chain stepping through plan→tool→critique. No marketing flourishes.

## Accessibility

- WCAG 2.2 AA: keyboard-traversable signal feed, focus rings, color-independent state indicators (icon + color), aria-live for streaming agent output.
- Mobile: collapses to single-column with bottom-sheet for write-back preview.

## Brand-safety constraints

- Footer disclaimer: "Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All data is synthetic."
- No G-P logo. No "Gia" branding. No real customer names.
- Synthetic companies use plausible-but-fake names: "Lumenscale", "Northsail Robotics", "Verdantia Foods."

## Required assets

- Hero illustration: abstract globe-of-signals, AI-generated, no real logos.
- Empty states for: no signals yet, no campaigns connected, no knowledge sources uploaded.
- Architecture diagram (PNG + SVG): LangGraph nodes, RAG store, HITL gate, CRM connector.
- 4 screenshots: signal stream, agent run, campaign reallocator, architecture.
- 60-90s walkthrough video.

## Demo script anchors

- 90s: "Watch one signal turn into a cited, approved CRM write-back."
- 5min: "Now the same agent flips to outbound and handles a Deel objection from RAG."
- 15min: "Architecture, evaluator loop, HITL gate, threat model."

## Resume bullet (target)

> Built an autonomous multi-agent marketing operations workbench using LangGraph-style state graphs, Claude/GPT-4o cost-quality routing, RAG over a synthetic ICP and brand-voice corpus, and Netlify Functions — ingesting buyer-intent signals to drive ICP enrichment, NLP-derived nurture sequencing, and autonomous campaign reallocation, with audit-grade CRM write-back previews behind human-in-the-loop guardrails.
