# JD Source — Globalization Partners (G-P)

Source file: `~/Downloads/JD... Globalization Partners .docx`
Captured: 2026-04-28

The JD doc bundles two roles. Both report into G-P's revenue org (CRO Aamir Khan as of Feb 2026). Both center on building autonomous agents — explicitly contrasted with "if-this-then-that" automation.

---

## Role 1 — Marketing AI Agent Builder

### Role Overview
Lead architect for G-P's "agentic" marketing stack. Move beyond simple automation toward autonomous systems that reason through marketing data, execute multi-channel campaigns, and self-correct based on performance. Part Engineer, part Strategist, part Data Scientist. Remote, anywhere in NA.

### Core Responsibilities
- **Intelligent Research & Segmentation:** Deploy agents to crawl the web for intent signals (hiring changes, funding, news) to dynamically update ICP segments and enrich CRM records in real-time.
- **Autonomous Campaign Management:** Build agents that independently monitor live campaigns (Search, Social, Email) and autonomously reallocate budgets or pause underperforming creatives based on real-time ROI.
- **Dynamic Lead Nurturing:** Design agents that use NLP to "read" prospect behavior and trigger personalized, multi-step nurture sequences without manual intervention.
- **Performance & Guardrails:** Establish "human-in-the-loop" protocols and evaluation frameworks to ensure agent outputs align with brand voice and security standards.
- **System Orchestration:** Connect AI agents to HubSpot/Salesforce, 6sense, and Google Analytics — seamless data flow and automated CRM write-backs.

### Qualifications & Skills
- 5+ years (senior) in Growth Engineering, ideally scaling a mid-market SaaS revenue engine.
- AI Tooling: agent orchestration frameworks (LangGraph, CrewAI) or low-code builder platforms (Claude CoWork, CodeX).
- Agent Orchestration: low-code/no-code (Clay, Zapier Central, Make.com) or code-based (LangGraph, CrewAI).
- Prompt Engineering: design complex "reasoning loops" that prevent hallucinations and ensure professional, brand-aligned output.
- Data Savvy: JSON, APIs, RAG to feed agents context from internal knowledge bases.
- Marketing Expertise: B2B buyer journeys, attribution models, demand generation tactics.

---

## Role 2 — Sales AI Agent Builder

### Role Overview
Architect and manage a fleet of autonomous Sales Agents that perform end-to-end prospecting, qualification, and meeting scheduling. Build reasoning systems that research prospects, handle objections, and manage their own inboxes to deliver qualified meetings to SEs. Remote, anywhere in NA.

### Key Responsibilities
- **Autonomous Lead Qualification:** Agents "vet" inbound leads by querying external data sources and internal CRM history against ICP.
- **Inbox Management & Objection Handling:** Agents (using GPT-4o or Claude) read incoming emails, categorize intent, and draft/send context-aware replies for common objections.
- **Live Sales Assistant (RAG):** Build a Sales Knowledge Base using RAG so agents can instantly reference case studies, pricing, competitor battlecards during autonomous chats.
- **CRM Data Integrity:** Agents write back all interactions to Salesforce/HubSpot — clean data, accurate attribution, no rep intervention.

### Qualifications
- 4+ years in Growth or Solutions Engineering in B2B SaaS.
- AI Tooling: "Agent-as-a-Service" platforms (11x, Regie.ai, Lyzr) or custom agents via LangChain / LangGraph.
- Sales Stack: Salesforce/HubSpot, Salesloft/Outreach, ZoomInfo, 6sense.
- Analytical Rigor: A/B test agent prompts and reasoning loops to improve meeting-set rates.

---

## Cross-cutting signals

- **"Autonomous, not automation"** — explicit framing repeated in both roles. Demo must show reasoning loops, not if-this-then-that.
- **"Reasoning loops to prevent hallucinations"** — the demo must visualize the chain-of-thought / plan / critique step explicitly.
- **HITL guardrails** — approval gates are required, not optional polish.
- **CRM write-back** — both roles call this out; the demo should show the proposed write-back payload before execution.
- **RAG over a company knowledge base** — both roles want this; the demo should ship with a synthetic battlecard / ICP doc set.
- **Stack vocabulary** — LangGraph, CrewAI, Claude CoWork, CodeX, Clay, 11x, Regie, Lyzr. The architecture doc should name LangGraph-style state graphs explicitly.
