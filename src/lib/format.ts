export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime()
  const ms = now.getTime() - t
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function formatTokens(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1)}k`
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? singular + 's')
}
