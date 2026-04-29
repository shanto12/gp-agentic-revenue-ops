# Known limits

The demo is intentionally narrow. These are the gaps a hiring manager would (rightly) probe.

## Functional gaps

- **No real CRM write.** The "approve" button updates an in-memory audit log; nothing is sent to a real HubSpot or Salesforce instance. In production this would be a connector module with field-level access controls and bi-directional sync.
- **RAG is term-overlap, not embeddings.** Production would use a vector store. The demo uses cosine-like overlap over a small fixture corpus to keep the surface auditable and the bundle small.
- **The state machine is hand-rolled, not LangGraph.** It mirrors LangGraph's mental model (typed nodes + edges + conditional routing) but does not import the library — keeps the demo portable across runtimes (browser + Netlify Functions). Production would adopt LangGraph proper for replay, step-level rollback, and observability.
- **Critique is a regex + heuristic, not a separate model run by default.** A single Haiku 4.5 call would produce a richer critique; the regex evaluator is fast, deterministic, and demonstrates the principle.
- **Live signal feed is canned.** No real Greenhouse / LinkedIn / PitchBook ingestion; signals are hand-authored fixtures. Production would be a worker pool with rate-limited connector adapters.

## Operational gaps

- **No real authentication.** The workspace switcher and approver name are synthetic. Production would put SSO + RBAC in front, scoped by region and product line.
- **No production telemetry.** Netlify function logs only carry status and latency. Production would add OpenTelemetry, structured logs, and a Grafana board for the agent's eval-score distribution.
- **No A/B testing on prompts.** The JD asks for "A/B test agent prompts and reasoning loops." A real system would version prompts in a registry and route a fraction of traffic to each variant.

## Security gaps

- **No DLP scan on outbound copy.** The brand-voice evaluator handles forbidden terms but a real system would also run a PII / IP / regulated-claims classifier.
- **No rate limiting on `/api/agent-run`.** Demo-grade. Production would put an API key + per-user quota in front.

## Accessibility

- WCAG 2.2 AA for keyboard, contrast, and aria-live targets is in scope and tested. Mobile bottom-sheet for HITL gate is sketched in CSS but not exercised in the live build (single-column responsive only).

## What's intentionally absent

- A login screen / sign-up flow. The recruiter should hit the live URL and immediately see the workflow.
- Marketing copy. There is no "hero" section, no testimonials, no pricing. This is an operator's console, not a SaaS landing page.
