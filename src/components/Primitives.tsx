import type { AgentStatus, ModelId, SignalType } from '../lib/types'

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = 'var(--c1)',
  fill = false,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}) {
  if (!data || !data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const stepX = width / (data.length - 1)
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 4) - 2])
  const d = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(' ')
  const fillD = `${d} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} className="spark" aria-hidden>
      {fill && <path d={fillD} fill={color} fillOpacity="0.10" />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function JsonView({
  data,
  maxHeight = 220,
}: {
  data: unknown
  maxHeight?: number
}) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="j-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="j-str">"$1"</span>')
    .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="j-num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="j-bool">$1</span>')
    .replace(/: null/g, ': <span class="j-null">null</span>')
  return <pre style={{ maxHeight }} dangerouslySetInnerHTML={{ __html: html }} />
}

export function ScoreChip({ value }: { value: number }) {
  const cls = value >= 75 ? 'score--high' : value >= 55 ? 'score--mid' : 'score--low'
  return <span className={`score ${cls}`}>{Math.round(value)}</span>
}

export function TypeTag({ code }: { code: SignalType }) {
  const labelMap: Record<SignalType, string> = {
    HIRING_INTL: 'HIRING',
    FUNDING: 'FUNDING',
    EXPANSION: 'EXPANSION',
    EXEC_HIRE: 'EXEC-HIRE',
    COMPLIANCE: 'COMPLIANCE',
  }
  const cssMap: Record<SignalType, string> = {
    HIRING_INTL: 'hiring',
    FUNDING: 'funding',
    EXPANSION: 'expansion',
    EXEC_HIRE: 'exec',
    COMPLIANCE: 'expansion',
  }
  return <span className={`tag tag--${cssMap[code]}`}>{labelMap[code]}</span>
}

export function StatusBadge({ status }: { status: AgentStatus }) {
  const labels: Record<AgentStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    awaiting_approval: 'Awaiting approval',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  const cls: Record<AgentStatus, string> = {
    queued: 'status--queued',
    running: 'status--running',
    awaiting_approval: 'status--awaiting',
    approved: 'status--approved',
    rejected: 'status--rejected',
  }
  return (
    <span
      className={`status ${cls[status]}`}
      aria-label={`Status: ${labels[status]}`}
    >
      <span className="dot" aria-hidden />
      {labels[status]}
    </span>
  )
}

export function ModelChip({ model }: { model: ModelId | null }) {
  if (!model) return <span className="tl__model" aria-label="deterministic step">deterministic</span>
  const cls =
    model.startsWith('claude-sonnet') ? 'tl__model--sonnet' : 'tl__model--gpt'
  return <span className={`tl__model ${cls}`}>{model}</span>
}

export function Gauge({
  label,
  value,
  tone = 'good',
  invert = false,
}: {
  label: string
  value: number
  tone?: 'good' | 'warn' | 'bad'
  invert?: boolean
}) {
  const v = Math.max(0, Math.min(100, value))
  const colorMap = {
    good: 'var(--green)',
    warn: 'var(--amber)',
    bad: 'var(--red)',
  }
  const fillColor = colorMap[tone]
  const display = invert ? `${v}` : `${v}`
  return (
    <div className="gauge">
      <span className="gauge__lbl">{label}</span>
      <span className="gauge__bar" aria-hidden>
        <span
          className="gauge__fill"
          style={{ width: `${v}%`, background: fillColor }}
        />
      </span>
      <span className="gauge__val">{display}</span>
    </div>
  )
}
