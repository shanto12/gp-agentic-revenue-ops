import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Shell, type ScreenName } from './components/Shell'
import { SignalsScreen } from './components/SignalsScreen'
import { AgentRunScreen } from './components/AgentRunScreen'
import type {
  ParallelAgentRunState,
  ParallelSubagentSnapshot,
  ParallelVariantId,
} from './components/AgentRunScreen'
import { CampaignsScreen } from './components/CampaignsScreen'
import { ArchitectureScreen } from './components/ArchitectureScreen'
import { AuditScreen } from './components/AuditScreen'
import { KnowledgeScreen } from './components/KnowledgeScreen'
import { RunsScreen } from './components/RunsScreen'
import { DemoGuideScreen } from './components/DemoGuideScreen'
import type { ResearchResult } from './components/DeepResearchPanel'
import { Icon } from './components/Icon'
import { buildSyntheticRun } from './lib/agent-graph'
import type {
  AgentRun,
  AgentStatus,
  AuditEntry,
  Company,
  NurtureSequence,
  Signal,
} from './lib/types'
import { brandVoiceDoc } from './data/brand-voice'
import { retrieve } from './lib/rag'
import { companies as fixtureCompanies } from './data/companies'
import { signals as fixtureSignals } from './data/signals'

interface WebSearchHit {
  title: string
  link: string
  publishDate: string | null
  refer: string | null
  excerpt: string
}

interface LiveSignalsPayload {
  signals: Signal[]
  companies: Company[]
  capturedAt: string
}

type View = ScreenName | 'agent-run'

const PARALLEL_SUBAGENT_IDS = [
  'research-enricher',
  'draft-compliance',
  'draft-talent',
  'draft-speed',
] as const

function emptyParallelState(): ParallelAgentRunState {
  const subagents: Record<string, ParallelSubagentSnapshot> = {}
  for (const id of PARALLEL_SUBAGENT_IDS) {
    subagents[id] = { id, status: 'queued', latencyMs: null }
  }
  return {
    status: 'idle',
    subagents,
    consolidator: null,
    winner: null,
    drafts: { compliance: null, talent: null, speed: null },
    research: null,
    totalLatencyMs: null,
    totalUsage: null,
    webSearchHitCount: 0,
    error: null,
  }
}

export default function App() {
  const [view, setView] = useState<View>('signals')
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null)
  const [rowStatus, setRowStatus] = useState<Record<string, AgentStatus>>({
    'sig-001': 'awaiting_approval',
    'sig-002': 'running',
    'sig-005': 'approved',
    'sig-006': 'rejected',
  })
  const [paused, setPaused] = useState(false)
  const [liveModeAvailable, setLiveModeAvailable] = useState(false)
  const [parallel, setParallel] = useState<ParallelAgentRunState>(() => emptyParallelState())
  const [webSearchHits, setWebSearchHits] = useState<WebSearchHit[]>([])
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [extraAudit, setExtraAudit] = useState<AuditEntry[]>([])
  const [utc, setUtc] = useState(() => new Date().toISOString().slice(11, 19))
  // Quota counters — visible in the topbar so the user can see real GLM usage.
  const [glmCallCount, setGlmCallCount] = useState(0)
  const [webSearchTotal, setWebSearchTotal] = useState(0)
  // Real public-web data is the only display mode. Fixtures are kept ONLY as
  // a last-resort fallback if both /api/cached-signals and /api/refresh-signals
  // fail (e.g. GLM_API_KEY unset on the deployed env).
  const [liveSignals, setLiveSignals] = useState<Signal[] | null>(null)
  const [liveCompanies, setLiveCompanies] = useState<Company[] | null>(null)
  const [liveCapturedAt, setLiveCapturedAt] = useState<string | null>(null)
  const [liveSignalsLoading, setLiveSignalsLoading] = useState(false)
  const [liveSignalsProgress, setLiveSignalsProgress] = useState<string | null>(null)
  const [liveSignalsError, setLiveSignalsError] = useState<string | null>(null)
  const [usingFixtureFallback, setUsingFixtureFallback] = useState(false)

  const activeSignals: Signal[] = liveSignals ?? fixtureSignals
  const activeCompanies: Company[] = liveCompanies ?? fixtureCompanies
  const parallelAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const id = setInterval(() => setUtc(new Date().toISOString().slice(11, 19)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return
        setLiveModeAvailable(j.mode === 'live-glm')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const runParallelAgents = useCallback(
    async (sig: Signal) => {
      const company = activeCompanies.find((c) => c.id === sig.companyId)
      if (!company) return
      // Abort any in-flight parallel run for the previous signal.
      if (parallelAbortRef.current) parallelAbortRef.current.abort()
      const ac = new AbortController()
      parallelAbortRef.current = ac

      const fresh = emptyParallelState()
      fresh.status = 'streaming'
      // mark all four as running so the panel ticks immediately
      for (const id of PARALLEL_SUBAGENT_IDS) {
        fresh.subagents[id] = { id, status: 'running', latencyMs: null, startedAt: Date.now() }
      }
      setParallel(fresh)

      const ragHits = retrieve(
        `${sig.headline} ${sig.detail} ${company.industry} ${sig.countryFocus}`,
        { topK: 3 },
      ).map((h) => ({
        docId: h.doc.id,
        kind: h.doc.kind,
        title: h.doc.title,
        excerpt: h.excerpt,
      }))

      try {
        const res = await fetch('/api/agent-run', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            signal: sig,
            company,
            ragHits,
            brandVoiceMarkdown: brandVoiceDoc.bodyMarkdown,
            icpBand: 'high',
          }),
          signal: ac.signal,
        })
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `parallel run failed (${res.status})`)
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const handle = (event: string, data: unknown) => {
          if (event === 'start') {
            // 4 GLM calls planned + 1 consolidator (we count on landing).
          } else if (event === 'subagent') {
            const d = data as {
              id: string
              status: 'ok' | 'error'
              latencyMs: number
              payload?: unknown
              error?: string
              usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
              webSearchHitCount?: number
              webSearchHits?: WebSearchHit[]
            }
            setParallel((prev) => {
              const next: ParallelAgentRunState = {
                ...prev,
                subagents: {
                  ...prev.subagents,
                  [d.id]: {
                    id: d.id,
                    status: d.status,
                    latencyMs: d.latencyMs,
                    payload: d.payload,
                    error: d.error,
                    usage: d.usage ?? null,
                    webSearchHitCount: d.webSearchHitCount ?? 0,
                  },
                },
              }
              if (d.status === 'ok' && d.id === 'research-enricher') {
                next.research = (d.payload ?? null) as ParallelAgentRunState['research']
              }
              if (d.status === 'ok' && d.id.startsWith('draft-')) {
                const variant = d.id.replace('draft-', '') as ParallelVariantId
                next.drafts = {
                  ...next.drafts,
                  [variant]: (d.payload ?? null) as NurtureSequence | null,
                }
              }
              return next
            })
            setGlmCallCount((n) => n + 1)
            if (d.status === 'ok' && d.webSearchHits && d.webSearchHits.length) {
              setWebSearchHits((prev) => [...prev, ...d.webSearchHits!])
              setWebSearchTotal((n) => n + d.webSearchHits!.length)
            }
          } else if (event === 'consolidating') {
            setParallel((prev) => ({ ...prev, consolidator: { status: 'running' } }))
          } else if (event === 'consolidator') {
            const d = data as {
              winnerVariant: ParallelVariantId | null
              evaluatorScores: ParallelAgentRunState['evaluatorScores']
              rationale: string | null
              latencyMs: number
              error?: string
            }
            setParallel((prev) => ({
              ...prev,
              consolidator: {
                status: d.error ? 'error' : 'ok',
                latencyMs: d.latencyMs,
                rationale: d.rationale,
                evaluatorScores: d.evaluatorScores as ParallelAgentRunState['evaluatorScores'],
                error: d.error,
              },
              winner: d.winnerVariant,
              evaluatorScores: d.evaluatorScores as ParallelAgentRunState['evaluatorScores'],
            }))
            setGlmCallCount((n) => n + 1)
          } else if (event === 'result') {
            const d = data as {
              drafts: ParallelAgentRunState['drafts']
              research: ParallelAgentRunState['research']
              winner: {
                variant: ParallelVariantId
                draft: NurtureSequence | null
              } | null
              totalLatencyMs: number
              totalUsage: ParallelAgentRunState['totalUsage']
              webSearchHitCount: number
            }
            setParallel((prev) => ({
              ...prev,
              status: 'done',
              drafts: d.drafts,
              research: d.research,
              winner: d.winner?.variant ?? prev.winner,
              totalLatencyMs: d.totalLatencyMs,
              totalUsage: d.totalUsage,
              webSearchHitCount: d.webSearchHitCount,
            }))
            // Replace the deterministic draft step output with the winner.
            if (d.winner?.draft) {
              setCurrentRun((prevRun) => {
                if (!prevRun || prevRun.signalId !== sig.id) return prevRun
                const refreshed = buildSyntheticRun({
                  signal: sig,
                  modelMode: 'live-claude',
                  liveDraft: d.winner!.draft!,
                  companies: activeCompanies,
                })
                return refreshed
              })
            }
          } else if (event === 'error') {
            const d = data as { message?: string }
            setParallel((prev) => ({
              ...prev,
              status: 'error',
              error: d.message ?? 'unknown error',
            }))
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const messages = buffer.split('\n\n')
          buffer = messages.pop() ?? ''
          for (const msg of messages) {
            if (!msg.trim() || msg.startsWith(':')) continue
            const lines = msg.split('\n')
            let event = 'message'
            let dataStr = ''
            for (const line of lines) {
              if (line.startsWith('event: ')) event = line.slice(7).trim()
              else if (line.startsWith('data: ')) dataStr += line.slice(6)
            }
            if (!dataStr) continue
            let data: unknown
            try {
              data = JSON.parse(dataStr)
            } catch {
              continue
            }
            handle(event, data)
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'unknown error'
        setParallel((prev) => ({ ...prev, status: 'error', error: message }))
      }
    },
    [activeCompanies],
  )

  const onSelectSignal = useCallback(
    (sig: Signal) => {
      setSelectedSignal(sig)
      setWebSearchHits([])
      setResearchResult(null)
      setResearchError(null)
      setParallel(emptyParallelState())
      const run = buildSyntheticRun({
        signal: sig,
        modelMode: 'synthetic-deterministic',
        companies: activeCompanies,
      })
      setCurrentRun(run)
      setRowStatus((prev) => ({ ...prev, [sig.id]: run.status }))
      setView('agent-run')
      // Auto-fire the parallel run on signal click — the user does not need
      // to push a button. Skip in synthetic-only environments where there's
      // no GLM key on the server.
      if (liveModeAvailable) {
        void runParallelAgents(sig)
      }
    },
    [activeCompanies, liveModeAvailable, runParallelAgents],
  )

  const refreshSignals = useCallback(async () => {
    setLiveSignalsLoading(true)
    setLiveSignalsError(null)
    setLiveSignalsProgress('connecting…')
    try {
      const res = await fetch('/api/refresh-signals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `refresh-signals failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let payload: LiveSignalsPayload | null = null
      let errorMessage: string | null = null
      let eventsSeen = 0

      const processMessage = (msg: string) => {
        if (!msg.trim() || msg.startsWith(':')) return
        const lines = msg.split('\n')
        let event = 'message'
        let dataStr = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) event = line.slice(7).trim()
          else if (line.startsWith('data: ')) dataStr += line.slice(6)
        }
        if (!dataStr) return
        let data: unknown
        try {
          data = JSON.parse(dataStr)
        } catch (e) {
          console.warn('refresh-signals: JSON parse failed', { event, dataStr: dataStr.slice(0, 200), e })
          return
        }
        eventsSeen += 1
        if (event === 'progress') {
          const p = data as { phase: string; note: string }
          setLiveSignalsProgress(`${p.phase}: ${p.note}`)
        } else if (event === 'result') {
          const r = data as LiveSignalsPayload
          payload = r
        } else if (event === 'error') {
          const e = data as { message?: string }
          errorMessage = e.message ?? 'unknown error'
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''
        for (const msg of messages) processMessage(msg)
      }
      const tail = (buffer + decoder.decode()).trim()
      if (tail) {
        for (const msg of tail.split('\n\n')) processMessage(msg)
      }

      if (errorMessage) throw new Error(errorMessage)
      if (!payload) {
        console.warn('refresh-signals: no result event after', eventsSeen, 'events')
        throw new Error('no live signals returned')
      }
      const finalPayload = payload as LiveSignalsPayload
      if (finalPayload.signals.length === 0) {
        throw new Error('live signals returned empty list')
      }
      setLiveSignals(finalPayload.signals)
      setLiveCompanies(finalPayload.companies)
      setLiveCapturedAt(finalPayload.capturedAt)
      setUsingFixtureFallback(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      setLiveSignalsError(message)
      // Last-resort: if we have nothing live cached either, surface fixtures
      // with a banner so the demo still renders.
      setUsingFixtureFallback((prev) => prev || liveSignals === null)
      return false
    } finally {
      setLiveSignalsLoading(false)
      setLiveSignalsProgress(null)
    }
  }, [liveSignals])

  const onRefresh = useCallback(() => {
    if (liveSignalsLoading) return
    void refreshSignals()
  }, [liveSignalsLoading, refreshSignals])

  // First-load: try the cache, fall back to a one-shot refresh if stale/missing.
  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        const res = await fetch('/api/cached-signals', { method: 'GET' })
        if (cancelled) return
        if (res.ok) {
          const j = (await res.json()) as LiveSignalsPayload
          if (cancelled) return
          if (Array.isArray(j.signals) && j.signals.length > 0) {
            setLiveSignals(j.signals)
            setLiveCompanies(j.companies)
            setLiveCapturedAt(j.capturedAt)
            setUsingFixtureFallback(false)
            return
          }
        }
        // 404 / stale / empty — kick off a refresh.
        if (!cancelled) {
          const ok = await refreshSignals()
          if (!ok && !cancelled) setUsingFixtureFallback(true)
        }
      } catch {
        if (!cancelled) {
          const ok = await refreshSignals()
          if (!ok && !cancelled) setUsingFixtureFallback(true)
        }
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onApprove = useCallback(() => {
    if (!currentRun || !selectedSignal) return
    const ts = new Date().toISOString()
    setRowStatus((prev) => ({ ...prev, [selectedSignal.id]: 'approved' }))
    setCurrentRun({ ...currentRun, status: 'approved' })
    setExtraAudit((prev) => [
      {
        id: `aud-live-${ts}`,
        timestamp: ts,
        signalId: selectedSignal.id,
        action: 'agent_run.approved',
        step: 'hitl',
        evaluatorScore: currentRun.scores.brandVoiceFit,
        approver: 'candidate@example.invalid',
        status: 'ok',
      },
      ...prev,
    ])
  }, [currentRun, selectedSignal])

  const onReject = useCallback(() => {
    if (!currentRun || !selectedSignal) return
    const ts = new Date().toISOString()
    setRowStatus((prev) => ({ ...prev, [selectedSignal.id]: 'rejected' }))
    setCurrentRun({ ...currentRun, status: 'rejected' })
    setExtraAudit((prev) => [
      {
        id: `aud-live-${ts}`,
        timestamp: ts,
        signalId: selectedSignal.id,
        action: 'agent_run.rejected',
        step: 'hitl',
        approver: 'candidate@example.invalid',
        status: 'rejected',
      },
      ...prev,
    ])
  }, [currentRun, selectedSignal])

  const onRerunParallel = useCallback(() => {
    if (!selectedSignal) return
    void runParallelAgents(selectedSignal)
  }, [selectedSignal, runParallelAgents])

  const onRunResearch = useCallback(async () => {
    if (!selectedSignal) return
    const company = activeCompanies.find((c) => c.id === selectedSignal.companyId)
    if (!company) return
    setResearchLoading(true)
    setResearchError(null)
    setResearchResult(null)
    try {
      const res = await fetch('/api/deep-research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: { name: company.name, industry: company.industry },
          country: selectedSignal.countryFocus,
        }),
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `deep research failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const lensesByOrder: ResearchResult['lenses'] = []
      let result: ResearchResult = {
        totalLatencyMs: 0,
        lensCount: 4,
        successCount: 0,
        totalUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        lenses: [],
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''
        for (const msg of messages) {
          if (!msg.trim() || msg.startsWith(':')) continue
          const lines = msg.split('\n')
          let event = 'message'
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr += line.slice(6)
          }
          if (!dataStr) continue
          let data: unknown
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }
          if (event === 'start') {
            const startData = data as { lensCount: number }
            result = { ...result, lensCount: startData.lensCount }
            setResearchResult({ ...result })
          } else if (event === 'lens') {
            lensesByOrder.push(data as ResearchResult['lenses'][number])
            result = { ...result, lenses: [...lensesByOrder] }
            setResearchResult({ ...result })
          } else if (event === 'done') {
            const doneData = data as Pick<
              ResearchResult,
              'totalLatencyMs' | 'lensCount' | 'successCount' | 'totalUsage'
            >
            result = { ...result, ...doneData, lenses: lensesByOrder }
            setResearchResult({ ...result })
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      setResearchError(message)
    } finally {
      setResearchLoading(false)
    }
  }, [selectedSignal, activeCompanies])

  const breadcrumb = useMemo(() => {
    if (view === 'agent-run' && selectedSignal) {
      const company = activeCompanies.find((c) => c.id === selectedSignal.companyId)
      return (
        <>
          <span>Operations</span>
          <span className="sep">/</span>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setView('signals')}
            style={{ padding: '2px 6px' }}
          >
            Signals
          </button>
          <span className="sep">/</span>
          <b>Run · {company?.name}</b>
        </>
      )
    }
    const labelMap: Record<ScreenName, string> = {
      signals: 'Signals',
      runs: 'Agent Runs',
      campaigns: 'Campaigns',
      knowledge: 'Knowledge',
      arch: 'Architecture',
      audit: 'Audit Log',
      guide: 'Demo Guide',
    }
    const label = view === 'agent-run' ? 'Agent Run' : labelMap[view]
    return (
      <>
        <span>Operations</span>
        <span className="sep">/</span>
        <b>{label}</b>
      </>
    )
  }, [view, selectedSignal, activeCompanies])

  const rightExtras = (
    <>
      {view === 'signals' && (
        <button className="btn btn--sm" type="button" aria-label="Connector status">
          <Icon name="info" size={11} />
          <span style={{ fontSize: 11.5 }}>2 signals new</span>
        </button>
      )}
      <span
        className="tb__chip mono"
        title="Live GLM-5.1 calls and web_search hits captured this session"
        style={{ fontSize: 11.5 }}
      >
        <Icon name="sparkle" size={11} />
        GLM {glmCallCount} · web {webSearchTotal}
      </span>
    </>
  )

  return (
    <Shell
      active={view === 'agent-run' ? 'signals' : view}
      onNavigate={(s) => {
        setView(s)
      }}
      breadcrumb={breadcrumb}
      rightExtras={rightExtras}
      utc={utc}
    >
      {view === 'signals' && (
        <SignalsScreen
          paused={paused}
          onPauseToggle={() => setPaused((p) => !p)}
          onSelectSignal={onSelectSignal}
          rowStatus={rowStatus}
          signals={activeSignals}
          companies={activeCompanies}
          liveLoading={liveSignalsLoading}
          liveProgress={liveSignalsProgress}
          liveError={liveSignalsError}
          onRefresh={onRefresh}
          liveCapturedAt={liveCapturedAt}
          usingFixtureFallback={usingFixtureFallback}
        />
      )}
      {view === 'runs' && (
        <RunsScreen
          rowStatus={rowStatus}
          onSelectSignal={onSelectSignal}
          signals={activeSignals}
          companies={activeCompanies}
        />
      )}
      {view === 'campaigns' && <CampaignsScreen />}
      {view === 'knowledge' && <KnowledgeScreen />}
      {view === 'arch' && <ArchitectureScreen />}
      {view === 'audit' && <AuditScreen extraEntries={extraAudit} />}
      {view === 'guide' && <DemoGuideScreen />}
      {view === 'agent-run' &&
        currentRun &&
        selectedSignal &&
        (() => {
          const company = activeCompanies.find((c) => c.id === selectedSignal.companyId)
          if (!company) return null
          return (
            <AgentRunScreen
              run={currentRun}
              signal={selectedSignal}
              company={company}
              onApprove={onApprove}
              onReject={onReject}
              onBack={() => setView('signals')}
              liveModeAvailable={liveModeAvailable}
              onRerunParallel={onRerunParallel}
              parallel={parallel}
              webSearchHits={webSearchHits}
              researchAvailable={liveModeAvailable}
              onRunResearch={onRunResearch}
              researchLoading={researchLoading}
              researchError={researchError}
              researchResult={researchResult}
            />
          )
        })()}
    </Shell>
  )
}
