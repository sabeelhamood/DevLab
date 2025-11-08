import React, { useState, useEffect } from 'react'
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
  Search
} from 'lucide-react'

function Leaderboard() {
  const { id } = useParams()
  const navigate = useNavigate()
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
        joinDate: "2024-01-10"
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
        joinDate: "2024-01-12"
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
        joinDate: "2024-01-08"
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
        joinDate: "2024-01-14"
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
        joinDate: "2024-01-13"
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
        joinDate: "2024-01-15"
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
        joinDate: "2024-01-11"
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
        joinDate: "2024-01-09"
      }
    ]

    setCompetition(mockCompetition)
    setLeaderboard(mockLeaderboard)
    setLoading(false)
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Medal className="w-6 h-6 text-orange-500" />
      default: return <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 text-sm font-bold rounded-full">{rank}</span>
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'Expert': return 'bg-red-100 text-red-800'
      case 'Advanced': return 'bg-orange-100 text-orange-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Beginner': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 80) return 'text-yellow-600'
    if (accuracy >= 70) return 'text-orange-600'
    return 'text-red-600'
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(`/competition/${id}`)}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Competition</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                  Leaderboard
                </h1>
                <p className="text-gray-600 mt-2">{competition.title}</p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{competition.participants}</div>
                <div className="text-sm text-gray-500">Participants</div>
              </div>
            </div>

            {/* Competition Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Active Players</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {leaderboard.filter(p => p.status === 'online').length}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Questions Solved</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {leaderboard.reduce((sum, p) => sum + p.questionsSolved, 0)}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900">Average Score</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Time Remaining</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{competition.timeRemaining}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All</span>
              </button>
              <button
                onClick={() => setFilter('online')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'online' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Online</span>
              </button>
              <button
                onClick={() => setFilter('streak')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'streak' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Hot Streak</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 text-indigo-600 mr-2" />
              Live Rankings
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredLeaderboard.map((player, index) => (
              <div key={player.rank} className={`p-6 hover:bg-gray-50 transition-colors ${
                player.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(player.rank)}
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{player.name}</h3>
                            <span className="text-lg">{player.country}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(player.level)}`}>
                              {player.level}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                player.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span>{player.status}</span>
                            </span>
                            {player.streak > 0 && (
                              <span className="flex items-center space-x-1 text-orange-600">
                                <Flame className="w-3 h-3" />
                                <span>{player.streak} streak</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{player.score.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{player.questionsSolved}/{competition.totalQuestions}</div>
                      <div className="text-sm text-gray-500">solved</div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getAccuracyColor(player.accuracy)}`}>
                        {player.accuracy}%
                      </div>
                      <div className="text-sm text-gray-500">accuracy</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{player.timeSpent}</div>
                      <div className="text-sm text-gray-500">time</div>
                    </div>
                  </div>
                </div>
                
                {/* Badges */}
                {player.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {player.badges.map((badge, badgeIndex) => (
                      <span key={badgeIndex} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        {badge}
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
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard

