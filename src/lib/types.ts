export type SignalType =
  | 'HIRING_INTL'
  | 'FUNDING'
  | 'EXPANSION'
  | 'EXEC_HIRE'
  | 'COMPLIANCE'

export type AgentStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'

export interface Company {
  id: string
  name: string
  hqCountry: string
  hqFlag: string
  industry: string
  employeeBand: string
  fundingStage: string
  revenueBand: string
  hasGlobalHrFootprint: boolean
  existingEntities: string[]
  publicSignals: string[]
}

export interface Signal {
  id: string
  type: SignalType
  companyId: string
  headline: string
  detail: string
  sourceUrl: string
  capturedAt: string
  countryFocus: string
  countryFlag: string
  rawPayload: Record<string, unknown>
}

export type StepName =
  | 'plan'
  | 'enrich'
  | 'icp_score'
  | 'rag'
  | 'draft_nurture'
  | 'critique'
  | 'hitl'

export type ModelId = 'claude-sonnet-4-6' | 'claude-haiku-4-5' | 'gpt-4o-mini'

export interface AgentStep {
  step: StepName
  label: string
  status: 'pending' | 'running' | 'complete' | 'flagged'
  model: ModelId | null
  latencyMs: number
  inputTokens: number
  outputTokens: number
  output: unknown
  startedAt: string | null
  endedAt: string | null
  notes?: string
}

export interface EvaluatorScores {
  brandVoiceFit: number
  hallucinationRisk: number
  icpConfidence: number
  flagged: string[]
}

export interface CrmWriteback {
  object: 'contact' | 'company' | 'opportunity'
  recordId: string | null
  before: Record<string, unknown>
  after: Record<string, unknown>
  diff: Array<{ field: string; before: unknown; after: unknown }>
}

export interface AgentRun {
  id: string
  signalId: string
  status: AgentStatus
  startedAt: string
  steps: AgentStep[]
  scores: EvaluatorScores
  draftNurture: NurtureSequence | null
  writeback: CrmWriteback | null
  totalLatencyMs: number
  totalInputTokens: number
  totalOutputTokens: number
  estCostUsd: number
  modelMode: 'live-claude' | 'synthetic-deterministic'
}

export interface NurtureStep {
  channel: 'email' | 'linkedin' | 'ad'
  delayHours: number
  subject?: string
  body: string
  personalisationCitations: string[]
}

export interface NurtureSequence {
  steps: NurtureStep[]
  rationale: string
  brandVoiceCitations: string[]
}

export interface Campaign {
  id: string
  name: string
  channel: 'Search' | 'LinkedIn' | 'Email Nurture'
  spendUsd: number
  budgetUsd: number
  leads: number
  cpl: number
  roi: number
  trend: number[]
  creativeNotes: string
  brandVoiceFlag?: string
}

export interface ReallocationProposal {
  fromCampaignId: string
  toCampaignId: string
  amountUsd: number
  reasoning: string
  confidence: number
  citations: string[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  signalId?: string
  campaignId?: string
  action: string
  step?: StepName
  model?: ModelId
  tokens?: number
  latencyMs?: number
  evaluatorScore?: number
  approver: string
  status: 'ok' | 'flagged' | 'rejected'
}

export interface KnowledgeDoc {
  id: string
  title: string
  kind: 'brand-voice' | 'icp' | 'battlecard' | 'compliance'
  source: string
  updatedAt: string
  bodyMarkdown: string
}
