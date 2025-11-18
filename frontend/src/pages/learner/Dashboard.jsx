import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { apiClient } from '../../services/api/client.js'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'
import { Trophy, Clock, Play, Target, Award } from 'lucide-react'

const DEFAULT_FORCED_LEARNER_ID = '2080d04e-9e6f-46b8-a602-8eb67b009e88'

const CompetitionCard = ({ competition, onStart }) => (
  <motion.div
    layout
    className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 hover:shadow-xl transition-shadow"
    whileHover={{ scale: 1.01 }}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-medium">Course</p>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{competition.course_name}</h3>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <p className="text-sm">
            Ready since {new Date(competition.created_at || competition.completed_at).toLocaleString()}
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 font-semibold transition-colors"
      >
        <Play className="w-5 h-5" />
        <span>Start Competition</span>
      </button>
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-center text-red-600 font-medium">
              Unable to determine learner context. Please refresh or log in again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500 font-medium mb-2">AI Competition Hub</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {learnerProfile?.learner_name || effectiveUser?.name || 'Learner'}!
              </h1>
              <p className="text-gray-600">
                Complete courses, unlock competitions, and challenge the DevLab AI.
              </p>
            </div>
          </div>
        </div>

        {/* Competitions Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-6 h-6 text-indigo-600 mr-2" />
              Available Competitions
            </h2>

            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading competitions…</p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-8">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {!loading && !error && pendingCompetitions.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium mb-2">No competitions available</p>
                <p className="text-gray-500">Complete a course to unlock your first AI competition!</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}

