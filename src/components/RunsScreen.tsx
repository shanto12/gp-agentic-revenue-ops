import { scoreSignal } from '../lib/icp-score'
import { ScoreChip, StatusBadge } from './Primitives'
import { formatTimeAgo } from '../lib/format'
import type { AgentStatus, Company, Signal } from '../lib/types'

interface Props {
  rowStatus: Record<string, AgentStatus>
  onSelectSignal: (s: Signal) => void
  signals: Signal[]
  companies: Company[]
}

export function RunsScreen({ rowStatus, onSelectSignal, signals, companies }: Props) {
  const inFlight = signals
    .map((sig) => {
      const company = companies.find((c) => c.id === sig.companyId)
      if (!company) return null
      const breakdown = scoreSignal(sig, company)
      return { sig, company, score: breakdown.total, status: rowStatus[sig.id] ?? 'queued' }
    })
    .filter(
      (r): r is { sig: Signal; company: Company; score: number; status: AgentStatus } =>
        r !== null && r.status !== 'queued',
    )

  return (
    <div className="page" aria-labelledby="runs-h1">
      <h1 id="runs-h1" className="page__h1">Agent Runs</h1>
      <p className="page__sub">
        Active and completed agent runs. Click any to drop into the reasoning timeline and HITL
        gate.
      </p>
      {inFlight.length === 0 ? (
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          No runs in flight. Open a signal from the Signals stream to start one.
        </p>
      ) : (
        <table className="tbl" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Account</th>
              <th>Industry</th>
              <th>ICP</th>
              <th>Status</th>
              <th>Detected</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {inFlight.map((r) => (
              <tr
                key={r.sig.id}
                onClick={() => onSelectSignal(r.sig)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <strong>{r.company.name}</strong>
                  <br />
                  <small style={{ color: 'var(--muted)' }}>
                    {r.sig.countryFlag} {r.sig.countryFocus}
                  </small>
                </td>
                <td>{r.company.industry}</td>
                <td>
                  <ScoreChip value={r.score} />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="mono">{formatTimeAgo(r.sig.capturedAt)}</td>
                <td>
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSignal(r.sig)
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
