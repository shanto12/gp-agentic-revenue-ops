import { useEffect, useState } from 'react'
import { Icon } from './Icon'

interface HealthBody {
  mode: 'live-glm' | 'synthetic-deterministic'
  provider: 'z.ai-glm' | 'none'
  model: string
  endpoint: string
  capabilities: {
    agent_run: boolean
    deep_research: boolean
    web_reader: boolean
    web_search_grounding: boolean
    live_signals?: boolean
    cached_signals?: boolean
  }
}

const STEPS = [
  {
    n: 1,
    title: 'Open Signals',
    body: 'Click "Signals" in the sidebar. The page boots from /api/cached-signals (last live payload, served from Netlify Blobs). On a cold cache it auto-fires /api/refresh-signals so you always land on real public-web data. Filter by signal type (HIRING / FUNDING / EXPANSION / EXEC-HIRE / COMPLIANCE) or score floor.',
  },
  {
    n: 2,
    title: 'Click Refresh to pull fresh signals from the open web',
    body: 'In the Signals header, click "Refresh". The app calls /api/refresh-signals → GLM-5.1 + web_search fetches REAL named companies with public expansion / hiring / funding / exec / compliance disclosures from the last ~30 days, then writes the result to the signals-cache blob so the next visitor gets it instantly. No fixtures, no demo data — every row is verifiable against a public source.',
  },
  {
    n: 3,
    title: 'Pick a high-fit signal',
    body: 'Click a row with ICP fit ≥ 75. Pick whichever company GLM surfaced with the highest score — typically a recently-funded mid-market with fresh hiring or expansion press.',
  },
  {
    n: 4,
    title: 'Watch the reasoning timeline',
    body: 'Plan → Enrich → ICP Score → RAG → Draft Nurture → Critique → HITL Gate. Click any step to expand its JSON I/O and see model, latency, tokens.',
  },
  {
    n: 5,
    title: 'Run live with GLM-5.1',
    body: 'Click "Re-run draft live" — calls Z.ai\'s glm-5.1 over a streaming SSE function (thinking-mode disabled). The function returns the draft + any cited public sources.',
  },
  {
    n: 6,
    title: 'Fan out a deep research run (parallel subagents)',
    body: 'In the Agent Run, click "Deep research". Four GLM-5.1 subagents fire in parallel — Hiring, Expansion, Executive, Compliance — each with its own web_search budget. Total time ≈ slowest single lens.',
  },
  {
    n: 7,
    title: 'Approve / Edit / Reject at the HITL gate',
    body: 'Right rail shows evaluator gauges (brand-voice fit, hallucination risk, ICP confidence) and the proposed CRM write-back as a JSON diff. Nothing executes without your explicit approval.',
  },
  {
    n: 8,
    title: 'Tour the rest',
    body: 'Campaigns shows an autonomous reallocation proposal with reasoning + brand-voice flag on a creative. Architecture shows the LangGraph-style state graph + connector strip. Audit Log is the chronological action log.',
  },
]

export function DemoGuideScreen() {
  const [health, setHealth] = useState<HealthBody | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(`health ${r.status}`)))
      .then((j) => {
        if (!cancelled) setHealth(j)
      })
      .catch((e) => {
        if (!cancelled) setHealthError(typeof e === 'string' ? e : 'fetch failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page" aria-labelledby="dg-h1">
      <h1 id="dg-h1" className="page__h1">Demo Guide</h1>
      <p className="page__sub">
        Everything you need to run this demo end-to-end, in one place. Open it on a second monitor
        during interviews or send the live URL with this guide as the landing tab.
      </p>

      <section
        className="card"
        style={{ marginTop: 16, borderColor: health?.mode === 'live-glm' ? 'var(--green)' : 'var(--line)' }}
        aria-label="System status"
      >
        <div className="card__head">
          <Icon name="info" size={13} />
          <span className="card__title">Live system status</span>
          <span className="tb__spacer" />
          {health?.mode === 'live-glm' ? (
            <span className="status status--approved">
              <span className="dot" /> live · {health.provider}
            </span>
          ) : (
            <span className="status status--queued">
              <span className="dot" /> synthetic mode
            </span>
          )}
        </div>
        <div className="card__body">
          {healthError && (
            <p style={{ color: 'var(--red)', fontSize: 12 }}>health check failed: {healthError}</p>
          )}
          {health && (
            <div className="kvp">
              <dt>Mode</dt>
              <dd className="mono">{health.mode}</dd>
              <dt>Model</dt>
              <dd className="mono">{health.model}</dd>
              <dt>Endpoint</dt>
              <dd className="mono">{health.endpoint}</dd>
              <dt>Agent run</dt>
              <dd>{health.capabilities.agent_run ? '✓ live' : '∅ degraded'}</dd>
              <dt>Deep research</dt>
              <dd>{health.capabilities.deep_research ? '✓ live' : '∅ degraded'}</dd>
              <dt>Web reader</dt>
              <dd>{health.capabilities.web_reader ? '✓ live' : '∅ degraded'}</dd>
              <dt>Search grounding</dt>
              <dd>{health.capabilities.web_search_grounding ? '✓ live' : '∅ degraded'}</dd>
              <dt>Live signals (real data)</dt>
              <dd>{health.capabilities.live_signals ? '✓ live' : '∅ degraded'}</dd>
              <dt>Cached signals (Netlify Blobs)</dt>
              <dd>{health.capabilities.cached_signals ? '✓ live' : '∅ degraded'}</dd>
            </div>
          )}
        </div>
      </section>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24 }}>Business Requirement</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4, marginBottom: 8 }}>
        What this is and why it exists.
      </p>
      <div className="card" style={{ marginTop: 8 }}>
        <div className="card__body" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>
            <strong>Buyer.</strong> The target buyer is an Employer-of-Record (EOR) buyer inside a
            mid-market, expansion-stage SaaS company — typically a VP of People, a Head of
            International, or a CFO standing up the company's first 1–3 international hires without
            opening a foreign entity. Buying triggers are public and observable: a Series B/C round,
            a new VP of International, a job req in Berlin or Singapore, a SOC 2 / GDPR posture
            update, an M&A close.
          </p>
          <p>
            <strong>Pain G-P's marketing team is solving.</strong> An SDR cannot read the entire
            open web every morning. By the time a hand-built list of "companies that just announced
            international expansion" reaches a sequencer, the signal is days stale and the
            messaging is generic. The team needs (a) autonomous lead enrichment from public
            buyer-intent signals, (b) brand-safe outbound drafted against an EOR-buyer ICP and
            G-P's voice, and (c) audit-grade write-backs into the CRM that a compliance reviewer
            can defend line by line.
          </p>
          <p>
            <strong>Agentic, not automation.</strong> A Zapier-style if-this-then-that pipeline
            cannot decide that a SOC-2 announcement plus a Berlin hiring spree plus a new VP of
            International together imply a higher-fit moment than any one of them alone. That is a
            reasoning loop: plan → enrich → score → draft → critique → re-plan. The demo runs that
            loop explicitly so the steps, the model, the latency, and the citations are all
            inspectable.
          </p>
          <p>
            <strong>HITL is non-negotiable.</strong> EOR buying touches employment law, tax
            posture, and data residency in every target country. A hallucinated claim about GDPR
            coverage or a misattributed funding round is a brand-safety incident, not a typo.
            Every CRM write-back, every outbound draft, and every budget reallocation in this
            workbench passes through an explicit approve / edit / reject gate with evaluator
            scores (brand-voice fit, hallucination risk, ICP confidence) before anything leaves
            the boundary.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>How the four screens map to the JD's Core Responsibilities.</strong>
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li>
              <strong>Signals</strong> — "Crawl the web for buyer-intent signals and enrich CRM
              records." Live, cited, deduped, ICP-scored.
            </li>
            <li>
              <strong>Agent Run</strong> — "NLP-driven lead nurturing" + "reasoning loops to prevent
              hallucinations." Plan → Enrich → ICP Score → RAG → Draft → Critique → HITL Gate, with
              parallel deep-research subagents on demand.
            </li>
            <li>
              <strong>Campaigns</strong> — "Autonomous campaign management." A reallocation
              proposal with reasoning, brand-voice flag on the creative, and a HITL approval before
              spend moves.
            </li>
            <li>
              <strong>Architecture</strong> — "Orchestrate HubSpot / Salesforce / 6sense / GA" +
              "LangGraph / CrewAI / Claude / GPT-4o." The state graph and connector strip make the
              orchestration boundary, model routing, and write-back contract explicit for a
              security or compliance reviewer.
            </li>
          </ul>
        </div>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24 }}>Real-world application & who it's useful for</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4, marginBottom: 8 }}>
        Why this demo is worth a look beyond the specific G-P role.
      </p>
      <div className="card" style={{ marginTop: 8 }}>
        <div className="card__body" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>
            <strong>What this is in plain terms.</strong> A working reference implementation of an
            autonomous agent that reads the open web for buyer-intent signals, scores them against a
            target customer profile, drafts brand-safe outbound, and previews CRM updates behind a
            human approval gate.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Who it's useful for.</strong>
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li>
              Sales / marketing / RevOps leaders evaluating "agentic, not automation" patterns for
              their own pipeline.
            </li>
            <li>
              Founders / operators considering similar internal tooling instead of buying
              off-the-shelf SDR-as-a-service products.
            </li>
            <li>
              AI / platform engineers looking for a working reference of: GLM-5.1 + web_search
              grounding, parallel sub-agent fan-out over Server-Sent Events, server-side AI boundary
              on Netlify, deterministic ICP scoring + brand-voice evaluator + HITL gate, Netlify
              Blobs-backed real-data caching.
            </li>
            <li>
              Compliance / security reviewers wanting to see what an audit-grade AI workflow looks
              like in practice — every model call inspectable, every CRM write previewed as a JSON
              diff, every step replayable.
            </li>
            <li>
              Hiring managers and recruiters evaluating an applied-AI engineer (working demo &gt;
              deck).
            </li>
          </ul>
          <p style={{ marginTop: 12 }}>
            <strong>Industries where this pattern transfers.</strong> B2B SaaS revenue operations,
            employer-of-record / global-payroll, financial services compliance workflows, healthcare
            revenue cycle, regulated marketing in pharma / insurance — anywhere "autonomous +
            brand-safe + auditable" is the bar.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Generalizable architectural ideas worth borrowing.</strong>
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li>Server-side AI boundary so the browser never holds a key.</li>
            <li>
              Evaluator-gauged HITL gate (brand-voice fit, hallucination risk, ICP confidence) in
              front of every external write.
            </li>
            <li>Parallel sub-agent fan-out via SSE — total latency ≈ slowest single lens.</li>
            <li>
              Netlify Blobs as a cheap durable cache for expensive LLM calls, so the next visitor
              gets fresh-but-instant results.
            </li>
            <li>
              Deterministic-vs-model split: deterministic ICP scoring, RAG retrieval, and CRM diff;
              model-driven plan, draft, and critique. Each side is testable on its own terms.
            </li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <strong>What it is NOT.</strong> A concept demo. All data is real public-web evidence
            (cached + refreshable from GLM-5.1 + web_search) — no scraped private data, no
            proprietary G-P content, no real CRM mutations. Independent work, not affiliated with
            G-P.
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24 }}>Recommended walkthrough</h2>
      <ol style={{ paddingLeft: 0, marginTop: 12, listStyle: 'none' }}>
        {STEPS.map((s) => (
          <li
            key={s.n}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr',
              gap: 12,
              padding: '12px 0',
              borderTop: '1px solid var(--line)',
            }}
          >
            <span
              className="mono"
              style={{
                background: 'var(--navy)',
                color: '#fff',
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {s.n}
            </span>
            <div>
              <strong style={{ fontSize: 13 }}>{s.title}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-2)' }}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24 }}>Configuration cheatsheet</h2>
      <div className="card" style={{ marginTop: 8 }}>
        <div className="card__body">
          <p style={{ fontSize: 12, margin: 0 }}>
            All AI calls are server-side via Netlify Functions. Browser never holds a key.
          </p>
          <pre
            style={{
              fontFamily: 'var(--t-mono)',
              fontSize: 11.5,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              padding: '10px 12px',
              borderRadius: 4,
              marginTop: 10,
            }}
          >{`# Netlify env (production)
GLM_API_KEY        = <your z.ai key>      # required for live mode
GLM_MODEL          = glm-5.1              # optional override
GLM_USE_STANDARD_ENDPOINT = false         # default; coding endpoint enables web_search quota

# Endpoints exposed:
GET  /api/health           → mode + capabilities
POST /api/agent-run        → draft nurture + cited web search hits     (SSE)
POST /api/deep-research    → 4 parallel research subagents             (SSE)
POST /api/web-reader       → URL → structured page summary
POST /api/live-signals     → real, web-fetched buyer-intent signals    (SSE)
GET  /api/cached-signals   → last refreshed payload from Netlify Blobs (24h TTL)
POST /api/refresh-signals  → re-run live-signals + persist to blob     (SSE)
`}</pre>
        </div>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24 }}>Talk track shortcuts</h2>
      <ul style={{ paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
        <li>
          <strong>90 seconds:</strong> Signal stream → click Lumenscale → reasoning timeline → HITL
          gate with JSON diff.
        </li>
        <li>
          <strong>5 minutes:</strong> Add the Campaign Reallocator and the parallel Deep Research
          fan-out.
        </li>
        <li>
          <strong>15 minutes:</strong> Walk through <code>src/lib/agent-graph.ts</code>,{' '}
          <code>netlify/functions/deep-research.mjs</code>, threat model, tests.
        </li>
      </ul>
    </div>
  )
}
