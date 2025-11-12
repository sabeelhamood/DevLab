import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../services/api/client.js'
import { Trophy, BookOpen, Users, ArrowRight, Star, Award, Flame, Target, Zap, Crown, Medal, TrendingUp, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext.jsx'

// Sabeel's user ID - hardcoded for now
const SABEEL_USER_ID = '3e3526c7-b8ae-4425-9128-5aa6897a895d'

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const CompetitionPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { theme } = useTheme()
  const [competition, setCompetition] = useState(null)
  const [progress, setProgress] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(600)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedCourses, setCompletedCourses] = useState([])
  const [showCourseList, setShowCourseList] = useState(!id) // Show list if no competition ID
  
  // Gamification state
  const [userScore, setUserScore] = useState(0)
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState([])

  useEffect(() => {
    if (id) {
      // If competition ID provided, load that competition
      loadCompetition()
    } else {
      // Otherwise, load completed courses for competition selection
      loadCompletedCourses()
    }
  }, [id])

  useEffect(() => {
    if (competition && progress?.activeQuestion) {
      // Start timer based on active question
      const timer = progress.activeQuestion.timerRemaining || 600
      setTimeRemaining(timer)

      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [competition, progress])

  const loadCompletedCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try new route pattern first
      let courses = null
      try {
        courses = await apiClient.get(`/user-profiles/completed-courses/${SABEEL_USER_ID}`)
      } catch (newRouteError) {
        // If new route fails (404), try old route pattern as fallback
        if (newRouteError.response?.status === 404) {
          console.warn('New route pattern failed, trying old pattern...')
          try {
            courses = await apiClient.get(`/user-profiles/${SABEEL_USER_ID}/completed-courses`)
          } catch (oldRouteError) {
            // Both routes failed
            throw newRouteError // Use the original error
          }
        } else {
          throw newRouteError
        }
      }
      
      const coursesArray = Array.isArray(courses) ? courses : (courses.data || [])
      
      setCompletedCourses(coursesArray)
      setShowCourseList(true)
    } catch (err) {
      console.error('Error loading completed courses:', err)
      // Don't show error if it's just a 404 - might mean no courses yet
      if (err.response?.status === 404) {
        setCompletedCourses([])
        setShowCourseList(true)
      } else {
        setError(err.message || 'Failed to load completed courses')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (course) => {
    const courseId = course.course_id || course.id
    const courseName = course.course_name || course.name || 'Competition'
    navigate(`/competition/invitation?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`)
  }

  const loadCompetition = async () => {
    try {
      setLoading(true)
      setError(null)

      let competitionData = null

      if (id) {
        // If competition ID is provided, fetch that specific competition
        try {
          const response = await apiClient.get(`/competitions/${id}`)
          competitionData = response.data || response
        } catch (compError) {
          console.error('Error fetching competition:', compError)
          // Handle different error cases
          if (compError.response?.status === 404) {
            setError('Competition not found')
            setLoading(false)
            return
          } else if (compError.response?.status === 401) {
            setError('Authentication required. Please log in.')
            setLoading(false)
            return
          }
          throw compError
        }
      } else {
        // Otherwise, fetch competitions for Sabeel and get the first active one
        try {
          let competitions = null
          let competitionsArray = []
          
          // Try the learner-specific endpoint first
          try {
            competitions = await apiClient.get(`/competitions/learner/${SABEEL_USER_ID}`)
            // Handle both array and object responses (with success/data structure)
            if (competitions.success !== undefined) {
              // New format: { success: true, data: [...] }
              competitionsArray = Array.isArray(competitions.data) ? competitions.data : []
            } else if (Array.isArray(competitions)) {
              // Direct array response
              competitionsArray = competitions
            } else {
              // Fallback: try data property
              competitionsArray = competitions.data || []
            }
          } catch (learnerError) {
            // If learner endpoint returns 404, fallback to active/all and filter
            if (learnerError.response?.status === 404) {
              console.warn('Learner endpoint not available, using active/all fallback')
              try {
                const activeCompetitions = await apiClient.get('/competitions/active/all')
                const activeArray = Array.isArray(activeCompetitions) 
                  ? activeCompetitions 
                  : (activeCompetitions.data || [])
                
                console.log('Fetched active competitions:', activeArray.length)
                
                // Filter competitions where Sabeel is a participant
                competitionsArray = activeArray.filter(
                  (comp) => {
                    const learner1Id = comp.learner1_id || comp.learner1?.learner_id || comp.learner1?.id
                    const learner2Id = comp.learner2_id || comp.learner2?.learner_id || comp.learner2?.id
                    return learner1Id === SABEEL_USER_ID || learner2Id === SABEEL_USER_ID
                  }
                )
                
                console.log('Filtered competitions for Sabeel:', competitionsArray.length)
              } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError)
                competitionsArray = []
              }
            } else {
              throw learnerError
            }
          }
          
          if (competitionsArray.length > 0) {
            // Find active competition (no result means it's active)
            const activeCompetition = competitionsArray.find(
              (comp) => !comp.result && comp.status !== 'completed'
            ) || competitionsArray[0]
            
            competitionData = activeCompetition
          } else {
            // No competitions found - this is okay, just show empty state
            competitionData = null
          }
        } catch (fetchError) {
          console.error('Error fetching competitions:', fetchError)
          // If it's a 404, it means the route doesn't exist or user has no competitions
          if (fetchError.response?.status === 404) {
            competitionData = null
          } else {
            throw fetchError
          }
        }
      }

      // If no competition data, set to null (will show empty state)
      if (!competitionData) {
        setCompetition(null)
        setLoading(false)
        return
      }

      setCompetition(competitionData)

      // Fetch progress for the competition
      const competitionId = competitionData.competition_id || competitionData.id || id
      if (competitionId) {
        try {
          const progressResponse = await apiClient.get(`/competitions/${competitionId}/progress`)
          setProgress(progressResponse.data || progressResponse)
        } catch (progressError) {
          console.warn('Could not fetch progress:', progressError)
          // Continue without progress data
        }
      }
    } catch (err) {
      console.error('Error loading competition:', err)
      setError(err.message || 'Failed to load competition')
    } finally {
      setLoading(false)
    }
  }

  const activeQuestion = useMemo(() => {
    if (!competition?.questions || !Array.isArray(competition.questions)) {
      return null
    }

    // Find active question
    const activeIndex = competition.questions.findIndex(
      (q) => q?.state?.is_active === true
    )

    if (activeIndex >= 0) {
      return competition.questions[activeIndex]
    }

    // If no active question, return first question
    return competition.questions[0] || null
  }, [competition])

  const learners = useMemo(() => {
    if (!competition) return []

    const learner1 = competition.learner1 || {
      learner_id: competition.learner1_id,
      name: competition.learner1?.name || 'Player A'
    }
    const learner2 = competition.learner2 || {
      learner_id: competition.learner2_id,
      name: competition.learner2?.name || 'Player B'
    }

    const learner1Id = learner1.learner_id || competition.learner1_id
    const learner2Id = learner2.learner_id || competition.learner2_id
    const isSabeel = (id) => id === SABEEL_USER_ID

    const learner1Submitted = progress?.learners?.find(
      (l) => l.id === learner1Id
    )?.submitted || false
    const learner2Submitted = progress?.learners?.find(
      (l) => l.id === learner2Id
    )?.submitted || false

    return [
      {
        id: learner1Id,
        name: learner1.name || 'Player A',
        isSabeel: isSabeel(learner1Id),
        submitted: learner1Submitted
      },
      {
        id: learner2Id,
        name: learner2.name || 'Player B',
        isSabeel: isSabeel(learner2Id),
        submitted: learner2Submitted
      }
    ].map((learner) => {
      const isActive = learner.isSabeel
      return {
        ...learner,
        state: isActive
          ? learner.submitted
            ? 'Awaiting opponent'
            : 'Your move'
          : learner.submitted
          ? 'Submitted'
          : 'Waiting'
      }
    })
  }, [competition, progress])

  const courseName = competition?.course?.course_name || 
                     competition?.course_name || 
                     'Competition'

  const competitionId = competition?.competition_id || 
                        competition?.id || 
                        'N/A'

  // Calculate gamification metrics
  const totalQuestions = competition?.questions?.length || 0
  const completedQuestions = progress?.completedQuestions || 0
  const progressPercent = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
  const xpToNextLevel = userLevel * 1000
  const xpProgress = (userXP % 1000) / 10

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--gradient-primary)' }}></div>
          <p className={theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}>Loading competition...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-semibold text-red-400">Error</h1>
          <p className="text-base text-slate-300">{error}</p>
          <button
            onClick={() => navigate('/competitions')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show course list if no competition ID and courses are loaded
  if (showCourseList && !id) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-emerald-400" />
              <h1 className="text-4xl font-bold text-white">Competitions</h1>
            </div>
            <p className="text-lg text-slate-400">
              Choose a completed course to start a competition
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                <p className="text-slate-400">Loading courses...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadCompletedCourses}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Try Again
              </button>
            </div>
          ) : completedCourses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-300 mb-2">No Completed Courses</h2>
              <p className="text-slate-400 mb-6">
                Complete a course first to participate in competitions.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedCourses.map((course) => {
                const courseId = course.course_id || course.id
                const courseName = course.course_name || course.name || 'Untitled Course'
                const completedAt = course.completed_at || course.completedAt
                
                return (
                  <button
                    key={courseId}
                    onClick={() => handleCourseClick(course)}
                    className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                      {courseName}
                    </h3>
                    
                    {completedAt && (
                      <p className="text-sm text-slate-400">
                        Completed {new Date(completedAt).toLocaleDateString()}
                      </p>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                      <Users className="w-4 h-4" />
                      <span>Find Opponent</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!competition || !activeQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-semibold">No Active Competition</h1>
          <p className="text-base text-slate-300">
            You don't have any active competitions at the moment.
          </p>
          <button
            onClick={() => navigate('/competitions')}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Browse Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-12 px-4 flex items-center justify-center ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="w-full max-w-5xl space-y-8">
        {/* Gamification Header */}
        <div className={`rounded-2xl p-6 shadow-xl ${theme === 'day-mode' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p 
                className="text-xs uppercase tracking-[0.3em] mb-2"
                style={{ 
                  background: 'var(--gradient-primary)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Active Competition
              </p>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ 
                  background: 'var(--gradient-primary)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {courseName}
              </h1>
              <p className={`text-sm ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                Competition ID: <span className={`font-mono ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>{competitionId}</span>
              </p>
            </div>
            
            {/* XP and Level Display */}
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                    <span className={`text-xs font-medium ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>XP</span>
                  </div>
                  <p className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                    {userXP.toLocaleString()}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5" style={{ color: 'var(--gradient-primary)' }} />
                    <span className={`text-xs font-medium ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>Level</span>
                  </div>
                  <p className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                    {userLevel}
                  </p>
                </div>
                {streak > 0 && (
                  <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-orange-50' : 'bg-orange-500/20'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className={`text-xs font-medium ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>Streak</span>
                    </div>
                    <p className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                      {streak}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-700' : 'text-gray-300'}`}>
                Competition Progress
              </span>
              <span className={`text-sm font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                {completedQuestions}/{totalQuestions} Questions
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${theme === 'day-mode' ? 'bg-gray-200' : 'bg-gray-700'}`}>
              <div 
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 0 10px rgba(6, 95, 70, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>Badges:</span>
              {badges.map((badge, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                  style={{ 
                    background: 'var(--gradient-accent)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className={`space-y-6 rounded-2xl border p-8 shadow-xl ${theme === 'day-mode' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p 
                  className="text-xs uppercase tracking-[0.3em] mb-2"
                  style={{ 
                    background: 'var(--gradient-primary)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Current Question
                </p>
                <h2 className={`text-2xl font-bold mt-1 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                  {activeQuestion.title || 'Question'}
                </h2>
                <p className={`text-sm mt-2 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {activeQuestion.difficulty && (
                    <>
                      Difficulty:{' '}
                      <span 
                        className="font-semibold capitalize"
                        style={{ 
                          background: 'var(--gradient-primary)', 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {activeQuestion.difficulty}
                      </span>
                    </>
                  )}
                  {activeQuestion.language && (
                    <>
                      {activeQuestion.difficulty && ' · '}
                      Language:{' '}
                      <span 
                        className="font-semibold"
                        style={{ 
                          background: 'var(--gradient-primary)', 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {activeQuestion.language}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className={`text-right p-4 rounded-xl ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
                <p 
                  className="text-xs uppercase tracking-[0.3em] mb-2"
                  style={{ 
                    background: 'var(--gradient-primary)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Time Remaining
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ 
                    background: 'var(--gradient-primary)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-6 space-y-4 ${theme === 'day-mode' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-700 border-gray-600'}`}>
              <h3 
                className="text-lg font-semibold"
                style={{ 
                  background: 'var(--gradient-primary)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Prompt
              </h3>
              <p className={`text-sm leading-relaxed ${theme === 'day-mode' ? 'text-gray-700' : 'text-gray-300'}`}>
                {activeQuestion.description || 'No description available'}
              </p>

              {activeQuestion.starterCode && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Starter Code (Read-only)
                  </h4>
                  <pre className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs text-slate-200 overflow-x-auto">
                    {activeQuestion.starterCode}
                  </pre>
                </div>
              )}

              {activeQuestion.testCases && activeQuestion.testCases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">Sample Test Cases</h4>
                  <ul className="space-y-2">
                    {activeQuestion.testCases.map((testCase, index) => (
                      <li
                        key={index}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300"
                      >
                        <span className="font-semibold text-slate-200">Input:</span>{' '}
                        <span className="font-mono text-slate-100">
                          {typeof testCase.input === 'object'
                            ? JSON.stringify(testCase.input)
                            : testCase.input}
                        </span>
                        <br />
                        <span className="font-semibold text-slate-200">Expected:</span>{' '}
                        <span className="font-mono text-slate-100">
                          {String(testCase.expected)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                Learners
              </p>
              <ul className="space-y-4">
                {learners.map((learner) => (
                  <li
                    key={learner.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {learner.name}
                        {learner.isSabeel && ' (You)'}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                        {learner.id}
                      </p>
                    </div>
                    <div
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        learner.state === 'Your move'
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                          : learner.state === 'Submitted'
                          ? 'bg-sky-400/10 text-sky-200 border border-sky-400/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {learner.state}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Competition Info</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                This is a head-to-head coding competition. Both players work on the same question
                simultaneously. When both submit, the system automatically moves to the next
                question.
              </p>

              <button
                type="button"
                onClick={() => navigate('/competitions')}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Back to Competitions
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

export default CompetitionPage


