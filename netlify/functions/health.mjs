export default async () => {
  const glmKey = Boolean(process.env.GLM_API_KEY)
  const mode = glmKey ? 'live-glm' : 'synthetic-deterministic'
  const provider = glmKey ? 'z.ai-glm' : 'none'
  const model = process.env.GLM_MODEL ?? 'glm-5.1'
  const usingCodingEndpoint = process.env.GLM_USE_STANDARD_ENDPOINT !== 'true'
  const body = {
    service: 'gp-agentic-revenue-ops',
    status: 'ok',
    mode,
    provider,
    model,
    endpoint: usingCodingEndpoint
      ? 'https://api.z.ai/api/coding/paas/v4'
      : 'https://api.z.ai/api/paas/v4',
    dataPolicy: 'synthetic-only',
    generatedAt: new Date().toISOString(),
    capabilities: {
      agent_run: glmKey,
      deep_research: glmKey,
      web_reader: glmKey,
      web_search_grounding: glmKey,
      live_signals: glmKey,
      cached_signals: glmKey,
    },
    checks: [
      { name: 'static_assets', status: 'ok' },
      { name: 'synthetic_data', status: 'ok' },
      { name: 'glm_api_key', status: glmKey ? 'configured' : 'absent' },
      {
        name: 'ai_gateway',
        status: glmKey ? 'live' : 'absent_degraded_mode_ok',
      },
    ],
  }

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
