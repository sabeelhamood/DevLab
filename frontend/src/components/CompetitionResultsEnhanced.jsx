import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Share2,
  Star,
  Zap,
  Award,
  BarChart3
} from 'lucide-react'

function CompetitionResults() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadResults()
  }, [competitionId])

  useEffect(() => {
    if (results && results.winner) {
      setShowCelebration(true)
      // Hide celebration after 3 seconds
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [results])

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setResults(result.data)
      } else {
        console.error('Failed to load results:', result.error)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-500" />
      default: return <Award className="w-6 h-6 text-indigo-500" />
    }
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800'
      case 2: return 'bg-gray-100 text-gray-800'
      default: return 'bg-indigo-100 text-indigo-800'
    }
  }

  const handlePlayAgain = () => {
    navigate('/competition')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Competition Results',
        text: `I just completed a coding competition! Check out my results.`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Results link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600">The competition results could not be loaded.</p>
        </div>
      </div>
    )
  }

  const currentUser = results.participants.find(p => p.isYou)
  const isWinner = currentUser?.rank === 1

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
            <div className="mb-4">
              {isWinner ? (
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
              ) : (
                <Medal className="w-16 h-16 text-gray-500 mx-auto animate-bounce" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isWinner ? 'Congratulations!' : 'Great Effort!'}
            </h2>
            <p className="text-gray-600">
              {isWinner ? 'You won the competition!' : 'Thanks for participating!'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/competition')}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Competitions</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Competition Results</h1>
            </div>
            <p className="text-indigo-100 text-lg">
              {isWinner ? 'You are the winner!' : 'Competition completed successfully!'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Winner Announcement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="mb-4">
                  {getRankIcon(results.winner === 'Player A' ? 1 : 2)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Winner: {results.winner}
                </h2>
                <p className="text-gray-600">
                  {results.winner === 'Player A' ? 
                    (currentUser?.playerId === 'Player A' ? 'That\'s you!' : 'Your opponent won.') :
                    (currentUser?.playerId === 'Player B' ? 'That\'s you!' : 'Your opponent won.')
                  }
                </p>
              </div>
            </div>

            {/* Final Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                Final Leaderboard
              </h3>
              
              <div className="space-y-4">
                {results.leaderboard.map((player, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    player.playerId === currentUser?.playerId ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(player.rank)}`}>
                          {getRankIcon(player.rank)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {player.playerId}
                            {player.playerId === currentUser?.playerId && (
                              <span className="ml-2 text-sm text-indigo-600">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Time: {formatTime(player.timeSpent)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{player.score}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 text-indigo-600 mr-2" />
                Question Breakdown
              </h3>
              
              <div className="space-y-3">
                {results.questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{question.title}</div>
                        <div className="text-sm text-gray-600">{question.difficulty} • {question.points} pts</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Performance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
                Your Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Final Rank</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRankColor(currentUser?.rank || 0)}`}>
                    #{currentUser?.rank || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Score</span>
                  <span className="font-semibold text-gray-900">{currentUser?.score || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Time Spent</span>
                  <span className="font-semibold text-gray-900">{formatTime(currentUser?.timeSpent || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions</span>
                  <span className="font-semibold text-gray-900">{results.questions.length}/3</span>
                </div>
              </div>
            </div>

            {/* Competition Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Competition Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">30 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions</span>
                  <span className="font-semibold text-gray-900">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Players</span>
                  <span className="font-semibold text-gray-900">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-green-600">Completed</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-indigo-600 mr-2" />
                Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Results</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompetitionResults
