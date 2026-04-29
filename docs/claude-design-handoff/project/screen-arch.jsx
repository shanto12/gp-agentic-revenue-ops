// Screen 4 — Architecture
const ArchScreen = () => {
  return (
    <div className="page" role="main" aria-labelledby="arch-h1">
      <div>
        <h1 className="page__h1" id="arch-h1">Architecture</h1>
        <div className="page__sub">Graph <span className="mono">eor-emea-v3</span> · 8 nodes · last deploy 4h ago by r.steele.</div>
      </div>

      <div className="arch-wrap" style={{ marginTop: 16 }}>
        <div className="arch-canvas" role="img" aria-label="Agent state graph">
          <ArchGraph/>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="card__head"><span className="card__title">Model routing</span></div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <RoutingRow node="Plan" model="Sonnet 4.6" reason="multi-step reasoning"/>
              <RoutingRow node="Enrich" model="GPT-4o" reason="fast structured extraction"/>
              <RoutingRow node="ICP Score" model="GPT-4o" reason="deterministic classifier"/>
              <RoutingRow node="RAG Retrieval" model="Sonnet 4.6" reason="long-context synthesis"/>
              <RoutingRow node="Draft" model="Sonnet 4.6" reason="brand-voice fidelity"/>
              <RoutingRow node="Critique" model="Sonnet 4.6" reason="adversarial evaluator"/>
            </div>
          </div>
          <div className="card">
            <div className="card__head"><span className="card__title">Guardrails</span></div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
              <Guard label="Hallucination &lt; 25" ok/>
              <Guard label="Brand-voice ≥ 80" ok/>
              <Guard label="ICP confidence ≥ 70" ok/>
              <Guard label="HITL on cross-channel writes" ok/>
              <Guard label="No PII in prompts (auto-redaction)" ok/>
              <Guard label="Max $0.50 / signal · circuit-breaker" ok/>
            </div>
          </div>
        </aside>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="sec-title" style={{ marginBottom: 8 }}>Connectors</div>
        <div className="connectors">
          <Connector logo="hs" name="HubSpot" status="ok" detail="oauth · 4.2k accts synced · 12s lag"/>
          <Connector logo="sf" name="Salesforce" status="ok" detail="bulk-api v59 · 11.8k accts"/>
          <Connector logo="6s" name="6sense" status="warn" detail="enrich endpoint 503 · fallback active"/>
          <Connector logo="GA" name="Google Analytics" status="ok" detail="ga4 measurement · 38 events"/>
        </div>
      </div>
    </div>
  );
};

const RoutingRow = ({ node, model, reason }) => (
  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 8, alignItems: "center", fontSize: 12 }}>
    <b>{node}</b>
    <span className="card__sub" style={{ fontSize: 11.5 }}>{reason}</span>
    <span className={`tl__model tl__model--${model.startsWith("Sonnet") ? "sonnet" : "gpt"}`}>{model}</span>
  </div>
);

const Guard = ({ label, ok }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 14, height: 14, borderRadius: 3, background: ok ? "var(--green-tint)" : "var(--red-tint)", color: ok ? "var(--green)" : "var(--red)", display: "inline-grid", placeItems: "center" }}>
      <Icon name={ok ? "check" : "x"} size={10}/>
    </span>
    <span dangerouslySetInnerHTML={{ __html: label }}/>
  </div>
);

const Connector = ({ logo, name, status, detail }) => (
  <div className="conn">
    <div className="conn__logo">{logo}</div>
    <div className="conn__body">
      <b>{name}</b>
      <small>{detail}</small>
    </div>
    <span className={`dot dot--${status === "ok" ? "ok" : status === "warn" ? "warn" : "err"}`} aria-label={status}/>
  </div>
);

const ArchGraph = () => {
  // Node layout 880x460 viewBox
  const nodes = [
    { id: "plan", x: 80, y: 80, label: "Plan", model: "sonnet" },
    { id: "enrich", x: 260, y: 60, label: "Enrich", model: "gpt" },
    { id: "score", x: 440, y: 60, label: "ICP Score", model: "gpt" },
    { id: "rag", x: 620, y: 80, label: "RAG", model: "sonnet" },
    { id: "draft", x: 620, y: 220, label: "Draft", model: "sonnet" },
    { id: "critique", x: 440, y: 280, label: "Critique", model: "sonnet" },
    { id: "hitl", x: 260, y: 280, label: "HITL", model: null, hitl: true },
    { id: "writeback", x: 80, y: 280, label: "Writeback", model: null, sink: true },
    { id: "reject", x: 440, y: 400, label: "Reject", model: null, terminal: true },
  ];
  const N = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = [
    ["plan", "enrich"],
    ["enrich", "score"],
    ["score", "rag", { label: "≥70" }],
    ["score", "reject", { label: "<55", reject: true }],
    ["rag", "draft"],
    ["draft", "critique"],
    ["critique", "hitl", { label: "ship_with_edits" }],
    ["critique", "draft", { label: "regen", dashed: true }],
    ["hitl", "writeback", { label: "approved" }],
    ["hitl", "reject", { label: "rejected", reject: true, dashed: true }],
  ];

  const W = 88, H = 44;
  const portOut = (n) => ({ x: n.x + W/2, y: n.y });
  const portIn = (n) => ({ x: n.x - W/2, y: n.y });
  const portB = (n) => ({ x: n.x, y: n.y + H/2 });
  const portT = (n) => ({ x: n.x, y: n.y - H/2 });

  function edgePath(a, b, opts = {}) {
    // Pick reasonable ports based on relative position
    const dx = b.x - a.x, dy = b.y - a.y;
    let p1, p2;
    if (Math.abs(dx) > Math.abs(dy) + 30) {
      p1 = dx > 0 ? portOut(a) : portIn(a);
      p2 = dx > 0 ? portIn(b) : portOut(b);
    } else if (dy > 0) {
      p1 = portB(a); p2 = portT(b);
    } else {
      p1 = portT(a); p2 = portB(b);
    }
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    return { d: `M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`, mid: { x: mx, y: my - 6 } };
  }

  return (
    <svg viewBox="0 0 740 460" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
        </marker>
        <marker id="arrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--coral)"/>
        </marker>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="var(--line-2)" opacity="0.5"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="740" height="460" fill="url(#grid)"/>

      {edges.map(([from, to, opts = {}], i) => {
        const a = N[from], b = N[to];
        const { d, mid } = edgePath(a, b, opts);
        const stroke = opts.reject ? "var(--coral)" : "var(--muted)";
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={stroke} strokeWidth="1.4"
              strokeDasharray={opts.dashed ? "4 3" : ""}
              markerEnd={opts.reject ? "url(#arrR)" : "url(#arr)"}/>
            {opts.label && (
              <g transform={`translate(${mid.x}, ${mid.y})`}>
                <rect x="-26" y="-9" width="52" height="14" rx="3" fill="#fff" stroke="var(--line)"/>
                <text x="0" y="1" fontSize="9.5" textAnchor="middle" dominantBaseline="middle" fill={opts.reject ? "var(--red)" : "var(--ink-2)"} fontFamily="JetBrains Mono, monospace">{opts.label}</text>
              </g>
            )}
          </g>
        );
      })}

      {nodes.map(n => {
        const fill = n.terminal ? "var(--red-tint)" : n.sink ? "var(--green-tint)" : n.hitl ? "var(--coral-tint)" : "#fff";
        const stroke = n.terminal ? "var(--red)" : n.sink ? "var(--green)" : n.hitl ? "var(--coral)" : "var(--navy)";
        const tcolor = n.terminal ? "var(--red)" : n.sink ? "var(--green)" : "var(--ink)";
        return (
          <g key={n.id} transform={`translate(${n.x - W/2}, ${n.y - H/2})`}>
            <rect width={W} height={H} rx="6" fill={fill} stroke={stroke} strokeWidth="1.2"/>
            <text x={W/2} y={n.model ? 18 : 24} textAnchor="middle" fontSize="12" fontWeight="600" fill={tcolor} fontFamily="Inter, sans-serif">{n.label}</text>
            {n.model && (
              <text x={W/2} y={32} textAnchor="middle" fontSize="9.5" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
                {n.model === "sonnet" ? "Sonnet 4.6" : "GPT-4o"}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(20, 420)">
        <text x="0" y="0" fontSize="9.5" fill="var(--muted)" fontFamily="JetBrains Mono, monospace" letterSpacing="0.5">EDGES</text>
        <line x1="50" y1="-3" x2="80" y2="-3" stroke="var(--muted)" strokeWidth="1.4"/>
        <text x="86" y="0" fontSize="10" fill="var(--ink-2)">forward</text>
        <line x1="140" y1="-3" x2="170" y2="-3" stroke="var(--muted)" strokeWidth="1.4" strokeDasharray="4 3"/>
        <text x="176" y="0" fontSize="10" fill="var(--ink-2)">conditional</text>
        <line x1="240" y1="-3" x2="270" y2="-3" stroke="var(--coral)" strokeWidth="1.4"/>
        <text x="276" y="0" fontSize="10" fill="var(--ink-2)">reject</text>
      </g>
    </svg>
  );
};

window.ArchScreen = ArchScreen;
