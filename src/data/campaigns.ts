import type { Campaign, ReallocationProposal } from '../lib/types'

export const campaigns: Campaign[] = [
  {
    id: 'camp-search-eor-mid-market',
    name: 'Search — "EOR mid-market"',
    channel: 'Search',
    spendUsd: 18420,
    budgetUsd: 25000,
    leads: 41,
    cpl: 449.27,
    roi: 0.92,
    trend: [38, 41, 39, 36, 33, 30, 28],
    creativeNotes: 'Headline variant B uses "rockstar global team" — flagged off-tone.',
    brandVoiceFlag: 'rockstar',
  },
  {
    id: 'camp-linkedin-revops-leaders',
    name: 'LinkedIn — RevOps Leaders',
    channel: 'LinkedIn',
    spendUsd: 11200,
    budgetUsd: 15000,
    leads: 36,
    cpl: 311.11,
    roi: 1.62,
    trend: [22, 24, 25, 28, 30, 33, 36],
    creativeNotes: 'Three-day rolling CPL trending down 38% — agent recommends reallocation in.',
  },
  {
    id: 'camp-email-q2-nurture',
    name: 'Email — Q2 Compliance Nurture',
    channel: 'Email Nurture',
    spendUsd: 4800,
    budgetUsd: 6000,
    leads: 19,
    cpl: 252.63,
    roi: 1.18,
    trend: [12, 14, 14, 16, 17, 18, 19],
    creativeNotes: 'Quiet performer; brand voice clean.',
  },
]

export const reallocationProposal: ReallocationProposal = {
  fromCampaignId: 'camp-search-eor-mid-market',
  toCampaignId: 'camp-linkedin-revops-leaders',
  amountUsd: 4200,
  reasoning:
    'Search "EOR mid-market" 3-day rolling CPL is up 47% vs trailing 14-day average; LinkedIn RevOps Leaders 3-day rolling CPL is down 38%. Reallocating $4,200 brings the LinkedIn cohort into projected ROI > 1.8 with confidence band ±0.21.',
  confidence: 0.84,
  citations: [
    'campaign-feed#camp-search-eor-mid-market.cpl_3d',
    'campaign-feed#camp-linkedin-revops-leaders.cpl_3d',
    'roi-attribution-model#mid-market-revops-cohort',
  ],
}

export const campaignById = (id: string) => campaigns.find((c) => c.id === id)
