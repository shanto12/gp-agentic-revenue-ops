// Screen 5 — Audit Log
const AuditScreen = () => {
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [stepFilter, setStepFilter] = React.useState("ALL");
  const rows = WB_DATA.AUDIT_ROWS.filter(r =>
    (statusFilter === "ALL" || r.status === statusFilter.toLowerCase()) &&
    (stepFilter === "ALL" || r.step === stepFilter)
  );

  return (
    <div className="page" role="main" aria-labelledby="audit-h1">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 className="page__h1" id="audit-h1">Audit Log</h1>
          <div className="page__sub">Append-only · retained 7 years · cryptographically hashed (sha256 chain). Exportable for SOC2 / ISO 27001 evidence.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--sm"><Icon name="filter" size={12}/> Saved view: 24h</button>
          <button className="btn btn--sm"><Icon name="download" size={12}/> Export CSV</button>
          <button className="btn btn--sm btn--navy"><Icon name="download" size={12}/> Evidence bundle</button>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 14 }} role="toolbar" aria-label="Audit filters">
        <div className="toolbar__group">
          {["ALL", "approved", "awaiting", "rejected", "running"].map(f => (
            <button key={f} className={`toolbar__chip ${statusFilter === f ? "toolbar__chip--active" : ""}`} onClick={() => setStatusFilter(f)} aria-pressed={statusFilter === f}>
              {f === "ALL" ? "All status" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="divider"></div>
        <div className="toolbar__group">
          {["ALL", "Plan", "ICP Score", "Critique", "Writeback"].map(s => (
            <button key={s} className={`toolbar__chip ${stepFilter === s ? "toolbar__chip--active" : ""}`} onClick={() => setStepFilter(s)} aria-pressed={stepFilter === s}>
              {s === "ALL" ? "All steps" : s}
            </button>
          ))}
        </div>
        <div className="toolbar__search">
          <Icon name="search" size={13}/>
          <input placeholder="Filter by run id, account, action…" aria-label="Filter audit"/>
        </div>
        <span className="card__sub mono" style={{ marginLeft: "auto" }}>{rows.length} of 1,284 events</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="tbl" aria-label="Audit log">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Subject</th>
              <th>Action</th>
              <th>Step</th>
              <th>Model</th>
              <th style={{ textAlign: "right" }}>Tokens</th>
              <th style={{ textAlign: "right" }}>Latency</th>
              <th>Evaluator</th>
              <th>Approver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ color: "var(--muted)" }}>{r.ts}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{r.target.split(" · ")[1] || r.target}</div>
                  <div className="card__sub mono">{r.target.split(" · ")[0]}</div>
                </td>
                <td className="mono" style={{ color: "var(--c1)" }}>{r.action}</td>
                <td>{r.step}</td>
                <td>{r.model !== "—" ? <span className={`tl__model tl__model--${r.model.startsWith("Sonnet") ? "sonnet" : r.model.startsWith("GPT") ? "gpt" : ""}`}>{r.model}</span> : <span className="card__sub">—</span>}</td>
                <td className="mono" style={{ textAlign: "right" }}>{r.tokens ? r.tokens.toLocaleString() : "—"}</td>
                <td className="mono" style={{ textAlign: "right" }}>{r.latency}ms</td>
                <td className="mono" style={{ fontSize: 11.5 }}>{r.eval}</td>
                <td className="mono">{r.approver}</td>
                <td><StatusBadge status={r.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card__sub" style={{ marginTop: 10, fontSize: 11 }}>
        Chain root: <span className="mono">sha256:9f4a…2c81</span> · last verified 2026-04-28 09:00:00Z
      </div>
    </div>
  );
};

const KnowledgeScreen = () => (
  <div className="page" role="main">
    <h1 className="page__h1">Knowledge</h1>
    <div className="page__sub">RAG corpus · 48 documents · 12.4k chunks · re-embedded 6h ago.</div>
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card__head"><span className="card__title">Indexed sources</span><span style={{ marginLeft: "auto" }} className="card__sub mono">embed: text-embedding-3-large · 1536d</span></div>
      <div className="card__body">
        <table className="tbl" style={{ border: 0 }}>
          <thead><tr><th>Document</th><th>Type</th><th>Chunks</th><th>Last touched</th><th>Owner</th></tr></thead>
          <tbody>
            {[
              ["brand-voice-v4.md", "Voice", 142, "2026-04-22", "lopez@…"],
              ["icp-eor-mid-emea-v3.md", "ICP", 84, "2026-04-19", "rsteele@…"],
              ["battlecard-eor-vs-entity.md", "Battlecard", 96, "2026-04-15", "kparkins@…"],
              ["case-study-northsail.md", "Case study", 38, "2026-04-11", "lopez@…"],
              ["compliance-de-uk-sg.md", "Legal", 71, "2026-04-08", "Legal Ops"],
              ["objection-handling-v2.md", "Sales", 60, "2026-04-02", "kparkins@…"],
            ].map((r, i) => (
              <tr key={i}>
                <td className="mono">{r[0]}</td>
                <td><span className="tag tag--hiring">{r[1]}</span></td>
                <td className="mono">{r[2]}</td>
                <td className="mono" style={{ color: "var(--muted)" }}>{r[3]}</td>
                <td className="mono">{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

window.AuditScreen = AuditScreen;
window.KnowledgeScreen = KnowledgeScreen;
