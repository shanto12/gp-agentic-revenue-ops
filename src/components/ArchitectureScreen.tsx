import { Icon } from './Icon'

const NODES = [
  { id: 'plan', label: 'Plan', x: 80, y: 80, model: 'glm-5.1' },
  { id: 'enrich', label: 'Enrich', x: 240, y: 80, model: 'glm-5.1' },
  { id: 'icp_score', label: 'ICP Score', x: 240, y: 180, model: 'deterministic' },
  { id: 'rag', label: 'RAG', x: 400, y: 180, model: 'term-overlap' },
  { id: 'draft', label: 'Draft + Search', x: 560, y: 180, model: 'glm-5.1 + web_search' },
  { id: 'critique', label: 'Critique', x: 560, y: 80, model: 'evaluator' },
  { id: 'hitl', label: 'HITL Gate', x: 720, y: 80, model: 'Human approver' },
  { id: 'writeback', label: 'CRM Write-back', x: 720, y: 180, model: 'connector' },
] as const

const EDGES: Array<{ from: string; to: string; label?: string }> = [
  { from: 'plan', to: 'enrich' },
  { from: 'enrich', to: 'icp_score' },
  { from: 'icp_score', to: 'rag' },
  { from: 'rag', to: 'draft' },
  { from: 'draft', to: 'critique', label: 'self-check' },
  { from: 'critique', to: 'hitl' },
  { from: 'hitl', to: 'writeback' },
  { from: 'critique', to: 'plan', label: 'replan if flagged' },
]

const CONNECTORS = [
  { id: 'hubspot', label: 'HubSpot', sub: 'CRM write-back · scoped key', status: 'ok' as const },
  { id: 'salesforce', label: 'Salesforce', sub: 'CRM read-only fallback', status: 'warn' as const },
  { id: 'sixsense', label: '6sense', sub: 'Intent signal feed', status: 'ok' as const },
  { id: 'ga4', label: 'GA4', sub: 'Campaign attribution', status: 'ok' as const },
]

export function ArchitectureScreen() {
  return (
    <div className="page" aria-labelledby="arch-h1">
      <h1 id="arch-h1" className="page__h1">Architecture</h1>
      <p className="page__sub">
        LangGraph-style state machine. Customer-visible reasoning nodes call Z.ai's <strong>glm-5.1</strong>
        through a server-side Netlify Function with the built-in <code>web_search</code> tool for
        grounded citations. Deep research fans out four parallel subagents (Hiring / Expansion / Exec /
        Compliance), each with its own search budget. Deterministic steps (ICP score, RAG retrieval)
        run client-side over synthetic fixtures. The HITL gate is the only edge that touches a
        live CRM connector.
      </p>

      <div className="arch-wrap" style={{ marginTop: 16 }}>
        <div className="arch-canvas">
          <svg viewBox="0 0 840 280" role="img" aria-label="Agent state graph">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
              </marker>
            </defs>
            {EDGES.map((e, i) => {
              const a = NODES.find((n) => n.id === e.from)!
              const b = NODES.find((n) => n.id === e.to)!
              const mx = (a.x + b.x) / 2
              const my = (a.y + b.y) / 2
              const isReplan = e.label === 'replan if flagged'
              return (
                <g key={i}>
                  <line
                    x1={a.x + 70}
                    y1={a.y}
                    x2={b.x - 70}
                    y2={b.y}
                    stroke={isReplan ? 'var(--coral)' : 'var(--line-2)'}
                    strokeDasharray={isReplan ? '4 3' : ''}
                    strokeWidth="1.4"
                    markerEnd="url(#arrow)"
                  />
                  {e.label && (
                    <text
                      x={mx}
                      y={my - 6}
                      fill={isReplan ? 'var(--coral)' : 'var(--muted)'}
                      fontSize="10"
                      fontFamily="var(--t-mono)"
                      textAnchor="middle"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              )
            })}
            {NODES.map((n) => (
              <g key={n.id} transform={`translate(${n.x - 70}, ${n.y - 22})`}>
                <rect
                  width="140"
                  height="44"
                  rx="6"
                  fill="#fff"
                  stroke="var(--line)"
                  strokeWidth="1"
                />
                <text
                  x="70"
                  y="20"
                  fontSize="12"
                  fontFamily="var(--t-ui)"
                  fontWeight="600"
                  fill="var(--ink)"
                  textAnchor="middle"
                >
                  {n.label}
                </text>
                <text
                  x="70"
                  y="34"
                  fontSize="10"
                  fontFamily="var(--t-mono)"
                  fill="var(--muted)"
                  textAnchor="middle"
                >
                  {n.model}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <aside className="card">
          <div className="card__head">
            <span className="sec-title">Routing rules</span>
          </div>
          <div className="card__body" style={{ fontSize: 12, lineHeight: 1.55 }}>
            <p style={{ margin: 0 }}>
              <strong>glm-5.1</strong> on the <span className="mono">/coding/paas/v4</span> endpoint
              for every customer-visible step + the four deep-research subagents.
            </p>
            <p style={{ margin: '8px 0 0' }}>
              <strong>web_search tool</strong> attached to every model call — Coding Plan quota powers
              grounded citations. Search results are returned alongside the draft and rendered in the
              UI.
            </p>
            <p style={{ margin: '8px 0 0' }}>
              <strong>Deterministic</strong> for ICP scoring, RAG retrieval, and the brand-voice
              evaluator — auditable, no hallucination surface, no model cost.
            </p>
            <p style={{ margin: '8px 0 0' }}>
              <strong>Parallel subagents</strong> — deep research fires 4 GLM calls concurrently;
              total latency ≈ slowest single lens. See <span className="mono">netlify/functions/deep-research.mjs</span>.
            </p>
            <p style={{ margin: '8px 0 0', color: 'var(--coral)' }}>
              <Icon name="alert" size={11} /> Critique replans on flagged output instead of falling
              forward — the dashed coral edge.
            </p>
          </div>
        </aside>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '20px 0 0' }}>System connectors</h3>
      <p className="page__sub">
        Server-side AI boundary. The browser never holds API keys. Optional connectors degrade
        cleanly when absent — the workbench keeps functioning on synthetic fixtures.
      </p>
      <div className="connectors">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="conn">
            <span className="conn__logo">{c.label.slice(0, 2).toUpperCase()}</span>
            <span className="conn__body">
              <b>{c.label}</b>
              <small>{c.sub}</small>
            </span>
            <span
              className={`dot dot--${c.status}`}
              aria-label={c.status === 'ok' ? 'connected' : 'degraded'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
