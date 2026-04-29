import { useMemo, useState } from 'react'
import type { AgentRun, AgentStep, Company, Signal, StepName } from '../lib/types'
import { Icon } from './Icon'
import { Gauge, JsonView, ModelChip, ScoreChip, StatusBadge, TypeTag } from './Primitives'
import { formatLatency, formatTokens, formatTimeAgo } from '../lib/format'
import { DeepResearchPanel, type ResearchResult } from './DeepResearchPanel'

interface Props {
  run: AgentRun
  signal: Signal
  company: Company
  onApprove: () => void
  onReject: () => void
  onBack: () => void
  liveModeAvailable: boolean
  onRunLive: () => void
  liveError?: string | null
  liveLoading?: boolean
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
  onRunLive,
  liveError,
  liveLoading,
  webSearchHits,
  researchAvailable,
  onRunResearch,
  researchLoading,
  researchError,
  researchResult,
}: Props) {
  const [openStep, setOpenStep] = useState<StepName | null>('draft_nurture')

  const decision = run.status

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
      </div>
    ),
    [run],
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
              onClick={onRunLive}
              disabled={liveLoading}
              aria-label="Re-run draft step against live Claude"
            >
              <Icon name="sparkle" size={11} /> {liveLoading ? 'Drafting…' : 'Re-run draft live'}
            </button>
          )}
        </header>
        {liveError && (
          <div role="alert" className="card" style={{ borderColor: 'var(--red)' }}>
            <div className="card__body" style={{ color: 'var(--red)', fontSize: 12 }}>
              <Icon name="alert" size={12} /> {liveError}
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
          </div>
          <div className="card__body">
            <Gauge label="Brand-voice fit" value={run.scores.brandVoiceFit} tone="good" />
            <Gauge
              label="Hallucination risk"
              value={run.scores.hallucinationRisk}
              tone={run.scores.hallucinationRisk > 25 ? 'bad' : 'good'}
              invert
            />
            <Gauge
              label="ICP confidence"
              value={run.scores.icpConfidence}
              tone={run.scores.icpConfidence >= 70 ? 'good' : 'warn'}
            />
            {run.scores.flagged.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--red)', margin: '6px 0 0' }}>
                <Icon name="alert" size={11} /> Flagged terms: {run.scores.flagged.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="card__head">
            <span className="sec-title">Proposed CRM write-back</span>
            <span className="tb__spacer" />
            <span className="kbd">{run.writeback?.object}</span>
          </div>
          <div className="card__body">
            <div className="diff">
              {run.writeback?.diff.map((d) => (
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
              Diff against synthetic CRM record <span className="kbd">{run.writeback?.recordId}</span>.
              Nothing is sent until you approve.
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
