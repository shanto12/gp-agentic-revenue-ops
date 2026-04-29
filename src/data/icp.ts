import type { KnowledgeDoc } from '../lib/types'

export const icpWeights = {
  hasInternationalHiringSignal: 30,
  hasExplicitExpansionLanguage: 25,
  fundingStageSeriesBPlus: 15,
  employeeBandMidMarket: 15,
  noEntityInTargetCountry: 25,
  regulatedIndustry: 10,
  recentExecHireWithGlobalRemit: 10,
  alreadyHasEorElsewhere: 8,
  smallTeamPenalty: -10,
} as const

export const icpDoc: KnowledgeDoc = {
  id: 'icp-eor-2026',
  title: 'EOR Buyer ICP — 2026 baseline',
  kind: 'icp',
  source: 'Internal G-P-style ICP doc (synthetic)',
  updatedAt: '2026-04-15',
  bodyMarkdown: `# EOR Buyer ICP — 2026 baseline

## Firmographic
- Employee band: 200 to 5,000 (mid-market sweet spot 500–2,500).
- Funding: Series B+ or PE-backed; profitable bootstrapped ok if expanding.
- Geography: HQ in NA, EMEA, or APAC with clear cross-border movement.

## Buying-stage signals (highest to lowest)
1. **Compliance trigger language** — direct mentions of compliance complexity in earnings calls or regulatory filings (intent: explicit).
2. **Hiring in country with no legal entity** — international job posts where Companies House or Bundesanzeiger or local registry shows no entity.
3. **Funding round with stated international use of funds.**
4. **Executive appointment with international remit** (VP EMEA Ops, Head of APAC Growth, etc.).
5. **Expansion press release** naming countries.
6. **Already buys EOR in some markets** but not all (cross-sell vector).

## Disqualifiers
- Headcount < 50 (use Contractor product instead).
- Pure venture-stage (< $5M ARR) without clear international roadmap.
- Industries with extreme regulatory custom needs (defense primes, nuclear) — handle as named-account.

## Compliance-first positioning notes
- Lead with audit defensibility, owned legal entities (vs partner-chain), and breadth (180+ countries).
- Flat per-employee pricing competitor anchoring is a yellow flag — counter with Total Cost of Compliance framing.
`,
}
