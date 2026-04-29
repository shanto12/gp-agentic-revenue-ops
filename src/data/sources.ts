export interface AssetSource {
  id: string
  type: string
  source: string
  notes: string
}

export const assetSources: AssetSource[] = [
  {
    id: 'synthetic-companies',
    type: 'fixture-data',
    source: 'Hand-authored synthetic companies. No real customers, no real PII.',
    notes:
      'Names like "Lumenscale Robotics" and "Verdantia Foods" are intentionally fictional; do not link to any real business.',
  },
  {
    id: 'synthetic-signals',
    type: 'fixture-data',
    source:
      'Hand-authored intent-signal stream modelled on plausible public-feed shapes (jobs feeds, press, earnings transcripts).',
    notes: 'No real LinkedIn or Greenhouse data is ingested.',
  },
  {
    id: 'icp-doc',
    type: 'knowledge-base',
    source: 'Synthetic EOR-buyer ICP doc.',
    notes:
      'Reflects publicly known EOR market segmentation patterns; not a leaked or proprietary G-P document.',
  },
  {
    id: 'brand-voice-doc',
    type: 'knowledge-base',
    source: 'Synthetic outbound brand-voice playbook.',
    notes: 'Modeled on enterprise compliance-led B2B tone. No proprietary content.',
  },
  {
    id: 'battlecards',
    type: 'knowledge-base',
    source:
      'Synthetic battlecards for Deel, Remote, Rippling EOR built from public market positioning summaries.',
    notes:
      'No proprietary information. Cold outbound usage is explicitly disallowed inside the brand-voice doc.',
  },
]
