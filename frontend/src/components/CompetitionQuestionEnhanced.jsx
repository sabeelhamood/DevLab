import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  const { id: competitionId, questionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const learnerIdFromQuery = useMemo(() => queryParams.get('learnerId'), [queryParams])
  const storedLearnerId = useMemo(() => {
    try {
      return localStorage.getItem('learnerId')
    } catch (error) {
      console.warn('Unable to read learnerId from localStorage:', error)
      return null
    }
  }, [])
  const activeLearnerId = learnerIdFromQuery || storedLearnerId || null
  console.log('Active learner ID:', activeLearnerId)
  const apiBase = useMemo(() => {
    const rawBase =
      import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'
    return rawBase.replace(/\/$/, '')
  }, [])
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes default
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [competition, setCompetition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
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
    if (learnerIdFromQuery) {
      try {
        localStorage.setItem('learnerId', learnerIdFromQuery)
      } catch (error) {
        console.warn('Unable to persist learnerId to localStorage:', error)
      }
    }
  }, [learnerIdFromQuery])

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
  }, [competitionId, questionId, activeLearnerId])

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

    let currentIndex = competition.questions.findIndex((q) => q.id === questionId)
    if (currentIndex < 0) {
      currentIndex = competition.questions.findIndex((q) => q.id === `${questionId}`)
    }
    if (currentIndex < 0) {
      currentIndex = competition.questions.findIndex((q) => q.id === `q${questionId}`)
    }
    if (currentIndex < 0) {
      const numeric = Number(questionId)
      if (!Number.isNaN(numeric) && numeric > 0) {
        currentIndex = numeric - 1
      }
    }
    const percent = competition.question_count
      ? Math.round(((currentIndex >= 0 ? currentIndex : 0) / competition.question_count) * 100)
      : 0
    setQuestionProgress(percent)
  }, [competition, questionId])

  const currentQuestionIndex = useMemo(() => {
    if (!competition?.questions?.length) return 0
    let index = competition.questions.findIndex((q) => q.id === questionId)
    if (index < 0) {
      index = competition.questions.findIndex((q) => q.id === `${questionId}`)
    }
    if (index < 0) {
      index = competition.questions.findIndex((q) => q.id === `q${questionId}`)
    }
    if (index < 0) {
      const numeric = Number(questionId)
      if (!Number.isNaN(numeric) && numeric > 0) {
        index = numeric - 1
      }
    }
    return index >= 0 ? index : 0
  }, [competition, questionId])

  const initializeSounds = () => {
    // Create audio elements for different sounds
    startSoundRef.current = new Audio('/sounds/start.mp3')
    countdownSoundRef.current = new Audio('/sounds/countdown.mp3')
    completeSoundRef.current = new Audio('/sounds/complete.mp3')
    
    // Set volume
    const sounds = [startSoundRef.current, countdownSoundRef.current, completeSoundRef.current]
    sounds.filter(Boolean).forEach(audio => {
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

  const parseQuestions = (rawQuestions) => {
    if (!rawQuestions) {
      return []
    }

    if (Array.isArray(rawQuestions)) {
      return rawQuestions
    }

    if (typeof rawQuestions === 'string') {
      try {
        const parsed = JSON.parse(rawQuestions)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.warn('Unable to parse questions JSON:', error)
        return []
      }
    }

    return []
  }

  const normalizeCompetitionData = (rawCompetition) => {
    if (!rawCompetition) {
      return null
    }

    const questions = parseQuestions(rawCompetition.questions)
    const normalizedQuestions = questions.map((question, index) => {
      const resolvedId =
        question.id ??
        question.question_id ??
        question.slug ??
        question.external_id ??
        `${index + 1}`

      return {
        id: resolvedId.toString(),
        title: question.title ?? question.name ?? question.question_title ?? `Question ${index + 1}`,
        description: question.description ?? question.prompt ?? question.question_content ?? '',
        difficulty: question.difficulty ?? question.level ?? 'unknown',
        timeLimit:
          question.timeLimit ??
          question.time_limit ??
          rawCompetition.time_limit ??
          600,
        points: question.points ?? question.score ?? 0,
        starterCode: question.starterCode ?? question.starter_code ?? '',
        hints: question.hints ?? [],
        testCases: question.testCases ?? question.test_cases ?? []
      }
    })

    const resolvedCompetitionId =
      rawCompetition.competition_id ?? rawCompetition.id ?? competitionId

    return {
      ...rawCompetition,
      competition_id: resolvedCompetitionId,
      id: resolvedCompetitionId,
      questions: normalizedQuestions,
      question_count: rawCompetition.question_count ?? normalizedQuestions.length
    }
  }

  const loadCompetitionData = async () => {
    setLoading(true)
    setLoadError(null)

    try {
      console.log('Competition ID:', competitionId)
      if (!competitionId) {
        throw new Error('Missing competition identifier in route.')
      }
      if (!questionId) {
        throw new Error('Missing question identifier in route.')
      }

      const headers = {
        'Content-Type': 'application/json'
      }

      try {
        const token = localStorage.getItem('token')
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('Unable to read auth token from localStorage:', error)
      }

      let fetchedCompetition = null
      const competitionUrl = `${apiBase}/competitions/${competitionId}`
      const learnerUrl = `${apiBase}/competitions/learner/${activeLearnerId}`
      console.log('Fetching competition URL:', competitionUrl)
      console.log('Fallback learner URL:', learnerUrl)

      let response = await fetch(competitionUrl, { headers })
      console.log('Competition fetch status:', response.status)

      if (response.ok) {
        fetchedCompetition = await response.json()
      } else if (
        (response.status === 401 ||
          response.status === 403 ||
          response.status === 404) &&
        activeLearnerId
      ) {
        console.log('Competition fetch text:', await response.text())

        const fallbackResponse = await fetch(learnerUrl)
        console.log('Learner fetch status:', fallbackResponse.status)
        if (!fallbackResponse.ok) {
          const fallbackText = await fallbackResponse.text()
          console.log('Learner fetch text:', fallbackText)
          throw new Error(
            fallbackText || `Unable to load competitions for learner ${activeLearnerId}`
          )
        }

        const competitionsByLearner = await fallbackResponse.json()
        fetchedCompetition =
          competitionsByLearner.find((item) => {
            const itemId = item.competition_id ?? item.id
            return itemId?.toString() === competitionId?.toString()
          }) || null

        if (!fetchedCompetition) {
          throw new Error('Competition not found for the specified learner.')
        }
      } else {
        const errorText = await response.text()
        throw new Error(errorText || `Failed to load competition (${response.status})`)
      }

      const normalizedCompetition = normalizeCompetitionData(fetchedCompetition)
      console.log('Normalized competition:', normalizedCompetition)

      if (!normalizedCompetition?.questions?.length) {
        throw new Error('Competition is missing question data.')
      }

      setCompetition(normalizedCompetition)

      const resolvedScore =
        activeLearnerId && normalizedCompetition.learner1_id === activeLearnerId
          ? Number(normalizedCompetition.learner1_score || 0)
          : activeLearnerId && normalizedCompetition.learner2_id === activeLearnerId
            ? Number(normalizedCompetition.learner2_score || 0)
            : Number(normalizedCompetition.score || 0)
      setScore(Number.isFinite(resolvedScore) ? resolvedScore : 0)

      const currentQuestion =
        normalizedCompetition.questions.find((q) => q.id === questionId) ||
        normalizedCompetition.questions.find((q) => q.id === `${questionId}`) ||
        normalizedCompetition.questions[Number(questionId) - 1] ||
        normalizedCompetition.questions[0]

      if (!currentQuestion) {
        throw new Error('Unable to resolve the current question.')
      }

      console.log('Resolved current question:', currentQuestion)

      setQuestion(currentQuestion)
      setTimeLeft(currentQuestion.timeLimit || normalizedCompetition.time_limit || 600)
      setAnswer(currentQuestion.starterCode || '')
      setIsRunning(false)
      setIsCompleted(false)
      setProgress(0)
      setLoading(false)
    } catch (error) {
      console.error('Error loading competition:', error)
      setCompetition(null)
      setQuestion(null)
      setLoadError(error.message)
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
      const headers = {
        'Content-Type': 'application/json'
      }

      try {
        const token = localStorage.getItem('token')
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('Unable to read auth token before submitting answer:', error)
      }

      const response = await fetch(`${apiBase}/competitions/${competitionId}/submit`, {
        method: 'POST',
        headers,
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
          const nextQuestion = competition?.questions?.[currentQuestionIndex + 1]
          if (nextQuestion?.id) {
            navigate(`/competition/${competitionId}/question/${nextQuestion.id}`)
          } else {
            navigate(`/competition/${competitionId}/results`)
          }
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

  if (loadError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0f0f0]">
        <div className="text-center max-w-xl mx-auto px-6 py-8 bg-white shadow-xl rounded-2xl border border-gray-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Unable to load competition</h2>
          <p className="text-[#333333] mb-6">{loadError}</p>
          <p className="text-sm text-[#666666]">
            Make sure this learner is registered for the competition and that questions have been
            generated. You can also refresh the page once the setup is complete.
          </p>
        </div>
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
                      {question?.testCases?.length
                        ? question.testCases.map((testCase, index) => (
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
                          ))
                        : (
                          <div
                            className="p-3 rounded-lg text-sm"
                            style={{ backgroundColor: '#f0f0f0', color: '#333333' }}
                          >
                            No test cases available.
                          </div>
                        )
                      }
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
