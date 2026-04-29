import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell, type ScreenName } from './components/Shell'
import { SignalsScreen } from './components/SignalsScreen'
import { AgentRunScreen } from './components/AgentRunScreen'
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
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [webSearchHits, setWebSearchHits] = useState<WebSearchHit[]>([])
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [extraAudit, setExtraAudit] = useState<AuditEntry[]>([])
  const [utc, setUtc] = useState(() => new Date().toISOString().slice(11, 19))
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

  const onSelectSignal = useCallback(
    (sig: Signal) => {
      setSelectedSignal(sig)
      setLiveError(null)
      setWebSearchHits([])
      setResearchResult(null)
      setResearchError(null)
      const run = buildSyntheticRun({
        signal: sig,
        modelMode: 'synthetic-deterministic',
        companies: activeCompanies,
      })
      setCurrentRun(run)
      setRowStatus((prev) => ({ ...prev, [sig.id]: run.status }))
      setView('agent-run')
    },
    [activeCompanies],
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

  const onRunLive = useCallback(async () => {
    if (!selectedSignal || !currentRun) return
    setLiveLoading(true)
    setLiveError(null)
    try {
      const company = activeCompanies.find((c) => c.id === selectedSignal.companyId)
      if (!company) throw new Error('company not found in active dataset')
      const ragHits = retrieve(
        `${selectedSignal.headline} ${selectedSignal.detail} ${company.industry} ${selectedSignal.countryFocus}`,
        { topK: 3 },
      ).map((h) => ({
        docId: h.doc.id,
        kind: h.doc.kind,
        title: h.doc.title,
        excerpt: h.excerpt,
      }))
      const res = await fetch('/api/agent-run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          signal: selectedSignal,
          company,
          ragHits,
          brandVoiceMarkdown: brandVoiceDoc.bodyMarkdown,
          icpBand: 'high',
        }),
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `live mode failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let resolvedDraft: NurtureSequence | null = null
      let resolvedHits: WebSearchHit[] = []
      let resolvedError: string | null = null

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
          if (event === 'result') {
            const r = data as {
              draft: NurtureSequence
              webSearchHits?: WebSearchHit[]
            }
            resolvedDraft = r.draft
            resolvedHits = r.webSearchHits ?? []
          } else if (event === 'error') {
            const e = data as { message?: string }
            resolvedError = e.message ?? 'unknown error'
          }
        }
      }

      if (resolvedError) throw new Error(resolvedError)
      if (!resolvedDraft) throw new Error('no draft returned')

      const refreshed = buildSyntheticRun({
        signal: selectedSignal,
        modelMode: 'live-claude',
        liveDraft: resolvedDraft,
        companies: activeCompanies,
      })
      setCurrentRun(refreshed)
      setWebSearchHits(resolvedHits)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error'
      setLiveError(message)
    } finally {
      setLiveLoading(false)
    }
  }, [selectedSignal, currentRun, activeCompanies])

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

  const rightExtras = view === 'signals' && (
    <button className="btn btn--sm" type="button" aria-label="Connector status">
      <Icon name="info" size={11} />
      <span style={{ fontSize: 11.5 }}>2 signals new</span>
    </button>
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
              onRunLive={onRunLive}
              liveError={liveError}
              liveLoading={liveLoading}
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
