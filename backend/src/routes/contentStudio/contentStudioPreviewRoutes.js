import express from 'express'
import { generateCodeContentStudioComponent } from '../../utils/codeContentStudioRender.js'
import { openAIContentStudioService } from '../../services/openAIContentStudioService.js'

const router = express.Router()

/**
 * Preview endpoint for Content Studio code components.
 *
 * Path: POST /api/content-studio/code-preview
 *
 * Accepts either:
 * - A full data-request style wrapper:
 *   {
 *     requester_service: "content-studio",
 *     payload: {
 *       action: "generate-questions",
 *       topic_id,
 *       topic_name,
 *       question_type: "code",
 *       programming_language,
 *       amount,
 *       skills,
 *       humanLanguage
 *     },
 *     response: { answer: "" }
 *   }
 *
 * - Or just the inner payload object itself.
 *
 * It then calls generateCodeContentStudioComponent (which uses the
 * OpenAI-backed Content Studio service) and returns:
 *   { success: true, html: "<full component HTML>" }
 */
router.post('/code-preview', async (req, res) => {
  try {
    const body = req.body || {}
    const payload = body.payload || body

    const {
      topic_id,
      topic_name,
      topicName,
      question_type,
      programming_language,
      programmingLanguage,
      amount = 3,
      skills = [],
      humanLanguage = 'en'
    } = payload || {}

    const resolvedTopicId = typeof topic_id === 'number' || typeof topic_id === 'string'
      ? topic_id
      : null

    const resolvedTopicName = topic_name || topicName || null

    if (!resolvedTopicId || !resolvedTopicName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: topic_id, topic_name'
      })
    }

    if (question_type && question_type !== 'code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid question_type. Only "code" is supported for HTML preview.'
      })
    }

    const safeAmount = Number(amount) > 0 ? Number(amount) : 3
    const normalizedSkills = Array.isArray(skills) ? skills : []

    const html = await generateCodeContentStudioComponent({
      topicName: resolvedTopicName,
      topic_id: resolvedTopicId,
      amount: safeAmount,
      programming_language: programming_language || programmingLanguage || 'javascript',
      skills: normalizedSkills,
      humanLanguage
    })

    return res.json({
      success: true,
      html
    })
  } catch (error) {
    console.error('❌ Error generating Content Studio code-preview HTML:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Content Studio code preview component',
      message: error?.message
    })
  }
})

/**
 * Generate a hint for the rendered code question using OpenAI Content Studio service.
 *
 * Path: POST /api/content-studio/generate-hint
 *
 * Body:
 * {
 *   question: "<question text>",
 *   userAttempt: "<current code>",
 *   hintsUsed: 0 | 1 | 2,
 *   allHints: ["previous hint 1", "previous hint 2"],
 *   topicName: "Arrays"
 * }
 */
router.post('/generate-hint', async (req, res) => {
  const {
    question,
    userAttempt = '',
    hintsUsed = 0,
    allHints = [],
    topicName
  } = req.body || {}

  // Ensure we always have some question text to send to OpenAI.
  // Prefer the question from the client; otherwise fall back to topicName.
  let questionText = (question || '').toString().trim()
  if (!questionText) {
    if (topicName) {
      questionText = `Coding challenge about ${topicName}`
    } else {
      questionText = 'Coding challenge'
    }
  }

  try {
    const hintResult = await openAIContentStudioService.generateHints(
      questionText,
      userAttempt,
      hintsUsed,
      Array.isArray(allHints) ? allHints : []
    )

    let hintText = hintResult
    if (typeof hintResult === 'object' && hintResult !== null) {
      hintText =
        hintResult.hint ||
        hintResult.text ||
        hintResult.message ||
        JSON.stringify(hintResult)
    }
    if (typeof hintText !== 'string') {
      hintText = String(hintText || '')
    }

    if (!hintText.trim()) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI service returned an empty hint'
      })
    }

    return res.json({
      success: true,
      hint: hintText,
      metadata: {
        topicName: topicName || null,
        hintsUsed: (hintsUsed || 0) + 1,
        generatedAt: new Date().toISOString(),
        fallback: !!hintResult?.fallback,
        source: 'openai_content_studio'
      }
    })
  } catch (error) {
    console.error('❌ Error generating Content Studio hint with OpenAI:', error)

    const fallback = openAIContentStudioService.generateFallbackHints(questionText, userAttempt, hintsUsed)

    return res.json({
      success: true,
      hint: fallback.hint,
      metadata: {
        topicName: topicName || null,
        hintsUsed: fallback.hintLevel,
        generatedAt: new Date().toISOString(),
        fallback: true,
        source: 'openai_fallback',
        message: fallback.message
      }
    })
  }
})

/**
 * Check a learner's solution for the rendered code question using OpenAI Content Studio service.
 *
 * Path: POST /api/content-studio/check-solution
 *
 * Body:
 * {
 *   question: "<question text>",
 *   userSolution: "<user code>",
 *   language: "javascript",
 *   topicName: "Arrays"
 * }
 */
router.post('/check-solution', async (req, res) => {
  const {
    question,
    userSolution,
    language = 'javascript',
    topicName
  } = req.body || {}

  if (!userSolution) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: userSolution'
    })
  }

  // Ensure we always send some question context to OpenAI.
  let questionText = (question || '').toString().trim()
  if (!questionText) {
    if (topicName) {
      questionText = `Coding challenge about ${topicName}`
    } else {
      questionText = 'Coding challenge'
    }
  }

  try {
    const evaluation = await openAIContentStudioService.evaluateCodeSubmission(
      userSolution,
      questionText,
      language,
      [] // test cases not wired through this preview endpoint
    )

    let aiDetection = null
    let enrichedEvaluation = evaluation

    // Run fraud detection whenever the solution is judged correct by OpenAI.
    const score = typeof evaluation.score === 'number' ? evaluation.score : 0
    const isCorrectFlag = evaluation.isCorrect === true || score >= 80

    if (isCorrectFlag) {
      try {
        aiDetection = await openAIContentStudioService.detectFraud(
          userSolution,
          questionText
        )

        const aiLikelihood =
          typeof aiDetection.aiLikelihood === 'number' ? aiDetection.aiLikelihood : 0
        const isAiGenerated =
          aiDetection.verdict === 'AI' ||
          aiLikelihood >= 70

        enrichedEvaluation = {
          ...evaluation,
          isAiGenerated
        }

        aiDetection = {
          ...aiDetection,
          isAiGenerated
        }
      } catch (fraudError) {
        console.error('❌ Error running OpenAI fraud detection for Content Studio preview:', fraudError)
        aiDetection = null
      }
    }

    return res.json({
      success: true,
      evaluation: enrichedEvaluation,
      aiDetection,
      metadata: {
        topicName: topicName || null,
        language,
        checkedAt: new Date().toISOString(),
        source: 'openai_content_studio'
      }
    })
  } catch (error) {
    console.error('❌ Error checking solution with OpenAI Content Studio service:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check solution',
      message: error?.message
    })
  }
})

export default router


