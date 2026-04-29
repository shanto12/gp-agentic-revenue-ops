# Marketing Agent Workbench

_Started 2026-04-28 17:20 UTC_

---

## User

Build a high-fidelity, recruiter-quality multi-screen web app: "Agentic Marketing Operations Workbench."

It is an enterprise demo built for a Marketing AI Agent Builder role at an Employer of Record (EOR) company. The audience is a CMO who values brand-safety, audit-grade attribution, and ICP precision. The bar is enterprise SaaS, not portfolio site.

TONE & DESIGN SYSTEM: "audit-grade calm." Compliance navy #0E1F3A on warm off-white #F5F1EA. Signal coral #FF5F4E accent (sparing — for active state, alerts, primary buttons). Deep ink #131722 text. Subtle desaturated chart palette. Inter or Geist Sans for UI; JetBrains Mono for agent traces and JSON. Density like a SOC console — information-rich but uncluttered. No gradients, no glassmorphism, no marketing flourishes.

GLOBAL LAYOUT: persistent left sidebar (compact logo "Marketing Agent Workbench" + nav items: Signals, Agent Runs, Campaigns, Knowledge, Architecture, Audit Log). Top bar with workspace switcher and a small "degraded mode" indicator dot. Main canvas. Right rail context-dependent.

SCREEN 1 — Signals (default landing): a scrolling live feed of synthetic buyer-intent signals. Each row shows company name, signal type tag (HIRING / FUNDING / EXPANSION / EXEC-HIRE), country flag, ICP fit score chip color-graded green→amber→red, and an agent status badge (queued, running, awaiting approval, approved, rejected). A small filter bar at top by tag and score. Clicking a row opens Screen 2. Above the feed, a thin metrics strip: signals/hr, in-flight runs, approval queue depth.

SCREEN 2 — Agent Run (the hero screen): 3-column.
  Left column: signal context card — company name, country, what triggered the signal, source URL, raw signal payload (collapsible).
  Center column: vertical reasoning timeline. Steps: Plan → Enrich (firmographic) → ICP Score → RAG retrieval (brand-voice doc + ICP doc + battlecards) → Draft Nurture (3-step sequence) → Critique (evaluator agent flags hallucination risk and brand-voice drift) → HITL Approval. Each step is a card with status icon, latency ms, model badge (Claude Sonnet 4.6 or GPT-4o), tokens, and a collapsible JSON I/O panel. Active step pulses coral.
  Right rail: HITL Gate panel — proposed CRM write-back JSON diff (red strikethrough for old, green for new, field-level), evaluator score gauges (brand-voice fit, hallucination risk, ICP confidence — each 0-100), and three buttons: Approve & Send, Edit, Reject with reason.

SCREEN 3 — Campaigns: 3 synthetic live campaigns (Search, LinkedIn, Email Nurture) shown as tiles with sparkline, spend, ROI, cost-per-lead. At top, the agent's proposed reallocation: "Shift $4,200 from Campaign A → Campaign B (reasoning: 3-day rolling CPL on B is 38% lower)." Reasoning chain expandable. Approve / Hold for now buttons. Below, a brand-voice critique panel showing the agent flagged one creative as off-tone and proposed a fix.

SCREEN 4 — Architecture: a clean LangGraph-style state graph with named nodes (Plan, Enrich, Score, RAG, Draft, Critique, HITL, Writeback) and routing edges. Side panel shows model routing rules (Claude Sonnet 4.6 for reasoning + critique, GPT-4o for fast classification). Below, a connector strip with mock-status pills for HubSpot, Salesforce, 6sense, Google Analytics — each with a green/amber dot.

SCREEN 5 — Audit Log: a chronological table — timestamp, signal/campaign, action, agent step, model, tokens, latency, evaluator score, approver, status. Filterable. Designed to be exported.

FOOTER on every page (small, muted italic): "Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All data is synthetic."

MICRO-COPY: avoid marketing language. Use operator-grade phrasing — "in-flight," "awaiting approval," "writeback proposed," "evaluator flagged." 

NO landing page, no "Get Started" CTA, no hero marketing copy. Open the URL → immediately see Screen 1 with signals streaming. Recruiter must grasp the workflow within 5 seconds.

Responsive: tablet collapses sidebar to icon rail, mobile collapses to single column with bottom-sheet for HITL gate.

Accessibility: WCAG 2.2 AA, focus rings, color-independent state indicators (icon + color), aria-live for streaming agent timeline.

Seed all screens with rich, plausible synthetic data — fake company names like "Lumenscale Robotics", "Northsail Maritime", "Verdantia Foods", "Helix Diagnostics", "Cinder & Steel Apparel". Country flags. Realistic JSON CRM payloads.

## Assistant

I'll build this as a single-page app with screen routing. Note the user explicitly asked for a non-affiliated concept demo with a clear disclaimer, so this is original work, not a recreation of any branded UI.

_[tool: update_todos]_

I'll build this as a single React app with multiple JSX files, then compose them in the main HTML file. Starting with the shell, design tokens, and synthetic data, then each screen.

_[tool: write_file]_

_[tool: write_file]_

Now the shared UI primitives and icons file.

_[tool: write_file]_

_[tool: write_file]_

Now the screens. Starting with Signals (landing) and Agent Run (hero).

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

The Marketing Agent Workbench is live. Opens directly to the Signals stream with metrics strip, filterable feed, and live row-streaming. Click any signal to drop into the 3-column Agent Run with reasoning timeline and HITL gate. Sidebar nav covers Campaigns (with proposed reallocation + brand-voice critique), Architecture (LangGraph-style state machine + connectors), and Audit Log (filterable, exportable). Footer disclaimer present on every screen.

Tablet collapses to icon rail, mobile to single column with bottom tabbar. Color/icon dual-encoded statuses, focus rings, aria-live on the streaming feed.

