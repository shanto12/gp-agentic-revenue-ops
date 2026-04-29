# Research — G-P Marketing / Sales AI Agent Builder

Captured: 2026-04-28

## Company snapshot

- **Legal name:** Globalization Partners, LLC (brand: G-P)
- **HQ:** Boston, MA. Largely remote workforce.
- **Founded:** 2012. Pioneer of the EOR (Employer of Record) category.
- **Coverage:** 180+ countries (the broadest in the category).
- **Recognition:** #1 Leader in IEC Group Global EOR Study 2026 — 4th consecutive year. Recognized as gold standard by Everest Group, NelsonHall, IEC, QKS Group.
- **Posture:** Compliance-first, premium-priced. Largest in-house legal team in the category. The "Global Compliance Engine" is the brand-level moat.

Sources:
- [G-P homepage](https://www.globalization-partners.com/)
- [G-P #1 in IEC 2026 Study](https://www.manilatimes.net/2026/04/28/tmt-newswire/pr-newswire/g-p-secures-1-leader-ranking-in-2026-iec-group-global-eor-study/2330755)
- [G-P record-breaking 2025](https://www.prnewswire.com/news-releases/g-p-closes-2025-with-record-breaking-growth-ai-innovation-and-market-leadership-302667097.html)

## Existing AI product — G-P Gia (critical context)

G-P already ships agentic AI in production. The demo must look like a sibling to Gia, not an imitation of it.

- **What it is:** "World's first AI-based global HR compliance advisor." Agentic, not just chat.
- **Capabilities:** Proactive policy monitoring, document drafting, worker classification, RAG over uploaded company knowledge.
- **Scale:** 50 countries, all 50 US states, 50+ languages. Saved 7,000+ HR hours in 6 months.
- **Tiers:** Gia Essential, Gia Pro, Gia Enterprise. GA in 2025.
- **Award:** 2025 Top HR Product of the Year.
- **Public framing:** G-P explicitly distinguishes "agent" from "assistant" — the agent **performs tasks on the user's behalf**. Our demo language must respect this distinction.

Sources:
- [G-P Gia next-gen launch](https://www.globalization-partners.com/news/gp-unveils-next-gen-gia/)
- [G-P unveils Gia AI HR compliance advisor](https://www.globalization-partners.com/news/g-p-unveils-gia-ai-based-hr-compliance-advisor/)
- [HRtechedge coverage](https://hrtechedge.com/globalization-partners-launches-g-p-gia-ai-agent-for-compliant-global-hr/)

## Likely interviewers and what impresses them

### CRO — Aamir Khan (promoted Feb 5, 2026)
The Sales AI Agent Builder reports up to him. He likely has a hand in interview loops for both roles given the unified revenue function.
- 7 years at G-P, deep institutional knowledge.
- Charter: unified revenue function across acquisition → customer success → partnerships.
- Quote (CEO Sahin on his appointment): "In an AI-driven market, speed and focus are critical."
- **What impresses Aamir:** end-to-end funnel coverage, attribution clarity, audit-grade write-backs to CRM, speed to first qualified meeting.

Sources:
- [G-P names Aamir Khan CRO](https://www.prnewswire.com/news-releases/g-p-names-aamir-khan-as-chief-revenue-officer-and-gk-konduri-as-chief-product-officer-302680477.html)
- [LinkedIn](https://www.linkedin.com/in/theaamirkhan/)

### CMO — Heidi Arkinstall (since Dec 2021)
The Marketing AI Agent Builder reports up to her org.
- 25+ years across IBM, Samsung, PayPal, EA, Logitech.
- Forbes "CMO Next 2021 — Marketers Transforming Business in a Changed World."
- Stated philosophy: "Be a business person before a marketer." Deep understanding of how marketing supports business goals.
- Owns Brand, Communications, Product Marketing.
- **What impresses Heidi:** brand-safe AI output, attribution that ties marketing spend to revenue, ICP precision, business-outcome framing over feature framing.

Sources:
- [Heidi Arkinstall profile](https://www.globalization-partners.com/team/heidi-arkinstall/)
- [MarTech interview with Heidi](https://martechseries.com/mts-insights/interviews/martech-interview-with-heidi-arkinstall-cmo-at-g-p/)
- [TopCMO podcast EP 36](https://www.topthoughtleader.com/episode/top-cmo-heidi-arkinstall-gp-breaking-barriers)

### CPO — GK Konduri (also promoted Feb 2026)
Owns product including Gia. Likely involved in technical depth screen given the agent-builder nature of the role.

## Stated tech stack vocabulary (use these names exactly)

From the JD:
- **Agent orchestration:** LangGraph, CrewAI (preferred), Claude CoWork, CodeX (low-code).
- **Low-code/no-code:** Clay, Zapier Central, Make.com.
- **Agent-as-a-Service (sales):** 11x, Regie.ai, Lyzr.
- **CRM:** Salesforce, HubSpot.
- **Sales engagement:** Salesloft, Outreach.
- **Data providers:** ZoomInfo, 6sense.
- **Analytics:** Google Analytics.
- **LLMs called out:** GPT-4o, Claude.
- **Foundational concepts:** RAG, prompt engineering, "reasoning loops," HITL.

The architecture diagram in the demo should explicitly name **LangGraph state graphs** and use **RAG** terminology. Bonus points for showing where Claude vs GPT-4o would route based on cost/quality.

## ICP for the demo's hunting agent (G-P's actual ICP — eat their own dogfood)

The demo's research agent should hunt for **companies that look like G-P's ICP**: established mid-market firms expanding internationally who value compliance over price. Synthetic intent signals to ingest:

1. **International hiring posts** — job openings in countries where the company has no entity. (Highest signal.)
2. **Funding rounds** — Series B+ rounds where deck mentions international expansion.
3. **New market entry press** — "Acme Inc opens London office" / "expansion to APAC."
4. **Executive hires with international remit** — VP International, Head of EMEA, etc.
5. **Conference signals** — speaking at SaaStr Europe, scaling-international panels.
6. **Compliance triggers** — GDPR/data-residency announcements that imply EU presence.

## Competitor positioning (for the synthetic battlecard RAG corpus)

The Sales agent demo's RAG knowledge base should ship with synthetic battlecards for:

- **Deel** — flat $599/employee/mo, 150 countries, agile UX. G-P counter: 180 countries, owned entities, deeper compliance, bigger legal team, audit defensibility.
- **Remote** — user-friendly, 100 countries, smaller. G-P counter: regulated-industry credibility, scale, Global Compliance Engine.
- **Rippling** — unified HR/IT/finance platform but only 10-country payroll, 8-16 week implementation. G-P counter: faster country expansion, EOR depth.

Sources:
- [Top G-P competitors review](https://remotepeople.com/providers/globalization-partners-competitors-alternatives/)
- [G-P vs Rippling EOR](https://www.globalization-partners.com/blog/g-p-vs-rippling-eor/)
- [Deel's own G-P comparison](https://www.deel.com/blog/deel-vs-globalization-partners-honest-employer-of-record-service-comparison/)
- [G-P vs Remote](https://remote.com/blog/eor-peo/gp-vs-remote)

## Buyer pain themes (for the demo's narrative)

- "We can't see which intent signals predicted closed-won deals." (Attribution.)
- "Our SDRs spend 70% of their time on research and CRM hygiene." (Time-to-meeting.)
- "Our marketing automation is rule-based; it can't reason about a prospect's behavior." (The exact JD language.)
- "We need brand-safe AI — legal won't approve unsupervised outbound." (HITL guardrails.)
- "We invested in Salesforce/HubSpot/6sense and the systems don't talk to each other." (Orchestration.)

## Brand-safe disclaimers (mandatory)

Public-facing artifacts must include:
> Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All data is synthetic.

Avoid the G-P logo, the Gia branding, or any product screenshots. Color palette can echo "compliance navy + signal coral" without lifting their exact brand.

## Differentiation angle for THIS candidate

The demo positions on three things G-P's leadership demonstrably cares about:
1. **Agent-not-assistant rigor** — visible reasoning loops, not chat.
2. **Audit-grade trail** — every CRM write-back is previewable, with cited source signals.
3. **Full-funnel coverage in one app** — marketing-side ICP enrichment AND sales-side outbound/objection handling, mirroring CRO Aamir Khan's unified-revenue charter.

This is a single demo that lets the candidate apply to BOTH roles in the JD doc with one artifact.
