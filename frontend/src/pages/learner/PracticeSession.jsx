import { useState, useEffect } from 'react'
import { useSessionStore } from '../../store/sessionStore.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import { BookOpen, Lightbulb, CheckCircle, Clock, Target } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock question data
const mockQuestion = {
  id: '1',
  title: 'Python Hello World',
  description: 'Write a Python program that prints "Hello, World!" to the console.',
  type: 'code',
  difficulty: 'beginner',
  language: 'python',
  hints: [
    'Use the print() function to output text',
    'Remember to use quotes around your text',
    'Make sure to include the exclamation mark'
  ],
  testCases: [
    {
      input: '',
      expectedOutput: 'Hello, World!',
      description: 'Should print Hello, World!'
    }
  ],
  macroSkills: ['Programming Fundamentals'],
  microSkills: ['Python Basics'],
  nanoSkills: ['Print Statements'],
  courseId: '1',
  topicId: '1',
  createdBy: 'system',
  isAIGenerated: true,
  validationStatus: 'approved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export default function PracticeSession() {
  const [currentQuestion, setCurrentQuestion] = useState(mockQuestion)
  const [solution, setSolution] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [showHints, setShowHints] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { 
    currentSession, 
    submitAnswer, 
    requestHint, 
    completeSession,
    isLoading 
  } = useSessionStore()

  useEffect(() => {
    // Start timer
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async () => {
    if (!solution.trim()) {
      toast.error('Please write a solution before submitting')
      return
    }

    setIsSubmitting(true)
    try {
      await submitAnswer(currentQuestion.id, solution, timeSpent)
      toast.success('Answer submitted successfully!')
      // Move to next question or complete session
    } catch (error) {
      toast.error(error.message || 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestHint = async () => {
    if (hintsUsed >= 3) {
      toast.error('You have used all available hints')
      return
    }

    try {
      const hint = await requestHint(currentQuestion.id, hintsUsed + 1)
      setShowHints(prev => [...prev, hint])
      setHintsUsed(prev => prev + 1)
      toast.success(`Hint ${hintsUsed + 1} revealed!`)
    } catch (error) {
      toast.error(error.message || 'Failed to get hint')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Practice Session</span>
              </CardTitle>
              <CardDescription>
                {currentQuestion.type === 'code' ? 'Coding Exercise' : 'Theoretical Question'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>{currentQuestion.difficulty}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{currentQuestion.title}</CardTitle>
              <CardDescription>
                {currentQuestion.language && (
                  <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                    {currentQuestion.language}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">{currentQuestion.description}</p>
                
                {currentQuestion.testCases && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Test Cases:</h4>
                    {currentQuestion.testCases.map((testCase, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <strong>Expected Output:</strong> {testCase.expectedOutput}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Code Editor */}
          {currentQuestion.type === 'code' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Solution</CardTitle>
                <CardDescription>
                  Write your code solution below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Write your code here..."
                />
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Characters: {solution.length}
                  </div>
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={!solution.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hints Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Hints</span>
              </CardTitle>
              <CardDescription>
                {3 - hintsUsed} hints remaining
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {showHints.map((hint, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 font-semibold text-sm">
                        Hint {index + 1}:
                      </span>
                      <span className="text-sm text-gray-700">{hint}</span>
                    </div>
                  </div>
                ))}
                
                {hintsUsed < 3 && (
                  <Button
                    onClick={handleRequestHint}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Request Hint ({3 - hintsUsed} left)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle>Session Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Questions Completed</span>
                    <span>0/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <span>{formatTime(timeSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hints Used:</span>
                    <span>{hintsUsed}/3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button
                  onClick={() => toast.info('Session paused')}
                  variant="outline"
                  className="w-full"
                >
                  Pause Session
                </Button>
                <Button
                  onClick={() => completeSession()}
                  variant="destructive"
                  className="w-full"
                >
                  End Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}