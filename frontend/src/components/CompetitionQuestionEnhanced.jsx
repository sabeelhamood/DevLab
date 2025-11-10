import { useState, useEffect, useRef, useMemo } from 'react'
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
  Sparkles,
  AlertCircle,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import confetti from 'canvas-confetti'
import { playFeedback, preloadFeedbackSounds } from '../utils/soundManager.js'

const Feedback = ({ isCorrect, points }) => {
  useEffect(() => {
    if (isCorrect) {
      confetti({
        particleCount: 80,
        spread: 65,
        ticks: 180,
        origin: { y: 0.7 }
      })
    }
  }, [isCorrect])

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-lg border border-gray-100"
    >
      {isCorrect ? (
        <CheckCircle className="w-7 h-7 text-[#4caf50]" />
      ) : (
        <XCircle className="w-7 h-7 text-[#f44336]" />
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-[#333333]">{isCorrect ? 'Nice work!' : 'Keep going!'}</span>
        <span className={`text-lg font-semibold ${isCorrect ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
          {`${isCorrect ? '+' : ''}${points ?? 0} pts`}
        </span>
      </div>
    </motion.div>
  )
}

const FloatingPoints = ({ points }) => (
  <motion.div
    initial={{ opacity: 0, y: 0 }}
    animate={{ opacity: 1, y: -24 }}
    exit={{ opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="absolute right-6 -top-2 text-lg font-bold text-[#ff9800] drop-shadow"
  >
    +{points} pts
  </motion.div>
)

const ProgressPointsDisplay = ({ progressPercent, scorePercent, score, totalPoints }) => (
  <div className="flex items-center gap-6">
    <div className="w-24 h-24 relative">
      <CircularProgressbar
        value={progressPercent}
        text={`${progressPercent}%`}
        styles={buildStyles({
          textSize: '14px',
          pathColor: '#4caf50',
          textColor: '#333333',
          trailColor: '#e5e7eb'
        })}
      />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#333333]/70">
        Progress
      </div>
    </div>
    <div className="w-24 h-24 relative">
      <CircularProgressbar
        value={scorePercent}
        text={`${score}`}
        styles={buildStyles({
          textSize: '16px',
          pathColor: '#ff9800',
          textColor: '#333333',
          trailColor: '#f0f0f0'
        })}
      />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#333333]/70">
        Points
      </div>
      <div className="absolute inset-x-0 -bottom-5 text-center text-xs text-[#333333]/70">
        {totalPoints ? `of ${totalPoints}` : 'No total set'}
      </div>
    </div>
  </div>
)

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
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [questionProgress, setQuestionProgress] = useState(0)
  const [lastPointsAwarded, setLastPointsAwarded] = useState(0)
  
  const timerRef = useRef(null)
  const startSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const completeSoundRef = useRef(null)
  const feedbackTimeoutRef = useRef(null)

  useEffect(() => {
    loadCompetitionData()
    initializeSounds()
    preloadFeedbackSounds()
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
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

  useEffect(() => {
    if (!competition?.questions?.length) return

    const currentIndex = competition.questions.findIndex((q) => q.id === questionId)
    const percent = competition.question_count
      ? Math.round(((currentIndex >= 0 ? currentIndex : 0) / competition.question_count) * 100)
      : 0
    setQuestionProgress(percent)
  }, [competition, questionId])

  const currentQuestionIndex = useMemo(() => {
    if (!competition?.questions?.length) return 0
    const index = competition.questions.findIndex((q) => q.id === questionId)
    return index >= 0 ? index : 0
  }, [competition, questionId])

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
        const isCorrect = result.data?.isCorrect ?? true
        const pointsAwarded =
          result.data?.pointsAwarded ?? result.data?.points ?? question?.points ?? 0

        setLastPointsAwarded(pointsAwarded)
        setScore((prev) => (isCorrect ? prev + pointsAwarded : prev))
        setFeedback({ isCorrect, points: pointsAwarded })
        playFeedback(isCorrect)

        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current)
        }
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 2500)

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
    if (timeLeft <= 60) return 'text-[#f44336]'
    if (timeLeft <= 180) return 'text-[#ff9800]'
    return 'text-[#4caf50]'
  }

  const questionCardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const questionCardTransition = { duration: 0.4 }

  const completionPercent = competition?.question_count
    ? Math.round(((currentQuestionIndex + (isCompleted ? 1 : 0)) / competition.question_count) * 100)
    : questionProgress

  const totalPossiblePoints = useMemo(() => {
    if (!competition?.questions?.length) return 0
    return competition.questions.reduce((sum, q) => sum + (q.points || 0), 0)
  }, [competition])

  const scorePercent = useMemo(() => {
    if (!totalPossiblePoints) return 0
    return Math.min(100, Math.round((score / totalPossiblePoints) * 100))
  }, [score, totalPossiblePoints])

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
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Question Not Found</h2>
          <p className="text-[#333333]">The requested question could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] py-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <motion.button 
              onClick={() => navigate(`/competition/${competitionId}`)}
              className="text-[#333333] font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Competition</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white border border-[#f0f0f0] text-[#333333]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#333333]">Question {questionId} of {competition?.question_count}</h1>
              <ProgressPointsDisplay
                progressPercent={completionPercent}
                scorePercent={scorePercent}
                score={score}
                totalPoints={totalPossiblePoints}
              />
              <div className="flex items-center space-x-4">
                <div className={`text-3xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="flex space-x-2">
                  {!isRunning && !isCompleted && (
                    <motion.button
                      onClick={handleStart}
                      className="bg-[#4caf50] text-white px-4 py-2 rounded-lg hover:bg-[#43a047] flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </motion.button>
                  )}
                  {isRunning && (
                    <motion.button
                      onClick={handlePause}
                      className="bg-[#ff9800] text-white px-4 py-2 rounded-lg hover:bg-[#fb8c00] flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </motion.button>
                  )}
                  <motion.button
                    onClick={handleReset}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-[#f0f0f0] rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  progress > 80 ? 'bg-[#f44336]' : 
                  progress > 60 ? 'bg-[#ff9800]' : 'bg-[#4caf50]'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Question Panel */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {question && (
                <motion.div
                  key={question.id}
                  variants={questionCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={questionCardTransition}
                  className="bg-white rounded-xl shadow-lg p-6 relative text-[#333333]"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-[#333333]">{question.title}</h2>
                    <span className="px-3 py-1 rounded-full text-sm capitalize border border-[#333333] text-[#333333] bg-[#f0f0f0]">
                      {question.difficulty}
                    </span>
                    <span
                      className="px-3 py-1 text-sm rounded-full flex items-center gap-1"
                      style={{ backgroundColor: '#fff3e0', color: '#ff9800' }}
                    >
                      <Sparkles className="w-4 h-4" color="#ff9800" />
                      {question.points} pts
                    </span>
                  </div>
                  
                  <div className="prose max-w-none text-[#333333]">
                    <p className="mb-4">{question.description}</p>
                    
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">Test Cases:</h3>
                    <div className="space-y-2">
                      {question.testCases.map((testCase, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: '#f0f0f0', color: '#333333' }}
                        >
                          <div className="text-sm">
                            <span className="font-medium text-[#333333]">Input:</span> {testCase.input}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-[#333333]">Expected:</span> {testCase.expected}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {feedback?.isCorrect && lastPointsAwarded > 0 && (
                      <FloatingPoints points={lastPointsAwarded} />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Code Editor Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#333333]">Code Editor</h3>
                <div className="flex items-center space-x-2 text-[#333333]">
                  <Clock className="w-5 h-5" color="#333333" />
                  <span className="text-sm">Time spent: {formatTime((question?.timeLimit || 600) - timeLeft)}</span>
                </div>
              </div>
              
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-96 p-4 border border-[#f0f0f0] rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-[#4caf50] focus:border-transparent text-[#333333]"
                placeholder="Write your solution here..."
                disabled={isCompleted}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-[#333333]">
                  Characters: {answer.length}
                </div>
                <motion.button
                  onClick={submitAnswer}
                  disabled={isCompleted || !answer.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  whileHover={{ scale: isCompleted || !answer.trim() ? 1 : 1.05 }}
                  whileTap={{ scale: isCompleted || !answer.trim() ? 1 : 0.95 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Answer</span>
                </motion.button>
              </div>
            </div>

            {/* Timer Warning */}
            {timeLeft <= 60 && (
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: '#fdecea', border: '1px solid #f44336', color: '#f44336' }}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" color="#f44336" />
                  <span className="font-medium">
                    Warning: Less than 1 minute remaining!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <AnimatePresence>
          {feedback && (
            <Feedback isCorrect={feedback.isCorrect} points={feedback.points} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CompetitionQuestion
