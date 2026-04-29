import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/api/health')) {
        return new Response(JSON.stringify({ mode: 'synthetic-deterministic' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'not implemented' }), { status: 503 })
    }),
  )
})

describe('App shell', () => {
  it('renders the Signals landing screen with metrics', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Signals/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Buyer-intent stream/i)).toBeInTheDocument()
    expect(screen.getByText('Signals / hr')).toBeInTheDocument()
    expect(screen.getByText('Approval queue')).toBeInTheDocument()
  })

  it('shows the disclaimer footer on every screen', () => {
    render(<App />)
    expect(
      screen.getByText(/Independent concept demo. Not affiliated with or endorsed by/i),
    ).toBeInTheDocument()
  })

  it('navigates to Architecture and back to Signals', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Architecture/i }))
    expect(
      screen.getByRole('heading', { name: 'Architecture', level: 1 }),
    ).toBeInTheDocument()
    const navButtons = screen
      .getAllByRole('button')
      .filter((b) => /^Signals\s*\d/.test(b.textContent ?? ''))
    expect(navButtons.length).toBeGreaterThan(0)
    fireEvent.click(navButtons[0]!)
    expect(
      screen.getByRole('heading', { name: /^Signals\b/, level: 1 }),
    ).toBeInTheDocument()
  })

  it('opens an agent run and shows the HITL gate with a CRM diff', () => {
    render(<App />)
    const firstRow = screen.getAllByRole('row').find((r) =>
      r.getAttribute('aria-label')?.startsWith('Open agent run for'),
    )
    expect(firstRow).toBeTruthy()
    fireEvent.click(firstRow!)
    expect(screen.getByText('HITL Gate')).toBeInTheDocument()
    expect(screen.getByText('Proposed CRM write-back')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Approve & queue write-back/i }),
    ).toBeInTheDocument()
  })

  it('exposes a Refresh button that re-pulls live signals on the Signals screen', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: /Refresh live signals from the public web/i }),
    ).toBeInTheDocument()
  })
})
