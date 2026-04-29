// Shared SSE event-type contract for the /api/agent-run parallel-subagent
// pipeline. Both the Netlify function and the React client speak this set —
// keeping the names in one place lets us assert on them in tests without
// coupling to either side's implementation.

export type ParallelSubagentId =
  | 'research-enricher'
  | 'draft-compliance'
  | 'draft-talent'
  | 'draft-speed'

export type ParallelDraftVariant = 'compliance' | 'talent' | 'speed'

export const PARALLEL_SSE_EVENTS = [
  'start',
  'subagent',
  'consolidating',
  'consolidator',
  'result',
  'done',
] as const

export type ParallelSseEvent = (typeof PARALLEL_SSE_EVENTS)[number]

export const PARALLEL_SUBAGENT_IDS: readonly ParallelSubagentId[] = [
  'research-enricher',
  'draft-compliance',
  'draft-talent',
  'draft-speed',
] as const

export const PARALLEL_DRAFT_VARIANTS: readonly ParallelDraftVariant[] = [
  'compliance',
  'talent',
  'speed',
] as const

export interface ParallelStartEvent {
  plannedSubagents: 4
  modelId: string
}

export interface ParallelSubagentEvent {
  id: ParallelSubagentId
  status: 'ok' | 'error'
  latencyMs: number
  payload?: unknown
  error?: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
  webSearchHitCount?: number
}

export interface ParallelConsolidatorEvent {
  winnerVariant: ParallelDraftVariant | null
  evaluatorScores: Record<
    ParallelDraftVariant,
    { brandVoiceFit: number; hallucinationRisk: number; icpConfidence: number; flagged: string[] }
  > | null
  rationale: string | null
  latencyMs: number
  error?: string
}

export interface ParallelResultEvent {
  drafts: Record<ParallelDraftVariant, unknown>
  research: unknown
  winner: { variant: ParallelDraftVariant; draft: unknown } | null
  totalLatencyMs: number
  totalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  webSearchHitCount: number
}

export function isParallelSseEvent(name: string): name is ParallelSseEvent {
  return (PARALLEL_SSE_EVENTS as readonly string[]).includes(name)
}

export function isParallelSubagentId(id: string): id is ParallelSubagentId {
  return (PARALLEL_SUBAGENT_IDS as readonly string[]).includes(id)
}

export function isParallelDraftVariant(v: string): v is ParallelDraftVariant {
  return (PARALLEL_DRAFT_VARIANTS as readonly string[]).includes(v)
}
