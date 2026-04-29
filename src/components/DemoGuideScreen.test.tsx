import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DemoGuideScreen } from './DemoGuideScreen'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(
        JSON.stringify({
          mode: 'live-glm',
          provider: 'z.ai-glm',
          model: 'glm-5.1',
          endpoint: 'https://api.z.ai/api/coding/paas/v4',
          capabilities: {
            agent_run: true,
            deep_research: true,
            web_reader: true,
            web_search_grounding: true,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DemoGuideScreen', () => {
  it('renders the walkthrough steps', () => {
    render(<DemoGuideScreen />)
    expect(
      screen.getByRole('heading', { name: /Demo Guide/i, level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Open Signals/i)).toBeInTheDocument()
    expect(screen.getByText(/Fan out a deep research run/i)).toBeInTheDocument()
  })

  it('reflects live system status from /api/health', async () => {
    render(<DemoGuideScreen />)
    await waitFor(() => {
      expect(screen.getByText(/live · z\.ai-glm/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText(/glm-5\.1/).length).toBeGreaterThan(0)
  })
})
