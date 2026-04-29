import { useState } from 'react'
import { campaigns, campaignById, reallocationProposal } from '../data/campaigns'
import { Sparkline } from './Primitives'
import { Icon } from './Icon'
import { formatUsd } from '../lib/format'

export function CampaignsScreen() {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'held'>('pending')
  const fromCampaign = campaignById(reallocationProposal.fromCampaignId)
  const toCampaign = campaignById(reallocationProposal.toCampaignId)

  return (
    <div className="page" aria-labelledby="camp-h1">
      <h1 id="camp-h1" className="page__h1">Campaigns</h1>
      <p className="page__sub">
        Three live synthetic campaigns. The agent is autonomously watching ROI and brand-voice fit
        and proposing reallocations in real time. Nothing executes without explicit approval.
      </p>

      <section className="realloc" role="alert" aria-live="polite" style={{ marginTop: 16 }}>
        <span className="realloc__icon" aria-hidden>
          <Icon name="sparkle" size={14} />
        </span>
        <div className="realloc__body">
          <h4>
            Reallocation proposed:{' '}
            <span className="mono">{formatUsd(reallocationProposal.amountUsd)}</span> from{' '}
            <em>{fromCampaign?.name}</em> → <em>{toCampaign?.name}</em>
          </h4>
          <p>{reallocationProposal.reasoning}</p>
          <details className="code-fold" style={{ marginTop: 6 }}>
            <summary>Reasoning citations ({reallocationProposal.citations.length})</summary>
            <ul style={{ paddingLeft: 18, margin: '6px 0 0', fontSize: 11.5 }}>
              {reallocationProposal.citations.map((c) => (
                <li key={c} className="mono">
                  {c}
                </li>
              ))}
            </ul>
          </details>
        </div>
        <div className="realloc__actions">
          <button
            className="btn btn--primary btn--sm"
            onClick={() => setDecision('approved')}
            disabled={decision === 'approved'}
          >
            <Icon name="check" size={11} /> Approve
          </button>
          <button
            className="btn btn--sm"
            onClick={() => setDecision('held')}
            disabled={decision === 'held'}
          >
            Hold for now
          </button>
        </div>
      </section>

      <section className="camp-grid" style={{ marginTop: 16 }}>
        {campaigns.map((c) => {
          const isSource = c.id === reallocationProposal.fromCampaignId
          const isTarget = c.id === reallocationProposal.toCampaignId
          const sparkColor = c.roi >= 1.5 ? 'var(--green)' : c.roi < 1 ? 'var(--red)' : 'var(--c1)'
          return (
            <article key={c.id} className="camp" aria-labelledby={`camp-${c.id}-name`}>
              <header className="camp__h">
                <Icon name="campaigns" size={14} />
                <b id={`camp-${c.id}-name`}>{c.name}</b>
                <span className="tb__spacer" />
                {isSource && <span className="tag tag--expansion">FROM</span>}
                {isTarget && <span className="tag tag--funding">TO</span>}
              </header>
              <Sparkline data={c.trend} color={sparkColor} fill width={260} height={48} />
              <div className="camp__metrics">
                <div className="m">
                  <small>Spend</small>
                  <b>{formatUsd(c.spendUsd)}</b>
                </div>
                <div className="m">
                  <small>Leads</small>
                  <b>{c.leads}</b>
                </div>
                <div className="m">
                  <small>CPL</small>
                  <b>${c.cpl.toFixed(0)}</b>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                Channel · {c.channel} · ROI {c.roi.toFixed(2)}
              </p>
              {c.brandVoiceFlag && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: 'var(--red)',
                    background: 'var(--red-tint)',
                    border: '1px solid rgba(164,65,58,0.18)',
                    padding: '6px 8px',
                    borderRadius: 4,
                    margin: 0,
                  }}
                >
                  <Icon name="alert" size={11} /> Brand-voice flag: agent detected forbidden term
                  &ldquo;{c.brandVoiceFlag}&rdquo; in headline variant. Suggested rewrite available.
                </p>
              )}
            </article>
          )
        })}
      </section>

      {decision !== 'pending' && (
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          Decision recorded:{' '}
          <strong style={{ color: decision === 'approved' ? 'var(--green)' : 'var(--ink)' }}>
            {decision === 'approved' ? 'Reallocation approved (synthetic)' : 'Held for now'}
          </strong>
          . Audit Log updated.
        </p>
      )}
    </div>
  )
}
