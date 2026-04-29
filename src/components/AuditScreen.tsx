import { useMemo, useState } from 'react'
import { auditSeed } from '../data/audit-seed'
import { Icon } from './Icon'
import { formatLatency } from '../lib/format'

export function AuditScreen({ extraEntries = [] }: { extraEntries?: typeof auditSeed }) {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'rejected'>('all')
  const rows = useMemo(() => {
    const merged = [...extraEntries, ...auditSeed]
    return filter === 'all' ? merged : merged.filter((r) => r.status === filter)
  }, [filter, extraEntries])

  return (
    <div className="page" aria-labelledby="audit-h1">
      <h1 id="audit-h1" className="page__h1">Audit Log</h1>
      <p className="page__sub">
        Every agent action and approval. Filter, copy, or export. Designed to satisfy a security
        review with no extra prep.
      </p>

      <div className="toolbar" role="toolbar" aria-label="Filter">
        <div className="toolbar__group" role="radiogroup" aria-label="Status filter">
          {(['all', 'flagged', 'rejected'] as const).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={filter === f}
              className={`toolbar__chip ${filter === f ? 'toolbar__chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="tb__spacer" />
        <button className="btn btn--sm" type="button">
          <Icon name="download" size={12} /> Export CSV
        </button>
      </div>

      <table className="tbl" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>Timestamp (UTC)</th>
            <th>Subject</th>
            <th>Action</th>
            <th>Step</th>
            <th>Model</th>
            <th>Tokens</th>
            <th>Latency</th>
            <th>Eval</th>
            <th>Approver</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.timestamp}</td>
              <td>{r.signalId ?? r.campaignId ?? '—'}</td>
              <td>{r.action}</td>
              <td className="mono">{r.step ?? '—'}</td>
              <td className="mono">{r.model ?? '—'}</td>
              <td className="mono">{r.tokens ?? '—'}</td>
              <td className="mono">{r.latencyMs ? formatLatency(r.latencyMs) : '—'}</td>
              <td className="mono">{r.evaluatorScore ?? '—'}</td>
              <td>{r.approver}</td>
              <td>
                <span
                  className="status"
                  style={{
                    color:
                      r.status === 'flagged'
                        ? 'var(--amber)'
                        : r.status === 'rejected'
                          ? 'var(--red)'
                          : 'var(--green)',
                  }}
                >
                  <span className="dot" aria-hidden />
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="page__sub" style={{ marginTop: 12 }}>
          No entries match the current filter.
        </p>
      )}
    </div>
  )
}
