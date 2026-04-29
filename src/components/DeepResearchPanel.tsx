import { useState } from 'react'
import { Icon } from './Icon'
import { formatLatency } from '../lib/format'

export interface ResearchLensResult {
  lens: string
  label: string
  status: 'ok' | 'error' | 'pending'
  latencyMs: number
  summary?: string
  findings?: Array<{
    title: string
    link: string
    excerpt: string
    publishDate: string | null
  }>
  confidence?: number | null
  webSearchHits?: Array<{ title: string; link: string; refer: string | null }>
  error?: string
}

export interface ResearchResult {
  totalLatencyMs: number
  lensCount: number
  successCount: number
  totalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  lenses: ResearchLensResult[]
}

interface Props {
  available: boolean
  onRun: () => Promise<void> | void
  loading: boolean
  error: string | null
  result: ResearchResult | null
}

const PENDING_LENSES: Array<{ id: string; label: string }> = [
  { id: 'hiring', label: 'International hiring & job posts' },
  { id: 'expansion', label: 'Expansion announcements' },
  { id: 'executive', label: 'Executive moves with international remit' },
  { id: 'compliance', label: 'Regulatory & compliance signals' },
]

export function DeepResearchPanel({ available, onRun, loading, error, result }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className="card" aria-label="Deep research">
      <div className="card__head">
        <Icon name="sparkle" size={13} />
        <span className="card__title">Deep research (parallel subagents)</span>
        <span className="tb__spacer" />
        <button
          className="btn btn--sm btn--primary"
          onClick={() => onRun()}
          disabled={!available || loading}
          aria-label="Run parallel deep-research subagents"
        >
          <Icon name={loading ? 'clock' : 'play'} size={11} />
          {loading ? 'Researching…' : result ? 'Re-run' : 'Run'}
        </button>
      </div>
      <div className="card__body">
        {!available && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            <Icon name="info" size={11} /> GLM_API_KEY not configured. Deep research requires live
            mode.
          </p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>
            <Icon name="alert" size={11} /> {error}
          </p>
        )}
        {result && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 10px' }}>
            {result.successCount} / {result.lensCount} lenses ·{' '}
            <span className="mono">{formatLatency(result.totalLatencyMs)}</span> total ·{' '}
            <span className="mono">{result.totalUsage.total_tokens}</span> tokens · run in parallel
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(result?.lenses ?? PENDING_LENSES.map((p) => ({
            ...p,
            lens: p.id,
            status: loading ? 'pending' : 'pending',
            latencyMs: 0,
          }))).map((lens) => {
            const isOpen = open === lens.lens
            const ok = lens.status === 'ok'
            const err = lens.status === 'error'
            return (
              <div
                key={lens.lens}
                className={`tl__step ${ok ? 'tl__step--done' : err ? '' : 'tl__step--pending'}`}
              >
                <button
                  className="tl__head"
                  onClick={() => setOpen(isOpen ? null : lens.lens)}
                  aria-expanded={isOpen}
                  style={{ background: 'transparent', border: 0, width: '100%' }}
                >
                  <span className="tl__num">
                    {ok ? <Icon name="check" size={10} /> : err ? <Icon name="x" size={10} /> : '·'}
                  </span>
                  <span className="tl__name">{lens.label}</span>
                  <span className="tl__meta">
                    {lens.latencyMs > 0 ? formatLatency(lens.latencyMs) : ''}
                    {ok && lens.confidence != null ? ` · conf ${Math.round(lens.confidence)}` : ''}
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
                        <Icon name="alert" size={11} /> {lens.error ?? 'subagent error'}
                      </p>
                    )}
                    {ok && lens.summary && (
                      <p style={{ fontSize: 12.5, margin: '0 0 8px' }}>{lens.summary}</p>
                    )}
                    {ok && lens.findings && lens.findings.length > 0 && (
                      <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                        {lens.findings.slice(0, 5).map((f, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <a
                              href={f.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--ink)', fontWeight: 600 }}
                            >
                              {f.title}
                            </a>
                            {f.publishDate && (
                              <span className="mono" style={{ color: 'var(--muted)' }}>
                                {' '}
                                · {f.publishDate}
                              </span>
                            )}
                            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 0' }}>
                              {f.excerpt}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
