import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Trophy, Users, Clock, Target, Award } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock competition data
const mockCompetition = {
  id: 'comp-1',
  courseId: '1',
  name: 'Weekly Python Challenge',
  description: 'Test your Python skills against other learners',
  maxParticipants: 2,
  questionCount: 3,
  timeLimit: 1800, // 30 minutes
  status: 'waiting',
  participants: [
    {
      id: 'part-1',
      learnerId: 'user-123',
      score: 0,
      rank: null,
      joinedAt: new Date().toISOString()
    }
  ],
  questions: [],
  leaderboard: [],
  createdAt: new Date().toISOString()
}

export default function Competition() {
  const [competition, setCompetition] = useState(mockCompetition)
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(1800)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  useEffect(() => {
    if (competition.status === 'active') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [competition.status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleJoinCompetition = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCompetition(prev => ({
        ...prev,
        status: 'waiting',
        participants: [
          ...prev.participants,
          {
            id: `part-${Date.now()}`,
            learnerId: 'current-user',
            score: 0,
            rank: null,
            joinedAt: new Date().toISOString()
          }
        ]
      }))
      
      toast.success('Joined competition! Waiting for other participants...')
    } catch (error: any) {
      toast.error('Failed to join competition')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartCompetition = () => {
    setCompetition(prev => ({
      ...prev,
      status: 'active',
      startedAt: new Date().toISOString()
    }))
    toast.success('Competition started!')
  }

  const handleSubmitAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
    
    if (currentQuestion < competition.questionCount - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleCompleteCompetition()
    }
  }

  const handleCompleteCompetition = () => {
    setCompetition(prev => ({
      ...prev,
      status: 'completed',
      endedAt: new Date().toISOString()
    }))
    toast.success('Competition completed!')
  }

  const handleTimeUp = () => {
    handleCompleteCompetition()
    toast.error('Time\'s up! Competition ended.')
  }

  if (competition.status === 'waiting') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>Join Competition</span>
            </CardTitle>
            <CardDescription>
              Compete against other learners in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {competition.participants.length}/{competition.maxParticipants} participants
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {competition.questionCount} questions
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {Math.floor(competition.timeLimit / 60)} minutes
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={handleJoinCompetition}
                  isLoading={isLoading}
                  disabled={competition.participants.length >= competition.maxParticipants}
                  className="w-full md:w-auto"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Join Competition'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (competition.status === 'active') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Competition Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  <span>{competition.name}</span>
                </CardTitle>
                <CardDescription>{competition.description}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-500">Time Remaining</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Question Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {competition.questionCount}</h3>
              <div className="text-sm text-gray-500">
                {Math.floor((currentQuestion / competition.questionCount) * 100)}% Complete
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestion + 1) / competition.questionCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mock Question */}
        <Card>
          <CardHeader>
            <CardTitle>Python Hello World</CardTitle>
            <CardDescription>
              Write a Python program that prints "Hello, World!" to the console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                className="w-full h-32 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Write your code here..."
                value={answers[currentQuestion] || ''}
                onChange={(e) => setAnswers(prev => {
                  const newAnswers = [...prev]
                  newAnswers[currentQuestion] = e.target.value
                  return newAnswers
                })}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Characters: {answers[currentQuestion]?.length || 0}
                </div>
                <Button
                  onClick={() => handleSubmitAnswer(answers[currentQuestion] || '')}
                  disabled={!answers[currentQuestion]?.trim()}
                >
                  {currentQuestion < competition.questionCount - 1 ? 'Next Question' : 'Submit Final Answer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (competition.status === 'completed') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-yellow-600" />
              <span>Competition Results</span>
            </CardTitle>
            <CardDescription>
              Here are the results of your competition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">2nd Place</div>
                <div className="text-lg text-gray-600">Great job! You scored 80 points</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-semibold">80/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Spent:</span>
                      <span className="font-semibold">15:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rank:</span>
                      <span className="font-semibold">2nd Place</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Leaderboard</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>🥇 Anonymous Player 1:</span>
                      <span className="font-semibold">95 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥈 You:</span>
                      <span className="font-semibold">80 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥉 Anonymous Player 3:</span>
                      <span className="font-semibold">75 points</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild>
                  <a href="/practice">Continue Learning</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competition</CardTitle>
          <CardDescription>
            Join anonymous competitions to test your skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <h3 className="text-xl font-semibold">Ready to Compete?</h3>
            <p className="text-gray-600">
              Join a competition with other learners who have completed the same course.
              Test your skills in real-time and see how you rank!
            </p>
            <Button onClick={handleJoinCompetition} size="lg">
              Find Competition
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

