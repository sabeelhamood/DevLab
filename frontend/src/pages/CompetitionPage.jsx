import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../services/api/client.js'

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
  const [competition, setCompetition] = useState(null)
  const [progress, setProgress] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(600)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCompetition()
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

  const loadCompetition = async () => {
    try {
      setLoading(true)
      setError(null)

      let competitionData = null

      if (id) {
        // If competition ID is provided, fetch that specific competition
        const response = await apiClient.get(`/competitions/${id}`)
        competitionData = response.data || response
      } else {
        // Otherwise, fetch competitions for Sabeel and get the first active one
        try {
          let competitions = null
          let competitionsArray = []
          
          // Try the learner-specific endpoint first
          try {
            competitions = await apiClient.get(`/competitions/learner/${SABEEL_USER_ID}`)
            // Handle both array and object responses
            competitionsArray = Array.isArray(competitions) 
              ? competitions 
              : (competitions.data || [])
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="text-slate-400">Loading competition...</p>
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

  if (!competition || !activeQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-semibold">No Active Competition</h1>
          <p className="text-base text-slate-300">
            You don't have any active competitions at the moment.
          </p>
          <button
            onClick={() => navigate('/competition/invitation')}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Create Competition
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-emerald-400/80 text-xs uppercase tracking-[0.3em]">
            Active Competition
          </p>
          <h1 className="text-3xl font-semibold text-white">{courseName}</h1>
        <p className="text-sm text-slate-400">
            Competition ID:{' '}
            <span className="font-mono text-white/80">{competitionId}</span>
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">
                  Current Question
                </p>
                <h2 className="text-2xl font-semibold text-white mt-1">
                  {activeQuestion.title || 'Question'}
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  {activeQuestion.difficulty && (
                    <>
                      Difficulty:{' '}
                      <span className="text-emerald-300 capitalize">
                        {activeQuestion.difficulty}
                      </span>
                    </>
                  )}
                  {activeQuestion.language && (
                    <>
                      {activeQuestion.difficulty && ' · '}
                      Language:{' '}
                      <span className="text-emerald-300">{activeQuestion.language}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">
                  Time Remaining
                </p>
                <p className="text-3xl font-bold text-emerald-300">
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Prompt</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
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


