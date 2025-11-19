import express from 'express'
import { generateCodeContentStudioComponent } from '../../utils/codeContentStudioRender.js'

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

export default router


