import type { KnowledgeDoc } from '../lib/types'

export const battlecards: KnowledgeDoc[] = [
  {
    id: 'bc-deel',
    title: 'Battlecard — Deel',
    kind: 'battlecard',
    source: 'Synthetic competitor battlecard (no proprietary data).',
    updatedAt: '2026-04-12',
    bodyMarkdown: `# Battlecard — Deel (synthetic)

**Common objection:** "Deel quotes flat $599/employee — your pricing is opaque."

**Counter-frame:** Total cost of compliance, not headline rate.
- 180+ countries with owned entities vs Deel's partner-chain in many markets.
- Largest in-house legal team — defensibility under audit committees.
- Implementation in days for entity-owned countries (no third-party handover).
- Be ready to reference SOC 2 Type II coverage breadth.

**Forbidden:** Do not mention Deel by name in cold outbound. Save for warm conversations.
`,
  },
  {
    id: 'bc-remote',
    title: 'Battlecard — Remote',
    kind: 'battlecard',
    source: 'Synthetic competitor battlecard (no proprietary data).',
    updatedAt: '2026-04-12',
    bodyMarkdown: `# Battlecard — Remote (synthetic)

**Common objection:** "Remote feels easier to use."

**Counter-frame:**
- Coverage: ~100 countries (Remote) vs 180+ (us).
- Regulated industries (medtech, fintech) — depth of policy library matters more than UI sheen.
- Owned entities reduce transfer risk under M&A scenarios.

**Forbidden:** Do not mention Remote by name in cold outbound.
`,
  },
  {
    id: 'bc-rippling',
    title: 'Battlecard — Rippling EOR',
    kind: 'battlecard',
    source: 'Synthetic competitor battlecard (no proprietary data).',
    updatedAt: '2026-04-12',
    bodyMarkdown: `# Battlecard — Rippling EOR (synthetic)

**Common objection:** "We already use Rippling for HRIS."

**Counter-frame:**
- Rippling EOR coverage is narrower than headline HRIS coverage suggests.
- Implementation time for full global rollout typically 8–16 weeks vs days-to-weeks for entity-owned EOR.
- Depth of country-specific labor law guidance is the moat.

**Forbidden:** Do not mention Rippling by name in cold outbound.
`,
  },
]

export const knowledgeCorpus = (): KnowledgeDoc[] => battlecards
