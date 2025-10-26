import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Timer,
  Volume2,
  VolumeX,
  AlertCircle,
  Trophy,
  Target
} from 'lucide-react'

function CompetitionQuestion() {
  const { competitionId, questionId } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes default
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [competition, setCompetition] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const startSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const completeSoundRef = useRef(null)

  useEffect(() => {
    loadCompetitionData()
    initializeSounds()
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [competitionId, questionId])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          const newProgress = ((600 - newTime) / 600) * 100
          setProgress(newProgress)
          
          // Play countdown sound for last 10 seconds
          if (newTime <= 10 && newTime > 0 && soundEnabled) {
            playCountdownSound()
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            handleAutoSubmit()
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, timeLeft, soundEnabled])

  const initializeSounds = () => {
    // Create audio elements for different sounds
    startSoundRef.current = new Audio('/sounds/start.mp3')
    countdownSoundRef.current = new Audio('/sounds/countdown.mp3')
    completeSoundRef.current = new Audio('/sounds/complete.mp3')
    
    // Set volume
    [startSoundRef.current, countdownSoundRef.current, completeSoundRef.current].forEach(audio => {
      audio.volume = 0.5
    })
  }

  const playStartSound = () => {
    if (soundEnabled && startSoundRef.current) {
      startSoundRef.current.play().catch(console.error)
    }
  }

  const playCountdownSound = () => {
    if (soundEnabled && countdownSoundRef.current) {
      countdownSoundRef.current.play().catch(console.error)
    }
  }

  const playCompleteSound = () => {
    if (soundEnabled && completeSoundRef.current) {
      completeSoundRef.current.play().catch(console.error)
    }
  }

  const loadCompetitionData = async () => {
    try {
      // Mock competition data - replace with actual API call
      const mockCompetition = {
        id: competitionId,
        status: 'active',
        current_question: parseInt(questionId),
        question_count: 3,
        questions: [
          {
            id: '1',
            title: 'Array Manipulation Challenge',
            description: 'Write a function that finds the longest increasing subsequence in an array. The function should return the length of the subsequence.',
            difficulty: 'medium',
            timeLimit: 600,
            points: 100,
            testCases: [
              { input: '[1,3,2,4,5]', expected: 4 },
              { input: '[5,4,3,2,1]', expected: 1 },
              { input: '[1,2,3,4,5]', expected: 5 }
            ],
            starterCode: `function longestIncreasingSubsequence(arr) {
  // Your code here
  return 0;
}`
          },
          {
            id: '2',
            title: 'String Processing',
            description: 'Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.',
            difficulty: 'easy',
            timeLimit: 600,
            points: 80,
            testCases: [
              { input: '"A man a plan a canal Panama"', expected: true },
              { input: '"race a car"', expected: false },
              { input: '"Madam"', expected: true }
            ],
            starterCode: `function isPalindrome(s) {
  // Your code here
  return false;
}`
          },
          {
            id: '3',
            title: 'Dynamic Programming',
            description: 'Solve the classic "House Robber" problem. You are a robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected, so you cannot rob two adjacent houses.',
            difficulty: 'hard',
            timeLimit: 600,
            points: 150,
            testCases: [
              { input: '[2,7,9,3,1]', expected: 12 },
              { input: '[1,2,3,1]', expected: 4 },
              { input: '[2,1,1,2]', expected: 4 }
            ],
            starterCode: `function rob(nums) {
  // Your code here
  return 0;
}`
          }
        ]
      }

      setCompetition(mockCompetition)
      const currentQuestion = mockCompetition.questions.find(q => q.id === questionId)
      setQuestion(currentQuestion)
      setTimeLeft(currentQuestion?.timeLimit || 600)
      setAnswer(currentQuestion?.starterCode || '')
      setLoading(false)
    } catch (error) {
      console.error('Error loading competition:', error)
      setLoading(false)
    }
  }

  const handleStart = () => {
    setIsRunning(true)
    playStartSound()
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(question?.timeLimit || 600)
    setProgress(0)
    setAnswer(question?.starterCode || '')
  }

  const handleAutoSubmit = async () => {
    setIsRunning(false)
    setIsCompleted(true)
    playCompleteSound()
    
    // Auto-submit the current answer
    await submitAnswer()
  }

  const submitAnswer = async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          questionId,
          answer,
          timeSpent: (question?.timeLimit || 600) - timeLeft
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Move to next question or show results
        if (result.data.competitionFinished) {
          navigate(`/competition/${competitionId}/results`)
        } else {
          const nextQuestionId = parseInt(questionId) + 1
          navigate(`/competition/${competitionId}/question/${nextQuestionId}`)
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-600'
    if (timeLeft <= 180) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Not Found</h2>
          <p className="text-gray-600">The requested question could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(`/competition/${competitionId}`)}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Competition</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Question {questionId} of {competition?.question_count}</h1>
              <div className="flex items-center space-x-4">
                <div className={`text-3xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="flex space-x-2">
                  {!isRunning && !isCompleted && (
                    <button
                      onClick={handleStart}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </button>
                  )}
                  {isRunning && (
                    <button
                      onClick={handlePause}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  progress > 80 ? 'bg-red-500' : 
                  progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Question Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{question.title}</h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                  {question.difficulty}
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                  {question.points} pts
                </span>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">{question.description}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Cases:</h3>
                <div className="space-y-2">
                  {question.testCases.map((testCase, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Input:</span> {testCase.input}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Expected:</span> {testCase.expected}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Code Editor</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Time spent: {formatTime((question?.timeLimit || 600) - timeLeft)}</span>
                </div>
              </div>
              
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Write your solution here..."
                disabled={isCompleted}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Characters: {answer.length}
                </div>
                <button
                  onClick={submitAnswer}
                  disabled={isCompleted || !answer.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Answer</span>
                </button>
              </div>
            </div>

            {/* Timer Warning */}
            {timeLeft <= 60 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">
                    Warning: Less than 1 minute remaining!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompetitionQuestion
