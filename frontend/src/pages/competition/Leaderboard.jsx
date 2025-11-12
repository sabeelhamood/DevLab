import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Flame, 
  TrendingUp,
  Users,
  Clock,
  Target,
  Award,
  BarChart3,
  Zap,
  ArrowLeft,
  Filter,
  Search,
  Sparkles
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext.jsx'

function Leaderboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [leaderboard, setLeaderboard] = useState([])
  const [competition, setCompetition] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [id])

  const loadLeaderboard = () => {
    // Mock leaderboard data with gamification elements
    const mockCompetition = {
      id: parseInt(id),
      title: "JavaScript Master Challenge",
      status: "active",
      participants: 1247,
      totalQuestions: 5,
      timeRemaining: "1h 23m"
    }

    const mockLeaderboard = [
      {
        rank: 1,
        name: "Alex Chen",
        score: 2850,
        avatar: "👨‍💻",
        status: "online",
        streak: 5,
        questionsSolved: 5,
        accuracy: 95,
        timeSpent: "1h 45m",
        badges: ["🔥 Hot Streak", "⚡ Speed Demon", "🎯 Perfect Score"],
        country: "🇺🇸",
        level: "Expert",
        joinDate: "2024-01-10",
        xp: 12500
      },
      {
        rank: 2,
        name: "Sarah Kim",
        score: 2720,
        avatar: "👩‍💻",
        status: "online",
        streak: 3,
        questionsSolved: 4,
        accuracy: 88,
        timeSpent: "1h 52m",
        badges: ["⚡ Speed Demon", "🎯 Sharp Shooter"],
        country: "🇰🇷",
        level: "Advanced",
        joinDate: "2024-01-12",
        xp: 11200
      },
      {
        rank: 3,
        name: "Mike Johnson",
        score: 2650,
        avatar: "👨‍💻",
        status: "offline",
        streak: 2,
        questionsSolved: 4,
        accuracy: 82,
        timeSpent: "2h 15m",
        badges: ["🎯 Sharp Shooter"],
        country: "🇬🇧",
        level: "Advanced",
        joinDate: "2024-01-08",
        xp: 10800
      },
      {
        rank: 4,
        name: "Emma Wilson",
        score: 2580,
        avatar: "👩‍💻",
        status: "online",
        streak: 4,
        questionsSolved: 3,
        accuracy: 90,
        timeSpent: "1h 38m",
        badges: ["⚡ Speed Demon", "🎯 Sharp Shooter"],
        country: "🇦🇺",
        level: "Intermediate",
        joinDate: "2024-01-14",
        xp: 9800
      },
      {
        rank: 5,
        name: "David Lee",
        score: 2450,
        avatar: "👨‍💻",
        status: "online",
        streak: 1,
        questionsSolved: 3,
        accuracy: 75,
        timeSpent: "2h 30m",
        badges: ["🎯 Sharp Shooter"],
        country: "🇨🇦",
        level: "Intermediate",
        joinDate: "2024-01-13",
        xp: 9200
      },
      {
        rank: 6,
        name: "Lisa Park",
        score: 2320,
        avatar: "👩‍💻",
        status: "offline",
        streak: 0,
        questionsSolved: 2,
        accuracy: 85,
        timeSpent: "1h 20m",
        badges: [],
        country: "🇯🇵",
        level: "Intermediate",
        joinDate: "2024-01-15",
        xp: 8500
      },
      {
        rank: 7,
        name: "Tom Anderson",
        score: 2180,
        avatar: "👨‍💻",
        status: "online",
        streak: 2,
        questionsSolved: 2,
        accuracy: 78,
        timeSpent: "2h 45m",
        badges: ["🎯 Sharp Shooter"],
        country: "🇩🇪",
        level: "Beginner",
        joinDate: "2024-01-11",
        xp: 7800
      },
      {
        rank: 8,
        name: "Anna Garcia",
        score: 2050,
        avatar: "👩‍💻",
        status: "online",
        streak: 1,
        questionsSolved: 2,
        accuracy: 70,
        timeSpent: "3h 10m",
        badges: [],
        country: "🇪🇸",
        level: "Beginner",
        joinDate: "2024-01-09",
        xp: 7200
      }
    ]

    setCompetition(mockCompetition)
    setLeaderboard(mockLeaderboard)
    setLoading(false)
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: 
        return (
          <div className="relative">
            <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        )
      case 2: 
        return <Medal className="w-7 h-7 text-gray-400" />
      case 3: 
        return <Medal className="w-7 h-7 text-orange-500" />
      default: 
        return (
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm"
            style={{ background: 'var(--gradient-primary)', color: 'white' }}
          >
            {rank}
          </div>
        )
    }
  }

  const getLevelColor = (level) => {
    if (theme === 'day-mode') {
      switch (level) {
        case 'Expert': return 'bg-red-100 text-red-800 border border-red-300'
        case 'Advanced': return 'bg-orange-100 text-orange-800 border border-orange-300'
        case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        case 'Beginner': return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        default: return 'bg-gray-100 text-gray-800 border border-gray-300'
      }
    } else {
      switch (level) {
        case 'Expert': return 'bg-red-500/20 text-red-300 border border-red-500/30'
        case 'Advanced': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
        case 'Intermediate': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        case 'Beginner': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        default: return 'bg-gray-700 text-gray-300 border border-gray-600'
      }
    }
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return theme === 'day-mode' ? 'text-emerald-600' : 'text-emerald-400'
    if (accuracy >= 80) return theme === 'day-mode' ? 'text-yellow-600' : 'text-yellow-400'
    if (accuracy >= 70) return theme === 'day-mode' ? 'text-orange-600' : 'text-orange-400'
    return theme === 'day-mode' ? 'text-red-600' : 'text-red-400'
  }

  const filteredLeaderboard = leaderboard.filter(player => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'online' && player.status === 'online') ||
                         (filter === 'streak' && player.streak > 0)
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: 'var(--gradient-primary)' }}></div>
      </div>
    )
  }

  const activePlayers = leaderboard.filter(p => p.status === 'online').length
  const totalSolved = leaderboard.reduce((sum, p) => sum + p.questionsSolved, 0)
  const avgScore = Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)

  return (
    <div className={`min-h-screen py-8 ${theme === 'day-mode' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(`/competitions/${id}`)}
            className={`mb-4 font-medium flex items-center space-x-2 transition-all duration-300 hover:scale-105 ${
              theme === 'day-mode' 
                ? 'text-emerald-600 hover:text-emerald-700' 
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Competition</span>
          </button>
          
          <div className={`rounded-2xl shadow-xl p-6 ${theme === 'day-mode' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
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
                  Leaderboard
                </h1>
                <p className={`text-lg ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {competition.title}
                </p>
              </div>
              
              <div className={`text-right p-4 rounded-xl ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
                <div 
                  className="text-3xl font-bold"
                  style={{ 
                    background: 'var(--gradient-primary)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {competition.participants.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Participants
                </div>
              </div>
            </div>

            {/* Competition Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-blue-50' : 'bg-blue-500/20'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className={`w-5 h-5 ${theme === 'day-mode' ? 'text-blue-600' : 'text-blue-400'}`} />
                  <span className={`font-semibold ${theme === 'day-mode' ? 'text-blue-900' : 'text-blue-300'}`}>
                    Active Players
                  </span>
                </div>
                <div className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-blue-900' : 'text-white'}`}>
                  {activePlayers}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-emerald-500/20'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className={`w-5 h-5 ${theme === 'day-mode' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span className={`font-semibold ${theme === 'day-mode' ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    Questions Solved
                  </span>
                </div>
                <div className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-emerald-900' : 'text-white'}`}>
                  {totalSolved}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-yellow-50' : 'bg-yellow-500/20'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className={`w-5 h-5 ${theme === 'day-mode' ? 'text-yellow-600' : 'text-yellow-400'}`} />
                  <span className={`font-semibold ${theme === 'day-mode' ? 'text-yellow-900' : 'text-yellow-300'}`}>
                    Average Score
                  </span>
                </div>
                <div className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-yellow-900' : 'text-white'}`}>
                  {avgScore.toLocaleString()}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${theme === 'day-mode' ? 'bg-purple-50' : 'bg-purple-500/20'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className={`w-5 h-5 ${theme === 'day-mode' ? 'text-purple-600' : 'text-purple-400'}`} />
                  <span className={`font-semibold ${theme === 'day-mode' ? 'text-purple-900' : 'text-purple-300'}`}>
                    Time Remaining
                  </span>
                </div>
                <div className={`text-2xl font-bold ${theme === 'day-mode' ? 'text-purple-900' : 'text-white'}`}>
                  {competition.timeRemaining}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${theme === 'day-mode' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'day-mode' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'day-mode' 
                    ? 'bg-white border-gray-300 text-gray-900' 
                    : 'bg-gray-800 border-gray-600 text-white'
                }`}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'online', 'streak'].map((filterOption) => (
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
                  {filterOption === 'all' && <Users className="w-4 h-4" />}
                  {filterOption === 'online' && <Zap className="w-4 h-4" />}
                  {filterOption === 'streak' && <Flame className="w-4 h-4" />}
                  <span className="capitalize">{filterOption === 'all' ? 'All' : filterOption === 'online' ? 'Online' : 'Hot Streak'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${theme === 'day-mode' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
          <div className={`p-6 border-b ${theme === 'day-mode' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'}`}>
            <h2 
              className="text-2xl font-bold flex items-center"
              style={{ 
                background: 'var(--gradient-primary)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <BarChart3 className="w-6 h-6 mr-2" style={{ color: 'var(--gradient-primary)' }} />
              Live Rankings
            </h2>
          </div>
          
          <div className="divide-y" style={{ borderColor: theme === 'day-mode' ? '#e5e7eb' : '#374151' }}>
            {filteredLeaderboard.map((player, index) => (
              <div 
                key={player.rank} 
                className={`p-6 transition-all duration-300 hover:scale-[1.02] ${
                  player.rank <= 3 
                    ? theme === 'day-mode'
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                      : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10'
                    : theme === 'day-mode'
                      ? 'hover:bg-gray-50'
                      : 'hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-4">
                      {getRankIcon(player.rank)}
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{player.avatar}</span>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-bold text-lg ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                              {player.name}
                            </h3>
                            <span className="text-xl">{player.country}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(player.level)}`}>
                              {player.level}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`flex items-center space-x-1 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${
                                player.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                              }`}></div>
                              <span className="capitalize">{player.status}</span>
                            </span>
                            {player.streak > 0 && (
                              <span className="flex items-center space-x-1 text-orange-500 font-medium">
                                <Flame className="w-4 h-4" />
                                <span>{player.streak} streak</span>
                              </span>
                            )}
                            <span className={`flex items-center space-x-1 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
                              <Star className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                              <span>{player.xp?.toLocaleString() || '0'} XP</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div 
                        className="text-3xl font-bold"
                        style={{ 
                          background: 'var(--gradient-primary)', 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {player.score.toLocaleString()}
                      </div>
                      <div className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>
                        points
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                        {player.questionsSolved}/{competition.totalQuestions}
                      </div>
                      <div className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>
                        solved
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getAccuracyColor(player.accuracy)}`}>
                        {player.accuracy}%
                      </div>
                      <div className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>
                        accuracy
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
                        {player.timeSpent}
                      </div>
                      <div className={`text-sm font-medium ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>
                        time
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Badges */}
                {player.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {player.badges.map((badge, badgeIndex) => (
                      <span 
                        key={badgeIndex} 
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
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredLeaderboard.length === 0 && (
          <div className={`text-center py-12 rounded-2xl ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
            <Trophy className={`mx-auto h-16 w-16 mb-4 ${theme === 'day-mode' ? 'text-gray-400' : 'text-gray-600'}`} />
            <h3 className={`text-xl font-medium mb-2 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>
              No players found
            </h3>
            <p className={theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
