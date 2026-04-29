// Screen 3 — Campaigns
const CampaignsScreen = () => {
  const [reallocOpen, setReallocOpen] = React.useState(false);
  const [reasoningOpen, setReasoningOpen] = React.useState(false);

  return (
    <div className="page" role="main" aria-labelledby="camp-h1">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 className="page__h1" id="camp-h1">Campaigns</h1>
          <div className="page__sub">3 active · last sync 41s ago · agent monitoring CPL drift on 5-min windows.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--sm"><Icon name="filter" size={12}/> Geo: EMEA</button>
          <button className="btn btn--sm"><Icon name="clock" size={12}/> 14d window</button>
        </div>
      </div>

      {/* Reallocation banner */}
      <div className="realloc" role="region" aria-label="Agent budget reallocation proposal" style={{ marginTop: 16 }}>
        <div className="realloc__icon" aria-hidden><Icon name="arrow-right" size={14}/></div>
        <div className="realloc__body">
          <h4>Writeback proposed · shift $4,200 from <b>LinkedIn — VP People DACH</b> → <b>Email Nurture — Expansion Trigger</b></h4>
          <p>3-day rolling CPL on Email Nurture is 38% lower ($48.40 vs $129.72 portfolio median). LinkedIn cohort fatigue rising — frequency cap exceeded for 71% of remaining audience.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <span className="status status--awaiting"><StatusGlyph status="awaiting"/> Awaiting approval · 11m</span>
            <span className="card__sub mono">run_2c81f4b1 · evaluator: ICP confidence 84</span>
            <button className="btn btn--ghost btn--sm" onClick={() => setReasoningOpen(o => !o)} aria-expanded={reasoningOpen}>
              <Icon name="chevron" size={11} className={`tl__caret ${reasoningOpen ? "tl__caret--open" : ""}`}/> Reasoning chain
            </button>
          </div>
          {reasoningOpen && (
            <div style={{ marginTop: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 5, padding: "10px 12px", fontSize: 12, lineHeight: 1.6, color: "var(--ink-2)" }}>
              <div className="sec-title" style={{ marginBottom: 6 }}>Chain</div>
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>Pulled 14d performance from GA4 + ad platforms; computed rolling CPL with 3d/7d/14d windows.</li>
                <li>LinkedIn audience saturation: 71% of segment hit ≥5 impressions; 3d CPL up 22% w/w.</li>
                <li>Email nurture re-engaged 88 EXPANSION-triggered accounts; cost-per-reply held at $48.40 across 9d.</li>
                <li>Optimisation policy <span className="mono">cpl_v2_min_$1k_shift</span> permits ≤$5,000 transfer without HITL · this proposal is below threshold but cross-channel, so HITL required.</li>
                <li>Forecast Δ leads next 14d: <span className="mono" style={{ color: "var(--green)" }}>+24</span> · Δ pipeline: <span className="mono" style={{ color: "var(--green)" }}>+$84k</span>.</li>
              </ol>
            </div>
          )}
        </div>
        <div className="realloc__actions">
          <button className="btn btn--primary"><Icon name="check" size={12}/> Approve shift</button>
          <button className="btn">Hold for now</button>
        </div>
      </div>

      {/* Campaign tiles */}
      <div className="camp-grid" style={{ marginTop: 16 }}>
        {WB_DATA.CAMPAIGNS.map(c => (
          <CampaignTile key={c.id} c={c}/>
        ))}
      </div>

      {/* Brand-voice critique panel */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card__head">
          <Icon name="alert" size={13} style={{ color: "var(--coral)" }}/>
          <span className="card__title">Brand-voice critique · 1 creative flagged</span>
          <span style={{ marginLeft: "auto" }} className="card__sub mono">evaluator: brand-voice-v4 · run_2c81f4b3</span>
        </div>
        <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16 }}>
          <div>
            <div className="sec-title" style={{ marginBottom: 6 }}>Original copy <span style={{ color: "var(--red)" }}>· tone 71</span></div>
            <div style={{ background: "var(--red-tint)", border: "1px solid rgba(164,65,58,0.25)", borderRadius: 5, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ display: "block", marginBottom: 4 }}>Stop wasting six figures on entity setup.</b>
              Hire abroad in days, not quarters. Our platform crushes the competition on speed and price — trusted by 2,000+ companies who refused to be held hostage by legal red tape.
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)" }}>
              Flagged terms: <span className="mono">"crushes"</span>, <span className="mono">"held hostage"</span>, <span className="mono">"refused"</span>. Brand voice v4 § 3.2 prohibits combative metaphors and competitor disparagement.
            </div>
          </div>
          <div>
            <div className="sec-title" style={{ marginBottom: 6 }}>Agent rewrite <span style={{ color: "var(--green)" }}>· tone 94</span></div>
            <div style={{ background: "var(--green-tint)", border: "1px solid rgba(79,122,74,0.25)", borderRadius: 5, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ display: "block", marginBottom: 4 }}>Hire in 184 countries without standing up an entity.</b>
              Onboard in days. Run payroll, benefits and compliance through one platform — used by teams expanding into the UK, Singapore and the UAE in the same quarter.
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)" }}>
              Concrete numbers replaced superlatives; combative language removed; specific geos surfaced from current campaign segment.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Gauge label="Brand-voice fit" value={94} threshold={80}/>
            <Gauge label="Reading grade" value={64} threshold={50}/>
            <Gauge label="ICP relevance" value={89} threshold={70}/>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              <button className="btn btn--primary" style={{ justifyContent: "center" }}><Icon name="check" size={12}/> Replace creative</button>
              <button className="btn">Send to copy reviewer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignTile = ({ c }) => {
  const cplDelta = ((c.cpl - c.cplPrev) / c.cplPrev) * 100;
  const cplDown = cplDelta < 0;
  return (
    <article className="camp" aria-label={c.name}>
      <div className="camp__h">
        <span className="conn__logo" aria-hidden>{c.channel === "Google Search" ? "G" : c.channel === "LinkedIn" ? "in" : "@"}</span>
        <div style={{ flex: 1 }}>
          <b>{c.name}</b>
          <div className="card__sub mono">{c.channel} · 14d</div>
        </div>
        <span className={`status ${c.status === "warn" ? "status--awaiting" : "status--approved"}`}>
          <StatusGlyph status={c.status === "warn" ? "awaiting" : "approved"}/>
          {c.status === "warn" ? "Drift" : "Healthy"}
        </span>
      </div>
      <Sparkline data={c.sparkline} width={280} height={48} color={c.status === "warn" ? "var(--amber)" : "var(--c2)"} fill/>
      <div className="camp__metrics">
        <div className="m">
          <small>Spend (14d)</small>
          <b>${c.spend.toLocaleString()}</b>
        </div>
        <div className="m">
          <small>Leads</small>
          <b>{c.leads}</b>
        </div>
        <div className="m">
          <small>CPL</small>
          <b>${c.cpl.toFixed(2)} <span className="mono" style={{ fontSize: 10.5, color: cplDown ? "var(--green)" : "var(--red)" }}>{cplDown ? "▾" : "▴"}{Math.abs(cplDelta).toFixed(0)}%</span></b>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <span className="card__sub mono" style={{ flex: 1 }}>ROI {c.roi.toFixed(1)}× · pacing 102%</span>
        <button className="btn btn--ghost btn--sm">Inspect</button>
      </div>
    </article>
  );
};

window.CampaignsScreen = CampaignsScreen;
