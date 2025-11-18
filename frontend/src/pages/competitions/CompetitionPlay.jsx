import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'
import { useAuthStore } from '../../store/authStore.js'
import { Moon, Sun, Volume2, VolumeX, Code, Sparkles, Terminal, Cpu } from 'lucide-react'

const DEFAULT_FORCED_LEARNER_ID = '2080d04e-9e6f-46b8-a602-8eb67b009e88'
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
  const [darkMode, setDarkMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)

  const startAttemptedRef = useRef(Boolean(location.state?.session))
  const autoSubmitRef = useRef(false)
  const audioRef = useRef(null)

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio('/assets/sfx/arena_loop.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = 0.18
    audioRef.current.preload = 'auto'
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  // Audio control
  useEffect(() => {
    if (!audioRef.current) return
    try {
      if (soundEnabled) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked - user can press button to play
        })
      } else {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } catch (err) {
      console.error('Audio playback failed', err)
    }
  }, [soundEnabled])

  // Load sound preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('devlab_sound_enabled') === '1'
    setSoundEnabled(saved)
  }, [])

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('devlab_sound_enabled', soundEnabled ? '1' : '0')
  }, [soundEnabled])

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
        <p className={`text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
            <div className={`${
              darkMode
                ? 'bg-slate-900/70 border-slate-800'
                : 'bg-white/80 backdrop-blur border-slate-300'
            } border rounded-xl shadow-lg p-5 min-h-[200px] hover:shadow-[0_8px_40px_rgba(16,185,129,0.08)] transition-all`}>
              <p className={`text-xs uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Current Challenge
              </p>
              <p className={`mt-3 text-lg leading-relaxed whitespace-pre-line ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {session.question.question}
              </p>
            </div>
            <textarea
              className={`w-full border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all ${
                darkMode
                  ? 'bg-slate-900/70 border-slate-800 text-slate-100 placeholder:text-slate-400'
                  : 'bg-white/80 backdrop-blur border-slate-300 text-slate-900 placeholder:text-slate-500'
              }`}
              rows={6}
              placeholder="Write your code solution here"
              value={currentAnswer}
              onChange={(event) => setCurrentAnswer(event.target.value)}
            />
          </div>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-32 h-32">
              <div
                className="absolute inset-0 rounded-full opacity-80"
                style={{
                  background: `conic-gradient(#10b981 ${timerPercent}%, rgba(255,255,255,0.15) ${timerPercent}% 100%)`
                }}
              />
              <div className={`absolute inset-2 rounded-full flex flex-col items-center justify-center shadow-lg ${
                darkMode ? 'bg-gray-900 shadow-black/40' : 'bg-white shadow-black/20'
              }`}>
                <span className={`text-[10px] uppercase tracking-[0.3em] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Timer
                </span>
                <span className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {remainingSeconds === null ? '--:--' : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`}
                </span>
                <span className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {Math.floor(perQuestionTimer / 60)} min limit
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className={`text-xs uppercase tracking-[0.3em] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Progress
              </p>
              <p className={`text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {questionPosition} / {totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`h-3 rounded-full overflow-hidden ${
            darkMode ? 'bg-slate-800' : 'bg-slate-200'
          }`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, questionProgress))}%` }}
            />
          </div>
          <p className={`text-xs text-right ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            No skipping — the next challenge appears when this timer expires or you submit.
          </p>
          <div className={`h-1.5 rounded-full overflow-hidden ${
            darkMode ? 'bg-slate-800' : 'bg-slate-200'
          }`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, totalTimerPercent))}%` }}
            />
          </div>
          <p className={`text-[11px] text-right ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Total competition time remaining: {Math.max(0, Math.floor(totalRemainingSeconds / 60))}m {Math.max(0, totalRemainingSeconds % 60)}s
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => handleSubmitAnswer(false)}
            disabled={answerSubmitting || !currentAnswer.trim()}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-emerald-500/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full md:w-auto"
          >
            {answerSubmitting ? 'Submitting…' : 'Submit Answer'}
          </button>
          <button
            onClick={handleCompleteCompetition}
            disabled={completing}
            className={`border rounded-lg px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-emerald-500/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full md:w-auto ${
              darkMode
                ? 'bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800/50'
                : 'bg-transparent border-slate-400 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {completing ? 'Saving…' : 'Finish Competition'}
          </button>
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
          <div className={`${
            darkMode
              ? 'bg-slate-900/70 border-slate-800'
              : 'bg-white/80 backdrop-blur border-slate-300'
          } border rounded-xl shadow-lg p-4 text-center hover:shadow-[0_8px_40px_rgba(16,185,129,0.08)] transition-all`}>
            <p className={`text-xs uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Winner
            </p>
            <p className={`text-3xl font-semibold mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {session.summary?.winner === 'learner'
                ? 'You'
                : session.summary?.winner === 'ai'
                ? 'AI'
                : 'Tie'}
            </p>
          </div>
          <div className={`${
            darkMode
              ? 'bg-slate-900/70 border-slate-800'
              : 'bg-white/80 backdrop-blur border-slate-300'
          } border rounded-xl shadow-lg p-4 text-center hover:shadow-[0_8px_40px_rgba(16,185,129,0.08)] transition-all`}>
            <p className={`text-xs uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Your Score
            </p>
            <p className={`text-3xl font-semibold mt-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {typeof session.summary?.score === 'number' ? session.summary.score : 'Pending'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className={`border rounded-lg px-4 py-2 font-semibold transition-all focus:ring-2 focus:ring-emerald-500/60 focus:outline-none ${
              darkMode
                ? 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800/50'
                : 'bg-transparent border-slate-400 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
          >
            View More Competitions
          </button>
        </div>
      </div>
    )
  }

  if (!learnerId) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-white via-slate-100 to-slate-200 text-slate-900'
      }`}>
        <p className={`text-center font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          Unable to determine learner context. Please sign in again.
        </p>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen px-4 py-10 overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
        : 'bg-gradient-to-br from-white via-slate-100 to-slate-200 text-slate-900'
    }`}>
      {/* Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[5] opacity-30"
        style={{
          background: 'linear-gradient(transparent 50%, rgba(255,255,255,0.02) 50%)',
          backgroundSize: '100% 4px',
          animation: 'scanline 8s linear infinite'
        }}
      />

      {/* Animated Background Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ y: [-10, 10], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-10 left-8 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Code size={60} />
        </motion.div>
        <motion.div
          animate={{ y: [10, -10], rotate: [0, -15, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-1/4 right-12 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Sparkles size={50} />
        </motion.div>
        <motion.div
          animate={{ y: [-8, 8], rotate: [0, 12, -12, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-16 left-12 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Terminal size={55} />
        </motion.div>
        <motion.div
          animate={{ y: [8, -8], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-1/3 right-20 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Cpu size={48} />
        </motion.div>
        <motion.div
          animate={{ y: [-12, 12], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-1/2 left-20 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Code size={45} />
        </motion.div>
        <motion.div
          animate={{ y: [12, -12], rotate: [0, -12, 12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-20 right-1/4 ${darkMode ? 'text-emerald-500/10' : 'text-emerald-400/12'}`}
          style={{ willChange: 'transform' }}
        >
          <Terminal size={52} />
        </motion.div>
      </div>

      {/* HUD */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setSoundEnabled(s => !s)}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute background sound' : 'Unmute background sound'}
          className={`p-2 rounded-lg transition-all focus:ring-2 focus:ring-emerald-500/60 focus:outline-none ${
            darkMode
              ? 'bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-800'
              : 'bg-white/80 backdrop-blur border border-slate-300 text-slate-700 hover:bg-white shadow-lg'
          }`}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          onClick={() => setDarkMode(d => !d)}
          aria-pressed={darkMode}
          aria-label="Toggle theme"
          className={`p-2 rounded-lg transition-all focus:ring-2 focus:ring-emerald-500/60 focus:outline-none ${
            darkMode
              ? 'bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-800'
              : 'bg-white/80 backdrop-blur border border-slate-300 text-slate-700 hover:bg-white shadow-lg'
          }`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
          darkMode
            ? 'bg-slate-800/60 text-slate-300'
            : 'bg-white/60 backdrop-blur text-slate-700'
        }`}>
          {session ? `${session.questionIndex || 1}/${session.totalQuestions || 3}` : '—/—'}
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className={`text-xs uppercase tracking-[0.4em] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            AI Arena
          </p>
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {competition?.course_name || 'Competition In Progress'}
            <div className="h-1 w-28 mx-auto rounded-full bg-emerald-500/80 mt-3 shadow-[0_6px_30px_rgba(16,185,129,0.12)]"></div>
          </h1>
          <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
            Each question unlocks one at a time, with {TOTAL_COMPETITION_MINUTES} minutes total to outsmart the AI opponent.
          </p>
        </motion.div>

        {error && (
          <div className={`border rounded-xl p-4 text-center space-y-3 ${
            darkMode
              ? 'bg-red-500/10 border-red-500/40 text-red-300'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}>
            <p>{error}</p>
            <button
              onClick={handleRetryStart}
              className={`border rounded-lg px-4 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-emerald-500/60 focus:outline-none ${
                darkMode
                  ? 'bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800/50'
                  : 'bg-transparent border-slate-400 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Retry
            </button>
          </div>
        )}

        {loadingSession ? (
          <p className={`text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Loading competition session…
          </p>
        ) : (
          <div className={`${
            darkMode
              ? 'bg-slate-900/70 border-slate-800'
              : 'bg-white/80 backdrop-blur border-slate-300'
          } border rounded-3xl shadow-2xl p-6 space-y-6 hover:shadow-[0_8px_40px_rgba(16,185,129,0.08)] transition-all`}>
            {!session && !error && (
              <p className={`text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Unable to load the competition session.
              </p>
            )}

            {session && !session.completed && renderActiveQuestion()}
            {session && session.completed && renderSummary()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}

