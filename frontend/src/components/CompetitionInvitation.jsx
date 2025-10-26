import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Clock, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Star,
  Target,
  Zap,
  Crown,
  AlertCircle
} from 'lucide-react'

function CompetitionInvitation() {
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [])

  const loadInvitation = async () => {
    try {
      // Mock invitation data - replace with actual API call
      const mockInvitation = {
        id: 'inv-123',
        courseId: 'course-1',
        courseName: 'JavaScript Fundamentals',
        learnerId: 'learner-123',
        eligibleLearners: [
          {
            id: 'learner-456',
            isAnonymous: true,
            completedAt: '2024-01-15T10:30:00Z',
            skillLevel: 'intermediate'
          },
          {
            id: 'learner-789',
            isAnonymous: true,
            completedAt: '2024-01-15T09:15:00Z',
            skillLevel: 'advanced'
          },
          {
            id: 'learner-101',
            isAnonymous: true,
            completedAt: '2024-01-14T16:45:00Z',
            skillLevel: 'intermediate'
          }
        ],
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

      setInvitation(mockInvitation)
      setLoading(false)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (competitorId) => {
    setResponding(true)
    try {
      const response = await fetch(`/api/competitions/invitation/${invitation.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'accept',
          competitorId,
          courseId: invitation.courseId,
          courseName: invitation.courseName
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Navigate to competition
        navigate(`/competition/${result.data.competition.id}`)
      } else {
        alert('Failed to start competition. Please try again.')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  const handleDeclineInvitation = async () => {
    setResponding(true)
    try {
      await fetch(`/api/competitions/invitation/${invitation.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'decline'
        })
      })

      navigate('/competition')
    } catch (error) {
      console.error('Error declining invitation:', error)
    } finally {
      setResponding(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just completed'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Invitation Found</h2>
          <p className="text-gray-600">You don't have any pending competition invitations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Competition Invitation</h1>
            </div>
            <p className="text-indigo-100 text-lg">
              You've been invited to compete in a 2-player anonymous coding challenge!
            </p>
          </div>
        </div>

        {/* Competition Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 text-indigo-600 mr-2" />
            Competition Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-semibold text-gray-900">Course</div>
                  <div className="text-gray-600">{invitation.courseName}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-semibold text-gray-900">Players</div>
                  <div className="text-gray-600">2 players (anonymous)</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-semibold text-gray-900">Questions</div>
                  <div className="text-gray-600">3 coding challenges</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-semibold text-gray-900">Duration</div>
                  <div className="text-gray-600">30 minutes total</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-semibold text-gray-900">Difficulty</div>
                  <div className="text-gray-600">Medium level</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-semibold text-gray-900">Prize</div>
                  <div className="text-gray-600">Bragging rights & XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Competitors */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 text-indigo-600 mr-2" />
            Choose Your Opponent
          </h3>
          <p className="text-gray-600 mb-6">
            Select one of the learners who completed the same course to compete against. 
            Both players will remain anonymous during the competition.
          </p>
          
          <div className="space-y-4">
            {invitation.eligibleLearners.map((learner, index) => (
              <div key={learner.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-lg">
                        Player {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Anonymous Player {String.fromCharCode(65 + index)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed course {formatTimeAgo(learner.completedAt)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSkillLevelColor(learner.skillLevel)}`}>
                          {learner.skillLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAcceptInvitation(learner.id)}
                    disabled={responding}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Challenge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-indigo-600 mr-2" />
            Competition Rules
          </h3>
          
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Both players remain anonymous throughout the competition</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">3 coding questions with 10 minutes each</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Timer automatically submits your answer when time runs out</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Winner determined by correct answers and completion time</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">No external help or collaboration allowed</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDeclineInvitation}
            disabled={responding}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <XCircle className="w-5 h-5" />
            <span>Decline Invitation</span>
          </button>
        </div>

        {/* Expiration Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This invitation expires in 24 hours. Choose your opponent soon!
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompetitionInvitation
