// App shell: sidebar, topbar, footer, mobile tabbar
const NAV = [
  { id: "signals", label: "Signals", count: "22" },
  { id: "runs", label: "Agent Runs", count: "7" },
  { id: "campaigns", label: "Campaigns", count: "3" },
  { id: "knowledge", label: "Knowledge", count: "48" },
  { id: "arch", label: "Architecture" },
  { id: "audit", label: "Audit Log", count: "1.2k" },
];

const Sidebar = ({ route, setRoute }) => (
  <aside className="app__sidebar" aria-label="Primary">
    <div className="sb">
      <div className="sb__brand">
        <div className="sb__mark" aria-hidden></div>
        <div className="sb__title">
          Marketing Agent
          <small>Workbench</small>
        </div>
      </div>
      <div className="sb__section">Operations</div>
      <nav className="sb__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`sb__item ${route === n.id ? "sb__item--active" : ""}`}
            onClick={() => setRoute(n.id)}
            aria-current={route === n.id ? "page" : undefined}
            title={n.label}
          >
            <Icon name={
              n.id === "signals" ? "signals" :
              n.id === "runs" ? "runs" :
              n.id === "campaigns" ? "campaigns" :
              n.id === "knowledge" ? "knowledge" :
              n.id === "arch" ? "arch" : "audit"
            } className="sb__icon" />
            <span>{n.label}</span>
            {n.count && <span className="sb__count">{n.count}</span>}
          </button>
        ))}
      </nav>
      <div className="sb__foot">
        <strong>r.steele</strong>
        Lifecycle Marketing Ops
      </div>
    </div>
  </aside>
);

const Topbar = ({ route, signal }) => {
  const labels = {
    signals: ["Operations", "Signals"],
    runs: ["Operations", "Agent Runs", signal ? signal.id : "—"],
    campaigns: ["Operations", "Campaigns"],
    knowledge: ["Operations", "Knowledge"],
    arch: ["Operations", "Architecture"],
    audit: ["Operations", "Audit Log"],
  };
  const crumbs = labels[route] || labels.signals;
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="app__topbar" role="banner">
      <div className="tb">
        <div className="tb__breadcrumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
            </React.Fragment>
          ))}
        </div>
        <span className="tb__time mono">{WB_DATA.fmtClock(now)} UTC</span>
        <div className="tb__spacer"></div>
        <span className="tb__chip" title="One enrichment provider returning 503; agent fell back to OpenCorporates.">
          <span className="dot" aria-hidden></span>
          Degraded mode · 1 connector
        </span>
        <div className="tb__ws" role="button" tabIndex={0} aria-label="Workspace switcher">
          <span className="ws-mark">EM</span>
          <span>EMEA Demand · prod</span>
          <Icon name="chevron" size={12} className="caret"/>
        </div>
        <div className="tb__user" aria-label="r.steele">RS</div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="footer" role="contentinfo">
    Independent concept demo. Not affiliated with or endorsed by Globalization Partners (G-P). All data is synthetic.
  </footer>
);

const MobileTabbar = ({ route, setRoute }) => (
  <nav className="mob-tabbar" aria-label="Primary mobile">
    {NAV.filter(n => n.id !== "knowledge").map(n => (
      <button key={n.id} className={route === n.id ? "active" : ""} onClick={() => setRoute(n.id)}>
        <Icon name={n.id === "signals" ? "signals" : n.id === "runs" ? "runs" : n.id === "campaigns" ? "campaigns" : n.id === "arch" ? "arch" : "audit"} size={16}/>
        <span>{n.label.split(" ")[0]}</span>
      </button>
    ))}
  </nav>
);

Object.assign(window, { Sidebar, Topbar, Footer, MobileTabbar, NAV });
