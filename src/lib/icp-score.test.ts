import { describe, expect, it } from 'vitest'
import { scoreSignal } from './icp-score'
import { signals } from '../data/signals'
import { companies } from '../data/companies'

const must = <T>(v: T | undefined): T => {
  if (v === undefined) throw new Error('expected value to be defined')
  return v
}

describe('scoreSignal', () => {
  it('scores high for international hiring with no entity in target country', () => {
    const sig = must(signals.find((s) => s.id === 'sig-001'))
    const co = must(companies.find((c) => c.id === sig.companyId))
    const result = scoreSignal(sig, co)
    expect(result.total).toBeGreaterThanOrEqual(70)
    expect(result.band).toBe('high')
    const noEntityFactor = must(
      result.factors.find((f) => f.key === 'noEntityInTargetCountry'),
    )
    expect(noEntityFactor.matched).toBe(true)
  })

  it('keeps the score in the 0-100 band', () => {
    for (const sig of signals) {
      const co = must(companies.find((c) => c.id === sig.companyId))
      const result = scoreSignal(sig, co)
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(100)
    }
  })

  it('penalises a too-small team', () => {
    const sig = must(signals.find((s) => s.id === 'sig-009'))
    const co = must(companies.find((c) => c.id === sig.companyId))
    const result = scoreSignal(sig, co)
    const penalty = must(result.factors.find((f) => f.key === 'smallTeamPenalty'))
    expect(penalty.matched).toBe(true)
  })
})
