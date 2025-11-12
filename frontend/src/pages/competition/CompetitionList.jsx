import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Users, 
  Clock, 
  Star, 
  Flame, 
  Crown,
  Target,
  Zap,
  Medal,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Award,
  Sparkles
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext.jsx'

function CompetitionList() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [competitions, setCompetitions] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = () => {
    // Mock competition data with gamification elements
    const mockCompetitions = [
      {
        id: 1,
        title: "JavaScript Master Challenge",
        description: "Test your JavaScript skills in this intense coding competition",
        type: "coding",
        difficulty: "expert",
        participants: 1247,
        maxParticipants: 2000,
        duration: "2 hours",
        startTime: "2024-01-15T10:00:00Z",
        endTime: "2024-01-15T12:00:00Z",
        status: "upcoming",
        prize: "Premium Course Access",
        points: 500,
        xpReward: 2500,
        badges: ["🔥 Hot Competition", "⭐ Featured"],
        leaderboard: [
          { rank: 1, name: "Alex Chen", score: 2850, avatar: "👨‍💻" },
          { rank: 2, name: "Sarah Kim", score: 2720, avatar: "👩‍💻" },
          { rank: 3, name: "Mike Johnson", score: 2650, avatar: "👨‍💻" }
        ],
        requirements: {
          level: "intermediate",
          courses: ["JavaScript Fundamentals"]
        }
      },
      {
        id: 2,
        title: "Algorithm Speed Run",
        description: "Fast-paced algorithm solving competition",
        type: "algorithm",
        difficulty: "hard",
        participants: 892,
        maxParticipants: 1000,
        duration: "1 hour",
        startTime: "2024-01-16T14:00:00Z",
        endTime: "2024-01-16T15:00:00Z",
        status: "active",
        prize: "Algorithm Master Badge",
        points: 300,
        xpReward: 1500,
        badges: ["⚡ Speed Challenge", "🧠 Brain Teaser"],
        leaderboard: [
          { rank: 1, name: "Emma Wilson", score: 1950, avatar: "👩‍💻" },
          { rank: 2, name: "David Lee", score: 1820, avatar: "👨‍💻" },
          { rank: 3, name: "Lisa Park", score: 1750, avatar: "👩‍💻" }
        ],
        requirements: {
          level: "advanced",
          courses: ["Data Structures & Algorithms"]
        }
      },
      {
        id: 3,
        title: "React Component Battle",
        description: "Build the most creative React components",
        type: "frontend",
        difficulty: "intermediate",
        participants: 634,
        maxParticipants: 800,
        duration: "3 hours",
        startTime: "2024-01-17T09:00:00Z",
        endTime: "2024-01-17T12:00:00Z",
        status: "upcoming",
        prize: "React Expert Certificate",
        points: 400,
        xpReward: 2000,
        badges: ["🎨 Creative", "⚛️ React"],
        leaderboard: [],
        requirements: {
          level: "intermediate",
          courses: ["React Fundamentals"]
        }
      },
      {
        id: 4,
        title: "Database Design Challenge",
        description: "Design optimal database schemas",
        type: "database",
        difficulty: "expert",
        participants: 456,
        maxParticipants: 500,
        duration: "2.5 hours",
        startTime: "2024-01-14T13:00:00Z",
        endTime: "2024-01-14T15:30:00Z",
        status: "completed",
        prize: "Database Architect Badge",
        points: 600,
        xpReward: 3000,
        badges: ["🏆 Completed", "💾 Database"],
        leaderboard: [
          { rank: 1, name: "Tom Anderson", score: 3200, avatar: "👨‍💻" },
          { rank: 2, name: "Anna Garcia", score: 3100, avatar: "👩‍💻" },
          { rank: 3, name: "Chris Brown", score: 2950, avatar: "👨‍💻" }
        ],
        requirements: {
          level: "expert",
          courses: ["Database Design"]
        }
      }
    ]

    setCompetitions(mockCompetitions)
    setLoading(false)
  }

  const getStatusColor = (status) => {
    if (theme === 'day-mode') {
      switch (status) {
        case 'active': return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        case 'upcoming': return 'bg-blue-100 text-blue-800 border border-blue-300'
        case 'completed': return 'bg-gray-100 text-gray-800 border border-gray-300'
        default: return 'bg-gray-100 text-gray-800 border border-gray-300'
      }
    } else {
      switch (status) {
        case 'active': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        case 'upcoming': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        case 'completed': return 'bg-gray-700 text-gray-300 border border-gray-600'
        default: return 'bg-gray-700 text-gray-300 border border-gray-600'
      }
    }
  }

  const getDifficultyColor = (difficulty) => {
    if (theme === 'day-mode') {
      switch (difficulty) {
        case 'easy': return 'bg-emerald-100 text-emerald-800'
        case 'intermediate': return 'bg-yellow-100 text-yellow-800'
        case 'hard': return 'bg-orange-100 text-orange-800'
        case 'expert': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    } else {
      switch (difficulty) {
        case 'easy': return 'bg-emerald-500/20 text-emerald-300'
        case 'intermediate': return 'bg-yellow-500/20 text-yellow-300'
        case 'hard': return 'bg-orange-500/20 text-orange-300'
        case 'expert': return 'bg-red-500/20 text-red-300'
        default: return 'bg-gray-700 text-gray-300'
      }
    }
  }

  const filteredCompetitions = competitions.filter(comp => {
    const matchesFilter = filter === 'all' || comp.status === filter
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: 'var(--gradient-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-4xl font-bold mb-2 flex items-center"
                style={{ 
                  background: 'var(--gradient-primary)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                <Trophy className="w-10 h-10 mr-3" style={{ color: 'var(--accent-gold)' }} />
                Competitions
              </h1>
              <p className={`text-lg ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                Compete with developers worldwide and climb the leaderboards!
              </p>
            </div>
            <button
              onClick={() => navigate('/competition/create')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${theme === 'day-mode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}
            >
              <Plus className="w-5 h-5" />
              <span>Create Competition</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'day-mode' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${theme === 'day-mode' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'upcoming'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-3 rounded-lg flex items-center space-x-2 font-medium transition-all duration-300 ${
                    filter === filterOption
                      ? theme === 'day-mode'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-emerald-500 text-white shadow-lg'
                      : theme === 'day-mode'
                        ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {filterOption === 'all' && <Filter className="w-4 h-4" />}
                  {filterOption === 'active' && <Zap className="w-4 h-4" />}
                  {filterOption === 'upcoming' && <Clock className="w-4 h-4" />}
                  <span className="capitalize">{filterOption}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitions.map((competition) => {
            const participationPercent = (competition.participants / competition.maxParticipants) * 100
            return (
              <div 
                key={competition.id} 
                className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${theme === 'day-mode' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}
                style={{ 
                  boxShadow: theme === 'day-mode' 
                    ? '0 10px 40px rgba(6, 95, 70, 0.15)' 
                    : '0 10px 40px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Competition Header with Gradient */}
                <div 
                  className="p-6 relative overflow-hidden"
                  style={{ 
                    background: theme === 'day-mode' 
                      ? 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)' 
                      : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                          {competition.title}
                        </h3>
                        <p className={`text-sm mb-3 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {competition.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(competition.status)}`}>
                          {competition.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(competition.difficulty)}`}>
                          {competition.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {competition.badges.map((badge, index) => (
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

                    {/* XP and Points Display */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--gradient-primary)' }}
                        >
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>XP Reward</p>
                          <p className={`font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                            {competition.xpReward?.toLocaleString() || competition.points * 5} XP
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--gradient-accent)' }}
                        >
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>Points</p>
                          <p className={`font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                            {competition.points} pts
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Participation Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${theme === 'day-mode' ? 'text-gray-700' : 'text-gray-300'}`}>
                          Participation
                        </span>
                        <span className={`text-xs font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                          {competition.participants}/{competition.maxParticipants}
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${theme === 'day-mode' ? 'bg-gray-200' : 'bg-gray-700'}`}>
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${participationPercent}%`,
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 0 10px rgba(6, 95, 70, 0.5)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Competition Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className={`w-4 h-4 ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={theme === 'day-mode' ? 'text-gray-700' : 'text-gray-300'}>
                          {competition.participants} joined
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={theme === 'day-mode' ? 'text-gray-700' : 'text-gray-300'}>
                          {competition.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Preview */}
                {competition.leaderboard.length > 0 && (
                  <div className={`p-6 ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700/50'}`}>
                    <h4 className={`font-semibold mb-3 flex items-center ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                      <Crown className="w-5 h-5 mr-2" style={{ color: 'var(--accent-gold)' }} />
                      Top Performers
                    </h4>
                    <div className="space-y-3">
                      {competition.leaderboard.slice(0, 3).map((player, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                            theme === 'day-mode' ? 'bg-white hover:bg-emerald-100' : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                index === 0 
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                                  : index === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                                  : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                              }`}
                            >
                              {index === 0 ? <Crown className="w-4 h-4" /> : index === 1 ? <Medal className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
                            </div>
                            <span className="text-xl">{player.avatar}</span>
                            <span className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                              {player.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className={`text-sm font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                              {player.score.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`p-6 ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/competitions/${competition.id}`)}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
                        theme === 'day-mode' 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      <span>
                        {competition.status === 'active' ? 'Join Now' : 
                         competition.status === 'upcoming' ? 'Register' : 'View Results'}
                      </span>
                    </button>
                    <button
                      onClick={() => navigate(`/competitions/${competition.id}/leaderboard`)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                        theme === 'day-mode'
                          ? 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                          : 'bg-emerald-600/20 text-emerald-100 hover:bg-emerald-600/30 border border-emerald-500/30'
                      }`}
                    >
                      <Medal className="w-4 h-4" />
                      <span>Leaderboard</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCompetitions.length === 0 && (
          <div className={`text-center py-12 rounded-2xl ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
            <Trophy className={`mx-auto h-16 w-16 mb-4 ${theme === 'day-mode' ? 'text-gray-400' : 'text-gray-600'}`} />
            <h3 className={`text-xl font-medium mb-2 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
              No competitions found
            </h3>
            <p className={`mb-4 ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => navigate('/competition/create')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                theme === 'day-mode' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
              }`}
            >
              Create First Competition
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitionList
