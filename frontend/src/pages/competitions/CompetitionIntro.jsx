import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'
import { apiClient } from '../../services/api/client.js'
import { useAuthStore } from '../../store/authStore.js'

export default function CompetitionIntro() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const learnerId = user?.id

  const initialCompetition = location.state?.competition || null

  const [competition, setCompetition] = useState(initialCompetition)
  const [loadingCompetition, setLoadingCompetition] = useState(!initialCompetition)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const [learnerProfile, setLearnerProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    if (!learnerId) {
      return
    }

    let isMounted = true
    setProfileError(null)

    ;(async () => {
      try {
        const profile = await apiClient.get(`/user-profiles/${learnerId}`)
        if (!isMounted) {
          return
        }
        setLearnerProfile(profile?.data || profile || null)
      } catch (profileFetchError) {
        console.error('[CompetitionIntro] Failed to load learner profile:', profileFetchError)
        if (isMounted) {
          setProfileError('Unable to load learner profile.')
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [learnerId])

  useEffect(() => {
    if (competition || !learnerId || !competitionId) {
      return
    }

    let isMounted = true
    setLoadingCompetition(true)
    setError(null)

    ;(async () => {
      try {
        const pending = await competitionsAIAPI.getPendingCompetitions(learnerId)
        if (!isMounted) {
          return
        }
        const found = pending.find((item) => item.competition_id === competitionId)
        setCompetition(found || null)
        if (!found) {
          setError('Competition not found or already completed.')
        }
      } catch (fetchError) {
        console.error('[CompetitionIntro] Failed to fetch competition:', fetchError)
        if (isMounted) {
          setError('Unable to load competition details. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoadingCompetition(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [competition, learnerId, competitionId])

  const handleStartCompetition = async () => {
    if (!competitionId) {
      return
    }

    setStarting(true)
    setError(null)
    try {
      const response = await competitionsAIAPI.startCompetition(competitionId)
      const session = response?.session || response
      if (!session) {
        throw new Error('Invalid competition session response.')
      }

      navigate(`/competitions/${competitionId}/play`, {
        state: {
          competition,
          session
        },
        replace: true
      })
    } catch (startError) {
      console.error('[CompetitionIntro] Failed to start competition:', startError)
      const message = startError?.response?.data?.error || startError.message || 'Unable to start competition.'
      setError(message)
    } finally {
      setStarting(false)
    }
  }

  const renderContent = () => {
    if (!learnerId) {
      return (
        <p className="text-center text-red-500">
          Unable to determine learner context. Please sign in again.
        </p>
      )
    }

    if (loadingCompetition) {
      return <p className="text-center text-white/80">Loading competition…</p>
    }

    if (error) {
      return (
        <div className="space-y-4 text-center">
          <p className="text-red-300">{error}</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      )
    }

    return (
      <>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Competition</p>
          <h2 className="text-3xl font-semibold">{competition?.course_name}</h2>
          <p className="text-white/80">
            You’ll face three sequential coding questions generated specifically for this course. Each
            question unlocks only after you finish (or time out) the previous one.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Format</p>
            <ul className="list-disc list-inside text-white/80 mt-2 space-y-1 text-sm">
              <li>3 coding questions, 10 minutes each.</li>
              <li>No skipping or jumping ahead.</li>
              <li>AI opponent answers simultaneously.</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Scoring</p>
            <ul className="list-disc list-inside text-white/80 mt-2 space-y-1 text-sm">
              <li>Quality, correctness, and clarity matter.</li>
              <li>AI vs. learner evaluated at the end.</li>
              <li>Winner + learner score saved to your record.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleStartCompetition} disabled={starting}>
            {starting ? 'Starting…' : 'Start Competition'}
          </Button>
        </div>
      </>
    )
  }

  const displayName = learnerProfile?.learner_name || user?.name || 'Learner'

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Competition Briefing</p>
          <h1 className="text-4xl font-bold">
            Ready for the Arena, {displayName}?
          </h1>
          <p className="text-white/70">
            Take a deep breath, review the rules, and start when you’re ready. The AI opponent is waiting.
          </p>
          {profileError && (
            <p className="text-xs text-red-300">{profileError}</p>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

