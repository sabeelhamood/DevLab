import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'
import { useAuthStore } from '../../store/authStore.js'

const DEFAULT_FORCED_LEARNER_ID = '550e8400-e29b-41d4-a716-446655440000'
const QUESTIONS_PER_COMPETITION = 3
const QUESTION_TIMER_SECONDS = 10 * 60 // 10 minutes per question
const TOTAL_COMPETITION_SECONDS = QUESTION_TIMER_SECONDS * QUESTIONS_PER_COMPETITION // 30 minutes total
const TOTAL_COMPETITION_MINUTES = TOTAL_COMPETITION_SECONDS / 60

const calculateRemainingSeconds = (expiresAt, fallbackSeconds = QUESTION_TIMER_SECONDS) => {
  if (expiresAt) {
    const diff = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)
    return diff > 0 ? diff : 0
  }
  return fallbackSeconds
}

export default function CompetitionPlay() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const forcedLearnerId =
    import.meta.env.VITE_FORCE_LEARNER_ID || DEFAULT_FORCED_LEARNER_ID
  const learnerId = user?.id || forcedLearnerId || null

  const [competition, setCompetition] = useState(location.state?.competition || null)
  const [session, setSession] = useState(location.state?.session || null)
  const [loadingSession, setLoadingSession] = useState(!location.state?.session)
  const [error, setError] = useState(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answerSubmitting, setAnswerSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(null)

  const startAttemptedRef = useRef(Boolean(location.state?.session))
  const autoSubmitRef = useRef(false)

  useEffect(() => {
    if (competition || !learnerId || !competitionId) {
      return
    }

    let isMounted = true

    ;(async () => {
      try {
        const pending = await competitionsAIAPI.getPendingCompetitions(learnerId)
        if (!isMounted) {
          return
        }
        const found = pending.find((item) => item.competition_id === competitionId)
        setCompetition(found || null)
      } catch (fetchError) {
        console.error('[CompetitionPlay] Failed to load competition:', fetchError)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [competition, learnerId, competitionId])

  const fetchSession = useCallback(async () => {
    if (!competitionId || startAttemptedRef.current) {
      return
    }

    startAttemptedRef.current = true
    setLoadingSession(true)
    setError(null)

    try {
      const response = await competitionsAIAPI.startCompetition(competitionId)
      const sessionPayload = response?.session || response
      if (!sessionPayload) {
        throw new Error('Invalid competition session response.')
      }
      setSession(sessionPayload)
    } catch (fetchError) {
      console.error('[CompetitionPlay] Failed to start competition:', fetchError)
      const message =
        fetchError?.response?.data?.error || fetchError.message || 'Unable to start competition.'
      setError(message)
      startAttemptedRef.current = false
    } finally {
      setLoadingSession(false)
    }
  }, [competitionId])

  useEffect(() => {
    if (!session && competitionId) {
      fetchSession()
    }
  }, [session, competitionId, fetchSession])

  const handleRetryStart = useCallback(() => {
    startAttemptedRef.current = false
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!session || session.completed) {
      setRemainingSeconds(null)
      autoSubmitRef.current = false
      return
    }

    const seconds = calculateRemainingSeconds(session.expires_at, session.timer_seconds)
    setRemainingSeconds(seconds)

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev === null ? seconds : prev - 1
        return next > 0 ? next : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [session?.competition_id, session?.question?.question_id, session?.expires_at, session?.completed, session?.timer_seconds])

  useEffect(() => {
    setCurrentAnswer('')
    autoSubmitRef.current = false
  }, [session?.question?.question_id])

  const handleSubmitAnswer = useCallback(
    async (isTimeout = false) => {
      if (!session || session.completed || !session.question) {
        return
      }

      if (!isTimeout && !currentAnswer.trim()) {
        return
      }

      setAnswerSubmitting(true)
      setError(null)

      try {
        const payload = {
          question_id: session.question.question_id,
          answer: isTimeout ? '' : currentAnswer.trim()
        }
        const response = await competitionsAIAPI.submitAnswer(competitionId, payload)
        const updatedSession = response?.session || response
        if (!updatedSession) {
          throw new Error('Invalid competition session response.')
        }
        setSession(updatedSession)
        setCurrentAnswer('')
      } catch (submitError) {
        console.error('[CompetitionPlay] Failed to submit answer:', submitError)
        const message =
          submitError?.response?.data?.error ||
          submitError.message ||
          'Unable to submit answer. Please try again.'
        setError(message)
      } finally {
        setAnswerSubmitting(false)
        autoSubmitRef.current = false
      }
    },
    [session, currentAnswer, competitionId]
  )

  useEffect(() => {
    if (!session || session.completed) {
      autoSubmitRef.current = false
      return
    }

    if (remainingSeconds === 0 && !autoSubmitRef.current && session.question) {
      autoSubmitRef.current = true
      handleSubmitAnswer(true)
    }
  }, [remainingSeconds, session, handleSubmitAnswer])

  const handleCompleteCompetition = async () => {
    if (!session || session.completed) {
      return
    }

    setCompleting(true)
    setError(null)
    try {
      const response = await competitionsAIAPI.completeCompetition(competitionId)
      const updatedSession = response?.session || response
      setSession(updatedSession)
    } catch (completeError) {
      console.error('[CompetitionPlay] Failed to complete competition:', completeError)
      const message =
        completeError?.response?.data?.error ||
        completeError.message ||
        'Unable to finalize competition.'
      setError(message)
    } finally {
      setCompleting(false)
    }
  }

  const renderActiveQuestion = () => {
    if (!session || session.completed) {
      return null
    }

    if (!session.question) {
      return (
        <p className="text-center text-white/70">
          Preparing your next challenge…
        </p>
      )
    }

    const questionPosition = session.questionIndex || 1
    const totalQuestions = session.totalQuestions || QUESTIONS_PER_COMPETITION
    const perQuestionTimer = session.timer_seconds || QUESTION_TIMER_SECONDS

    const questionProgress =
      totalQuestions > 0 ? ((questionPosition - 1) / totalQuestions) * 100 : 0
    const timerPercent = Math.max(
      0,
      Math.min(
        100,
        ((remainingSeconds ?? perQuestionTimer) / perQuestionTimer) * 100
      )
    )
    const questionsRemainingAfterThis = Math.max(totalQuestions - questionPosition, 0)
    const totalRemainingSeconds =
      questionsRemainingAfterThis * perQuestionTimer + (remainingSeconds ?? perQuestionTimer)
    const totalTimerPercent = Math.max(
      0,
      Math.min(
        100,
        (totalRemainingSeconds / (perQuestionTimer * totalQuestions)) * 100
      )
    )

    return (
      <>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white/5 rounded-2xl p-5 shadow-inner shadow-white/5 min-h-[200px]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Current Challenge</p>
              <p className="mt-3 text-lg leading-relaxed whitespace-pre-line">
                {session.question.question}
              </p>
            </div>
            <textarea
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/60"
              rows={6}
              placeholder="Describe your reasoning like a human competitor…"
              value={currentAnswer}
              onChange={(event) => setCurrentAnswer(event.target.value)}
            />
          </div>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-32 h-32">
              <div
                className="absolute inset-0 rounded-full opacity-80"
                style={{
                  background: `conic-gradient(#d8b4fe ${timerPercent}%, rgba(255,255,255,0.15) ${timerPercent}% 100%)`
                }}
              />
              <div className="absolute inset-2 bg-gray-900 rounded-full flex flex-col items-center justify-center shadow-lg shadow-black/40">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                  Timer
                </span>
                <span className="text-3xl font-bold">
                  {remainingSeconds === null ? '--:--' : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`}
                </span>
                <span className="text-[10px] text-white/50 mt-1">{Math.floor(perQuestionTimer / 60)} min limit</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Progress</p>
              <p className="text-3xl font-semibold">
                {questionPosition} / {totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white via-white to-transparent transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, questionProgress))}%` }}
            />
          </div>
          <p className="text-xs text-white/70 text-right">
            No skipping — the next challenge appears when this timer expires or you submit.
          </p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-300 via-white to-transparent transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, totalTimerPercent))}%` }}
            />
          </div>
          <p className="text-[11px] text-white/60 text-right">
            Total competition time remaining: {Math.max(0, Math.floor(totalRemainingSeconds / 60))}m {Math.max(0, totalRemainingSeconds % 60)}s
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 w-full md:w-auto"
            onClick={() => handleSubmitAnswer(false)}
            disabled={answerSubmitting || !currentAnswer.trim()}
          >
            {answerSubmitting ? 'Submitting…' : 'Submit Answer'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/60 text-white hover:bg-white/10 w-full md:w-auto"
            onClick={handleCompleteCompetition}
            disabled={completing}
          >
            {completing ? 'Saving…' : 'Finish Competition'}
          </Button>
        </div>
      </>
    )
  }

  const renderSummary = () => {
    if (!session || !session.completed) {
      return null
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white/10 rounded-2xl p-4 text-center shadow-inner shadow-black/30">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Winner</p>
            <p className="text-3xl font-semibold mt-2">
              {session.summary?.winner === 'learner'
                ? 'You'
                : session.summary?.winner === 'ai'
                ? 'AI'
                : 'Tie'}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center shadow-inner shadow-black/30">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Your Score</p>
            <p className="text-3xl font-semibold mt-2">
              {typeof session.summary?.score === 'number' ? session.summary.score : 'Pending'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            View More Competitions
          </Button>
        </div>
      </div>
    )
  }

  if (!learnerId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <p className="text-center text-red-400">
          Unable to determine learner context. Please sign in again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">AI Arena</p>
          <h1 className="text-4xl font-bold">
            {competition?.course_name || 'Competition In Progress'}
          </h1>
          <p className="text-white/70">
            Each question unlocks one at a time, with {TOTAL_COMPETITION_MINUTES} minutes total to outsmart the AI opponent.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 rounded-xl p-4 text-center space-y-3">
            <p>{error}</p>
            <Button variant="outline" onClick={handleRetryStart} size="sm">
              Retry
            </Button>
          </div>
        )}

        {loadingSession ? (
          <p className="text-center text-white/80">Loading competition session…</p>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 rounded-3xl border border-white/10 shadow-2xl shadow-black/40 p-6 space-y-6">
            {!session && !error && (
              <p className="text-center text-white/70">
                Unable to load the competition session.
              </p>
            )}

            {session && !session.completed && renderActiveQuestion()}
            {session && session.completed && renderSummary()}
          </div>
        )}
      </div>
    </div>
  )
}

