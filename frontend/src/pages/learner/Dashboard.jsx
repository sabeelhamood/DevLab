import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import { BookOpen, BarChart3, Clock, Target, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'

// Mock data for demonstration
const mockStats = {
  totalQuestions: 45,
  correctAnswers: 38,
  averageScore: 84.4,
  timeSpent: 120,
  currentStreak: 7,
  achievements: 12
}

const mockCourses = [
  {
    id: '1',
    name: 'Python Fundamentals',
    progress: 75,
    difficulty: 'Beginner',
    nextTopic: 'Functions and Modules'
  },
  {
    id: '2',
    name: 'JavaScript Advanced',
    progress: 45,
    difficulty: 'Intermediate',
    nextTopic: 'Async Programming'
  }
]

const mockRecentActivity = [
  {
    id: '1',
    course: 'Python Fundamentals',
    score: 85,
    date: '2 hours ago'
  },
  {
    id: '2',
    course: 'JavaScript Advanced',
    score: 78,
    date: '1 day ago'
  }
]

const QUESTION_TIMER_SECONDS = 10 * 60

const calculateRemainingSeconds = (endsAt, fallbackSeconds = DEFAULT_COMPETITION_TIMER) => {
  if (endsAt) {
    const diff = Math.floor((Date.parse(endsAt) - Date.now()) / 1000)
    return diff > 0 ? diff : 0
  }
  return fallbackSeconds
}

const formatTimer = (seconds) => {
  if (seconds === null || seconds === undefined) {
    return '--:--'
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const buildSessionState = (session, meta = {}) => ({
  competitionId: session?.competition_id || null,
  status: session?.status || 'pending',
  question: session?.question || null,
  questionIndex: session?.questionIndex || 0,
  totalQuestions: session?.totalQuestions || 0,
  startedAt: session?.started_at || null,
  expiresAt: session?.expires_at || null,
  timerSeconds: session?.timer_seconds || QUESTION_TIMER_SECONDS,
  answers: session?.answers || [],
  completed: Boolean(session?.completed),
  summary: session?.summary || null,
  winner: session?.summary?.winner || session?.winner || null,
  score:
    typeof session?.summary?.score === 'number'
      ? session.summary.score
      : typeof session?.score === 'number'
      ? session.score
      : null,
  courseKey: meta.courseKey || null,
  courseName: meta.courseName || null
})

const DEFAULT_FORCED_LEARNER_ID = '550e8400-e29b-41d4-a716-446655440000'
const DEFAULT_FORCED_LEARNER_NAME = 'DevLab Test Learner'

export default function Dashboard() {
  const { user } = useAuthStore()
  const forcedLearnerId =
    import.meta.env.VITE_FORCE_LEARNER_ID || DEFAULT_FORCED_LEARNER_ID
  const forcedLearnerName =
    import.meta.env.VITE_FORCE_LEARNER_NAME || DEFAULT_FORCED_LEARNER_NAME
  const effectiveUser = forcedLearnerId
    ? {
        id: forcedLearnerId,
        name: forcedLearnerName,
        role: 'learner'
      }
    : user
  const learnerId = effectiveUser?.id
  const learnerName = effectiveUser?.name
  const isLearner = (effectiveUser?.role || 'learner') === 'learner'
  const [pendingCompetitions, setPendingCompetitions] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState(null)
  const [creationState, setCreationState] = useState({})
  const [activeSession, setActiveSession] = useState(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [sessionError, setSessionError] = useState(null)
  const [answerSubmitting, setAnswerSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const autoSubmitRef = useRef(false)

  const syncCreationStateWithSession = useCallback((sessionState) => {
    if (!sessionState?.courseKey) {
      return
    }

    setCreationState((prev) => ({
      ...prev,
      [sessionState.courseKey]: {
        ...(prev[sessionState.courseKey] || {}),
        status: sessionState.completed ? 'completed' : 'in_progress',
        competitionId: sessionState.competitionId,
        courseName: sessionState.courseName
      }
    }))
  }, [])

  useEffect(() => {
    const learnerId = effectiveUser?.id
    if (!learnerId) {
      setPendingCompetitions([])
      console.log('[Dashboard] No learnerId available; skipping pending competitions fetch.')
      return
    }

    let isMounted = true
    setPendingLoading(true)
    setPendingError(null)
    console.log('[Dashboard] Fetching pending competitions for learner:', learnerId)
    competitionsAIAPI
      .getPendingCompetitions(learnerId)
      .then((data) => {
        console.log('[Dashboard] Pending competitions response:', data)
        if (isMounted) {
          setPendingCompetitions(data)
        }
      })
      .catch((error) => {
        console.error('[Dashboard] Failed to fetch pending competitions:', error)
        if (isMounted) {
          setPendingError(error.message || 'Unable to fetch pending competitions')
        }
      })
      .finally(() => {
        if (isMounted) {
          setPendingLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [learnerId])

  useEffect(() => {
    if (!activeSession || activeSession.completed) {
      setRemainingSeconds(null)
      return
    }

    const initial = calculateRemainingSeconds(
      activeSession.expiresAt,
      activeSession.timerSeconds || QUESTION_TIMER_SECONDS
    )
    setRemainingSeconds(initial)

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const baseline =
          prev === null
            ? calculateRemainingSeconds(
                activeSession.expiresAt,
                activeSession.timerSeconds || QUESTION_TIMER_SECONDS
              )
            : prev
        return baseline > 0 ? baseline - 1 : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [
    activeSession?.competitionId,
    activeSession?.completed,
    activeSession?.expiresAt,
    activeSession?.timerSeconds
  ])

  const handleEnterCompetition = async (course) => {
    const learnerId = effectiveUser?.id
    if (!learnerId) {
      return
    }

    const courseKey = course.course_id
    setCreationState((prev) => ({
      ...prev,
      [courseKey]: { ...(prev[courseKey] || {}), status: 'creating', courseName: course.course_name }
    }))

    try {
      console.log('[Dashboard] Requesting competition creation', {
        learnerId,
        learnerName,
        course
      })
      const response = await competitionsAIAPI.createCompetition({
        learner_id: learnerId,
        learner_name: learnerName || null,
        course_id: course.course_id,
        course_name: course.course_name
      })
      console.log('[Dashboard] createCompetition response', response)

      setCreationState((prev) => ({
        ...prev,
        [courseKey]: {
          ...(prev[courseKey] || {}),
          status: 'ready',
          competitionId: response?.competition?.competition_id || null,
          courseName: course.course_name
        }
      }))
    } catch (error) {
      console.error('[Dashboard] Failed to create AI competition:', error)
      setCreationState((prev) => ({
        ...prev,
        [courseKey]: {
          status: 'error',
          message: error.response?.data?.error || error.message || 'Unable to create competition',
          competitionId: prev[courseKey]?.competitionId || null,
          courseName: course.course_name
        }
      }))
    }
  }

  const completeActiveCompetition = useCallback(
    async (reason = 'finished') => {
      if (!activeSession || isCompleting) {
        return
      }

      setIsCompleting(true)
      try {
      console.log('[Dashboard] Completing competition', {
        competitionId: activeSession.competitionId,
        reason
      })
        const response = await competitionsAIAPI.completeCompetition(activeSession.competitionId)
        const session = response?.session || null
        if (!session) {
          throw new Error('Invalid competition session response.')
        }

        const sessionState = buildSessionState(session, {
          courseKey: activeSession.courseKey,
          courseName: activeSession.courseName
        })

        setActiveSession(sessionState)
        setRemainingSeconds(null)
        syncCreationStateWithSession(sessionState)

        if (reason === 'timeout' && !sessionState.completed) {
          setSessionError('Competition ended because the timer expired.')
        }
    } catch (error) {
      console.error('[Dashboard] Failed to finalize competition:', error)
        setSessionError(
          error.response?.data?.error || error.message || 'Unable to finalize competition.'
        )
      } finally {
        setIsCompleting(false)
        autoSubmitRef.current = false
      }
    },
    [activeSession, isCompleting, syncCreationStateWithSession]
  )

  const handleStartCompetition = async (course, competitionId) => {
    const learnerId = effectiveUser?.id
    if (!learnerId || !competitionId) {
      return
    }

    const courseKey = course.course_id
    setCreationState((prev) => ({
      ...prev,
      [courseKey]: {
        ...(prev[courseKey] || {}),
        status: 'starting',
        competitionId,
        courseName: course.course_name
      }
    }))
    setSessionError(null)

    try {
      console.log('[Dashboard] Starting competition', { competitionId, course })
      const response = await competitionsAIAPI.startCompetition(competitionId)
      console.log('[Dashboard] startCompetition response', response)
      const session = response?.session || null
      if (!session) {
        throw new Error('Invalid competition session response.')
      }

      const sessionState = buildSessionState(session, {
        courseKey,
        courseName: course.course_name
      })

      setActiveSession(sessionState)
      setCurrentAnswer('')
      setRemainingSeconds(
        calculateRemainingSeconds(sessionState.expiresAt, sessionState.timerSeconds)
      )
      autoSubmitRef.current = false

      syncCreationStateWithSession(sessionState)
    } catch (error) {
      console.error('[Dashboard] Failed to start competition:', error)
      setCreationState((prev) => ({
        ...prev,
        [courseKey]: {
          ...(prev[courseKey] || {}),
          status: 'ready',
          competitionId,
          courseName: course.course_name,
          message: error.response?.data?.error || error.message || 'Unable to start competition'
        }
      }))
      setSessionError(error.response?.data?.error || error.message || 'Unable to start competition')
    }
  }

  const handleSubmitLearnerAnswer = useCallback(async (isTimeout = false) => {
    if (!activeSession || activeSession.completed) {
      return
    }

    const question = activeSession.question
    if (!question) {
      return
    }

    if (!isTimeout && !currentAnswer.trim()) {
      return
    }

    setAnswerSubmitting(true)
    setSessionError(null)

    try {
      console.log('[Dashboard] Submitting answer', {
        competitionId: activeSession.competitionId,
        questionId: question.question_id,
        isTimeout
      })
      const response = await competitionsAIAPI.submitAnswer(activeSession.competitionId, {
        question_id: question.question_id,
        answer: isTimeout ? '' : currentAnswer.trim()
      })
      console.log('[Dashboard] submitAnswer response', response)

      const session = response?.session || null
      if (!session) {
        throw new Error('Invalid competition session response.')
      }

      const sessionState = buildSessionState(session, {
        courseKey: activeSession.courseKey,
        courseName: activeSession.courseName
      })

      setActiveSession(sessionState)
      setCurrentAnswer('')
      setRemainingSeconds(
        sessionState.completed
          ? null
          : calculateRemainingSeconds(sessionState.expiresAt, sessionState.timerSeconds)
      )
      autoSubmitRef.current = false
      syncCreationStateWithSession(sessionState)
    } catch (error) {
      console.error('[Dashboard] Failed to submit answer:', error)
      setSessionError(error.response?.data?.error || error.message || 'Unable to submit answer')
    } finally {
      setAnswerSubmitting(false)
    }
  }, [activeSession, currentAnswer, syncCreationStateWithSession])

  useEffect(() => {
    if (!activeSession || activeSession.completed) {
      autoSubmitRef.current = false
      return
    }

    if (remainingSeconds === 0 && !autoSubmitRef.current && activeSession.question) {
      autoSubmitRef.current = true
      handleSubmitLearnerAnswer(true)
    }
  }, [remainingSeconds, activeSession?.completed, activeSession?.question, handleSubmitLearnerAnswer])

  const formatCompletedAt = (timestamp) => {
    if (!timestamp) {
      return 'Recently completed'
    }

    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch (error) {
      return timestamp
    }
  }

  const activeQuestion =
    activeSession && !activeSession.completed ? activeSession.question || null : null
  const questionsTotal = activeSession?.totalQuestions || 0
  const answeredCount = activeSession?.answers?.length || 0
  const questionPosition = activeSession?.completed
    ? questionsTotal
    : Math.max(activeSession?.questionIndex || 1, 1)
  const questionProgressPercent =
    questionsTotal > 0
      ? ((questionPosition - 1) / questionsTotal) * 100
      : 0
  const timerPercent =
    activeSession && !activeSession.completed
      ? Math.max(
          0,
          Math.min(100, ((remainingSeconds ?? QUESTION_TIMER_SECONDS) / QUESTION_TIMER_SECONDS) * 100)
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your learning progress.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Solved</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <Target className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.timeSpent}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.achievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCourses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <span className="text-sm text-gray-500">{course.difficulty}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Next: {course.nextTopic}</p>
                  <div className="mt-3 flex space-x-2">
                    <Button size="sm" asChild>
                      <Link to="/practice">Continue</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Practice session in {activity.course}
                    </p>
                    <p className="text-xs text-gray-500">
                      Score: {activity.score}% • {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump back into your learning flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-20 flex-col space-y-2">
              <Link to="/practice">
                <BookOpen className="h-6 w-6" />
                <span>Start Practice</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link to="/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLearner && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for a Competition?</CardTitle>
            <CardDescription>
              Turn your recent course completions into an AI challenge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoading && <p className="text-gray-500">Checking for new competitions...</p>}
            {pendingError && (
              <p className="text-red-600 text-sm mb-4">
                {pendingError}
              </p>
            )}
            {!pendingLoading && !pendingCompetitions.length && !pendingError && (
              <p className="text-gray-600">
                Complete a course to unlock a personalized AI competition.
              </p>
            )}
            <div className="space-y-4">
              {pendingCompetitions.map((course) => {
                const courseKey = course.course_id
                const status = creationState[courseKey]?.status || 'idle'
                const competitionId = creationState[courseKey]?.competitionId

                return (
                  <div
                    key={courseKey}
                    className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                      <p className="text-sm text-gray-500">
                        Completed on {formatCompletedAt(course.completed_at)}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:items-center gap-3">
                      {status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCompetition(course, competitionId)}
                          disabled={!competitionId}
                        >
                          Start Competition
                        </Button>
                      )}
                      {status === 'starting' && (
                        <Button size="sm" variant="outline" disabled>
                          Starting Competition...
                        </Button>
                      )}
                      {status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCompetition(course, competitionId)}
                          disabled={!competitionId}
                        >
                          Resume Competition
                        </Button>
                      )}
                      {status === 'completed' && (
                        <p className="text-sm text-success-600 font-medium">Competition completed</p>
                      )}
                      {status !== 'ready' &&
                        status !== 'starting' &&
                        status !== 'in_progress' &&
                        status !== 'completed' && (
                          <Button
                            size="sm"
                            disabled={status === 'creating'}
                            onClick={() => handleEnterCompetition(course)}
                          >
                            {status === 'creating' ? 'Creating Competition...' : 'Enter Competition'}
                          </Button>
                        )}
                      {status === 'error' && (
                        <p className="text-xs text-red-600 max-w-sm">
                          {creationState[courseKey]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLearner && activeSession && (
        <Card className="border-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-white">AI Arena · {activeSession.courseName || 'Competition'}</CardTitle>
                <CardDescription className="text-white/80">
                  {activeSession.completed
                    ? 'Competition complete — review your performance below.'
                    : 'Each question unlocks one at a time with a 10-minute timer. Outsmart the AI opponent!'}
                </CardDescription>
              </div>
              <div className="text-sm text-white/70">
                {activeSession.completed
                  ? 'Finished'
                  : `Question ${Math.min(questionPosition, questionsTotal) || 0} / ${questionsTotal || 0}`}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!activeSession.completed && activeQuestion && (
              <>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white/5 rounded-2xl p-5 shadow-inner shadow-white/5 min-h-[200px]">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Current Challenge</p>
                      <p className="mt-3 text-lg leading-relaxed whitespace-pre-line">
                        {activeQuestion.question}
                      </p>
                    </div>
                    <textarea
                      className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/60"
                      rows={6}
                      placeholder="Describe your reasoning like a human competitor..."
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
                        <span className="text-3xl font-bold">{formatTimer(remainingSeconds)}</span>
                        <span className="text-[10px] text-white/50 mt-1">10 min limit</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Progress</p>
                      <p className="text-3xl font-semibold">
                        {Math.min(questionPosition, questionsTotal) || 0} / {questionsTotal || 0}
                      </p>
                      <p className="text-xs text-white/60">{answeredCount} answers saved</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-white via-white to-transparent transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, questionProgressPercent))}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/70 text-right">
                    No skipping — the next challenge appears when this timer expires or you submit.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 w-full md:w-auto"
                    onClick={() => handleSubmitLearnerAnswer(false)}
                    disabled={answerSubmitting || !currentAnswer.trim()}
                  >
                    {answerSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/60 text-white hover:bg-white/10 w-full md:w-auto"
                    onClick={() => completeActiveCompetition('finished')}
                    disabled={isCompleting}
                  >
                    {isCompleting ? 'Saving...' : 'Finish Competition'}
                  </Button>
                </div>
              </>
            )}

            {!activeSession.completed && !activeQuestion && (
              <p className="text-sm text-white/80">Loading your next challenge...</p>
            )}

            {activeSession.completed && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white/10 rounded-2xl p-4 text-center shadow-inner shadow-black/30">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Winner</p>
                    <p className="text-3xl font-semibold mt-2">
                      {activeSession.summary?.winner === 'learner'
                        ? 'You'
                        : activeSession.summary?.winner === 'ai'
                        ? 'AI'
                        : 'Tie'}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center shadow-inner shadow-black/30">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Your Score</p>
                    <p className="text-3xl font-semibold mt-2">
                      {typeof activeSession.summary?.score === 'number'
                        ? activeSession.summary.score
                        : 'Pending'}
                    </p>
                  </div>
                </div>
                {activeSession.summary && (
                  <div className="bg-gray-900/60 rounded-2xl p-4 text-sm text-white/90 max-h-72 overflow-auto border border-white/10">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Evaluation</p>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(activeSession.summary, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/60 text-white hover:bg-white/10"
                    onClick={() => {
                      setActiveSession(null)
                      setSessionError(null)
                      setCurrentAnswer('')
                      setRemainingSeconds(null)
                      autoSubmitRef.current = false
                    }}
                  >
                    Close Arena
                  </Button>
                </div>
              </div>
            )}

            {sessionError && (
              <p className="text-sm text-red-200 mt-2">{sessionError}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}