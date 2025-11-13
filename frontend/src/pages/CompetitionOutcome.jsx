import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://devlab-backend-production-0bcb.up.railway.app/api' : 'http://localhost:3001/api')

function CompetitionOutcome() {
  const { competitionId, learnerId } = useParams()
  const navigate = useNavigate()
  const [outcome, setOutcome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadOutcome = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_BASE_URL}/competitions/${competitionId}/outcome/${learnerId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            credentials: 'include'
          }
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.message || 'Unable to load competition outcome.')
        }

        const payload = await response.json()
        setOutcome(payload)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unexpected error while loading outcome.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadOutcome()

    return () => controller.abort()
  }, [competitionId, learnerId])

  const headline = useMemo(() => {
    if (!outcome?.winnerMessage) {
      return 'Competition Summary'
    }

    if (outcome.winnerMessage.includes('Congratulations')) {
      return 'You did it!'
    }

    if (outcome.winnerMessage.includes('tie')) {
      return 'What a Battle!'
    }

    return 'Keep Pushing Forward'
  }, [outcome?.winnerMessage])

  const handleNavigate = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-900/30 p-10 shadow-2xl shadow-emerald-500/10 space-y-8">
          <header className="space-y-3">
            <p className="text-emerald-400/80 text-xs uppercase tracking-[0.3em]">
              Competition Outcome
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{headline}</h1>
            <p className="text-sm text-slate-400">
              Competition ID: <span className="text-white/80 font-mono">{competitionId}</span>
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400/80 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
              <h2 className="text-lg font-semibold text-rose-200">Something went wrong</h2>
              <p className="text-sm text-rose-100/80">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
                  Your Score
                </p>
                <p className="text-5xl font-black text-white drop-shadow-[0_15px_45px_rgba(16,185,129,0.2)]">
                  {outcome?.learnerScore ?? 0}
                </p>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {outcome?.winnerMessage || 'Great effort on finishing this competition.'}
                </p>
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNavigate}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Back to Dashboard
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompetitionOutcome


