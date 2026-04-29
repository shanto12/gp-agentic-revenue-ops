import { useEffect, useMemo, useState } from 'react'
import type {
  AgentRun,
  AgentStep,
  Company,
  NurtureSequence,
  Signal,
  StepName,
} from '../lib/types'
import { Icon } from './Icon'
import { Gauge, JsonView, ModelChip, ScoreChip, StatusBadge, TypeTag } from './Primitives'
import { formatLatency, formatTokens, formatTimeAgo } from '../lib/format'
import { DeepResearchPanel, type ResearchResult } from './DeepResearchPanel'

export type ParallelVariantId = 'compliance' | 'talent' | 'speed'

export interface ParallelSubagentSnapshot {
  id: string
  status: 'queued' | 'running' | 'ok' | 'error'
  latencyMs: number | null
  startedAt?: number
  payload?: unknown
  error?: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
  webSearchHitCount?: number
}

export interface ParallelEvaluatorScores {
  brandVoiceFit: number
  hallucinationRisk: number
  icpConfidence: number
  flagged: string[]
}

export interface ParallelAgentRunState {
  status: 'idle' | 'streaming' | 'done' | 'error'
  subagents: Record<string, ParallelSubagentSnapshot>
  consolidator: {
    status: 'running' | 'ok' | 'error'
    latencyMs?: number
    rationale?: string | null
    evaluatorScores?: Record<ParallelVariantId, ParallelEvaluatorScores> | null
    error?: string
  } | null
  winner: ParallelVariantId | null
  evaluatorScores?: Record<ParallelVariantId, ParallelEvaluatorScores> | null
  drafts: Record<ParallelVariantId, NurtureSequence | null>
  research: {
    keyFacts?: string[]
    publicEvidence?: Array<{ title: string; link: string; publishDate: string | null }>
    confidence?: number
  } | null
  totalLatencyMs: number | null
  totalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
  webSearchHitCount: number
  error: string | null
}

const SUBAGENT_LABELS: Record<string, string> = {
  'research-enricher': 'Research enricher (web)',
  'draft-compliance': 'Draft · compliance lens',
  'draft-talent': 'Draft · talent lens',
  'draft-speed': 'Draft · speed lens',
}

const VARIANT_LABELS: Record<ParallelVariantId, string> = {
  compliance: 'Compliance',
  talent: 'Talent',
  speed: 'Speed-to-market',
}

interface Props {
  run: AgentRun
  signal: Signal
  company: Company
  onApprove: () => void
  onReject: () => void
  onBack: () => void
  liveModeAvailable: boolean
  onRerunParallel: () => void
  parallel: ParallelAgentRunState
  webSearchHits?: Array<{
    title: string
    link: string
    publishDate: string | null
    refer: string | null
    excerpt: string
  }>
  researchAvailable: boolean
  onRunResearch: () => Promise<void> | void
  researchLoading: boolean
  researchError: string | null
  researchResult: ResearchResult | null
}

export function AgentRunScreen({
  run,
  signal,
  company,
  onApprove,
  onReject,
  onBack,
  liveModeAvailable,
  onRerunParallel,
  parallel,
  webSearchHits,
  researchAvailable,
  onRunResearch,
  researchLoading,
  researchError,
  researchResult,
}: Props) {
  const [openStep, setOpenStep] = useState<StepName | null>('draft_nurture')

  const decision = run.status

  const winnerDraft: NurtureSequence | null = useMemo(() => {
    if (!parallel.winner) return null
    return parallel.drafts[parallel.winner] ?? null
  }, [parallel.winner, parallel.drafts])

  const effectiveDraft: NurtureSequence | null = winnerDraft ?? run.draftNurture
  const effectiveWriteback = run.writeback

  const effectiveScores = useMemo(() => {
    if (parallel.winner && parallel.evaluatorScores?.[parallel.winner]) {
      return parallel.evaluatorScores[parallel.winner]
    }
    return run.scores
  }, [parallel.winner, parallel.evaluatorScores, run.scores])

  const totalsRow = useMemo(
    () => (
      <div className="kvp" style={{ marginTop: 8 }}>
        <dt>Total latency</dt>
        <dd className="mono">{formatLatency(run.totalLatencyMs)}</dd>
        <dt>Total tokens</dt>
        <dd className="mono">
          {formatTokens(run.totalInputTokens)} in · {formatTokens(run.totalOutputTokens)} out
        </dd>
        <dt>Est. cost</dt>
        <dd className="mono">${run.estCostUsd.toFixed(4)}</dd>
        <dt>Mode</dt>
        <dd className="mono">{run.modelMode}</dd>
        {parallel.totalLatencyMs != null && (
          <>
            <dt>Parallel run</dt>
            <dd className="mono">
              {formatLatency(parallel.totalLatencyMs)} ·{' '}
              {parallel.totalUsage?.total_tokens ?? 0}t · {parallel.webSearchHitCount} web hits
            </dd>
          </>
        )}
      </div>
    ),
    [run, parallel],
  )

  return (
    <div className="run-grid" aria-labelledby="run-h1">
      <aside className="run-col run-col--scroll" aria-label="Signal context">
        <button className="btn btn--ghost btn--sm" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          <Icon name="chevron" size={11} className="" />
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>
            <Icon name="chevron" size={11} />
          </span>
          Back to signals
        </button>
        <div className="card">
          <div className="card__head">
            <span className="sec-title">Signal</span>
            <span className="tb__spacer" />
            <TypeTag code={signal.type} />
          </div>
          <div className="card__body">
            <h2 id="run-h1" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              {company.name}
            </h2>
            <p className="page__sub" style={{ marginTop: 4 }}>
              {company.industry} · {company.hqFlag} {company.hqCountry} · {company.employeeBand}
            </p>
            <p style={{ marginTop: 12, fontSize: 13 }}>{signal.headline}</p>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>{signal.detail}</p>
            <div className="kvp" style={{ marginTop: 12 }}>
              <dt>Country focus</dt>
              <dd>
                {signal.countryFlag} {signal.countryFocus}
              </dd>
              <dt>Funding</dt>
              <dd>{company.fundingStage}</dd>
              <dt>Existing entities</dt>
              <dd>{company.existingEntities.join(', ')}</dd>
              <dt>Detected</dt>
              <dd>{formatTimeAgo(signal.capturedAt)}</dd>
              <dt>Source</dt>
              <dd>
                {signal.id.startsWith('sig-live-') && /^https?:\/\//.test(signal.sourceUrl) ? (
                  <a
                    href={signal.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-2)' }}
                  >
                    {(() => {
                      try {
                        return new URL(signal.sourceUrl).hostname
                      } catch {
                        return 'live source'
                      }
                    })()}{' '}
                    <Icon name="external" size={10} />
                  </a>
                ) : (
                  <a
                    href={signal.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-2)' }}
                    onClick={(e) => e.preventDefault()}
                  >
                    synthetic source <Icon name="external" size={10} />
                  </a>
                )}
              </dd>
            </div>
            <details className="code-fold" style={{ marginTop: 10 }}>
              <summary>Raw signal payload</summary>
              <JsonView data={signal.rawPayload} maxHeight={160} />
            </details>
          </div>
        </div>
        <div className="card">
          <div className="card__head">
            <span className="sec-title">Run totals</span>
          </div>
          <div className="card__body">{totalsRow}</div>
        </div>
      </aside>

      <section className="run-col run-col--scroll" aria-label="Reasoning timeline">
        <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            <Icon name="branch" size={12} /> Reasoning timeline
          </h3>
          <span className="tb__spacer" />
          {liveModeAvailable && (
            <button
              className="btn btn--sm"
              onClick={onRerunParallel}
              disabled={parallel.status === 'streaming'}
              aria-label="Re-run parallel agents"
            >
              <Icon name="sparkle" size={11} />
              {parallel.status === 'streaming' ? 'Running…' : 'Re-run parallel agents'}
            </button>
          )}
        </header>
        {parallel.error && (
          <div role="alert" className="card" style={{ borderColor: 'var(--red)' }}>
            <div className="card__body" style={{ color: 'var(--red)', fontSize: 12 }}>
              <Icon name="alert" size={12} /> {parallel.error}
            </div>
          </div>
        )}
        <div className="tl">
          {run.steps.map((step, idx) => (
            <TimelineStep
              key={step.step}
              step={step}
              index={idx + 1}
              open={openStep === step.step}
              onToggle={() => setOpenStep(openStep === step.step ? null : step.step)}
            />
          ))}
        </div>

        <ParallelSubagentPanel parallel={parallel} />
        <RecommendedDraftCard parallel={parallel} />

        {webSearchHits && webSearchHits.length > 0 && (
          <section className="card">
            <div className="card__head">
              <Icon name="globe" size={13} />
              <span className="card__title">
                Public sources cited by the model ({webSearchHits.length})
              </span>
            </div>
            <div className="card__body">
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                {webSearchHits.map((h, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--ink)', fontWeight: 600 }}
                    >
                      {h.title}
                    </a>
                    {h.publishDate && (
                      <span className="mono" style={{ color: 'var(--muted)' }}>
                        {' '}
                        · {h.publishDate}
                      </span>
                    )}
                    {h.refer && (
                      <span className="kbd" style={{ marginLeft: 6 }}>
                        {h.refer}
                      </span>
                    )}
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 0' }}>
                      {h.excerpt}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <DeepResearchPanel
          available={researchAvailable}
          onRun={onRunResearch}
          loading={researchLoading}
          error={researchError}
          result={researchResult}
        />
      </section>

      <aside className="rail" aria-label="HITL gate">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="shield" size={13} />
          <strong style={{ fontSize: 13 }}>HITL Gate</strong>
          <span className="tb__spacer" />
          <StatusBadge status={decision} />
        </div>

        <div className="card">
          <div className="card__head">
            <span className="sec-title">Evaluator scores</span>
            {parallel.winner && (
              <>
                <span className="tb__spacer" />
                <span className="kbd">winner: {VARIANT_LABELS[parallel.winner]}</span>
              </>
            )}
          </div>
          <div className="card__body">
            <Gauge label="Brand-voice fit" value={effectiveScores.brandVoiceFit} tone="good" />
            <Gauge
              label="Hallucination risk"
              value={effectiveScores.hallucinationRisk}
              tone={effectiveScores.hallucinationRisk > 25 ? 'bad' : 'good'}
              invert
            />
            <Gauge
              label="ICP confidence"
              value={effectiveScores.icpConfidence}
              tone={effectiveScores.icpConfidence >= 70 ? 'good' : 'warn'}
            />
            {effectiveScores.flagged && effectiveScores.flagged.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--red)', margin: '6px 0 0' }}>
                <Icon name="alert" size={11} /> Flagged terms: {effectiveScores.flagged.join(', ')}
              </p>
            )}
          </div>
        </div>

        {effectiveDraft && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card__head">
              <span className="sec-title">Recommended draft</span>
              {parallel.winner && (
                <>
                  <span className="tb__spacer" />
                  <span className="kbd">{VARIANT_LABELS[parallel.winner]}</span>
                </>
              )}
            </div>
            <div className="card__body">
              <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0 }}>
                {effectiveDraft.rationale}
              </p>
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 12, cursor: 'pointer' }}>
                  Step 1 body preview
                </summary>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    margin: '6px 0 0',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {effectiveDraft.steps[0]?.body ?? '(empty)'}
                </p>
              </details>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 12 }}>
          <div className="card__head">
            <span className="sec-title">Proposed CRM write-back</span>
            <span className="tb__spacer" />
            <span className="kbd">{effectiveWriteback?.object}</span>
          </div>
          <div className="card__body">
            <div className="diff">
              {effectiveWriteback?.diff.map((d) => (
                <div key={d.field}>
                  <div className="diff__line diff__line--del">
                    <span className="diff__sigil">-</span>
                    <span>
                      <strong>{d.field}</strong>: {JSON.stringify(d.before)}
                    </span>
                  </div>
                  <div className="diff__line diff__line--add">
                    <span className="diff__sigil">+</span>
                    <span>
                      <strong>{d.field}</strong>: {JSON.stringify(d.after)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              Diff against synthetic CRM record{' '}
              <span className="kbd">{effectiveWriteback?.recordId}</span>. Nothing is sent until
              you approve.
            </p>
          </div>
        </div>

        <div className="gate-actions" style={{ marginTop: 16 }}>
          <button
            className="btn btn--primary"
            onClick={onApprove}
            disabled={decision === 'approved'}
          >
            <Icon name="check" size={12} /> Approve & queue write-back
          </button>
          <button className="btn" onClick={onApprove} disabled={decision === 'approved'}>
            <Icon name="edit" size={12} /> Edit before approving
          </button>
          <button className="btn btn--danger" onClick={onReject} disabled={decision === 'rejected'}>
            <Icon name="x" size={12} /> Reject with reason
          </button>
        </div>
      </aside>
    </div>
  )
}

function ParallelSubagentPanel({ parallel }: { parallel: ParallelAgentRunState }) {
  const [open, setOpen] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // tick to drive live latency for running cards
  useEffect(() => {
    const anyRunning = Object.values(parallel.subagents).some((s) => s.status === 'running')
    if (!anyRunning) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [parallel.subagents])

  const order = ['research-enricher', 'draft-compliance', 'draft-talent', 'draft-speed']

  return (
    <section className="card" aria-label="Parallel subagents">
      <div className="card__head">
        <Icon name="branch" size={13} />
        <span className="card__title">Parallel subagents (GLM-5.1 + web_search)</span>
        <span className="tb__spacer" />
        {parallel.status === 'streaming' && (
          <span className="kbd">streaming…</span>
        )}
        {parallel.status === 'done' && parallel.totalLatencyMs != null && (
          <span className="kbd mono">
            {formatLatency(parallel.totalLatencyMs)} · {parallel.webSearchHitCount} web hits
          </span>
        )}
      </div>
      <div className="card__body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.map((id) => {
            const snap = parallel.subagents[id] ?? {
              id,
              status: 'queued' as const,
              latencyMs: null,
            }
            const ok = snap.status === 'ok'
            const err = snap.status === 'error'
            const running = snap.status === 'running'
            const liveLatency =
              running && snap.startedAt ? now - snap.startedAt : snap.latencyMs ?? 0
            const isOpen = open === id
            return (
              <div
                key={id}
                className={`tl__step ${ok ? 'tl__step--done' : err ? '' : running ? 'tl__step--active' : 'tl__step--pending'}`}
              >
                <button
                  className="tl__head"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  style={{ background: 'transparent', border: 0, width: '100%' }}
                >
                  <span className="tl__num">
                    {ok ? (
                      <Icon name="check" size={10} />
                    ) : err ? (
                      <Icon name="x" size={10} />
                    ) : running ? (
                      <Icon name="clock" size={10} />
                    ) : (
                      '·'
                    )}
                  </span>
                  <span className="tl__name">{SUBAGENT_LABELS[id] ?? id}</span>
                  <span className="tl__meta mono">
                    {liveLatency > 0 ? formatLatency(liveLatency) : ''}
                    {snap.usage?.total_tokens ? ` · ${snap.usage.total_tokens}t` : ''}
                    {snap.webSearchHitCount ? ` · ${snap.webSearchHitCount} web` : ''}
                  </span>
                  <Icon
                    name="chevron"
                    size={10}
                    className={`tl__caret ${isOpen ? 'tl__caret--open' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="tl__body">
                    {err && (
                      <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>
                        <Icon name="alert" size={11} /> {snap.error ?? 'subagent error'}
                      </p>
                    )}
                    {ok && snap.payload != null && (
                      <JsonView data={snap.payload} maxHeight={260} />
                    )}
                    {running && snap.payload == null && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                        <Icon name="clock" size={11} /> waiting for GLM…
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {parallel.consolidator && (
          <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--muted)' }}>
            Consolidator:{' '}
            {parallel.consolidator.status === 'running' ? (
              <span className="kbd">running…</span>
            ) : parallel.consolidator.status === 'ok' ? (
              <span className="kbd">
                ok · {formatLatency(parallel.consolidator.latencyMs ?? 0)}
              </span>
            ) : (
              <span className="kbd" style={{ color: 'var(--red)' }}>
                error: {parallel.consolidator.error ?? 'unknown'}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function RecommendedDraftCard({ parallel }: { parallel: ParallelAgentRunState }) {
  const [explicitTab, setExplicitTab] = useState<ParallelVariantId | null>(null)
  const winner = parallel.winner
  // The active tab follows the consolidator's winner unless the user has
  // explicitly clicked a different tab. We derive instead of using a setState
  // effect so re-renders don't cascade.
  const tab: ParallelVariantId = explicitTab ?? winner ?? 'compliance'
  const setTab = (v: ParallelVariantId) => setExplicitTab(v)

  const visibleDraft = parallel.drafts[tab]
  const scores = parallel.evaluatorScores?.[tab]

  // Show this card the moment we have any draft variant or a winner.
  const hasAny = Object.values(parallel.drafts).some((d) => d != null) || winner != null
  if (!hasAny) return null

  const variants: ParallelVariantId[] = ['compliance', 'talent', 'speed']

  return (
    <section className="card" aria-label="Recommended draft">
      <div className="card__head">
        <Icon name="check" size={13} />
        <span className="card__title">
          Recommended draft (consolidator pick)
        </span>
        <span className="tb__spacer" />
        {winner && <span className="kbd">winner: {VARIANT_LABELS[winner]}</span>}
      </div>
      <div className="card__body">
        <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {variants.map((v) => {
            const present = parallel.drafts[v] != null
            const isWinner = v === winner
            return (
              <button
                key={v}
                role="tab"
                aria-selected={tab === v}
                className={`btn btn--sm ${tab === v ? 'btn--primary' : ''}`}
                disabled={!present}
                onClick={() => setTab(v)}
                style={{ position: 'relative' }}
              >
                {VARIANT_LABELS[v]}
                {isWinner && (
                  <span
                    className="kbd"
                    style={{ marginLeft: 6, fontSize: 9, padding: '0 4px' }}
                    aria-label="winner"
                  >
                    win
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {!visibleDraft && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            <Icon name="clock" size={11} /> {VARIANT_LABELS[tab]} variant not yet available.
          </p>
        )}
        {visibleDraft && (
          <>
            <p style={{ fontSize: 12.5, margin: '0 0 8px' }}>{visibleDraft.rationale}</p>
            {scores && (
              <p
                className="mono"
                style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 8px' }}
              >
                bvf {scores.brandVoiceFit} · halluc {scores.hallucinationRisk} · icp{' '}
                {scores.icpConfidence}
                {scores.flagged?.length ? ` · flagged ${scores.flagged.join(',')}` : ''}
              </p>
            )}
            <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12 }}>
              {visibleDraft.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <span className="kbd">{s.channel}</span>{' '}
                  <span className="mono" style={{ color: 'var(--muted)' }}>
                    +{s.delayHours}h
                  </span>
                  {s.subject && <strong> · {s.subject}</strong>}
                  <p
                    style={{
                      margin: '2px 0 0',
                      whiteSpace: 'pre-wrap',
                      color: 'var(--ink-2)',
                    }}
                  >
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
        {parallel.consolidator?.rationale && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '10px 0 0' }}>
            <Icon name="info" size={11} /> Consolidator rationale: {parallel.consolidator.rationale}
          </p>
        )}
      </div>
    </section>
  )
}

function isScoreOutput(o: unknown): o is { score: number } {
  return typeof o === 'object' && o !== null && 'score' in o && typeof (o as { score: unknown }).score === 'number'
}

function TimelineStep({
  step,
  index,
  open,
  onToggle,
}: {
  step: AgentStep
  index: number
  open: boolean
  onToggle: () => void
}) {
  const stateClass =
    step.status === 'pending'
      ? 'tl__step--pending'
      : step.status === 'running'
        ? 'tl__step--active'
        : 'tl__step--done'
  return (
    <div className={`tl__step ${stateClass}`}>
      <button
        className="tl__head"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`step-body-${step.step}`}
        style={{ background: 'transparent', border: 0, width: '100%' }}
      >
        <span className="tl__num">{index}</span>
        <span className="tl__name">{step.label}</span>
        <span className="tl__meta">
          {step.latencyMs > 0 && <>{formatLatency(step.latencyMs)} · </>}
          {(step.inputTokens > 0 || step.outputTokens > 0) && (
            <>
              {formatTokens(step.inputTokens + step.outputTokens)}t ·{' '}
            </>
          )}
          <ModelChip model={step.model} />
        </span>
        <Icon name="chevron" size={10} className={`tl__caret ${open ? 'tl__caret--open' : ''}`} />
      </button>
      {open && step.status !== 'pending' && (
        <div id={`step-body-${step.step}`} className="tl__body">
          {step.notes && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--red)' }}>
              <Icon name="alert" size={11} /> {step.notes}
            </p>
          )}
          <div className="tl__io">
            <div>
              <h6>Output</h6>
              <JsonView data={step.output ?? '(no output)'} />
            </div>
            <div>
              <h6>Telemetry</h6>
              <JsonView
                data={{
                  startedAt: step.startedAt,
                  endedAt: step.endedAt,
                  inputTokens: step.inputTokens,
                  outputTokens: step.outputTokens,
                  latencyMs: step.latencyMs,
                  model: step.model,
                }}
              />
            </div>
          </div>
          {step.step === 'icp_score' && isScoreOutput(step.output) && (
            <p style={{ marginTop: 8, fontSize: 12 }}>
              Deterministic score: <ScoreChip value={step.output.score} />
            </p>
          )}
        </div>
      )}
    </div>
  )
}
