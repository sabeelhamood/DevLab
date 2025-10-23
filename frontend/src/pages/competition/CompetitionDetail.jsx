import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Timer,
  Award,
  BarChart3,
  MessageCircle,
  Share2
} from 'lucide-react'

function CompetitionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [competition, setCompetition] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isParticipating, setIsParticipating] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userScore, setUserScore] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompetition()
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateLeaderboard()
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  const loadCompetition = () => {
    // Mock competition data
    const mockCompetition = {
      id: parseInt(id),
      title: "JavaScript Master Challenge",
      description: "Test your JavaScript skills in this intense coding competition",
      type: "coding",
      difficulty: "expert",
      participants: 1247,
      maxParticipants: 2000,
      duration: "2 hours",
      startTime: "2024-01-15T10:00:00Z",
      endTime: "2024-01-15T12:00:00Z",
      status: "active",
      prize: "Premium Course Access",
      points: 500,
      badges: ["🔥 Hot Competition", "⭐ Featured"],
      questions: [
        {
          id: 1,
          title: "Array Manipulation Master",
          description: "Implement a function that finds the longest increasing subsequence",
          difficulty: "hard",
          points: 100,
          timeLimit: 15,
          testCases: 5,
          category: "Algorithms"
        },
        {
          id: 2,
          title: "Async Programming Challenge",
          description: "Create a promise-based function that handles multiple API calls",
          difficulty: "medium",
          points: 80,
          timeLimit: 12,
          testCases: 4,
          category: "Async/Await"
        },
        {
          id: 3,
          title: "DOM Manipulation Expert",
          description: "Build a dynamic table with sorting and filtering capabilities",
          difficulty: "medium",
          points: 90,
          timeLimit: 20,
          testCases: 6,
          category: "DOM"
        }
      ],
      rules: [
        "No external libraries allowed",
        "Code must be syntactically correct",
        "All test cases must pass",
        "No cheating or collaboration"
      ]
    }

    setCompetition(mockCompetition)
    setTimeLeft(7200) // 2 hours in seconds
    setLoading(false)
  }

  const updateLeaderboard = () => {
    // Simulate real-time leaderboard updates
    const mockLeaderboard = [
      { rank: 1, name: "Alex Chen", score: 2850, avatar: "👨‍💻", status: "online", streak: 5 },
      { rank: 2, name: "Sarah Kim", score: 2720, avatar: "👩‍💻", status: "online", streak: 3 },
      { rank: 3, name: "Mike Johnson", score: 2650, avatar: "👨‍💻", status: "offline", streak: 2 },
      { rank: 4, name: "Emma Wilson", score: 2580, avatar: "👩‍💻", status: "online", streak: 4 },
      { rank: 5, name: "David Lee", score: 2450, avatar: "👨‍💻", status: "online", streak: 1 }
    ]
    setLeaderboard(mockLeaderboard)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleJoinCompetition = () => {
    setIsParticipating(true)
    setCurrentQuestion(competition.questions[0])
  }

  const handleStartQuestion = (question) => {
    setCurrentQuestion(question)
    navigate(`/competition/${id}/question/${question.id}`)
  }

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
          <button 
            onClick={() => navigate('/competition')}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Back to Competitions</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{competition.title}</h1>
                <p className="text-gray-600 mb-4">{competition.description}</p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {competition.badges.map((badge, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Competition Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-semibold text-gray-900">{competition.participants}</div>
                      <div className="text-gray-500">Participants</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-semibold text-gray-900">{competition.duration}</div>
                      <div className="text-gray-500">Duration</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold text-gray-900">{competition.points}</div>
                      <div className="text-gray-500">Points</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold text-gray-900">{competition.prize}</div>
                      <div className="text-gray-500">Prize</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{formatTime(timeLeft)}</div>
                  <div className="text-sm text-gray-500">Time Remaining</div>
                </div>
                
                {!isParticipating ? (
                  <button
                    onClick={handleJoinCompetition}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Join Competition</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{userScore}</div>
                    <div className="text-sm text-gray-500">Your Score</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Questions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-6 h-6 text-indigo-600 mr-2" />
                Competition Questions
              </h2>
              
              <div className="space-y-4">
                {competition.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{question.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{question.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{question.points} pts</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>{question.timeLimit} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{question.testCases} tests</span>
                          </span>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                            {question.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartQuestion(question)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-6 h-6 text-indigo-600 mr-2" />
                Competition Rules
              </h2>
              <ul className="space-y-2">
                {competition.rules.map((rule, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                Live Leaderboard
              </h3>
              
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {player.rank}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{player.avatar}</span>
                        <div>
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <div className={`w-2 h-2 rounded-full ${
                              player.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span>{player.status}</span>
                            {player.streak > 0 && (
                              <span className="flex items-center space-x-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span>{player.streak}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{player.score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competition Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
                Competition Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-semibold text-gray-900">{competition.participants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions Completed</span>
                  <span className="font-semibold text-gray-900">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold text-gray-900">1,850</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">78%</span>
                </div>
              </div>
            </div>

            {/* Social Features */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 text-indigo-600 mr-2" />
                Social
              </h3>
              
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Join Chat</span>
                </button>
                <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share Competition</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompetitionDetail

