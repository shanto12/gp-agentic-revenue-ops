import { describe, expect, it } from 'vitest'
import { buildSyntheticRun, STEP_ORDER } from './agent-graph'
import { signals } from '../data/signals'

describe('buildSyntheticRun', () => {
  it('produces a run with all steps in the canonical order', () => {
    const run = buildSyntheticRun({
      signal: signals[0]!,
      modelMode: 'synthetic-deterministic',
    })
    expect(run.steps.map((s) => s.step)).toEqual(STEP_ORDER)
  })

  it('lands awaiting_approval and produces a CRM diff', () => {
    const run = buildSyntheticRun({
      signal: signals[0]!,
      modelMode: 'synthetic-deterministic',
    })
    expect(run.status).toBe('awaiting_approval')
    expect(run.writeback).not.toBeNull()
    expect(run.writeback!.diff.length).toBeGreaterThan(0)
  })

  it('flags forbidden brand-voice terms when present in the draft', () => {
    const sig = signals[0]!
    const badDraft = {
      rationale: 'malformed',
      brandVoiceCitations: [],
      steps: [
        {
          channel: 'email' as const,
          delayHours: 0,
          subject: 'Synergy unlocked',
          body: 'This is a game-changing limited time act now opportunity for ninjas.',
          personalisationCitations: [],
        },
      ],
    }
    const run = buildSyntheticRun({
      signal: sig,
      modelMode: 'synthetic-deterministic',
      liveDraft: badDraft,
    })
    expect(run.scores.flagged.length).toBeGreaterThan(0)
    expect(run.scores.brandVoiceFit).toBeLessThan(80)
  })
})
