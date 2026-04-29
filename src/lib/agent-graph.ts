import type {
  AgentRun,
  AgentStep,
  Company,
  CrmWriteback,
  EvaluatorScores,
  ModelId,
  NurtureSequence,
  Signal,
  StepName,
} from './types'
import { companyById as fixtureCompanyById } from '../data/companies'
import { scoreSignal } from './icp-score'
import { retrieve } from './rag'

export interface BuildRunOptions {
  signal: Signal
  modelMode: 'live-claude' | 'synthetic-deterministic'
  liveDraft?: NurtureSequence
  companies?: Company[]
}

const STEP_LABELS: Record<StepName, string> = {
  plan: 'Plan',
  enrich: 'Enrich (firmographic)',
  icp_score: 'ICP Score',
  rag: 'RAG retrieval',
  draft_nurture: 'Draft Nurture',
  critique: 'Critique (evaluator)',
  hitl: 'HITL Approval',
}

export const STEP_ORDER: StepName[] = [
  'plan',
  'enrich',
  'icp_score',
  'rag',
  'draft_nurture',
  'critique',
  'hitl',
]

interface StepLatency {
  base: number
  jitter: number
}

const LATENCY: Record<StepName, StepLatency> = {
  plan: { base: 920, jitter: 220 },
  enrich: { base: 380, jitter: 120 },
  icp_score: { base: 12, jitter: 6 },
  rag: { base: 110, jitter: 40 },
  draft_nurture: { base: 4100, jitter: 800 },
  critique: { base: 720, jitter: 160 },
  hitl: { base: 0, jitter: 0 },
}

const MODEL_COST_PER_1K = {
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-haiku-4-5': { input: 0.0008, output: 0.004 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
} as const

function deterministicJitter(seed: string, range: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return Math.abs(h) % range
}

export function buildSyntheticRun(opts: BuildRunOptions): AgentRun {
  const { signal, modelMode, liveDraft, companies } = opts
  const company =
    companies?.find((c) => c.id === signal.companyId) ?? fixtureCompanyById(signal.companyId)
  if (!company) throw new Error(`unknown company for signal ${signal.id}`)

  const breakdown = scoreSignal(signal, company)
  const ragHits = retrieve(
    `${signal.headline} ${signal.detail} ${company.industry} ${signal.countryFocus}`,
    { topK: 3 },
  )

  const startedAt = new Date()
  const steps: AgentStep[] = []
  let runningClock = startedAt.getTime()

  function pushStep(
    step: StepName,
    model: ModelId | null,
    inputTokens: number,
    outputTokens: number,
    output: AgentStep['output'],
    notes?: string,
  ) {
    const lat = LATENCY[step]
    const latencyMs =
      lat.base + deterministicJitter(`${signal.id}-${step}`, Math.max(1, lat.jitter))
    const stepStart = new Date(runningClock).toISOString()
    runningClock += latencyMs
    const stepEnd = new Date(runningClock).toISOString()
    steps.push({
      step,
      label: STEP_LABELS[step],
      status: 'complete',
      model,
      latencyMs,
      inputTokens,
      outputTokens,
      output,
      startedAt: stepStart,
      endedAt: stepEnd,
      ...(notes ? { notes } : {}),
    })
  }

  pushStep(
    'plan',
    'claude-sonnet-4-6',
    420,
    180,
    {
      goal: `Produce a brand-safe nurture sequence for ${company.name} given signal ${signal.id}`,
      tools_planned: ['enrich.firmographics', 'icp.score', 'rag.retrieve', 'draft.nurture', 'critique'],
      success_criteria: [
        'evaluator brand-voice score >= 80',
        'evaluator hallucination risk <= 25',
        'CRM write-back is a clean diff (no destructive overwrites)',
      ],
    },
  )

  pushStep('enrich', 'claude-haiku-4-5', 260, 120, {
    company: {
      id: company.id,
      industry: company.industry,
      employeeBand: company.employeeBand,
      fundingStage: company.fundingStage,
      hqCountry: company.hqCountry,
      existingEntities: company.existingEntities,
    },
    enrichment_provider: 'synthetic-firmographic',
  })

  pushStep('icp_score', null, 0, 0, {
    score: breakdown.total,
    band: breakdown.band,
    factors: breakdown.factors,
  })

  pushStep(
    'rag',
    null,
    0,
    0,
    {
      query: `${signal.headline} ${company.industry} ${signal.countryFocus}`,
      hits: ragHits.map((h) => ({
        docId: h.doc.id,
        title: h.doc.title,
        kind: h.doc.kind,
        score: Number(h.score.toFixed(3)),
        matchedTerms: h.matchedTerms.slice(0, 6),
        excerpt: h.excerpt,
      })),
    },
  )

  const draft: NurtureSequence =
    liveDraft ?? buildDeterministicDraft(signal, company, breakdown.band, ragHits.map((h) => h.doc.id))

  pushStep(
    'draft_nurture',
    'claude-sonnet-4-6',
    1620,
    640,
    draft,
  )

  const scores = evaluate(draft, breakdown.band)

  pushStep(
    'critique',
    'claude-haiku-4-5',
    540,
    180,
    scores,
    scores.flagged.length > 0 ? `Flagged: ${scores.flagged.join(', ')}` : undefined,
  )

  const writeback = buildCrmWriteback(signal, company, breakdown.total)

  steps.push({
    step: 'hitl',
    label: STEP_LABELS.hitl,
    status: 'pending',
    model: null,
    latencyMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    output: { writeback },
    startedAt: null,
    endedAt: null,
  })

  const totalInput = steps.reduce((s, x) => s + x.inputTokens, 0)
  const totalOutput = steps.reduce((s, x) => s + x.outputTokens, 0)
  const totalLatency = steps.reduce((s, x) => s + x.latencyMs, 0)
  const estCost = steps.reduce((s, x) => {
    if (!x.model) return s
    const c = MODEL_COST_PER_1K[x.model]
    return s + (x.inputTokens / 1000) * c.input + (x.outputTokens / 1000) * c.output
  }, 0)

  return {
    id: `run-${signal.id}-${startedAt.getTime()}`,
    signalId: signal.id,
    status: 'awaiting_approval',
    startedAt: startedAt.toISOString(),
    steps,
    scores,
    draftNurture: draft,
    writeback,
    totalLatencyMs: totalLatency,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    estCostUsd: Number(estCost.toFixed(4)),
    modelMode,
  }
}

function buildDeterministicDraft(
  signal: Signal,
  company: Company | undefined,
  band: 'high' | 'medium' | 'low',
  ragDocIds: string[],
): NurtureSequence {
  const target = signal.countryFocus
  const co = company!.name
  const subject = `${target}: a question about your ${co} team plan`
  const opening =
    signal.type === 'COMPLIANCE'
      ? `Saw the Q1 transcript flag around ${target} compliance after the recent acquisition.`
      : signal.type === 'FUNDING'
        ? `Noticed the funding announcement and the explicit ${target} reference in the use-of-funds language.`
        : signal.type === 'EXEC_HIRE'
          ? `Picked up the appointment of your new VP with ${target} remit.`
          : `Picked up the ${target} hiring posts at ${co} where there's no on-file entity yet.`
  return {
    rationale: `Lead with the cited public signal (band: ${band}). Reference the typical 60–90 day compliance pressure curve for ${target} entries. Soft close.`,
    brandVoiceCitations: ragDocIds,
    steps: [
      {
        channel: 'email',
        delayHours: 0,
        subject,
        body: `${opening}\n\nIn similar ${company!.industry.toLowerCase()} expansions into ${target}, teams hit registration and payroll-classification questions inside 60–90 days. Happy to send over a 1-page checklist tailored to your stage if useful.\n\nNo deck, no demo — just the checklist.`,
        personalisationCitations: [signal.id, company!.id],
      },
      {
        channel: 'linkedin',
        delayHours: 72,
        body: `Following the email — wanted to share one observation: across 14 mid-market expansions into ${target} we tracked last year, the average time from "first hire posted" to "first compliance fire-drill" was 71 days. Three lines that usually shift the curve, happy to share.`,
        personalisationCitations: [signal.id],
      },
      {
        channel: 'email',
        delayHours: 168,
        subject: `Re: ${target} — last touch from me`,
        body: `Closing the loop. If now's not the right window for a compliance review, I'll move on and stop crowding the inbox. If anything changes, the 1-page ${target} checklist is here whenever it's useful.`,
        personalisationCitations: [signal.id],
      },
    ],
  }
}

function evaluate(draft: NurtureSequence, band: 'high' | 'medium' | 'low'): EvaluatorScores {
  const text = draft.steps.map((s) => `${s.subject ?? ''} ${s.body}`).join(' ').toLowerCase()
  const forbidden = ['synergy', 'game-changing', 'revolutionary', 'ninja', 'rockstar', 'limited time', 'act now']
  const flagged = forbidden.filter((w) => text.includes(w))
  const brandVoiceFit = Math.max(40, 100 - flagged.length * 18)
  const hallucinationRisk = draft.steps.some((s) => /\bguarantee|always|never\b/i.test(s.body)) ? 32 : 12
  const icpConfidence = band === 'high' ? 92 : band === 'medium' ? 74 : 58
  return { brandVoiceFit, hallucinationRisk, icpConfidence, flagged }
}

function buildCrmWriteback(
  signal: Signal,
  company: Company | undefined,
  icpScore: number,
): CrmWriteback {
  const before = {
    id: `crm-co-${company!.id}`,
    name: company!.name,
    icp_segment: 'unsegmented',
    icp_score: 0,
    detected_signals: [] as string[],
    nurture_status: 'none',
    last_touch_at: null as string | null,
    notes: '',
  }
  const after = {
    id: `crm-co-${company!.id}`,
    name: company!.name,
    icp_segment: icpScore >= 70 ? 'eor-mid-market-high-fit' : 'eor-mid-market-watch',
    icp_score: icpScore,
    detected_signals: [signal.id],
    nurture_status: 'queued-pending-approval',
    last_touch_at: new Date().toISOString(),
    notes: `Auto-tagged by Marketing Agent Workbench from signal ${signal.id} (${signal.type}).`,
  }
  const diff: CrmWriteback['diff'] = []
  for (const k of Object.keys(after) as Array<keyof typeof after>) {
    if (JSON.stringify(after[k]) !== JSON.stringify(before[k as keyof typeof before])) {
      diff.push({
        field: k,
        before: before[k as keyof typeof before],
        after: after[k],
      })
    }
  }
  return { object: 'company', recordId: before.id, before, after, diff }
}
