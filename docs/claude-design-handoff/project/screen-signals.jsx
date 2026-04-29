// Screen 1 — Signals (default landing)
const SignalsScreen = ({ setRoute, setSelectedSignal }) => {
  const [filter, setFilter] = React.useState("ALL");
  const [minScore, setMinScore] = React.useState(0);
  const [feed, setFeed] = React.useState(WB_DATA.SIGNAL_FEED);
  const [newIds, setNewIds] = React.useState(new Set());
  const [paused, setPaused] = React.useState(false);
  const counterRef = React.useRef(WB_DATA.SIGNAL_FEED.length);

  // Live streaming new signals
  React.useEffect(() => {
    if (paused) return;
    const tick = () => {
      counterRef.current += 1;
      const sig = WB_DATA.makeSignal(counterRef.current, 1);
      sig.id = `sig_${String(10421 + counterRef.current).padStart(5,'0')}`;
      sig.ts = 1;
      setFeed(prev => [sig, ...prev].slice(0, 40));
      setNewIds(prev => {
        const next = new Set(prev); next.add(sig.id);
        setTimeout(() => setNewIds(p => { const s = new Set(p); s.delete(sig.id); return s; }), 1200);
        return next;
      });
    };
    const t = setInterval(tick, 4200 + Math.random() * 2000);
    return () => clearInterval(t);
  }, [paused]);

  // Age all signals
  React.useEffect(() => {
    const t = setInterval(() => {
      setFeed(prev => prev.map(s => ({ ...s, ts: s.ts + 5 })));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const visible = feed.filter(s => (filter === "ALL" || s.type === filter) && s.score >= minScore);
  const inflight = feed.filter(s => s.status === "running").length;
  const queue = feed.filter(s => s.status === "awaiting").length;

  const open = (signal) => {
    setSelectedSignal(signal);
    setRoute("runs");
  };

  return (
    <div className="page" role="main" aria-labelledby="signals-h1">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 className="page__h1" id="signals-h1">Signals</h1>
          <div className="page__sub">Buyer-intent stream from Handelsregister, LinkedIn JobPosts, OpenCorporates, PitchBook and 3 first-party watchers.</div>
        </div>
        <div className="live-pulse" aria-live="polite">
          <span className="dot" aria-hidden></span>
          {paused ? "Stream paused" : "Live · streaming"}
          <button className="btn btn--ghost btn--sm" onClick={() => setPaused(p => !p)} style={{ marginLeft: 6 }}>
            <Icon name={paused ? "play" : "pause"} size={12}/>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="metrics" style={{ marginTop: 14 }} role="group" aria-label="Operational metrics">
        <div className="metrics__cell">
          <div className="metrics__lbl">Signals / hr</div>
          <div className="metrics__val">142<span className="metrics__delta">+8%</span></div>
          <div className="metrics__sub">7-day trailing avg 131</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">In-flight runs</div>
          <div className="metrics__val">{inflight + 5}</div>
          <div className="metrics__sub">2 over 30s · p95 22.4s</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">Approval queue</div>
          <div className="metrics__val">{queue + 4}<span className="metrics__delta metrics__delta--down">+2</span></div>
          <div className="metrics__sub">Oldest waiting 11m</div>
        </div>
        <div className="metrics__cell">
          <div className="metrics__lbl">Brand-voice fit (24h)</div>
          <div className="metrics__val">91.2</div>
          <div className="metrics__sub">Threshold 80 · 1 flag open</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" role="toolbar" aria-label="Signal filters">
        <div className="toolbar__group">
          {["ALL", "HIRING", "FUNDING", "EXPANSION", "EXEC-HIRE"].map(f => (
            <button key={f}
              className={`toolbar__chip ${filter === f ? "toolbar__chip--active" : ""}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}>
              {f === "ALL" ? "All types" : f}
            </button>
          ))}
        </div>
        <div className="divider" aria-hidden></div>
        <div className="toolbar__group" aria-label="Min ICP score">
          {[{l:"Any", v:0},{l:"≥55", v:55},{l:"≥75", v:75},{l:"≥85", v:85}].map(o => (
            <button key={o.v}
              className={`toolbar__chip ${minScore === o.v ? "toolbar__chip--active" : ""}`}
              onClick={() => setMinScore(o.v)}
              aria-pressed={minScore === o.v}>
              {o.l}
            </button>
          ))}
        </div>
        <div className="divider" aria-hidden></div>
        <div className="toolbar__search">
          <Icon name="search" size={13} />
          <input placeholder="Search company, country, signal id…" aria-label="Search signals"/>
          <span className="kbd">⌘K</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span className="card__sub mono">{visible.length} of {feed.length}</span>
        </div>
      </div>

      {/* Feed */}
      <div className="feed" role="table" aria-label="Signal feed" aria-live="polite">
        <div className="feed__head" role="row">
          <span></span>
          <span>Account</span>
          <span>Signal</span>
          <span>Geo</span>
          <span>ICP fit</span>
          <span>Trigger</span>
          <span>Agent state</span>
          <span style={{ textAlign: "right" }}>Detected</span>
        </div>
        {visible.map(s => (
          <div
            key={s.id}
            role="row"
            tabIndex={0}
            className={`feed__row ${newIds.has(s.id) ? "feed__row--new" : ""}`}
            onClick={() => open(s)}
            onKeyDown={(e) => { if (e.key === "Enter") open(s); }}
            aria-label={`Open ${s.company}`}
          >
            <div className="feed__icon" aria-hidden>
              <Icon name={s.type === "FUNDING" ? "sparkle" : s.type === "EXPANSION" ? "globe" : s.type === "EXEC-HIRE" ? "user" : "branch"} size={11} />
            </div>
            <div className="feed__company">
              <b>{s.company}</b>
              <small className="mono">{s.domain} · {s.industry} · {s.employees} hc</small>
            </div>
            <div><TypeTag code={s.type}/></div>
            <FlagISO iso={s.country} flag={s.flag}/>
            <div><ScoreChip value={s.score}/></div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.description}>
              {s.description}
            </div>
            <div><StatusBadge status={s.status}/></div>
            <div className="feed__t" style={{ textAlign: "right" }}>{WB_DATA.fmtTimeAgo(s.ts)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.SignalsScreen = SignalsScreen;
