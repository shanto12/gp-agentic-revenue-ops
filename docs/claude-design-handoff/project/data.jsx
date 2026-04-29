// Synthetic data for the workbench. All data is fictional.

const COMPANIES = [
  { name: "Lumenscale Robotics", domain: "lumenscale.io", country: "DE", flag: "🇩🇪", emp: 412, industry: "Industrial Automation" },
  { name: "Northsail Maritime", domain: "northsail.no", country: "NO", flag: "🇳🇴", emp: 1180, industry: "Logistics" },
  { name: "Verdantia Foods", domain: "verdantia.es", country: "ES", flag: "🇪🇸", emp: 760, industry: "Food & Beverage" },
  { name: "Helix Diagnostics", domain: "helixdx.com", country: "US", flag: "🇺🇸", emp: 240, industry: "Medical Devices" },
  { name: "Cinder & Steel Apparel", domain: "cinderandsteel.co.uk", country: "GB", flag: "🇬🇧", emp: 95, industry: "Apparel" },
  { name: "Krasnaya Kova Steel", domain: "krasnaya.cz", country: "CZ", flag: "🇨🇿", emp: 2100, industry: "Materials" },
  { name: "Pampas Telematics", domain: "pampas.ar", country: "AR", flag: "🇦🇷", emp: 88, industry: "Fleet IoT" },
  { name: "Tatami Systems", domain: "tatami.co.jp", country: "JP", flag: "🇯🇵", emp: 540, industry: "Robotics" },
  { name: "Kongsberg Photonics", domain: "kphotonics.no", country: "NO", flag: "🇳🇴", emp: 130, industry: "Optics" },
  { name: "Solenne Biosciences", domain: "solenne.fr", country: "FR", flag: "🇫🇷", emp: 320, industry: "Biotech" },
  { name: "Ardent Grid Energy", domain: "ardentgrid.ca", country: "CA", flag: "🇨🇦", emp: 680, industry: "Energy" },
  { name: "Halcyon Aviation", domain: "halcyon.ie", country: "IE", flag: "🇮🇪", emp: 210, industry: "Aviation" },
  { name: "Mistral & Loom", domain: "mistralloom.it", country: "IT", flag: "🇮🇹", emp: 78, industry: "Textiles" },
  { name: "Quartz Hollow Games", domain: "quartzhollow.se", country: "SE", flag: "🇸🇪", emp: 45, industry: "Games" },
  { name: "Fjordlight Renewables", domain: "fjordlight.dk", country: "DK", flag: "🇩🇰", emp: 510, industry: "Energy" },
];

const SIGNAL_TYPES = [
  { code: "HIRING", label: "Hiring", desc: (c) => `Posted ${rand(3, 28)} eng/GTM roles in last 14 days; ${rand(2,6)} are Director+ in EMEA.` },
  { code: "FUNDING", label: "Funding", desc: (c) => `Series ${pick(["B","C","D"])} closed at $${rand(20,180)}M led by ${pick(["Atomico","Index","Accel","Iconiq","Bessemer"])}.` },
  { code: "EXPANSION", label: "Expansion", desc: (c) => `Filed for new entity in ${pick(["Singapore","Brazil","Poland","UAE","Mexico"])}; LinkedIn shows ${rand(4,12)} country-specific roles.` },
  { code: "EXEC-HIRE", label: "Exec hire", desc: (c) => `New ${pick(["VP People","CRO","CFO","Head of International","COO"])} (ex-${pick(["Workday","Stripe","Datadog","Snowflake","Asana"])}) joined ${rand(5,40)}d ago.` },
];

const STATUSES = ["queued", "running", "awaiting", "approved", "rejected"];

function rand(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmtTimeAgo(seconds) {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
  return `${Math.floor(seconds/3600)}h ago`;
}
function fmtClock(d) {
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  return `${h}:${m}:${s}`;
}

function makeSignal(i, ageSec) {
  const co = COMPANIES[i % COMPANIES.length];
  const type = SIGNAL_TYPES[i % SIGNAL_TYPES.length];
  const score = (() => {
    const base = type.code === "EXPANSION" ? 80 : type.code === "EXEC-HIRE" ? 74 : type.code === "FUNDING" ? 68 : 62;
    return Math.max(28, Math.min(96, base + rand(-18, 18)));
  })();
  const status = (() => {
    if (i < 2) return "running";
    if (i < 4) return "awaiting";
    if (i % 7 === 0) return "queued";
    if (i % 11 === 0) return "rejected";
    if (score >= 80) return "approved";
    return pick(["approved", "running", "awaiting", "queued"]);
  })();
  return {
    id: `sig_${String(10421 + i).padStart(5,'0')}`,
    company: co.name,
    domain: co.domain,
    country: co.country,
    flag: co.flag,
    industry: co.industry,
    employees: co.emp,
    type: type.code,
    typeLabel: type.label,
    description: type.desc(co),
    score,
    status,
    ts: ageSec,
    source: pick(["LinkedIn JobPost", "PitchBook", "OpenCorporates", "Crunchbase", "GovFiling-DE", "GovFiling-NO", "ICP-Watcher"]),
  };
}

// Pre-generate a feed
const SIGNAL_FEED = Array.from({ length: 22 }, (_, i) => makeSignal(i, (i+1) * rand(45, 240)));

// Hero signal for Run screen
const HERO_SIGNAL = {
  id: "sig_10428",
  company: "Lumenscale Robotics",
  domain: "lumenscale.io",
  country: "DE",
  flag: "🇩🇪",
  industry: "Industrial Automation",
  employees: 412,
  type: "EXPANSION",
  typeLabel: "Expansion",
  description: "Filed Aktiengesellschaft amendment with HR Munich registering UK and Singapore subsidiaries. Concurrent LinkedIn shows 7 country-specific roles posted in 9 days.",
  source: "GovFiling-DE • Handelsregister B 213887",
  sourceUrl: "https://www.handelsregister.de/rp_web/mask.do?Typ=n",
  triggeredAt: "2026-04-28T09:14:22Z",
  payload: {
    signal_id: "sig_10428",
    detected_at: "2026-04-28T09:14:22Z",
    source: "handelsregister.de",
    entity: { name: "Lumenscale Robotics GmbH", hrb: "HRB 213887", jurisdiction: "DE-BY" },
    delta: {
      type: "subsidiary_registration",
      filings: [
        { jurisdiction: "GB", entity: "Lumenscale Robotics UK Ltd", filed: "2026-04-21" },
        { jurisdiction: "SG", entity: "Lumenscale Robotics Pte. Ltd.", filed: "2026-04-25" }
      ]
    },
    corroboration: [
      { source: "linkedin", roles_posted_14d: 7, geo: ["GB-LON","SG"] },
      { source: "press", url: "redacted", confidence: 0.71 }
    ]
  }
};

const RUN_STEPS = [
  {
    name: "Plan",
    model: "sonnet",
    latency: 412,
    tokens: 1820,
    status: "done",
    input: { task: "evaluate_signal", signal_id: "sig_10428", icp: "EOR-Mid-EMEA-v3" },
    output: {
      plan: [
        "enrich firmographic via Clearbit + OpenCorporates",
        "score against ICP EOR-Mid-EMEA-v3",
        "if score >= 70: retrieve brand-voice + battlecard",
        "draft 3-step nurture sequence",
        "evaluator: hallucination + brand drift gate",
        "route to HITL"
      ],
      stop_conditions: ["score<55", "hallucination_risk>0.25"]
    }
  },
  {
    name: "Enrich",
    model: "gpt",
    latency: 318,
    tokens: 740,
    status: "done",
    input: { domain: "lumenscale.io" },
    output: {
      legal_name: "Lumenscale Robotics GmbH",
      hq: "München, DE",
      employees: 412,
      hc_growth_90d: 0.18,
      tech_stack: ["Salesforce", "Workday", "AWS Frankfurt"],
      revenue_band: "€80–120M",
      ownership: "private",
      pe_backed: false
    }
  },
  {
    name: "ICP Score",
    model: "gpt",
    latency: 144,
    tokens: 220,
    status: "done",
    input: { profile: "EOR-Mid-EMEA-v3" },
    output: {
      score: 87,
      breakdown: {
        geo_fit: 0.96,
        size_fit: 0.84,
        intent_fit: 0.92,
        legal_complexity: 0.78,
        budget_fit: 0.72
      },
      tier: "A"
    }
  },
  {
    name: "RAG Retrieval",
    model: "sonnet",
    latency: 612,
    tokens: 3140,
    status: "done",
    input: { queries: ["brand voice EMEA mid-market", "EOR battlecard vs in-house entity", "Germany→UK→SG hiring compliance"] },
    output: {
      retrieved: [
        { doc: "brand-voice-v4.md", chunks: 6, top_score: 0.91 },
        { doc: "battlecard-eor-vs-entity.md", chunks: 4, top_score: 0.88 },
        { doc: "icp-eor-mid-emea-v3.md", chunks: 3, top_score: 0.95 },
        { doc: "case-study-northsail.md", chunks: 2, top_score: 0.74 }
      ],
      total_tokens_retrieved: 2940
    }
  },
  {
    name: "Draft Nurture",
    model: "sonnet",
    latency: 1840,
    tokens: 4120,
    status: "done",
    input: { sequence: "3-step", channel: "email", persona: "VP People — DACH" },
    output: {
      sequence: [
        { step: 1, day: 0, subject: "Spinning up UK + SG in the same quarter", preview: "Two filings in nine days is a tight runway — most of our DACH customers hit a wall here…" },
        { step: 2, day: 4, subject: "What Northsail learned standing up Singapore in 19 days", preview: "Their People team inherited 11 employment contracts on day one…" },
        { step: 3, day: 9, subject: "30-min: UK + SG without standing up entities", preview: "Worth a half-hour if your H2 plan still has both as line items." }
      ],
      avg_grade: "9.4 (Hemingway)",
      tone_match: 0.92
    }
  },
  {
    name: "Critique",
    model: "sonnet",
    latency: 1110,
    tokens: 2280,
    status: "active",
    input: { evaluator: "brand-voice + hallucination + ICP-fit" },
    output: {
      brand_voice_fit: 88,
      hallucination_risk: 12,
      icp_confidence: 91,
      flags: [
        { severity: "low", field: "step1.preview", note: "phrase 'tight runway' borderline; brand-voice-v4 prefers concrete time references" }
      ],
      verdict: "ship_with_minor_edits"
    }
  },
  {
    name: "HITL Approval",
    model: null,
    latency: null,
    tokens: null,
    status: "pending",
    input: null,
    output: null
  },
  {
    name: "CRM Writeback",
    model: null,
    latency: null,
    tokens: null,
    status: "blocked",
    input: null,
    output: null
  }
];

const CRM_DIFF = [
  { kind: "ctx", text: '{' },
  { kind: "ctx", text: '  "account_id": "0014x00001Pq8Lz",' },
  { kind: "ctx", text: '  "name": "Lumenscale Robotics GmbH",' },
  { kind: "del",  text: '  "lifecycle_stage": "marketing_qualified",' },
  { kind: "add",  text: '  "lifecycle_stage": "sales_accepted",' },
  { kind: "del",  text: '  "icp_tier": "B",' },
  { kind: "add",  text: '  "icp_tier": "A",' },
  { kind: "del",  text: '  "intent_score": 64,' },
  { kind: "add",  text: '  "intent_score": 87,' },
  { kind: "ctx", text: '  "owner": "rsteele@workspace.example",' },
  { kind: "add",  text: '  "next_touch": "2026-04-28T15:00:00Z",' },
  { kind: "add",  text: '  "sequence_id": "seq_eor_dach_uk_sg_v3",' },
  { kind: "add",  text: '  "agent_run_id": "run_2c81f4a9",' },
  { kind: "ctx", text: '}' }
];

const CAMPAIGNS = [
  {
    id: "search-eor-emea",
    name: "Search — EOR EMEA",
    channel: "Google Search",
    spend: 18420,
    spendPrev: 17900,
    leads: 142,
    cpl: 129.72,
    cplPrev: 158.10,
    roi: 3.4,
    sparkline: [22, 25, 21, 28, 30, 27, 33, 31, 36, 38, 41, 42, 45, 43],
    status: "ok"
  },
  {
    id: "li-cro-people",
    name: "LinkedIn — VP People DACH",
    channel: "LinkedIn",
    spend: 12180,
    spendPrev: 12300,
    leads: 38,
    cpl: 320.52,
    cplPrev: 412.01,
    roi: 1.9,
    sparkline: [12, 11, 14, 12, 13, 12, 11, 13, 14, 15, 13, 12, 14, 15],
    status: "warn"
  },
  {
    id: "email-nurture",
    name: "Email Nurture — Expansion Trigger",
    channel: "Email",
    spend: 4260,
    spendPrev: 5200,
    leads: 88,
    cpl: 48.40,
    cplPrev: 71.20,
    roi: 5.8,
    sparkline: [18, 20, 22, 21, 24, 26, 28, 27, 29, 31, 33, 35, 37, 38],
    status: "ok"
  },
];

const AUDIT_ROWS = [
  { ts: "2026-04-28 09:14:42", target: "sig_10428 · Lumenscale Robotics", action: "agent.run.start", step: "Plan", model: "Sonnet 4.6", tokens: 1820, latency: 412, eval: "—", approver: "agent", status: "running" },
  { ts: "2026-04-28 09:14:48", target: "sig_10428 · Lumenscale Robotics", action: "enrich.complete", step: "Enrich", model: "GPT-4o", tokens: 740, latency: 318, eval: "—", approver: "agent", status: "approved" },
  { ts: "2026-04-28 09:14:50", target: "sig_10428 · Lumenscale Robotics", action: "icp.score", step: "ICP Score", model: "GPT-4o", tokens: 220, latency: 144, eval: "87", approver: "agent", status: "approved" },
  { ts: "2026-04-28 09:14:55", target: "sig_10428 · Lumenscale Robotics", action: "rag.retrieve", step: "RAG", model: "Sonnet 4.6", tokens: 3140, latency: 612, eval: "—", approver: "agent", status: "approved" },
  { ts: "2026-04-28 09:15:02", target: "sig_10428 · Lumenscale Robotics", action: "draft.nurture", step: "Draft", model: "Sonnet 4.6", tokens: 4120, latency: 1840, eval: "tone 0.92", approver: "agent", status: "approved" },
  { ts: "2026-04-28 09:15:05", target: "sig_10428 · Lumenscale Robotics", action: "evaluator.critique", step: "Critique", model: "Sonnet 4.6", tokens: 2280, latency: 1110, eval: "voice 88 / halluc 12", approver: "agent", status: "awaiting" },
  { ts: "2026-04-28 09:11:18", target: "sig_10427 · Verdantia Foods", action: "writeback.crm", step: "Writeback", model: "—", tokens: 0, latency: 92, eval: "—", approver: "rsteele", status: "approved" },
  { ts: "2026-04-28 09:09:44", target: "sig_10426 · Pampas Telematics", action: "writeback.crm", step: "Writeback", model: "—", tokens: 0, latency: 88, eval: "—", approver: "rsteele", status: "approved" },
  { ts: "2026-04-28 09:08:02", target: "sig_10425 · Quartz Hollow Games", action: "agent.reject", step: "Critique", model: "Sonnet 4.6", tokens: 1740, latency: 920, eval: "halluc 31", approver: "agent", status: "rejected" },
  { ts: "2026-04-28 09:06:29", target: "camp_li-cro-people", action: "campaign.flag.creative", step: "Brand-voice", model: "Sonnet 4.6", tokens: 880, latency: 540, eval: "voice 71", approver: "agent", status: "awaiting" },
  { ts: "2026-04-28 09:04:11", target: "sig_10424 · Halcyon Aviation", action: "writeback.crm", step: "Writeback", model: "—", tokens: 0, latency: 110, eval: "—", approver: "kparkins", status: "approved" },
  { ts: "2026-04-28 09:01:55", target: "camp_search-eor-emea", action: "budget.reallocate.proposed", step: "Plan", model: "Sonnet 4.6", tokens: 2210, latency: 980, eval: "—", approver: "agent", status: "awaiting" },
  { ts: "2026-04-28 08:58:30", target: "sig_10423 · Mistral & Loom", action: "icp.below_threshold", step: "ICP Score", model: "GPT-4o", tokens: 200, latency: 121, eval: "41", approver: "agent", status: "rejected" },
  { ts: "2026-04-28 08:55:12", target: "sig_10422 · Tatami Systems", action: "writeback.crm", step: "Writeback", model: "—", tokens: 0, latency: 95, eval: "—", approver: "rsteele", status: "approved" },
  { ts: "2026-04-28 08:51:09", target: "sig_10421 · Helix Diagnostics", action: "agent.run.start", step: "Plan", model: "Sonnet 4.6", tokens: 1640, latency: 405, eval: "—", approver: "agent", status: "approved" },
];

window.WB_DATA = { COMPANIES, SIGNAL_TYPES, SIGNAL_FEED, HERO_SIGNAL, RUN_STEPS, CRM_DIFF, CAMPAIGNS, AUDIT_ROWS, fmtTimeAgo, fmtClock, rand, pick, makeSignal };
