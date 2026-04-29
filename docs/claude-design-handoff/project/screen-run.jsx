// Screen 2 — Agent Run (hero)
const RunScreen = ({ signal }) => {
  const sig = signal || WB_DATA.HERO_SIGNAL;
  const [openSteps, setOpenSteps] = React.useState({ 0: false, 1: false, 2: false, 3: false, 4: true, 5: true });

  const toggle = (i) => setOpenSteps(prev => ({ ...prev, [i]: !prev[i] }));

  const totalLatency = WB_DATA.RUN_STEPS.filter(s => s.latency).reduce((a, s) => a + s.latency, 0);
  const totalTokens = WB_DATA.RUN_STEPS.filter(s => s.tokens).reduce((a, s) => a + s.tokens, 0);

  return (
    <div className="run-grid" role="main" aria-labelledby="run-h1">
      {/* LEFT: signal context */}
      <aside className="run-col run-col--scroll" aria-label="Signal context">
        <div className="card">
          <div className="card__head">
            <span className="card__title">Signal context</span>
            <span style={{ marginLeft: "auto" }}><TypeTag code={sig.type || "EXPANSION"}/></span>
          </div>
          <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }} id="run-h1">{sig.company}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }} className="mono">{sig.domain} · {sig.industry || "—"}</div>
            </div>
            <dl className="kvp">
              <dt>Signal ID</dt><dd className="mono">{sig.id}</dd>
              <dt>Country</dt><dd><FlagISO iso={sig.country} flag={sig.flag}/></dd>
              <dt>Headcount</dt><dd className="mono">{sig.employees || 412}</dd>
              <dt>Detected</dt><dd className="mono">2026-04-28 09:14:22Z</dd>
              <dt>Source</dt><dd className="mono" style={{ wordBreak: "break-word" }}>{WB_DATA.HERO_SIGNAL.source}</dd>
              <dt>Trust</dt><dd>0.91 · cross-corroborated</dd>
            </dl>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div className="sec-title" style={{ marginBottom: 6 }}>Trigger</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{WB_DATA.HERO_SIGNAL.description}</p>
            </div>
            <a className="btn btn--sm" href="#" onClick={(e) => e.preventDefault()} style={{ alignSelf: "flex-start" }}>
              <Icon name="external" size={11}/> Open source filing
            </a>
            <details className="code-fold">
              <summary>Raw signal payload</summary>
              <Json data={WB_DATA.HERO_SIGNAL.payload} maxHeight={260}/>
            </details>
          </div>
        </div>

        <div className="card">
          <div className="card__head"><span className="card__title">Run summary</span></div>
          <div className="card__body">
            <dl className="kvp">
              <dt>Run ID</dt><dd className="mono">run_2c81f4a9</dd>
              <dt>Started</dt><dd className="mono">09:14:42Z</dd>
              <dt>Steps</dt><dd className="mono">5 / 8 complete</dd>
              <dt>Latency</dt><dd className="mono">{(totalLatency/1000).toFixed(2)}s wall</dd>
              <dt>Tokens</dt><dd className="mono">{totalTokens.toLocaleString()}</dd>
              <dt>Cost</dt><dd className="mono">$0.082</dd>
              <dt>Trace</dt><dd className="mono"><a href="#" onClick={e=>e.preventDefault()} style={{ color: "var(--c1)" }}>otlp/run_2c81f4a9 <Icon name="external" size={10}/></a></dd>
            </dl>
          </div>
        </div>
      </aside>

      {/* CENTER: timeline */}
      <section className="run-col run-col--scroll" aria-label="Reasoning timeline" aria-live="polite">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Reasoning timeline</h2>
          <span className="card__sub mono">8 steps · 1 active</span>
          <span style={{ marginLeft: "auto" }} className="card__sub mono">v3.2 · graph eor-emea-v3</span>
        </div>

        <div className="tl">
          {WB_DATA.RUN_STEPS.map((s, i) => {
            const isActive = s.status === "active";
            const isDone = s.status === "done";
            const isPending = s.status === "pending" || s.status === "blocked";
            const klass = `tl__step ${isActive ? "tl__step--active" : ""} ${isDone ? "tl__step--done" : ""} ${isPending ? "tl__step--pending" : ""}`;
            return (
              <div key={i} className={klass}>
                <div
                  className="tl__head"
                  role="button"
                  tabIndex={0}
                  aria-expanded={!!openSteps[i]}
                  onClick={() => !isPending && toggle(i)}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isPending) { e.preventDefault(); toggle(i); } }}
                >
                  <div className="tl__num" aria-hidden>{isDone ? "✓" : isActive ? "●" : i + 1}</div>
                  <div className="tl__name">{s.name}</div>
                  <div className="tl__meta">
                    {s.model && <span className={`tl__model tl__model--${s.model}`}>{s.model === "sonnet" ? "Sonnet 4.6" : "GPT-4o"}</span>}
                    {s.latency != null && <span>{s.latency}ms</span>}
                    {s.tokens != null && <span>{s.tokens.toLocaleString()} tok</span>}
                    {isActive && <span style={{ color: "var(--coral)" }}>running…</span>}
                    {isPending && <span style={{ color: "var(--muted)" }}>{s.status === "blocked" ? "blocked on HITL" : "awaiting input"}</span>}
                    {!isPending && <Icon name="chevron" size={12} className={`tl__caret ${openSteps[i] ? "tl__caret--open" : ""}`} />}
                  </div>
                </div>
                {openSteps[i] && !isPending && (
                  <div className="tl__body">
                    {s.name === "Critique" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                        <CritiqueChip label="Brand voice" value={s.output.brand_voice_fit} good />
                        <CritiqueChip label="Hallucination risk" value={s.output.hallucination_risk} good={s.output.hallucination_risk < 25} inverse />
                        <CritiqueChip label="ICP confidence" value={s.output.icp_confidence} good />
                      </div>
                    )}
                    {s.name === "Draft Nurture" && (
                      <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        {s.output.sequence.map(seq => (
                          <div key={seq.step} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 4, padding: "8px 10px" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                              <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>D+{seq.day}</span>
                              <b style={{ fontSize: 12.5 }}>{seq.subject}</b>
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{seq.preview}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="tl__io">
                      <div>
                        <h6>Input</h6>
                        <Json data={s.input}/>
                      </div>
                      <div>
                        <h6>Output</h6>
                        <Json data={s.output}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* RIGHT: HITL gate */}
      <aside className="run-col run-col--scroll" aria-label="Human-in-the-loop gate">
        <div className="card">
          <div className="card__head" style={{ background: "var(--coral-tint)", borderBottom: "1px solid rgba(255,95,78,0.3)" }}>
            <Icon name="shield" size={13} className="" /> <span className="card__title">HITL gate · awaiting you</span>
          </div>
          <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="sec-title">Evaluator scores</div>
            <div>
              <Gauge label="Brand-voice fit" value={88} threshold={80}/>
              <Gauge label="Hallucination risk" value={12} threshold={25} inverse/>
              <Gauge label="ICP confidence" value={91} threshold={70}/>
            </div>
            <div className="sec-title" style={{ marginTop: 4 }}>Proposed CRM writeback</div>
            <div className="diff" role="region" aria-label="CRM writeback diff">
              {WB_DATA.CRM_DIFF.map((line, i) => (
                <div key={i} className={`diff__line diff__line--${line.kind}`}>
                  <span className="diff__sigil">{line.kind === "add" ? "+" : line.kind === "del" ? "−" : " "}</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
            <div className="card__sub" style={{ fontSize: 11 }}>
              Target: <span className="mono">salesforce.workspace_emea.account</span>
            </div>
            <div className="gate-actions">
              <button className="btn btn--primary" style={{ justifyContent: "center" }}>
                <Icon name="check" size={13}/> Approve & write back
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button className="btn"><Icon name="edit" size={12}/> Edit</button>
                <button className="btn btn--danger"><Icon name="x" size={12}/> Reject…</button>
              </div>
            </div>
            <details className="code-fold">
              <summary>Why the agent recommends this</summary>
              <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55, padding: "6px 0" }}>
                ICP score moved B→A on a corroborated subsidiary registration in two priority geographies (UK, SG). Sequence retrieved brand-voice v4 with 0.91 top score and the Northsail case study. Critique flagged one borderline phrase but did not block.
              </div>
            </details>
          </div>
        </div>
      </aside>
    </div>
  );
};

const CritiqueChip = ({ label, value, good, inverse }) => {
  const cls = good ? "score--high" : value > 50 ? "score--mid" : "score--low";
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 4, padding: "8px 10px" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: 4 }}>
        <span className={`score ${cls}`} style={{ fontSize: 13 }}>{value}{inverse ? "" : ""}</span>
      </div>
    </div>
  );
};

const Gauge = ({ label, value, threshold, inverse }) => {
  const ok = inverse ? value < threshold : value >= threshold;
  const color = ok ? "var(--green)" : value >= (threshold * 0.7) ? "var(--amber)" : "var(--red)";
  const pct = Math.max(4, Math.min(100, value));
  return (
    <div className="gauge">
      <span className="gauge__lbl">{label}</span>
      <span className="gauge__bar"><span className="gauge__fill" style={{ width: `${pct}%`, background: color }}/></span>
      <span className="gauge__val mono" style={{ color }}>{value}</span>
    </div>
  );
};

window.RunScreen = RunScreen;
