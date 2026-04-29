import type { ReactNode } from 'react'
import { Icon } from './Icon'

export type ScreenName =
  | 'signals'
  | 'runs'
  | 'campaigns'
  | 'knowledge'
  | 'arch'
  | 'audit'
  | 'guide'

interface NavItem {
  key: ScreenName
  label: string
  icon: 'signals' | 'runs' | 'campaigns' | 'knowledge' | 'arch' | 'audit' | 'info'
  count?: string
}

const NAV: NavItem[] = [
  { key: 'signals', label: 'Signals', icon: 'signals', count: '32' },
  { key: 'runs', label: 'Agent Runs', icon: 'runs', count: '12' },
  { key: 'campaigns', label: 'Campaigns', icon: 'campaigns', count: '3' },
  { key: 'knowledge', label: 'Knowledge', icon: 'knowledge', count: '5' },
  { key: 'arch', label: 'Architecture', icon: 'arch' },
  { key: 'audit', label: 'Audit Log', icon: 'audit', count: '1.2k' },
  { key: 'guide', label: 'Demo Guide', icon: 'info' },
]

export function Shell({
  active,
  onNavigate,
  breadcrumb,
  rightExtras,
  children,
  utc,
}: {
  active: ScreenName
  onNavigate: (s: ScreenName) => void
  breadcrumb: ReactNode
  rightExtras?: ReactNode
  children: ReactNode
  utc: string
}) {
  return (
    <div className="app">
      <aside className="app__sidebar" aria-label="Primary">
        <div className="sb">
          <div className="sb__brand">
            <span className="sb__mark" aria-hidden />
            <span className="sb__title">
              Marketing Agent
              <small>Workbench</small>
            </span>
          </div>
          <div className="sb__section">Operations</div>
          <nav className="sb__nav" aria-label="Workbench sections">
            {NAV.map((item) => (
              <button
                key={item.key}
                className={`sb__item ${active === item.key ? 'sb__item--active' : ''}`}
                onClick={() => onNavigate(item.key)}
                aria-current={active === item.key ? 'page' : undefined}
              >
                <Icon name={item.icon} className="sb__icon" />
                <span>{item.label}</span>
                {item.count ? <span className="sb__count">{item.count}</span> : null}
              </button>
            ))}
          </nav>
          <div className="sb__foot">
            <strong>Independent demo</strong>
            Synthetic data only. Server-side AI boundary. No PII ingested.
          </div>
        </div>
      </aside>
      <header className="app__topbar">
        <div className="tb">
          <div className="tb__breadcrumb" aria-label="Breadcrumb">
            {breadcrumb}
          </div>
          <span className="tb__time mono">{utc} UTC</span>
          <span className="tb__spacer" />
          {rightExtras}
          <span className="tb__chip" title="Some optional connectors are running in degraded mode">
            <span className="dot" />
            Degraded mode · 1 connector
          </span>
          <span className="tb__ws" title="Workspace">
            <span className="ws-mark">EM</span>
            <span>EMEA Demand · prod</span>
            <Icon name="chevron" size={12} className="caret" />
          </span>
          <span className="tb__user" aria-label="Signed in as candidate">
            RS
          </span>
        </div>
      </header>
      <main className="app__main">
        <div className="main">{children}</div>
        <footer className="footer">
          Independent concept demo. Not affiliated with or endorsed by Globalization Partners
          (G-P). All data is synthetic.
        </footer>
      </main>
    </div>
  )
}
