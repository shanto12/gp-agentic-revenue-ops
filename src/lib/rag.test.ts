import { describe, expect, it } from 'vitest'
import { retrieve } from './rag'

describe('retrieve', () => {
  it('returns at most topK hits, sorted by score', () => {
    const hits = retrieve('international hiring expansion compliance', { topK: 3 })
    expect(hits.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score)
    }
  })

  it('finds the brand-voice doc when querying brand voice terms', () => {
    const hits = retrieve('outbound brand voice forbidden phrases')
    expect(hits[0]?.doc.kind).toBe('brand-voice')
  })

  it('limits to a kind when requested', () => {
    const hits = retrieve('competitor pricing flat rate', {
      kinds: ['battlecard'],
      topK: 5,
    })
    for (const h of hits) expect(h.doc.kind).toBe('battlecard')
  })
})
