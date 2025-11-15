import { CompetitionModel } from '../models/Competition.js'
import { UserProfileModel } from '../models/User.js'
import { generateQuestions } from '../services/geminiQuestionGeneration.js'
import { postgres, getSupabaseTables } from '../config/database.js'

let fetchInstance = globalThis.fetch
const getFetch = async () => {
  if (!fetchInstance) {
    const { default: nodeFetch } = await import('node-fetch')
    fetchInstance = nodeFetch
  }
  return fetchInstance
}

const DEFAULT_TURN_TIMER = 600
const tables = getSupabaseTables()
const learnerScoresTable = postgres.quoteIdentifier(tables.learnerScores || 'learner_scores')
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions || 'course_completions')

const ensureUserProfile = async (learnerId, learnerName = null) => {
  if (!learnerId) {
    throw new Error('learnerId is required to upsert user profile')
  }

  const existing = await UserProfileModel.findById(learnerId)
  if (existing) {
    return existing
  }

  try {
    const name =
      typeof learnerName === 'string' && learnerName.trim().length
        ? learnerName.trim()
        : `Learner ${learnerId.slice(0, 8)}`
    return await UserProfileModel.create({
      learner_id: learnerId,
      learner_name: name
    })
  } catch (error) {
    if (error.code === '23505') {
      return UserProfileModel.findById(learnerId)
    }
    throw error
  }
}

const upsertLearnerScore = async ({ learnerId, competitionId, score }) => {
  if (!learnerId || !competitionId) {
    throw new Error('Missing learnerId or competitionId for score upsert.')
  }

  const query = `
    INSERT INTO ${learnerScoresTable} ("learner_id", "competition_id", "score", "updated_at")
    VALUES ($1, $2, $3, now())
    ON CONFLICT ("learner_id", "competition_id")
    DO UPDATE SET "score" = EXCLUDED."score", "updated_at" = now()
    RETURNING "score"
  `

  const { rows } = await postgres.query(query, [learnerId, competitionId, score])
  return rows[0]?.score ?? null
}

const fetchLearnerScore = async ({ learnerId, competitionId }) => {
  if (!learnerId || !competitionId) {
    return null
  }

  const query = `
    SELECT "score"
    FROM ${learnerScoresTable}
    WHERE "learner_id" = $1 AND "competition_id" = $2
    LIMIT 1
  `

  const { rows } = await postgres.query(query, [learnerId, competitionId])
  return rows[0]?.score ?? null
}

const sumAnswerScores = (answers = []) =>
  answers.reduce((total, answer) => total + Number(answer?.score || 0), 0)

const resolveLearnerScore = (competition, learnerId, learner1Id, learner2Id) => {
  if (!competition) {
    return null
  }

  const result = competition.result || {}

  let learnerScore = null

  if (learnerId === learner1Id) {
    learnerScore =
      result?.learner1_score ??
      result?.results?.learner1?.score ??
      result?.performance_learner1?.score ??
      null

    if (learnerScore === null) {
      learnerScore = sumAnswerScores(competition.learner1_answers || [])
    }
  } else if (learnerId === learner2Id) {
    learnerScore =
      result?.learner2_score ??
      result?.results?.learner2?.score ??
      result?.performance_learner2?.score ??
      null

    if (learnerScore === null) {
      learnerScore = sumAnswerScores(competition.learner2_answers || [])
    }
  }

  return learnerScore !== null ? Number(learnerScore) : null
}

const sanitizeQuestionForTurn = (question) => {
  if (!question) {
    return null
  }

  const state = question.state || {}

  return {
    id: question.id || question.question_id,
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    language: question.language,
    points: question.points ?? 0,
    timeLimit: question.timeLimit ?? state.timer ?? DEFAULT_TURN_TIMER,
    testCases: question.testCases || question.test_cases || [],
    state
  }
}

// Helper function to evaluate answers with Gemini
async function evaluateAnswerWithGemini({ question, answer, testCases }) {
  try {
    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
      // Mock evaluation for local testing
      console.log('🔧 Using mock evaluation for local testing')
      const evaluation = {
        isCorrect: Math.random() > 0.3, // 70% success rate for testing
        feedback: "Mock evaluation: Your solution looks good! Consider optimizing for better performance.",
        score: Math.random() > 0.3 ? 100 : 0
      }
      return evaluation
    }
    
    // Real Gemini evaluation would go here
    // This would integrate with your existing Gemini service
    const evaluation = {
      isCorrect: Math.random() > 0.3, // Mock for now
      feedback: "Good attempt! Consider optimizing your algorithm for better performance.",
      score: Math.random() > 0.3 ? 100 : 0
    }
    
    return evaluation
  } catch (error) {
    console.error('Error evaluating answer with Gemini:', error)
    return {
      isCorrect: false,
      feedback: "Unable to evaluate answer at this time.",
      score: 0
    }
  }
}

export const competitionController = {
  // Create invitation for learners who finished the same course
  async createInvitation(req, res) {
    try {
      const { courseId, learnerId } = req.body
      
      // Check if learner completed the course
      // This would integrate with your course completion system
      const isCourseCompleted = true // Mock for now
      
      if (!isCourseCompleted) {
        return res.status(400).json({
          success: false,
          error: 'Course must be completed to participate in competitions'
        })
      }

      // Find other learners who completed the same course
      const eligibleLearners = await CompetitionModel.findEligibleLearners(courseId, learnerId)
      
      if (eligibleLearners.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No eligible competitors found for this course'
        })
      }

      // Create competition invitation
      const invitation = {
        id: `inv-${Date.now()}`,
        courseId,
        learnerId,
        eligibleLearners: eligibleLearners.map(learner => ({
          id: learner.id,
          isAnonymous: true,
          completedAt: learner.completedAt
        })),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      res.status(201).json({
        success: true,
        data: invitation
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  // Accept/Decline competition invitation
  async respondToInvitation(req, res) {
    try {
      const { invitationId } = req.params
      const { action, competitorId } = req.body // 'accept' or 'decline'
      const learnerId = req.user?.id

      if (action === 'accept') {
        // Create competition with 2 players
        const competitionData = {
          course_id: req.body.courseId,
          learner1_id: learnerId,
          learner2_id: competitorId,
          status: 'active',
          question_count: 3,
          time_limit: 1800, // 30 minutes total
          questions: [],
          created_at: new Date().toISOString()
        }

        // Generate 3 questions using Gemini or mock data
        let questions
        try {
          questions = await generateQuestions({
            courseName: req.body.courseName,
            topicName: 'Competition Questions',
            difficulty: 'medium',
            questionCount: 3,
            questionType: 'coding'
          })
        } catch (error) {
          console.log('🔧 Using mock questions for local testing')
          // Mock questions for local testing
          questions = [
            {
              title: 'Array Manipulation Challenge',
              description: 'Write a function that finds the longest increasing subsequence in an array. The function should return the length of the subsequence.',
              difficulty: 'medium',
              testCases: [
                { input: '[1,3,2,4,5]', expected: 4 },
                { input: '[5,4,3,2,1]', expected: 1 },
                { input: '[1,2,3,4,5]', expected: 5 }
              ]
            },
            {
              title: 'String Processing',
              description: 'Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.',
              difficulty: 'easy',
              testCases: [
                { input: '"A man a plan a canal Panama"', expected: true },
                { input: '"race a car"', expected: false },
                { input: '"Madam"', expected: true }
              ]
            },
            {
              title: 'Dynamic Programming',
              description: 'Solve the classic "House Robber" problem. You are a robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected, so you cannot rob two adjacent houses.',
              difficulty: 'hard',
              testCases: [
                { input: '[2,7,9,3,1]', expected: 12 },
                { input: '[1,2,3,1]', expected: 4 },
                { input: '[2,1,1,2]', expected: 4 }
              ]
            }
          ]
        }

        competitionData.questions = questions.map((q, index) => ({
          id: `q-${index + 1}`,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          timeLimit: 600, // 10 minutes per question
          points: 100,
          testCases: q.testCases || []
        }))

        const competition = await CompetitionModel.create(competitionData)

        res.status(201).json({
          success: true,
          data: {
            competition,
            message: 'Competition started! Both players are anonymous.'
          }
        })
      } else {
        res.json({
          success: true,
          message: 'Invitation declined'
        })
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async joinCompetition(req, res) {
    try {
      const { courseId } = req.body
      const learnerId = req.user?.id

      const competition = {
        id: `comp-${Date.now()}`,
        courseId,
        name: 'Weekly Python Challenge',
        description: 'Test your Python skills against other learners',
        maxParticipants: 2,
        questionCount: 3,
        timeLimit: 1800, // 30 minutes
        status: 'waiting',
        participants: [
          {
            id: `part-${Date.now()}`,
            competitionId: `comp-${Date.now()}`,
            learnerId,
            score: 0,
            joinedAt: new Date().toISOString()
          }
        ],
        questions: [],
        leaderboard: [],
        createdAt: new Date().toISOString()
      }

      res.status(201).json({
        success: true,
        data: competition
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getCompetition(req, res) {
    try {
      const { id } = req.params
      console.log('📋 [competitions] Fetching competition by id:', id)

      const competition = await CompetitionModel.findById(id)
      console.log('📋 [competitions] Query result:', competition ? 'found' : 'not found')

      if (!competition) {
        console.warn('⚠️ [competitions] Competition not found:', id)
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      res.json({
        success: true,
        data: competition
      })
    } catch (error) {
      console.error('❌ [competitions] Error in getCompetition:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async submitAnswer(req, res) {
    try {
      const { id } = req.params
      const { questionId, answer, timeSpent } = req.body
      const learnerId = req.user?.id

      // Get competition details
      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      // Check if time limit exceeded
      const question = competition.questions.find(q => q.id === questionId)
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      if (timeSpent > question.timeLimit) {
        return res.status(400).json({
          success: false,
          error: 'Time limit exceeded for this question'
        })
      }

      // Evaluate answer using Gemini
      const evaluation = await evaluateAnswerWithGemini({
        question: question.description,
        answer: answer,
        testCases: question.testCases
      })

      // Update competition with answer
      let updatedCompetition = await CompetitionModel.updateAnswer(id, learnerId, questionId, {
        answer,
        timeSpent,
        isCorrect: evaluation.isCorrect,
        score: evaluation.isCorrect ? question.points : 0,
        submittedAt: new Date().toISOString()
      })

      // Check if both players submitted answers for current question
      const bothSubmitted = await CompetitionModel.checkBothAnswersSubmitted(id, questionId)
      const totalQuestions =
        updatedCompetition?.question_count ?? updatedCompetition?.questions?.length ?? 0

      let answeredCount =
        updatedCompetition?.questions?.filter((item) => item?.state?.completed)?.length ?? 0
      let questionResult = null

      if (bothSubmitted) {
        const perQuestionResult = await CompetitionModel.determineWinner(id, questionId)
        if (perQuestionResult) {
          updatedCompetition = await CompetitionModel.recordQuestionResult(
            id,
            questionId,
            perQuestionResult
          )
          questionResult = perQuestionResult
        }

        answeredCount =
          updatedCompetition?.questions?.filter((item) => item?.state?.completed)?.length ??
          answeredCount

        // Move to next question or finish competition
        if (totalQuestions > 0 && answeredCount >= totalQuestions) {
          // Competition finished - evaluate winner
          const winner = await CompetitionModel.determineWinner(id)
          await CompetitionModel.updateResult(id, winner)
        }
      }

      res.json({
        success: true,
        data: {
          isCorrect: evaluation.isCorrect,
          score: evaluation.isCorrect ? question.points : 0,
          feedback: evaluation.feedback,
          timeSpent,
          nextQuestion:
            totalQuestions > 0 && answeredCount >= totalQuestions
              ? null
              : answeredCount + 1,
          competitionFinished: totalQuestions > 0 && answeredCount >= totalQuestions,
          questionResult
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getResults(req, res) {
    try {
      const { id } = req.params
      const learnerId = req.user?.id

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      // Get results with anonymous player names
      const results = {
        competitionId: id,
        status: competition.status,
        winner: competition.result?.winner || null,
        participants: [
          {
            playerId: 'Player A',
            isYou: competition.learner1_id === learnerId,
            score: competition.result?.player1Score || 0,
            rank: competition.result?.player1Rank || null,
            timeSpent: competition.result?.player1Time || 0,
            isAnonymous: true
          },
          {
            playerId: 'Player B', 
            isYou: competition.learner2_id === learnerId,
            score: competition.result?.player2Score || 0,
            rank: competition.result?.player2Rank || null,
            timeSpent: competition.result?.player2Time || 0,
            isAnonymous: true
          }
        ],
        leaderboard: [
          {
            rank: 1,
            playerId: competition.result?.player1Score > competition.result?.player2Score ? 'Player A' : 'Player B',
            score: Math.max(competition.result?.player1Score || 0, competition.result?.player2Score || 0),
            timeSpent: competition.result?.player1Score > competition.result?.player2Score ? 
              competition.result?.player1Time || 0 : competition.result?.player2Time || 0,
            isAnonymous: true
          },
          {
            rank: 2,
            playerId: competition.result?.player1Score <= competition.result?.player2Score ? 'Player A' : 'Player B',
            score: Math.min(competition.result?.player1Score || 0, competition.result?.player2Score || 0),
            timeSpent: competition.result?.player1Score <= competition.result?.player2Score ? 
              competition.result?.player1Time || 0 : competition.result?.player2Time || 0,
            isAnonymous: true
          }
        ],
        questions: competition.questions.map(q => ({
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          points: q.points
        }))
      }

      res.json({
        success: true,
        data: results
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { courseId } = req.params

      const leaderboard = [
        {
          rank: 1,
          learnerId: 'user-123',
          score: 95,
          timeSpent: 1100,
          isAnonymous: true
        },
        {
          rank: 2,
          learnerId: 'user-456',
          score: 90,
          timeSpent: 1200,
          isAnonymous: true
        },
        {
          rank: 3,
          learnerId: 'user-789',
          score: 85,
          timeSpent: 1300,
          isAnonymous: true
        }
      ]

      res.json({
        success: true,
        data: leaderboard
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async nextTurn(req, res) {
    try {
      const { id } = req.params

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      const questions = Array.isArray(competition.questions) ? competition.questions : []

      if (!questions.length) {
        return res.status(400).json({
          success: false,
          error: 'Competition has no questions configured'
        })
      }

      let activeIndex = questions.findIndex((question) => question?.state?.is_active)

      if (activeIndex === -1) {
        const updatedCompetition = await CompetitionModel.setActiveQuestion(id, 0)
        const activeQuestion = updatedCompetition?.questions?.[0]

        return res.json({
          success: true,
          data: {
            questionIndex: 0,
            totalQuestions: updatedCompetition?.questions?.length ?? questions.length,
            timer: activeQuestion?.state?.timer ?? activeQuestion?.timeLimit ?? DEFAULT_TURN_TIMER,
            question: sanitizeQuestionForTurn(activeQuestion),
            competitionFinished: false,
            turnStartedAt: activeQuestion?.state?.started_at
          }
        })
      }

      const currentQuestion = questions[activeIndex]
      const state = currentQuestion?.state || {}
      const learner1Submitted = state.learner1?.submitted ?? false
      const learner2Submitted = state.learner2?.submitted ?? false

      if (!learner1Submitted || !learner2Submitted) {
        return res.status(409).json({
          success: false,
          error: 'Current question is still awaiting submissions from both learners.'
        })
      }

      const nextIndex = activeIndex + 1

      if (nextIndex >= questions.length) {
        return res.json({
          success: true,
          data: {
            questionIndex: nextIndex,
            totalQuestions: questions.length,
            question: null,
            competitionFinished: true
          }
        })
      }

      const updatedCompetition = await CompetitionModel.setActiveQuestion(id, nextIndex)
      const nextQuestion = updatedCompetition?.questions?.[nextIndex]

      return res.json({
        success: true,
        data: {
          questionIndex: nextIndex,
          totalQuestions: updatedCompetition?.questions?.length ?? questions.length,
          timer: nextQuestion?.state?.timer ?? nextQuestion?.timeLimit ?? DEFAULT_TURN_TIMER,
          question: sanitizeQuestionForTurn(nextQuestion),
          competitionFinished: false,
          turnStartedAt: nextQuestion?.state?.started_at
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getProgress(req, res) {
    try {
      const { id } = req.params

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      const questions = Array.isArray(competition.questions) ? competition.questions : []
      const activeIndex = questions.findIndex((question) => question?.state?.is_active)

      let activeQuestionPayload = null
      if (activeIndex >= 0) {
        const activeQuestion = questions[activeIndex]
        const state = activeQuestion?.state || {}

        activeQuestionPayload = {
          index: activeIndex,
          questionId: activeQuestion?.id || activeQuestion?.question_id || null,
          timerRemaining: state.timer ?? activeQuestion?.timeLimit ?? DEFAULT_TURN_TIMER,
          startedAt: state.started_at || null
        }
      }

      const learner1Id = competition.learner1_id || competition.learner1?.learner_id || null
      const learner2Id = competition.learner2_id || competition.learner2?.learner_id || null

      const learners = [
        {
          id: learner1Id,
          submitted: Boolean(activeIndex >= 0 && questions[activeIndex]?.state?.learner1?.submitted),
          score:
            activeIndex >= 0
              ? questions[activeIndex]?.state?.learner1?.score ?? null
              : null
        },
        {
          id: learner2Id,
          submitted: Boolean(activeIndex >= 0 && questions[activeIndex]?.state?.learner2?.submitted),
          score:
            activeIndex >= 0
              ? questions[activeIndex]?.state?.learner2?.score ?? null
              : null
        }
      ].filter((learner) => learner.id)

      const perQuestionResults = competition?.result?.per_question || {}
      const resultsSoFar = Object.entries(perQuestionResults).map(([questionId, payload]) => ({
        questionId,
        winner:
          payload?.winner_id ||
          payload?.winner?.user_id ||
          payload?.winner === 'Player A'
            ? learner1Id
            : payload?.winner === 'Player B'
            ? learner2Id
            : payload?.winner || null,
        summary: payload
      }))

      return res.json({
        success: true,
        data: {
          competitionId: competition?.competition_id || competition?.id || id,
          activeQuestion: activeQuestionPayload,
          learners,
          resultsSoFar
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async storeFinalScore(req, res) {
    try {
      const { id } = req.params
      const { learnerId } = req.body || {}

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing learnerId'
        })
      }

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found.'
        })
      }

      const learner1Id =
        competition.learner1_id ||
        competition.learner1?.learner_id ||
        competition.learner1?.id ||
        null
      const learner2Id =
        competition.learner2_id ||
        competition.learner2?.learner_id ||
        competition.learner2?.id ||
        null

      if (learnerId !== learner1Id && learnerId !== learner2Id) {
        return res.status(400).json({
          success: false,
          message: 'Learner is not a participant of this competition.'
        })
      }

      const learnerScore = resolveLearnerScore(competition, learnerId, learner1Id, learner2Id)

      if (learnerScore === null) {
        return res.status(400).json({
          success: false,
          message: 'Competition results are not available yet.'
        })
      }

      await upsertLearnerScore({
        learnerId,
        competitionId: competition.competition_id || competition.id || id,
        score: learnerScore
      })

      return res.json({
        success: true,
        learnerScore,
        message: 'Score updated.'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getOutcome(req, res) {
    try {
      const { id, learnerId } = req.params

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found.'
        })
      }

      const learner1Id =
        competition.learner1_id ||
        competition.learner1?.learner_id ||
        competition.learner1?.id ||
        null
      const learner2Id =
        competition.learner2_id ||
        competition.learner2?.learner_id ||
        competition.learner2?.id ||
        null

      if (learnerId !== learner1Id && learnerId !== learner2Id) {
        return res.status(400).json({
          success: false,
          message: 'Learner is not a participant of this competition.'
        })
      }

      const competitionId = competition.competition_id || competition.id || id

      let learnerScore =
        (await fetchLearnerScore({ learnerId, competitionId })) ??
        resolveLearnerScore(competition, learnerId, learner1Id, learner2Id) ??
        0

      learnerScore = Number(learnerScore)

      const opponentId = learnerId === learner1Id ? learner2Id : learner1Id
      const opponentScore =
        resolveLearnerScore(competition, opponentId, learner1Id, learner2Id) ?? 0

      const result = competition.result || {}
      let winnerId =
        result?.winner_id ||
        result?.winner?.learner_id ||
        result?.winner?.user_id ||
        result?.winner ||
        null

      if (winnerId === 'Player A') {
        winnerId = learner1Id
      } else if (winnerId === 'Player B') {
        winnerId = learner2Id
      } else if (winnerId && typeof winnerId === 'object') {
        winnerId = winnerId?.learner_id || winnerId?.user_id || null
      }

      if (!winnerId || winnerId === 'tie') {
        if (learnerScore > opponentScore) {
          winnerId = learnerId
        } else if (opponentScore > learnerScore) {
          winnerId = opponentId
        } else {
          winnerId = 'tie'
        }
      }

      let winnerMessage
      if (winnerId === 'tie') {
        winnerMessage = '🤝 It was a tie! Fantastic effort from both of you!'
      } else if (winnerId === learnerId) {
        winnerMessage = '🎉 Congratulations! You won!'
      } else {
        winnerMessage = 'Keep going! Better luck next time!'
      }

      return res.json({
        success: true,
        learnerScore,
        winnerMessage
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async finalizeCompetition(req, res) {
    try {
      const { id } = req.params

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found.'
        })
      }

      const questions = Array.isArray(competition.questions) ? competition.questions : []
      if (!questions.length) {
        return res.status(400).json({
          success: false,
          message: 'Competition has no questions configured.'
        })
      }

      const allCompleted = questions.every((question) => question?.state?.completed)
      if (!allCompleted) {
        return res.status(400).json({
          success: false,
          message: 'Competition not yet complete.'
        })
      }

      const learner1Id =
        competition.learner1_id ||
        competition.learner1?.learner_id ||
        competition.learner1?.id ||
        'Player A'
      const learner2Id =
        competition.learner2_id ||
        competition.learner2?.learner_id ||
        competition.learner2?.id ||
        'Player B'

      const learner1Score =
        (competition.learner1_answers || []).reduce(
          (total, answer) => total + (answer.score || 0),
          0
        ) || 0
      const learner2Score =
        (competition.learner2_answers || []).reduce(
          (total, answer) => total + (answer.score || 0),
          0
        ) || 0

      let winnerId = null
      if (learner1Score > learner2Score) {
        winnerId = learner1Id
      } else if (learner2Score > learner1Score) {
        winnerId = learner2Id
      } else {
        winnerId = 'tie'
      }

      const summaryPayload = {
        competition_id: competition.competition_id || competition.id || id,
        winner_id: winnerId !== 'tie' ? winnerId : null,
        winner: winnerId === 'tie' ? 'tie' : winnerId,
        learner1_id: learner1Id,
        learner2_id: learner2Id,
        learner1_score: learner1Score,
        learner2_score: learner2Score,
        performance_learner1: {
          score: learner1Score,
          questions_answered: competition?.learner1_answers?.length ?? 0
        },
        performance_learner2: {
          score: learner2Score,
          questions_answered: competition?.learner2_answers?.length ?? 0
        }
      }

      const updatedCompetition = await CompetitionModel.upsertSummary(summaryPayload)

      return res.json({
        success: true,
        competitionId: updatedCompetition?.competition_id || id,
        finalResults: [
          { learnerId: learner1Id, totalScore: learner1Score },
          { learnerId: learner2Id, totalScore: learner2Score }
        ],
        winner: winnerId
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async recordCourseCompletion(req, res) {
    try {
      const { learner_id, learner_name, course_id, course_name } = req.body || {}

      if (!learner_id || !course_id) {
        return res.status(400).json({
          success: false,
          error: 'learner_id and course_id are required'
        })
      }

      const payload = req.body

      const serviceApiKeys = (process.env.SERVICE_API_KEYS || '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)

      if (!serviceApiKeys.length) {
        console.error('❌ [competitions] SERVICE_API_KEYS missing in environment variables')
        return res.status(500).json({
          success: false,
          error: 'Service authentication misconfigured'
        })
      }

      const selectedKey = serviceApiKeys[Math.floor(Math.random() * serviceApiKeys.length)]
      const serviceId = process.env.SERVICE_API_ID || 'devlab-competitions'
      const competitionsApiUrl = process.env.COMPETITIONS_API_URL

      let upstreamStatus = null
      let upstreamBody = null

      if (!competitionsApiUrl) {
        console.warn('⚠️ [competitions] COMPETITIONS_API_URL not set; skipping forward call')
      } else {
        try {
          const fetchFn = await getFetch()
          const forwardResponse = await fetchFn(competitionsApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': selectedKey,
              'x-service-id': serviceId
            },
            body: JSON.stringify(payload)
          })

          upstreamStatus = forwardResponse.status
          const text = await forwardResponse.text()
          upstreamBody = text

          if (!forwardResponse.ok) {
            const authFailure = forwardResponse.status === 401 || forwardResponse.status === 403
            if (authFailure) {
              console.error(
                `❌ [competitions] Authentication failed when forwarding course completion (status ${forwardResponse.status})`
              )
            } else {
              console.error(
                `⚠️ [competitions] Upstream competitions API responded with status ${forwardResponse.status}`
              )
            }
          }
        } catch (error) {
          console.error('❌ [competitions] Failed to forward course completion:', error.message)
        }
      }

      await ensureUserProfile(learner_id, learner_name || course_name)

      const { rows } = await postgres.query(
        `
        SELECT 1
        FROM ${courseCompletionsTable}
        WHERE "learner_id" = $1 AND "course_id" = $2
        LIMIT 1
        `,
        [learner_id, course_id]
      )

      let alreadyRecorded = Boolean(rows.length)
      if (!alreadyRecorded) {
        await postgres.query(
          `
          INSERT INTO ${courseCompletionsTable} (
            "learner_id",
            "course_id",
            "course_name",
            "completed_at"
          )
          VALUES ($1, $2, $3, now())
          `,
          [learner_id, course_id, course_name || null]
        )
      }

      return res.status(202).json({
        success: true,
        learner_id,
        course_id,
        course_name: course_name || null,
        alreadyRecorded,
        upstreamStatus,
        upstreamBody
      })
    } catch (error) {
      console.error('❌ [competitions] Course completion handling failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to record course completion'
      })
    }
  }
}

