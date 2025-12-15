import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { apiClient } from '../../services/api/client.js'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'
import { Trophy, Clock, Play, Target, Award } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext.jsx'

// Chatbot integration - External RAG service
// Using dummy token for UI/embed validation (authentication not in scope)
function useChatbotIntegration() {
  const { user } = useAuthStore()

  useEffect(() => {
    // Get real token if available, otherwise use dummy token
    const realToken = localStorage.getItem('auth-token')
    const token = realToken || 'dummy-token'
    
    // Use real user ID if available, otherwise use dummy user ID
    const userId = user?.id || 'dummy-user'
    const tenantId = user?.tenantId || 'devlab'

    const initChatbot = () => {
      if (window.initializeEducoreBot) {
        window.initializeEducoreBot({
          microservice: 'DEVLAB',
          userId: userId,
          token: token,
          tenantId: tenantId
        })
      } else {
        setTimeout(initChatbot, 100)
      }
    }

    if (!window.EDUCORE_BOT_LOADED) {
      const script = document.createElement('script')
      script.src = 'https://rag-production-3a4c.up.railway.app/embed/bot.js'
      script.async = true
      script.onload = () => {
        window.EDUCORE_BOT_LOADED = true
        initChatbot()
      }
      document.head.appendChild(script)
    } else {
      initChatbot()
    }
  }, [user])
}

const DEFAULT_FORCED_LEARNER_ID = '10000000-0000-0000-0000-000000000001'

const CompetitionCard = ({ competition, onStart }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#006666] rounded-xl shadow-lg shadow-black/30 p-6 mb-6 border border-[#004c4c] hover:shadow-xl hover:shadow-[#006666]/40 transition-all"
    whileHover={{ scale: 1.01 }}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-medium">Course</p>
        </div>
        <h3 className="text-2xl font-bold text-slate-100 mb-2">{competition.course_name}</h3>
        <div className="flex items-center space-x-2 text-slate-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          <p className="text-sm">
            Ready since {new Date(competition.created_at || competition.completed_at).toLocaleString()}
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className="bg-[#e6f4f4]/90 hover:bg-[#e6f4f4] text-slate-900 px-6 py-3 rounded-lg flex items-center space-x-2 font-semibold transition-all hover:scale-[1.02] focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
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
  const { theme } = useTheme()
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

  // Initialize external chatbot service
  useChatbotIntegration()

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
      <div
        className={`min-h-screen py-10 px-4 transition-colors duration-300 ${
          theme === 'day-mode'
            ? 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900'
            : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl shadow-lg p-6 border transition-colors duration-300 ${
              theme === 'day-mode'
                ? 'bg-white/90 border-slate-200 shadow-slate-300/60'
                : 'bg-slate-900/70 border-slate-800 shadow-black/30'
            }`}
          >
            <p className="text-center text-red-400 font-medium">
              Unable to determine learner context. Please refresh or log in again.
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen py-10 px-4 transition-colors duration-300 ${
        theme === 'day-mode'
          ? 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            className={`rounded-xl shadow-lg p-6 border transition-colors duration-300 ${
              theme === 'day-mode'
                ? 'bg-white/90 border-slate-200 shadow-slate-300/60'
                : 'bg-slate-900/70 border-slate-800 shadow-black/30'
            }`}
          >
            <div className="mb-4">
              <p
                className={`text-xs uppercase tracking-[0.4em] font-medium mb-2 ${
                  theme === 'day-mode' ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                AI Competition Hub
              </p>
              <h1
                className={`text-3xl font-bold mb-2 ${
                  theme === 'day-mode' ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                Welcome, {learnerProfile?.learner_name || effectiveUser?.name || 'Learner'}!
              </h1>
              <p className={theme === 'day-mode' ? 'text-slate-600' : 'text-slate-300'}>
                Complete courses, unlock competitions, and challenge the DevLab AI.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Competitions Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div
            className={`rounded-xl shadow-lg p-6 border transition-colors duration-300 ${
              theme === 'day-mode'
                ? 'bg-white/90 border-slate-200 shadow-slate-300/60'
                : 'bg-slate-900/70 border-slate-800 shadow-black/30'
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center ${
                theme === 'day-mode' ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <Trophy className="w-6 h-6 text-emerald-400 mr-2" />
              Available Competitions
            </h2>

            {loading && (
              <div className="text-center py-8">
                <p className={theme === 'day-mode' ? 'text-slate-600' : 'text-slate-300'}>
                  Loading competitions…
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-8">
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            )}

            {!loading && !error && pendingCompetitions.length === 0 && (
              <div className="text-center py-12">
                <Award
                  className={`w-16 h-16 mx-auto mb-4 ${
                    theme === 'day-mode' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
                <p
                  className={`text-lg font-medium mb-2 ${
                    theme === 'day-mode' ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  No competitions available
                </p>
                <p className={theme === 'day-mode' ? 'text-slate-500' : 'text-slate-400'}>
                  Complete a course to unlock your first AI competition!
                </p>
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
        </motion.div>
      </div>

      {/* External RAG Chatbot Container */}
      <div id="edu-bot-container"></div>
    </div>
  )
}

