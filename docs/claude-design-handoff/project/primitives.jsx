// Icons + small primitives shared across screens.
// Inline SVG so they inherit currentColor and stay crisp.

const Icon = ({ name, size = 14, className = "", strokeWidth = 1.6 }) => {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "signals":
      return <svg {...props}><path d="M3 12h3l2-6 4 12 2-6h2"/><path d="M16 12h5"/></svg>;
    case "runs":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9 8l6 4-6 4z" fill="currentColor" stroke="none"/></svg>;
    case "campaigns":
      return <svg {...props}><path d="M3 11l13-6v14L3 13z"/><path d="M16 7v10"/><path d="M7 13v4l3 1"/></svg>;
    case "knowledge":
      return <svg {...props}><path d="M4 5a2 2 0 0 1 2-2h11v15H6a2 2 0 0 0-2 2z"/><path d="M4 17v3h13"/><path d="M8 7h6M8 10h4"/></svg>;
    case "arch":
      return <svg {...props}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M9 6h6M6 9v3a3 3 0 0 0 3 3M18 9v3a3 3 0 0 1-3 3"/></svg>;
    case "audit":
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>;
    case "filter":
      return <svg {...props}><path d="M4 5h16l-6 8v6l-4-2v-4z"/></svg>;
    case "play":
      return <svg {...props}><path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none"/></svg>;
    case "pause":
      return <svg {...props}><rect x="7" y="5" width="3" height="14" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3" height="14" fill="currentColor" stroke="none"/></svg>;
    case "check":
      return <svg {...props}><path d="m5 12 4 4 10-10"/></svg>;
    case "x":
      return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "edit":
      return <svg {...props}><path d="M4 17l9-9 3 3-9 9H4z"/><path d="m13 6 2-2 3 3-2 2"/></svg>;
    case "alert":
      return <svg {...props}><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.01"/></svg>;
    case "info":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5h1"/></svg>;
    case "external":
      return <svg {...props}><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>;
    case "chevron":
      return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case "download":
      return <svg {...props}><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "globe":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "user":
      return <svg {...props}><circle cx="12" cy="9" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "more":
      return <svg {...props}><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>;
    case "sparkle":
      return <svg {...props}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/></svg>;
    case "shield":
      return <svg {...props}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "arrow-right":
      return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "arrow-down":
      return <svg {...props}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case "plus":
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "minus":
      return <svg {...props}><path d="M5 12h14"/></svg>;
    case "branch":
      return <svg {...props}><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M6 11a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6"/></svg>;
    default: return null;
  }
};

const Sparkline = ({ data, width = 96, height = 28, color = "var(--c1)", fill = false }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillD = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="spark" aria-hidden>
      {fill && <path d={fillD} fill={color} fillOpacity="0.10"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Pretty-print JSON with light syntax highlight
const Json = ({ data, maxHeight = 220 }) => {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"([^"]+)":/g, '<span class="j-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="j-str">"$1"</span>')
    .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="j-num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="j-bool">$1</span>')
    .replace(/: null/g, ': <span class="j-null">null</span>');
  return <pre style={{ maxHeight }} dangerouslySetInnerHTML={{ __html: html }} />;
};

const ScoreChip = ({ value }) => {
  const cls = value >= 75 ? "score--high" : value >= 55 ? "score--mid" : "score--low";
  return <span className={`score ${cls}`}>{value}</span>;
};

const TypeTag = ({ code }) => {
  const map = { HIRING: "hiring", FUNDING: "funding", EXPANSION: "expansion", "EXEC-HIRE": "exec" };
  return <span className={`tag tag--${map[code] || "hiring"}`}>{code}</span>;
};

const StatusBadge = ({ status }) => {
  const labels = { queued: "Queued", running: "Running", awaiting: "Awaiting approval", approved: "Approved", rejected: "Rejected" };
  return (
    <span className={`status status--${status}`} aria-label={`Status: ${labels[status]}`}>
      <StatusGlyph status={status} />
      {labels[status]}
    </span>
  );
};

const StatusGlyph = ({ status }) => {
  // Color-independent — every state has a distinct shape too.
  const sz = 8;
  switch (status) {
    case "queued": return <svg width={sz} height={sz} viewBox="0 0 8 8" aria-hidden><circle cx="4" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>;
    case "running": return <svg width={sz} height={sz} viewBox="0 0 8 8" aria-hidden><circle cx="4" cy="4" r="3" fill="currentColor"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite"/></circle></svg>;
    case "awaiting": return <svg width={sz} height={sz} viewBox="0 0 8 8" aria-hidden><path d="M0 4 4 0l4 4-4 4z" fill="currentColor"/></svg>;
    case "approved": return <svg width={sz} height={sz} viewBox="0 0 8 8" aria-hidden><path d="m1.5 4 1.8 2L6.5 2.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "rejected": return <svg width={sz} height={sz} viewBox="0 0 8 8" aria-hidden><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    default: return null;
  }
};

const FlagISO = ({ iso, flag }) => (
  <span className="flag-iso" aria-label={`Country: ${iso}`}>
    <span className="feed__flag" aria-hidden>{flag}</span>
    <span className="mono">{iso}</span>
  </span>
);

Object.assign(window, { Icon, Sparkline, Json, ScoreChip, TypeTag, StatusBadge, StatusGlyph, FlagISO });
