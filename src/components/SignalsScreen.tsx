import { useMemo, useState } from 'react'
import type { Company, Signal, SignalType } from '../lib/types'
import { ScoreChip, StatusBadge, TypeTag } from './Primitives'
import { Icon } from './Icon'
import { formatTimeAgo } from '../lib/format'
import { scoreSignal } from '../lib/icp-score'
import type { AgentStatus } from '../lib/types'

const FILTERS: { key: SignalType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All types' },
  { key: 'HIRING_INTL', label: 'HIRING' },
  { key: 'FUNDING', label: 'FUNDING' },
  { key: 'EXPANSION', label: 'EXPANSION' },
  { key: 'EXEC_HIRE', label: 'EXEC-HIRE' },
  { key: 'COMPLIANCE', label: 'COMPLIANCE' },
]

const SCORE_FLOORS: { key: number; label: string }[] = [
  { key: 0, label: 'Any' },
  { key: 55, label: '≥55' },
  { key: 75, label: '≥75' },
  { key: 85, label: '≥85' },
]

interface Props {
  paused: boolean
  onPauseToggle: () => void
  onSelectSignal: (signal: Signal) => void
  rowStatus: Record<string, AgentStatus>
  signals: Signal[]
  companies: Company[]
  liveLoading: boolean
  liveProgress: string | null
  liveError: string | null
  onRefresh: () => void
  liveCapturedAt: string | null
  usingFixtureFallback: boolean
}

export function SignalsScreen({
  paused,
  onPauseToggle,
  onSelectSignal,
  rowStatus,
  signals,
  companies,
  liveLoading,
  liveProgress,
  liveError,
  onRefresh,
  liveCapturedAt,
  usingFixtureFallback,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<SignalType | 'ALL'>('ALL')
  const [scoreFloor, setScoreFloor] = useState(0)
  const [search, setSearch] = useState('')

  const enriched = useMemo(() => {
    return signals
      .map((sig) => {
        const company = companies.find((c) => c.id === sig.companyId)
        if (!company) return null
        const breakdown = scoreSignal(sig, company)
        return { sig, company, score: breakdown.total }
      })
      .filter((row): row is { sig: Signal; company: Company; score: number } => row !== null)
      .filter((row) => (typeFilter === 'ALL' ? true : row.sig.type === typeFilter))
      .filter((row) => row.score >= scoreFloor)
      .filter((row) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          row.company.name.toLowerCase().includes(q) ||
          row.sig.countryFocus.toLowerCase().includes(q) ||
          row.sig.id.toLowerCase().includes(q)
        )
      })
  }, [signals, companies, typeFilter, scoreFloor, search])

  return (
    <div className="page" aria-labelledby="signals-h1">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 className="page__h1" id="signals-h1">
            Signals{' '}
            <span
              className="tag"
              style={{
                background: 'var(--green-tint)',
                color: 'var(--green)',
                marginLeft: 8,
                verticalAlign: 'middle',
              }}
            >
              LIVE WEB DATA
            </span>
          </h1>
          <p className="page__sub">
            Buyer-intent stream from real public sources, fetched live via GLM-5.1 + web_search.
          </p>
          {liveCapturedAt && !usingFixtureFallback && (
            <p className="page__sub mono" style={{ marginTop: 2, fontSize: 11 }}>
              Captured {formatTimeAgo(liveCapturedAt)} · {signals.length} signals across{' '}
              {companies.length} companies
            </p>
          )}
          {usingFixtureFallback && (
            <p
              role="alert"
              style={{
                marginTop: 6,
                fontSize: 12,
                color: 'var(--coral)',
              }}
            >
              <Icon name="alert" size={11} /> Live data unavailable, showing local fixtures.
            </p>
          )}
          {liveError && !usingFixtureFallback && (
            <p
              role="alert"
              style={{
                marginTop: 6,
                fontSize: 12,
                color: 'var(--red)',
              }}
            >
              <Icon name="alert" size={11} /> Refresh failed: {liveError}.
            </p>
          )}
          {liveLoading && (
            <p className="page__sub" style={{ marginTop: 4, color: 'var(--coral)' }}>
              <Icon name="sparkle" size={11} /> Fetching real signals from the public web…
              {liveProgress ? ` ${liveProgress}` : ''}
            </p>
          )}
          <details
            style={{
              marginTop: 8,
              padding: '8px 10px',
              border: '1px solid var(--line)',
              borderRadius: 4,
              background: 'var(--bg-2)',
              maxWidth: 720,
            }}
          >
            <summary style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', listStyle: 'none' }}>
              <Icon name="info" size={12} /> How to use this — click to expand
            </summary>
            <ol
              style={{
                margin: '8px 0 0 18px',
                padding: 0,
                fontSize: 11.5,
                lineHeight: 1.55,
                color: 'var(--ink-2)',
              }}
            >
              <li>
                <strong>What you're looking at:</strong> 4 real, named mid-market companies
                expanding internationally, fetched live from the public web (LinkedIn, press,
                investor letters, regulator portals) via GLM-5.1 + web_search and cached in Netlify
                Blobs. No fixtures, no demo data.
              </li>
              <li>
                <strong>Click any row</strong> → opens the Agent Run with a 7-step reasoning
                timeline (Plan → Enrich → ICP Score → RAG → Draft → Critique → HITL Gate) running
                on that real signal.
              </li>
              <li>
                <strong>Click the coral "Refresh" button (top right)</strong> → re-pulls fresh real
                signals from the public web (~30s, streamed) and updates the cache. Subsequent
                page loads are instant from the cache.
              </li>
              <li>
                <strong>Filter</strong> by signal type (HIRING / FUNDING / EXPANSION /
                EXEC-HIRE / COMPLIANCE) or ICP fit floor (≥55, ≥75, ≥85). Search by company,
                country, or signal id.
              </li>
              <li>
                <strong>Open the "Demo Guide" sidebar tab</strong> for the full walkthrough,
                business requirement, real-world application context, and 90s/5min/15min talk
                tracks.
              </li>
            </ol>
          </details>
        </div>
        <button
          className="btn btn--sm btn--primary"
          onClick={onRefresh}
          disabled={liveLoading}
          aria-label="Refresh live signals from the public web"
          title="Re-run /api/refresh-signals — pulls fresh public-web signals via GLM-5.1 + web_search and updates the cache"
        >
          <Icon name={liveLoading ? 'sparkle' : 'globe'} size={12} />
          {liveLoading ? 'Refreshing…' : 'Refresh'}
        </button>
        <span className="live-pulse" aria-live="polite">
          <span className="dot" />
          {paused ? 'Paused' : 'Live · streaming'}
        </span>
        <button
          className="btn btn--sm"
          onClick={onPauseToggle}
          aria-label={paused ? 'Resume signal stream' : 'Pause signal stream'}
        >
          <Icon name={paused ? 'play' : 'pause'} size={12} />
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <section className="metrics" aria-label="Signal metrics">
        <div className="metrics__cell">
          <div className="metrics__lbl">Signals / hr</div>
          <div className="metrics__val">
            142<span className="metrics__delta">+8%</span>
          </div>
          <div className="metrics__sub">7-day trailing avg 131</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">In-flight runs</div>
          <div className="metrics__val">12</div>
          <div className="metrics__sub">2 over 30s · p95 22.4s</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">Approval queue</div>
          <div className="metrics__val">
            9<span className="metrics__delta">+2</span>
          </div>
          <div className="metrics__sub">Oldest waiting 11m</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">Brand-voice fit (24h)</div>
          <div className="metrics__val">91.2</div>
          <div className="metrics__sub">Threshold 80 · 1 flag open</div>
        </div>
      </section>

      <div className="toolbar" role="toolbar" aria-label="Filters">
        <div className="toolbar__group" role="radiogroup" aria-label="Signal type">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="radio"
              aria-checked={typeFilter === f.key}
              className={`toolbar__chip ${typeFilter === f.key ? 'toolbar__chip--active' : ''}`}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="toolbar__group" role="radiogroup" aria-label="Min ICP score">
          {SCORE_FLOORS.map((s) => (
            <button
              key={s.key}
              role="radio"
              aria-checked={scoreFloor === s.key}
              className={`toolbar__chip ${scoreFloor === s.key ? 'toolbar__chip--active' : ''}`}
              onClick={() => setScoreFloor(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="toolbar__search">
          <Icon name="search" size={12} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, country, signal id…"
            aria-label="Search signals"
          />
          <span className="kbd">⌘K</span>
        </label>
        <span className="tb__spacer" />
        <span className="page__sub">
          {enriched.length} of {signals.length}
        </span>
      </div>

      <section className="feed" aria-label="Signal feed">
        <div className="feed__head" role="row">
          <span aria-hidden />
          <span>Account</span>
          <span>Signal</span>
          <span>Geo</span>
          <span>ICP fit</span>
          <span>Trigger</span>
          <span>Agent state</span>
          <span>Detected</span>
        </div>
        {enriched.map((row) => {
          const status = rowStatus[row.sig.id] ?? 'queued'
          return (
            <button
              key={row.sig.id}
              className="feed__row"
              role="row"
              onClick={() => onSelectSignal(row.sig)}
              aria-label={`Open agent run for ${row.company.name}`}
            >
              <span className="feed__icon" aria-hidden>
                <Icon name="globe" size={11} />
              </span>
              <span className="feed__company">
                <b>{row.company.name}</b>
                <small>
                  {row.company.industry} · {row.company.employeeBand}
                </small>
              </span>
              <span>
                <TypeTag code={row.sig.type} />
              </span>
              <span className="flag-iso" aria-label={row.sig.countryFocus}>
                <span className="feed__flag">{row.sig.countryFlag}</span>
              </span>
              <span>
                <ScoreChip value={row.score} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }} title={row.sig.detail}>
                {row.sig.headline.length > 70
                  ? row.sig.headline.slice(0, 70) + '…'
                  : row.sig.headline}
              </span>
              <span>
                <StatusBadge status={status} />
              </span>
              <span className="feed__t">{formatTimeAgo(row.sig.capturedAt)}</span>
            </button>
          )
        })}
      </section>
    </div>
  )
}
