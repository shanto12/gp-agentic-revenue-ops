import { describe, expect, it } from 'vitest'
import {
  PARALLEL_DRAFT_VARIANTS,
  PARALLEL_SSE_EVENTS,
  PARALLEL_SUBAGENT_IDS,
  isParallelDraftVariant,
  isParallelSseEvent,
  isParallelSubagentId,
} from './parallel-agent-events'

describe('parallel-agent-events SSE contract', () => {
  it('emits the canonical event sequence for a successful run', () => {
    expect(PARALLEL_SSE_EVENTS).toEqual([
      'start',
      'subagent',
      'consolidating',
      'consolidator',
      'result',
      'done',
    ])
  })

  it('declares exactly four subagent ids in canonical order', () => {
    expect(PARALLEL_SUBAGENT_IDS).toEqual([
      'research-enricher',
      'draft-compliance',
      'draft-talent',
      'draft-speed',
    ])
    expect(PARALLEL_SUBAGENT_IDS).toHaveLength(4)
  })

  it('declares the three draft variants and they line up with the draft- subagents', () => {
    expect(PARALLEL_DRAFT_VARIANTS).toEqual(['compliance', 'talent', 'speed'])
    for (const variant of PARALLEL_DRAFT_VARIANTS) {
      expect(PARALLEL_SUBAGENT_IDS).toContain(`draft-${variant}` as (typeof PARALLEL_SUBAGENT_IDS)[number])
    }
  })

  it('exposes type-guards that accept canonical names and reject others', () => {
    for (const name of PARALLEL_SSE_EVENTS) {
      expect(isParallelSseEvent(name)).toBe(true)
    }
    expect(isParallelSseEvent('delta')).toBe(false)
    expect(isParallelSseEvent('keepalive')).toBe(false)

    for (const id of PARALLEL_SUBAGENT_IDS) {
      expect(isParallelSubagentId(id)).toBe(true)
    }
    expect(isParallelSubagentId('draft-unknown')).toBe(false)

    for (const v of PARALLEL_DRAFT_VARIANTS) {
      expect(isParallelDraftVariant(v)).toBe(true)
    }
    expect(isParallelDraftVariant('research')).toBe(false)
  })

  it('parses a sample SSE log and confirms the event sequence is well-formed', () => {
    // Simulates the order of events emitted by netlify/functions/agent-run.mjs
    // when all four subagents and the consolidator succeed. The exact payload
    // shapes are part of the contract that the front-end depends on.
    const sample: Array<{ event: string }> = [
      { event: 'start' },
      { event: 'subagent' }, // research-enricher
      { event: 'subagent' }, // draft-compliance
      { event: 'subagent' }, // draft-talent
      { event: 'subagent' }, // draft-speed
      { event: 'consolidating' },
      { event: 'consolidator' },
      { event: 'result' },
      { event: 'done' },
    ]
    const events = sample.map((e) => e.event)
    expect(events.filter((e) => e === 'subagent')).toHaveLength(4)
    expect(events[0]).toBe('start')
    expect(events[events.length - 1]).toBe('done')
    expect(events.includes('consolidating')).toBe(true)
    expect(events.includes('consolidator')).toBe(true)
    expect(events.includes('result')).toBe(true)
    for (const e of events) expect(isParallelSseEvent(e)).toBe(true)
  })
})
