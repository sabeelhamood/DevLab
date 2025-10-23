import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Clock, 
  Users, 
  Play, 
  Target, 
  Award,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react'

const Competition = () => {
  const [activeCompetitions, setActiveCompetitions] = useState([])
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState({})
  const [selectedCompetition, setSelectedCompetition] = useState(null)
  const [isParticipating, setIsParticipating] = useState(false)
  
  useEffect(() => {
    // Mock data
    setActiveCompetitions([
      {
        id: 1,
        title: "Weekly Coding Challenge",
        description: "Solve 3 algorithmic problems in 2 hours",
        participants: 156,
        duration: 120,
        difficulty: "Medium",
        prize: "Premium Subscription",
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    ])
    
    setUpcomingCompetitions([
      {
        id: 2,
        title: "Data Structures Mastery",
        description: "Advanced data structures and algorithms",
        participants: 0,
        duration: 180,
        difficulty: "Hard",
        prize: "Certificate + Badge",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ])
    
    setLeaderboard([
      { rank: 1, name: "Anonymous User", points: 2450, solved: 15, time: "1:23:45" },
      { rank: 2, name: "Anonymous User", points: 2380, solved: 14, time: "1:45:12" },
      { rank: 3, name: "Anonymous User", points: 2320, solved: 13, time: "1:52:30" },
      { rank: 4, name: "You", points: 2150, solved: 12, time: "2:15:20" },
      { rank: 5, name: "Anonymous User", points: 2080, solved: 11, time: "2:30:45" }
    ])
    
    setUserStats({
      totalCompetitions: 12,
      wins: 3,
      averageRank: 8.5,
      bestTime: "1:45:30",
      totalPoints: 12500
    })
  }, [])
  
  const handleJoinCompetition = (competition) => {
    setSelectedCompetition(competition)
    setIsParticipating(true)
  }
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }
  
  const formatDuration = (startTime, endTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (now < start) {
      const diff = start - now
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `Starts in ${hours}h ${minutes}m`
    } else if (now < end) {
      const diff = end - now
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `Ends in ${hours}h ${minutes}m`
    } else {
      return "Ended"
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Competitions</h1>
        <p className="text-purple-100">
          Compete with peers and climb the leaderboard!
        </p>
      </div>
      
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Competitions</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalCompetitions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wins</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.wins}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rank</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.averageRank}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best Time</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.bestTime}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Competitions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active Competitions</h2>
        </div>
        <div className="p-6">
          {activeCompetitions.length > 0 ? (
            <div className="space-y-4">
              {activeCompetitions.map((competition) => (
                <div key={competition.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{competition.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          competition.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          competition.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {competition.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{competition.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{competition.participants} participants</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(competition.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4" />
                          <span>{competition.prize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button
                        onClick={() => handleJoinCompetition(competition)}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Join Now</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {formatDuration(competition.startTime, competition.endTime)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active competitions at the moment</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Upcoming Competitions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Competitions</h2>
        </div>
        <div className="p-6">
          {upcomingCompetitions.length > 0 ? (
            <div className="space-y-4">
              {upcomingCompetitions.map((competition) => (
                <div key={competition.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{competition.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          competition.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          competition.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {competition.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{competition.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(competition.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4" />
                          <span>{competition.prize}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(competition.startTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button
                        disabled
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Coming Soon</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming competitions scheduled</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Global Leaderboard</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                entry.name === 'You' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.rank === 1 ? <Star className="w-4 h-4" /> : entry.rank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entry.name}</p>
                    <p className="text-sm text-gray-600">{entry.solved} problems solved</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{entry.points} pts</p>
                  <p className="text-sm text-gray-600">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Competition


