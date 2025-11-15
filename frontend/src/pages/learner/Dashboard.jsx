import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { apiClient } from '../../services/api/client.js'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'

const DEFAULT_FORCED_LEARNER_ID = '550e8400-e29b-41d4-a716-446655440000'

const TechBackdrop = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-purple-900 opacity-70" />
    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] [background-size:80px_80px]" />
    <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
    <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">{children}</div>
  </div>
)

const DashboardHero = ({ learnerName }) => (
  <div className="text-center mb-10">
    <p className="text-xs uppercase tracking-[0.4em] text-white/60">AI Competition Hub</p>
    <h1 className="mt-4 text-4xl md:text-5xl font-bold">
      Welcome, {learnerName || 'Learner'}!
    </h1>
    <p className="mt-3 text-lg text-white/80">
      Complete courses, unlock competitions, and challenge the DevLab AI.
    </p>
  </div>
)

const CompetitionCard = ({ competition, onStart }) => (
  <motion.div
    layout
    className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 mb-6"
    whileHover={{ scale: 1.01 }}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Course</p>
        <h3 className="text-2xl font-semibold">{competition.course_name}</h3>
        <p className="text-white/70">
          Ready since {new Date(competition.created_at || competition.completed_at).toLocaleString()}
        </p>
      </div>
      <Button
        onClick={onStart}
        className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 rounded-full font-semibold"
      >
        Start Competition
      </Button>
    </div>
  </motion.div>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const forcedLearnerId =
    import.meta.env.VITE_FORCE_LEARNER_ID || DEFAULT_FORCED_LEARNER_ID
  const effectiveUser = forcedLearnerId
    ? { id: forcedLearnerId, role: 'learner' }
    : user
  const learnerId = effectiveUser?.id

  const [learnerProfile, setLearnerProfile] = useState(null)
  const [pendingCompetitions, setPendingCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!learnerId) {
      setError('Learner context missing. Please sign in again.')
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const [profileData, competitionsData] = await Promise.all([
          apiClient.get(`/user-profiles/${learnerId}`),
          competitionsAIAPI.getPendingCompetitions(learnerId)
        ])

        if (!isMounted) {
          return
        }

        setLearnerProfile(profileData?.data || profileData || null)
        setPendingCompetitions(Array.isArray(competitionsData) ? competitionsData : [])
      } catch (fetchError) {
        console.error('[Dashboard] Failed to load data:', fetchError)
        if (isMounted) {
          setError('Unable to load competitions. Please try again.')
          setPendingCompetitions([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [learnerId])

  const handleNavigateToIntro = (competition) => {
    navigate(`/competitions/${competition.competition_id}/intro`, {
      state: { competition }
    })
  }

  if (!learnerId) {
    return (
      <TechBackdrop>
        <DashboardHero learnerName="Learner" />
        <p className="text-center text-red-200">
          Unable to determine learner context. Please refresh or log in again.
        </p>
      </TechBackdrop>
    )
  }

  return (
    <TechBackdrop>
      <DashboardHero learnerName={learnerProfile?.learner_name || effectiveUser?.name} />

      {loading && <p className="text-center text-white/70">Loading competitions…</p>}

      {error && !loading && (
        <p className="text-center text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && pendingCompetitions.length === 0 && (
        <div className="text-center text-white/70">
          <p>Complete a course to unlock your first AI competition!</p>
        </div>
      )}

      {!loading &&
        !error &&
        pendingCompetitions.map((competition) => (
          <CompetitionCard
            key={competition.competition_id}
            competition={competition}
            onStart={() => handleNavigateToIntro(competition)}
          />
        ))}
    </TechBackdrop>
  )
}

