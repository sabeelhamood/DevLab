import { UserProfileModel } from '../models/User.js'
import { postgres, getSupabaseTables } from '../config/database.js'
import { CompetitionAIModel } from '../models/CompetitionAI.js'
import { competitionAIService } from '../services/competitionAIService.js'
import { getFetch } from '../utils/http.js'

const tables = getSupabaseTables()
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions || 'course_completions')
const QUESTION_DURATION_SECONDS = 10 * 60

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

const getTotalQuestions = (competition) => competition?.questions?.length || 0

const buildAiAnswersFromQuestions = (questions = []) =>
  questions
    .map((question) => {
      const answer = question?.state?.ai_answer
      if (!answer || !question?.question_id) {
        return null
      }
      return {
        question_id: question.question_id,
        answer
      }
    })
    .filter(Boolean)

const buildLearnerAnswersFromQuestions = (questions = []) =>
  questions
    .map((question) => {
      const answer = question?.state?.learner_answer
      if (answer === undefined || answer === null || !question?.question_id) {
        return null
      }
      return {
        question_id: question.question_id,
        answer
      }
    })
    .filter(Boolean)

const getCurrentQuestionIndex = (competition) =>
  Math.max(0, competition?.current_question_index ?? 0)

const getQuestionByIndex = (competition, index) => competition?.questions?.[index] || null

const questionHasExpired = (question) => {
  const expiresAt = question?.state?.expires_at
  if (!expiresAt) {
    return false
  }
  return Date.now() >= Date.parse(expiresAt)
}

const evaluateCompetitionOutcome = async (competition) => {
  if (
    !competition ||
    !Array.isArray(competition.questions) ||
    !Array.isArray(competition.ai_answers) ||
    !Array.isArray(competition.learner_answers) ||
    !competition.questions.length ||
    !competition.ai_answers.length ||
    !competition.learner_answers.length
  ) {
    return competition
  }

  try {
    const evaluation = await competitionAIService.evaluateCompetition({
      questions: competition.questions,
      aiAnswers: competition.ai_answers,
      learnerAnswers: competition.learner_answers
    })

    return CompetitionAIModel.saveEvaluation(competition.competition_id, evaluation)
  } catch (error) {
    console.error('⚠️ [competitions] Evaluation failed:', error.message)
    return competition
  }
}

const finalizeCompetitionAndEvaluate = async (competition) => {
  if (!competition) {
    return null
  }

  const learnerAnswers = buildLearnerAnswersFromQuestions(competition.questions)
  const aiAnswers = buildAiAnswersFromQuestions(competition.questions)

  const finalized = await CompetitionAIModel.finalizeCompetition(competition.competition_id, {
    learnerAnswers,
    aiAnswers
  })

  return evaluateCompetitionOutcome(finalized)
}

const startQuestion = async (competition, questionIndex) => {
  const question = getQuestionByIndex(competition, questionIndex)
  if (!question) {
    return finalizeCompetitionAndEvaluate(competition)
  }

  const state = question.state || {}
  if (state.status === 'active') {
    return competition
  }

  const aiAnswer = await competitionAIService.generateAIAnswerForQuestion({
    courseName: competition.course_name,
    question
  })

  const startedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + QUESTION_DURATION_SECONDS * 1000).toISOString()

  question.state = {
    ...state,
    status: 'active',
    started_at: startedAt,
    expires_at: expiresAt,
    ai_answer: aiAnswer,
    learner_answer: state.learner_answer || null
  }

  const timerSeconds = QUESTION_DURATION_SECONDS * getTotalQuestions(competition)

  return CompetitionAIModel.updateById(competition.competition_id, {
    questions: competition.questions,
    status: 'in_progress',
    started_at: competition.started_at || startedAt,
    timer_seconds: timerSeconds,
    current_question_index: questionIndex,
    ai_answers: buildAiAnswersFromQuestions(competition.questions)
  })
}

const completeQuestion = async (competition, questionIndex, answer, { timedOut = false } = {}) => {
  const question = getQuestionByIndex(competition, questionIndex)
  if (!question) {
    return competition
  }

  const state = question.state || {}
  question.state = {
    ...state,
    status: 'completed',
    completed_at: new Date().toISOString(),
    learner_answer: answer ?? '',
    timed_out: timedOut
  }

  const learnerAnswers = buildLearnerAnswersFromQuestions(competition.questions)

  return CompetitionAIModel.updateById(competition.competition_id, {
    questions: competition.questions,
    in_progress_answers: learnerAnswers,
    ai_answers: buildAiAnswersFromQuestions(competition.questions)
  })
}

const advanceCompetition = async (competition) => {
  if (!competition || competition.status === 'completed') {
    return competition
  }

  const nextIndex = getCurrentQuestionIndex(competition) + 1
  const total = getTotalQuestions(competition)

  if (nextIndex >= total) {
    return finalizeCompetitionAndEvaluate(competition)
  }

  const updated = await CompetitionAIModel.updateById(competition.competition_id, {
    current_question_index: nextIndex
  })

  return startQuestion(updated, nextIndex)
}

const ensureActiveQuestion = async (competition) => {
  if (!competition) {
    return null
  }

  if (competition.status === 'completed') {
    return competition
  }

  const total = getTotalQuestions(competition)
  if (!total) {
    return finalizeCompetitionAndEvaluate(competition)
  }

  let index = Math.min(getCurrentQuestionIndex(competition), total - 1)
  let question = getQuestionByIndex(competition, index)

  if (!question) {
    return finalizeCompetitionAndEvaluate(competition)
  }

  if (!question.state || question.state.status === 'pending') {
    return startQuestion(competition, index)
  }

  if (question.state.status === 'active') {
    if (questionHasExpired(question)) {
      const completed = await completeQuestion(
        competition,
        index,
        question.state.learner_answer || '',
        { timedOut: true }
      )
      return advanceCompetition(completed)
    }
    return competition
  }

  if (question.state.status === 'completed') {
    const updated = await CompetitionAIModel.updateById(competition.competition_id, {
      current_question_index: index + 1
    })
    return ensureActiveQuestion(updated)
  }

  return competition
}

const buildSessionPayload = (competition) => {
  const totalQuestions = getTotalQuestions(competition)
  const completed = competition.status === 'completed'
  const index = Math.min(
    getCurrentQuestionIndex(competition),
    Math.max(totalQuestions - 1, 0)
  )
  const question = !completed && totalQuestions ? getQuestionByIndex(competition, index) : null
  const state = question?.state || {}

  return {
    competition_id: competition.competition_id,
    status: competition.status,
    totalQuestions,
    questionIndex: question ? index + 1 : totalQuestions,
    question: question
      ? {
          question_id: question.question_id,
          question: question.question
        }
      : null,
    timer_seconds: QUESTION_DURATION_SECONDS,
    started_at: state.started_at || null,
    expires_at: state.expires_at || null,
    answers: buildLearnerAnswersFromQuestions(competition.questions),
    completed,
    winner: competition.winner || null,
    score: competition.score || null,
    summary: completed
      ? {
          winner: competition.winner,
          score: competition.score,
          learner_answers: buildLearnerAnswersFromQuestions(competition.questions),
          ai_answers: buildAiAnswersFromQuestions(competition.questions)
        }
      : null
  }
}

export const competitionController = {
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
  },

  async createAICompetition(req, res) {
    try {
      const { learner_id, learner_name, course_id, course_name } = req.body || {}

      if (!learner_id || !course_id || !course_name) {
        return res.status(400).json({
          success: false,
          error: 'learner_id, course_id, and course_name are required'
        })
      }

      const courseIdText = String(course_id)
      const existingCompetition = await CompetitionAIModel.findByLearnerAndCourse(learner_id, courseIdText)
      if (existingCompetition) {
        return res.status(200).json({
          success: true,
          competition: existingCompetition,
          alreadyExists: true
        })
      }

      const { questions } = await competitionAIService.generateCompetitionSetup({
        courseName: course_name
      })

      const competition = await CompetitionAIModel.create({
        learnerId: learner_id,
        learnerName: learner_name || null,
        courseId: courseIdText,
        courseName: course_name,
        questions,
        aiAnswers: [] // AI answers will be generated per question as the competition runs
      })

      return res.status(201).json({
        success: true,
        competition,
        alreadyExists: false
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to create AI competition:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create AI competition',
        message: error.message
      })
    }
  },

  async getPendingAICompetitions(req, res) {
    try {
      const { learnerId } = req.params

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          error: 'learnerId is required'
        })
      }

      const pendingCourses = await CompetitionAIModel.getPendingCourses(learnerId)
      return res.json({
        success: true,
        data: pendingCourses
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to fetch pending competitions:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending competitions',
        message: error.message
      })
    }
  },

  async startAICompetition(req, res) {
    try {
      const { competitionId } = req.params
      const learnerId = req.user?.id

      if (!competitionId) {
        return res.status(400).json({
          success: false,
          error: 'competitionId is required'
        })
      }

      const competition = await CompetitionAIModel.findById(competitionId)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      if (competition.learner_id !== learnerId) {
        return res.status(403).json({
          success: false,
          error: 'This competition does not belong to the authenticated learner'
        })
      }

      const updated = await ensureActiveQuestion(competition)
      return res.json({
        success: true,
        session: buildSessionPayload(updated)
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to start AI competition:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to start AI competition',
        message: error.message
      })
    }
  },

  async recordAICompetitionAnswer(req, res) {
    try {
      const { competitionId } = req.params
      const { question_id, answer } = req.body || {}
      const learnerId = req.user?.id

      if (!question_id) {
        return res.status(400).json({
          success: false,
          error: 'question_id is required'
        })
      }

      const submission = typeof answer === 'string' ? answer : ''

      const competition = await CompetitionAIModel.findById(competitionId)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      if (competition.learner_id !== learnerId) {
        return res.status(403).json({
          success: false,
          error: 'This competition does not belong to the authenticated learner'
        })
      }

      let workingCompetition = await ensureActiveQuestion(competition)

      if (workingCompetition.status === 'completed') {
        return res.json({
          success: true,
          session: buildSessionPayload(workingCompetition)
        })
      }

      const currentIndex = getCurrentQuestionIndex(workingCompetition)
      const currentQuestion = getQuestionByIndex(workingCompetition, currentIndex)

      if (!currentQuestion || currentQuestion.question_id !== question_id) {
        return res.status(400).json({
          success: false,
          error: 'Question mismatch or no active question available'
        })
      }

      if (!currentQuestion.state || currentQuestion.state.status !== 'active') {
        workingCompetition = await ensureActiveQuestion(workingCompetition)
        return res.json({
          success: true,
          session: buildSessionPayload(workingCompetition)
        })
      }

      const expired = questionHasExpired(currentQuestion)
      const answeredCompetition = await completeQuestion(
        workingCompetition,
        currentIndex,
        expired ? currentQuestion.state.learner_answer || '' : submission,
        { timedOut: expired }
      )

      const progressed = await advanceCompetition(answeredCompetition)

      return res.json({
        success: true,
        session: buildSessionPayload(progressed)
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to record learner answer:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to record learner answer',
        message: error.message
      })
    }
  },

  async completeAICompetition(req, res) {
    try {
      const { competitionId } = req.params
      const learnerId = req.user?.id

      const competition = await CompetitionAIModel.findById(competitionId)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      if (competition.learner_id !== learnerId) {
        return res.status(403).json({
          success: false,
          error: 'This competition does not belong to the authenticated learner'
        })
      }

      let workingCompetition = await ensureActiveQuestion(competition)

      if (workingCompetition.status !== 'completed') {
        let tempCompetition = workingCompetition
        while (tempCompetition && tempCompetition.status !== 'completed') {
          const total = getTotalQuestions(tempCompetition)
          if (!total) {
            tempCompetition = await finalizeCompetitionAndEvaluate(tempCompetition)
            break
          }

          const index = Math.min(getCurrentQuestionIndex(tempCompetition), total - 1)
          const currentQuestion = getQuestionByIndex(tempCompetition, index)

          if (!currentQuestion) {
            tempCompetition = await finalizeCompetitionAndEvaluate(tempCompetition)
            break
          }

          if (currentQuestion.state?.status !== 'completed') {
            tempCompetition = await completeQuestion(
              tempCompetition,
              index,
              currentQuestion.state?.learner_answer || '',
              { timedOut: false }
            )
          }

          tempCompetition = await advanceCompetition(tempCompetition)
        }

        workingCompetition = tempCompetition
      }

      return res.json({
        success: true,
        session: buildSessionPayload(workingCompetition)
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to finalize competition:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to finalize competition',
        message: error.message
      })
    }
  }
}

