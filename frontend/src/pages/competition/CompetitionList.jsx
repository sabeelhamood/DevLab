import React, { useState, useEffect } from 'react'
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
  Filter
} from 'lucide-react'

function CompetitionList() {
  const navigate = useNavigate()
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
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                Competitions
              </h1>
              <p className="text-gray-600 mt-2">Compete with developers worldwide and climb the leaderboards!</p>
            </div>
            <button
              onClick={() => navigate('/competition/create')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Competition</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search competitions..."
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
                <Filter className="w-4 h-4" />
                <span>All</span>
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Active</span>
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Upcoming</span>
              </button>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitions.map((competition) => (
            <div key={competition.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Competition Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{competition.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{competition.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(competition.status)}`}>
                      {competition.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(competition.difficulty)}`}>
                      {competition.difficulty}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {competition.badges.map((badge, index) => (
                    <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Competition Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{competition.participants}/{competition.maxParticipants}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{competition.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">{competition.points} pts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700 truncate">{competition.prize}</span>
                  </div>
                </div>
              </div>

              {/* Leaderboard Preview */}
              {competition.leaderboard.length > 0 && (
                <div className="p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Crown className="w-4 h-4 text-yellow-500 mr-2" />
                    Top Performers
                  </h4>
                  <div className="space-y-2">
                    {competition.leaderboard.slice(0, 3).map((player, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                            {player.rank}
                          </div>
                          <span className="text-lg">{player.avatar}</span>
                          <span className="text-sm font-medium text-gray-900">{player.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-gray-900">{player.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-6 bg-white">
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/competition/${competition.id}`)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>
                      {competition.status === 'active' ? 'Join Now' : 
                       competition.status === 'upcoming' ? 'Register' : 'View Results'}
                    </span>
                  </button>
                  <button
                    onClick={() => navigate(`/competition/${competition.id}/leaderboard`)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Medal className="w-4 h-4" />
                    <span>Leaderboard</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCompetitions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => navigate('/competition/create')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
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

