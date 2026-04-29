import type { Signal } from '../lib/types'

export const signals: Signal[] = [
  {
    id: 'sig-001',
    type: 'HIRING_INTL',
    companyId: 'lumenscale',
    headline: '12 engineering roles posted in Berlin & Munich — no DE entity on file',
    detail:
      'Greenhouse jobs feed shows 12 active roles requiring German language and on-site presence in Berlin or Munich. Lumenscale Robotics has no Bundesanzeiger-listed German subsidiary as of Q4 2025.',
    sourceUrl: 'https://example.invalid/synthetic/lumenscale-jobs',
    capturedAt: '2026-04-28T13:42:00Z',
    countryFocus: 'Germany',
    countryFlag: '🇩🇪',
    rawPayload: {
      provider: 'greenhouse-jobs-feed',
      roleCount: 12,
      cities: ['Berlin', 'Munich'],
      languages: ['German', 'English'],
      filedEntity: false,
    },
  },
  {
    id: 'sig-002',
    type: 'FUNDING',
    companyId: 'verdantia',
    headline: 'Verdantia Foods raised $120M Series D — APAC expansion named in deck',
    detail:
      'TechCrunch coverage of Series D explicitly references "first APAC offices in 2026." 6sense intent surge confirms 4× normal research traffic on EOR-adjacent terms.',
    sourceUrl: 'https://example.invalid/synthetic/verdantia-techcrunch',
    capturedAt: '2026-04-27T19:10:00Z',
    countryFocus: 'Singapore + Japan',
    countryFlag: '🌏',
    rawPayload: {
      provider: 'techcrunch-rss',
      roundUsd: 120000000,
      lead: 'Wellington Ventures',
      stated_use_of_funds: 'APAC expansion + brand investment',
    },
  },
  {
    id: 'sig-003',
    type: 'EXPANSION',
    companyId: 'cinder',
    headline: 'Cinder & Steel posts 6 UK retail-ops jobs ahead of London flagship',
    detail:
      'LinkedIn job posts dated 5 days ago for store managers, visual merchandisers, and a regional ops lead. UK Companies House shows no incorporated entity.',
    sourceUrl: 'https://example.invalid/synthetic/cinder-linkedin',
    capturedAt: '2026-04-28T08:05:00Z',
    countryFocus: 'United Kingdom',
    countryFlag: '🇬🇧',
    rawPayload: {
      provider: 'linkedin-jobs',
      roleCount: 6,
      city: 'London',
      filedEntity: false,
    },
  },
  {
    id: 'sig-004',
    type: 'EXEC_HIRE',
    companyId: 'lumenscale',
    headline: 'Lumenscale appoints VP EMEA Operations',
    detail:
      'Press release names former Bosch executive as VP EMEA Ops. Strong predictor of imminent EMEA hiring surge based on cohort patterns.',
    sourceUrl: 'https://example.invalid/synthetic/lumenscale-vp-press',
    capturedAt: '2026-04-26T11:30:00Z',
    countryFocus: 'EMEA',
    countryFlag: '🇪🇺',
    rawPayload: {
      provider: 'company-press-release',
      executiveName: 'A. Müller-Schmidt',
      remit: 'EMEA Operations',
    },
  },
  {
    id: 'sig-005',
    type: 'EXPANSION',
    companyId: 'northsail',
    headline: 'Northsail Maritime announces Brazil & Chile expansion in investor letter',
    detail:
      'Q1 investor letter section "South America Build-Out" names port-ops staffing in São Paulo and Valparaíso. Already EOR-savvy in DK + SG.',
    sourceUrl: 'https://example.invalid/synthetic/northsail-investor-letter',
    capturedAt: '2026-04-25T15:00:00Z',
    countryFocus: 'Brazil + Chile',
    countryFlag: '🇧🇷',
    rawPayload: {
      provider: 'investor-letter-rss',
      regions: ['Brazil', 'Chile'],
      stage: 'announced',
    },
  },
  {
    id: 'sig-006',
    type: 'COMPLIANCE',
    companyId: 'helix',
    headline: 'Helix Diagnostics CFO flags Japan compliance complexity post-acquisition',
    detail:
      'Q1 earnings call transcript: "we are evaluating EOR options for the 90 acquired Tokyo staff while we sort registrations." Direct intent.',
    sourceUrl: 'https://example.invalid/synthetic/helix-q1-call',
    capturedAt: '2026-04-24T22:18:00Z',
    countryFocus: 'Japan',
    countryFlag: '🇯🇵',
    rawPayload: {
      provider: 'earnings-transcript',
      acquisitionStaff: 90,
      intentExplicit: true,
    },
  },
  {
    id: 'sig-007',
    type: 'HIRING_INTL',
    companyId: 'brightway',
    headline: 'Brightway CEO posts about scaling AU + SG sales teams',
    detail:
      'Public LinkedIn post by founder/CEO; no AU or SG entity on file. Small but warm-touch fit for EOR pilot.',
    sourceUrl: 'https://example.invalid/synthetic/brightway-linkedin',
    capturedAt: '2026-04-28T05:55:00Z',
    countryFocus: 'Australia + Singapore',
    countryFlag: '🇦🇺',
    rawPayload: {
      provider: 'linkedin-post',
      countries: ['Australia', 'Singapore'],
      filedEntity: false,
    },
  },
  {
    id: 'sig-008',
    type: 'COMPLIANCE',
    companyId: 'orion',
    headline: 'Orion Pay files Mexico financial-services license — hiring compliance lead',
    detail:
      'CNBV filing reference visible in regulatory feeds. LinkedIn shows new Compliance Lead Mexico job dated yesterday.',
    sourceUrl: 'https://example.invalid/synthetic/orion-cnbv',
    capturedAt: '2026-04-28T11:11:00Z',
    countryFocus: 'Mexico',
    countryFlag: '🇲🇽',
    rawPayload: {
      provider: 'cnbv-feed',
      filingType: 'IFPE-license-application',
      hiringLeadCity: 'Mexico City',
    },
  },
  {
    id: 'sig-009',
    type: 'FUNDING',
    companyId: 'aurora',
    headline: 'Aurora Climate raises $48M Series A — names US East Coast as priority',
    detail:
      'Series A press explicitly states "open first US office in Boston by Q3." Sweden-based; no US footprint.',
    sourceUrl: 'https://example.invalid/synthetic/aurora-pr',
    capturedAt: '2026-04-23T09:42:00Z',
    countryFocus: 'United States',
    countryFlag: '🇺🇸',
    rawPayload: {
      provider: 'press-release-rss',
      roundUsd: 48000000,
      city: 'Boston',
      timeline: 'Q3 2026',
    },
  },
]

export const signalById = (id: string) => signals.find((s) => s.id === id)
