import express from 'express'
import { geminiService } from '../services/gemini.js'
import { saveQuestionsToSupabase } from '../services/questionStorageService.js'
import { saveTempQuestions, createRequestId } from '../services/tempQuestionStore.js'
import { saveGeminiQuestionsToSupabase } from '../services/tempQuestionStorageService.js'
import { postgres } from '../config/database.js'
import { fetchAssessmentTheoreticalQuestions } from '../services/assessmentClient.js'

const router = express.Router()

console.log('🔍 [gemini-question-generation] Route file loaded and router created')

// Middleware to log all requests to this router
router.use((req, res, next) => {
  try {
    console.log('[DEBUG] Middleware passed for gemini route')
    console.log('\n' + '='.repeat(80))
    console.log('🔍 [gemini-question-generation] Router middleware - Request received')
    console.log('='.repeat(80))
    console.log('   Method:', req.method)
    console.log('   Path:', req.path)
    console.log('   Original URL:', req.originalUrl)
    console.log('   Body exists:', !!req.body)
    console.log('   Body type:', typeof req.body)
    console.log('   Body keys:', req.body ? Object.keys(req.body) : 'N/A')
    console.log('   Headers:', JSON.stringify(req.headers, null, 2))
    console.log('='.repeat(80) + '\n')
    next()
  } catch (middlewareError) {
    console.error('[ERROR] Router middleware error:', middlewareError)
    console.error('   Error message:', middlewareError.message)
    console.error('   Error stack:', middlewareError.stack)
    next(middlewareError)
  }
})

// Health check endpoint to verify route is registered
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gemini question generation routes are active',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/gemini-questions/health',
      'GET /api/gemini-questions/test-cors',
      'POST /api/gemini-questions/generate-question-package'
    ]
  })
})

// Test endpoint to verify CORS is working
router.get('/test-cors', (req, res) => {
  console.log('🧪 CORS Test: Request received from origin:', req.header('Origin'))
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: req.header('Origin'),
    timestamp: new Date().toISOString()
  })
})

// Test endpoint to verify Supabase connection and temp_questions insertion
router.post('/test-supabase-insert', async (req, res) => {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TEST: Testing Supabase connection and temp_questions insertion')
  console.log('='.repeat(80))
  
  try {
    // Step 1: Test connection
    console.log('\n📋 STEP 1: Testing Supabase connection')
    const connectionTest = await postgres.query('SELECT NOW() as current_time, 1 as test')
    console.log('✅ Connection test successful')
    console.log('   Current database time:', connectionTest.rows[0].current_time)
    
    // Step 2: Test INSERT into temp_questions
    console.log('\n📋 STEP 2: Testing INSERT into temp_questions table')
    const testQuestionId = `test_${Date.now()}`
    const testQuestionContent = 'This is a test question from /test-supabase-insert endpoint'
    const testTitle = 'Test Question'
    
    console.log(`   Test question ID: ${testQuestionId}`)
    console.log(`   Test question content: ${testQuestionContent}`)
    console.log(`   Test title: ${testTitle}`)
    
    // Check if temp_questions table exists
    const tableCheck = await postgres.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'temp_questions'
    `)
    
    console.log(`   Table exists: ${tableCheck.rows.length > 0}`)
    console.log(`   Table columns: ${tableCheck.rows.length}`)
    if (tableCheck.rows.length > 0) {
      console.log(`   Columns:`, tableCheck.rows.map(col => col.column_name).join(', '))
    }
    
    // Try to insert test question
    try {
      const insertResult = await postgres.query(
        `INSERT INTO "temp_questions" (
          "question_id",
          "question_content",
          "title",
          "created_at",
          "updated_at"
        )
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT ("question_id")
        DO UPDATE SET
          "question_content" = EXCLUDED."question_content",
          "title" = EXCLUDED."title",
          "updated_at" = now()
        RETURNING "question_id", "title", "question_content", "created_at"`,
        [testQuestionId, testQuestionContent, testTitle]
      )
      
      console.log('✅ INSERT test successful')
      console.log('   Rows returned:', insertResult.rows.length)
      console.log('   Row count:', insertResult.rowCount)
      if (insertResult.rows.length > 0) {
        console.log('   Inserted data:', JSON.stringify(insertResult.rows[0], null, 2))
      }
      
      // Verify insertion
      console.log('\n📋 STEP 3: Verifying insertion')
      const verifyResult = await postgres.query(
        `SELECT "question_id", "title", "question_content", "created_at" 
         FROM "temp_questions" 
         WHERE "question_id" = $1`,
        [testQuestionId]
      )
      
      console.log('   Verification query result:', verifyResult.rows.length, 'row(s) found')
      if (verifyResult.rows.length > 0) {
        console.log('✅ Verification successful - test question found in database')
        console.log('   Verified data:', JSON.stringify(verifyResult.rows[0], null, 2))
      } else {
        console.error('❌ Verification failed - test question NOT found in database')
      }
      
      // Clean up test question
      console.log('\n📋 STEP 4: Cleaning up test question')
      await postgres.query(
        `DELETE FROM "temp_questions" WHERE "question_id" = $1`,
        [testQuestionId]
      )
      console.log('✅ Test question deleted')
      
      return res.json({
        success: true,
        message: 'Supabase connection and insertion test successful',
        test: {
          question_id: testQuestionId,
          inserted: true,
          verified: verifyResult.rows.length > 0,
          cleaned_up: true
        },
        connection: {
          connected: true,
          database_time: connectionTest.rows[0].current_time
        },
        table: {
          exists: tableCheck.rows.length > 0,
          columns: tableCheck.rows.map(col => col.column_name)
        }
      })
    } catch (insertError) {
      console.error('❌ INSERT test failed:')
      console.error('   Error:', insertError.message)
      console.error('   Code:', insertError.code || 'N/A')
      console.error('   Detail:', insertError.detail || 'N/A')
      console.error('   Hint:', insertError.hint || 'N/A')
      console.error('   Stack:', insertError.stack || 'N/A')
      
      return res.status(500).json({
        success: false,
        error: 'INSERT test failed',
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        hint: insertError.hint,
        connection: {
          connected: true,
          database_time: connectionTest.rows[0].current_time
        },
        table: {
          exists: tableCheck.rows.length > 0,
          columns: tableCheck.rows.map(col => col.column_name)
        }
      })
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED:')
    console.error('   Error:', error.message)
    console.error('   Code:', error.code || 'N/A')
    console.error('   Detail:', error.detail || 'N/A')
    console.error('   Stack:', error.stack || 'N/A')
    
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
  }
})

// Health check endpoint for question generation service
router.get('/health', (req, res) => {
  console.log('🏥 Health check: Question generation service')
  res.json({
    status: 'healthy',
    service: 'question-generation',
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.header('Origin'),
      allowed: true
    }
  })
})

// Generate question based on topic and skills (courseName removed - no longer used)
router.post('/generate-question', async (req, res) => {
  console.log('[DEBUG] /generate-question route reached (NOT /generate-question-package)')
  console.log('[DEBUG] Request path:', req.path)
  console.log('[DEBUG] Request originalUrl:', req.originalUrl)
  console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    const { 
      topicName, 
      skills = [],
      difficulty = 'beginner',
      language = 'javascript',
      questionType = 'coding'
    } = req.body

    if (!topicName) {
      console.log('❌ [DEBUG] /generate-question: topicName is missing')
      return res.status(400).json({
        error: 'Topic name is required'
      })
    }

    // Normalize skills to array
    const normalizedSkills = Array.isArray(skills) ? skills : skills ? [skills] : []

    let question
    if (questionType === 'coding') {
      const generated = await geminiService.generateCodingQuestion(
        topicName,
        normalizedSkills,
        1,
        language,
        {
          humanLanguage: 'en',
          topic_id: null
        }
      )
      question = generated?.[0] || {}
    } else {
      const theoretical = await fetchAssessmentTheoreticalQuestions({
        topic_id: null,
        topic_name: topicName,
        amount: 1,
        difficulty,
        humanLanguage: 'en',
        skills: normalizedSkills
      })
      question = theoretical?.[0] || {}
    }

    // Add topic context to the question (courseName removed - no longer used)
    question.topicName = topicName
    question.skills = normalizedSkills
    question.difficulty = difficulty
    question.language = language
    question.questionType = questionType
    
    // Remove deprecated fields from question
    delete question.nanoSkills
    delete question.macroSkills
    delete question.nano_skills
    delete question.macro_skills
    delete question.courseName // Remove courseName - no longer used
    // Ensure skills field exists
    if (!question.skills) {
      question.skills = []
    }

    res.json({
      success: true,
      question,
      metadata: {
        topicName,
        skills: normalizedSkills,
        difficulty,
        language,
        questionType,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating question:', error)
    res.status(500).json({
      error: 'Failed to generate question',
      message: error.message
    })
  }
})

// Generate hint for a specific question
router.post('/generate-hint', async (req, res) => {
  // Wrap entire handler in try-catch to ensure we always return a response
  try {
  const { 
    question, 
    userAttempt = '', 
    hintsUsed = 0, 
    allHints = [],
    topicName
    } = req.body || {}

  if (!question) {
      console.warn('⚠️ Hint generation: Question is missing')
      // Return fallback hint instead of error to avoid breaking UI
      const fallbackHints = [
        "Try breaking down the problem into smaller steps.",
        "Consider what data structures might be helpful for this problem.",
        "Think about edge cases and how to handle them."
      ]
      return res.json({
        success: true,
        hint: fallbackHints[0],
        metadata: {
          topicName: topicName || null,
          hintsUsed: 1,
          generatedAt: new Date().toISOString(),
          fallback: true,
          message: "Using fallback hint - question not provided"
        }
    })
  }

  try {
      // Extract question text from question object or use as-is if it's already a string
      // Frontend may send question object with fields like: question_content, title, description, question, etc.
      let questionText = question
      
      if (typeof question === 'object' && question !== null) {
        // Extract question text from various possible fields
        questionText = question.question_content || 
                       question.description || 
                       question.title || 
                       question.question || 
                       question.prompt ||
                       question.content ||
                       (question.ajax && question.ajax.question) ||
                       ''
        
        if (!questionText || questionText.trim() === '') {
          console.warn('⚠️ Cannot extract question text from question object:', Object.keys(question || {}))
          // Return fallback hint instead of error
          const fallbackHints = [
            "Try breaking down the problem into smaller steps.",
            "Consider what data structures might be helpful for this problem.",
            "Think about edge cases and how to handle them."
          ]
          return res.json({
            success: true,
            hint: fallbackHints[hintsUsed || 0] || fallbackHints[0],
            metadata: {
              topicName: topicName || null,
              hintsUsed: (hintsUsed || 0) + 1,
              generatedAt: new Date().toISOString(),
              fallback: true,
              message: "Using fallback hint - question text not found"
            }
          })
        }
      }
      
      // Ensure questionText is a string and not empty
      if (typeof questionText !== 'string') {
        questionText = String(questionText || '')
      }
      
      if (!questionText || questionText.trim() === '') {
        console.warn('⚠️ Question text is empty after processing')
        const fallbackHints = [
          "Try breaking down the problem into smaller steps.",
          "Consider what data structures might be helpful for this problem.",
          "Think about edge cases and how to handle them."
        ]
        return res.json({
          success: true,
          hint: fallbackHints[hintsUsed || 0] || fallbackHints[0],
          metadata: {
            topicName: topicName || null,
            hintsUsed: (hintsUsed || 0) + 1,
            generatedAt: new Date().toISOString(),
            fallback: true,
            message: "Using fallback hint - empty question text"
          }
        })
      }
      
      // Safely log question text (limit to 50 chars)
      const questionPreview = questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText
      console.log('🔍 Generating hint for question:', questionPreview)
      console.log(`   Hints used: ${hintsUsed || 0}, All hints: ${(Array.isArray(allHints) ? allHints : []).length}`)
      
      // Call Gemini service to generate hint
      let hint = null
      try {
        hint = await geminiService.generateHints(
          questionText,
          userAttempt || '',
          hintsUsed || 0,
          Array.isArray(allHints) ? allHints : []
        )
        
        // Extract hint text from response (handle both object and string responses)
        let hintText = hint
        if (typeof hint === 'object' && hint !== null) {
          hintText = hint.hint || hint.text || hint.message || JSON.stringify(hint)
        }
        
        // Ensure hintText is a string
        if (typeof hintText !== 'string') {
          hintText = String(hintText || '')
        }
        
        // If hint is empty, use fallback
        if (!hintText || hintText.trim() === '') {
          console.warn('⚠️ Gemini returned empty hint, using fallback')
          throw new Error('Empty hint returned from Gemini')
        }
        
        console.log('✅ Successfully generated hint from Gemini:', hintText.substring(0, 50) + '...')
        
        return res.json({
      success: true,
          hint: hintText,
      metadata: {
            topicName: topicName || null,
            hintsUsed: (hintsUsed || 0) + 1,
            generatedAt: new Date().toISOString(),
            fallback: false,
            source: 'gemini'
          }
        })
        
      } catch (geminiError) {
        console.error('❌ Error calling Gemini service:', geminiError)
        console.error('   Error message:', geminiError?.message)
        console.error('   Error stack:', geminiError?.stack)
        throw geminiError // Re-throw to be caught by outer catch
      }

  } catch (error) {
      console.error('❌ Error generating hint:', error)
      console.error('   Error message:', error?.message)
      console.error('   Error stack:', error?.stack)
      
      // Check if it's a rate limit error or API error
      const isRateLimit = error?.message && (
        error.message.includes('Rate limit exceeded') ||
        error.message.includes('429') ||
        error.message.includes('quota') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('overloaded') ||
        error.message.includes('503') ||
        error.message.includes('Service Unavailable')
      )
      
      // Provide fallback hints for any error to avoid breaking the UI
      console.warn('⚠️ Using fallback hint due to error:', error?.message || 'Unknown error')
      const fallbackHints = [
        "Try breaking down the problem into smaller steps.",
        "Consider what data structures might be helpful for this problem.",
        "Think about edge cases and how to handle them.",
        "Look at the test cases to understand the expected behavior.",
        "Consider using helper functions to organize your code better."
      ]
      
      const hintIndex = Math.min(hintsUsed || 0, fallbackHints.length - 1)
      const fallbackHint = fallbackHints[hintIndex] || fallbackHints[0]
      
      // Return fallback hint instead of error to avoid breaking the UI
      return res.json({
        success: true,
        hint: fallbackHint,
        metadata: {
          topicName: topicName || null,
          hintsUsed: (hintsUsed || 0) + 1,
          generatedAt: new Date().toISOString(),
          fallback: true,
          error: error?.message || 'Unknown error',
          message: isRateLimit ? "Using fallback hint due to API rate limits" : "Using fallback hint due to API error",
          source: 'fallback'
        }
      })
    }
    
  } catch (outerError) {
    // Final safety net - should never reach here, but just in case
    console.error('❌ CRITICAL: Unhandled error in hint generation endpoint:', outerError)
    console.error('   Error message:', outerError?.message)
    console.error('   Error stack:', outerError?.stack)
    
    // Always return a response to prevent 500 error
    const fallbackHints = [
      "Try breaking down the problem into smaller steps.",
      "Consider what data structures might be helpful for this problem.",
      "Think about edge cases and how to handle them."
    ]
    
    return res.json({
      success: true,
      hint: fallbackHints[0],
      metadata: {
        topicName: null,
        hintsUsed: 1,
        generatedAt: new Date().toISOString(),
        fallback: true,
        error: outerError?.message || 'Unknown error',
        message: "Using fallback hint due to unexpected error",
        source: 'fallback'
      }
    })
  }
})

// Check solution and provide feedback
router.post('/check-solution', async (req, res) => {
  const { 
    question, 
    userSolution, 
    language = 'javascript',
    topicName
  } = req.body

  try {

    if (!question || !userSolution) {
      return res.status(400).json({
        error: 'Question and user solution are required'
      })
    }

    // First, evaluate the code solution for correctness
    console.log('🔍 Evaluating solution correctness...')
    const evaluation = await geminiService.evaluateCodeSubmission(
      userSolution,
      question,
      language
    )

    console.log('📊 Evaluation result:', evaluation)

    // Only run AI detection if the solution is correct
    let aiDetectionResult = null
    if (evaluation.score >= 80) { // Consider solutions with 80%+ score as potentially correct
      console.log('✅ Solution appears correct, running AI detection analysis...')
      
      try {
        // Run simple pattern detection first (fast, no API calls)
        const simpleDetection = geminiService.simpleAiDetection(userSolution)
        console.log('🔍 Simple pattern detection result:', simpleDetection)

        // If simple detection already flags it, use that result
        if (simpleDetection.isAiGenerated) {
          console.log('🚨 AI detected by simple pattern analysis, skipping advanced detection')
          aiDetectionResult = {
            isAiGenerated: true,
            confidence: simpleDetection.confidence,
            method: 'pattern-based',
            simple: simpleDetection
          }
        } else {
          // Run advanced detection methods for more thorough analysis
          const [basicDetection, enhancedDetection] = await Promise.all([
            geminiService.detectCheating(userSolution, question.description || question.title, language),
            geminiService.enhancedAiDetection(userSolution, question.description || question.title, language)
          ])

          console.log('🔍 Basic detection result:', basicDetection)
          console.log('🔍 Enhanced detection result:', enhancedDetection)

          // Combine results - if any method detects AI, flag it
          const isAiGenerated = basicDetection.isAiGenerated || enhancedDetection.isAiGenerated
          const confidence = Math.max(
            simpleDetection.confidence || 0,
            basicDetection.confidence || 0, 
            enhancedDetection.confidence || 0
          )
          
          console.log('🔍 Combined AI detection result:', { isAiGenerated, confidence })

          aiDetectionResult = {
            isAiGenerated,
            confidence,
            simple: simpleDetection,
            basic: basicDetection,
            enhanced: enhancedDetection,
            combined: { isAiGenerated, confidence }
          }
        }
      } catch (detectionError) {
        console.error('❌ AI detection error:', detectionError)
        console.log('⚠️ AI detection failed, proceeding with normal evaluation...')
        aiDetectionResult = null
      }
    } else {
      console.log('❌ Solution is incorrect or incomplete, skipping AI detection')
    }

    // Handle AI detection results
    if (aiDetectionResult && aiDetectionResult.isAiGenerated) {
      console.log('🚨 AI-generated solution detected, returning detection result')
      
      const combinedReasons = [
        ...(aiDetectionResult.simple?.reasons || []),
        ...(aiDetectionResult.basic?.reasons || []),
        ...(aiDetectionResult.enhanced?.reasons || [])
      ].filter((reason, index, arr) => arr.indexOf(reason) === index) // Remove duplicates

      const combinedPatterns = [
        ...(aiDetectionResult.simple?.detectedPatterns || []),
        ...(aiDetectionResult.basic?.specificPatterns || []),
        ...(aiDetectionResult.enhanced?.detectedPatterns || [])
      ].filter((pattern, index, arr) => arr.indexOf(pattern) === index) // Remove duplicates

      return res.json({
        success: true,
        evaluation: {
          score: 0,
          feedback: `AI-generated solution detected (confidence: ${aiDetectionResult.confidence}%). Please try to solve it yourself.`,
          isAiGenerated: true,
          suggestions: []
        },
        feedback: {
          message: `AI-generated solution detected (confidence: ${aiDetectionResult.confidence}%). Please try to solve it yourself.`,
          suggestions: ["Try to understand the problem step by step", "Write your own code from scratch", "Ask for hints if you're stuck"],
          reasons: combinedReasons,
          patterns: combinedPatterns
        },
        metadata: {
          topicName,
          language,
          checkedAt: new Date().toISOString(),
          aiDetection: aiDetectionResult
        }
      })
    }

    // Generate detailed feedback for non-AI solutions
    const feedback = await geminiService.generateLearningRecommendations(
      {
        topicName,
        difficulty: question.difficulty || 'beginner'
      },
      {
        solution: userSolution,
        evaluation
      }
    )

    res.json({
      success: true,
      evaluation,
      feedback,
      metadata: {
        topicName,
        language,
        checkedAt: new Date().toISOString(),
        aiDetection: aiDetectionResult
      }
    })

  } catch (error) {
    console.error('Error checking solution:', error)
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('Rate limit exceeded')) {
      // Provide fallback evaluation when rate limited
      return res.json({
        success: true,
        evaluation: {
          score: 75, // Default score when rate limited
          feedback: "Your solution has been submitted. Due to API rate limits, detailed evaluation is temporarily unavailable. Please check your code against the test cases.",
          suggestions: [
            "Make sure your function handles all test cases correctly",
            "Check for edge cases and error handling",
            "Ensure your code is readable and well-structured"
          ],
          isAiGenerated: false,
          isCorrect: true,
          optimalSolution: null
        },
        metadata: {
          topicName: topicName || 'Unknown Topic',
          fallback: true,
          message: "Using fallback evaluation due to API rate limits"
        }
      })
    }
    
    res.status(500).json({
      error: 'Failed to check solution',
      message: error.message
    })
  }
})

// Helper function to parse skills from request
const parseSkills = (skillsPayload = {}) => {
  const ensureArray = (value) => {
    if (!value && value !== 0) return []
    if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' ? item.trim() !== '' : !!item)
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed ? [trimmed] : []
    }
    return []
  }

  if (Array.isArray(skillsPayload)) {
    const unique = Array.from(new Set(ensureArray(skillsPayload)))
    return {
      skills: unique,
      nanoSkills: unique,
      macroSkills: []
    }
  }
  
  if (typeof skillsPayload === 'string') {
    try {
      const parsed = JSON.parse(skillsPayload)
      return parseSkills(parsed)
    } catch {
      const arrayValue = ensureArray(skillsPayload)
      return {
        skills: arrayValue,
        nanoSkills: arrayValue,
        macroSkills: []
      }
    }
  }

  if (typeof skillsPayload === 'object' && skillsPayload !== null) {
    const directSkills = ensureArray(
      skillsPayload.skills ||
      skillsPayload.items ||
      skillsPayload.values
    )

    const nano = ensureArray(
      skillsPayload.nanoSkills ||
      skillsPayload.nano_skills ||
      skillsPayload.nano
    )

    const macro = ensureArray(
      skillsPayload.macroSkills ||
      skillsPayload.macro_skills ||
      skillsPayload.macro
    )

    let combined = [...directSkills]
    if (!combined.length) {
      combined = [...nano, ...macro]
    }

    const unique = Array.from(new Set(combined.filter(Boolean)))
  
  return {
      skills: unique,
      nanoSkills: nano.length ? nano : unique,
      macroSkills: macro
    }
  }

  return {
    skills: [],
    nanoSkills: [],
    macroSkills: []
  }
}

// Generate complete question package (question + hints + solution)
router.post('/generate-question-package', async (req, res) => {
  // CRITICAL: First log to confirm route is reached
  console.log('[DEBUG] /generate-question-package route reached')
  console.log('[DEBUG] Request method:', req.method)
  console.log('[DEBUG] Request path:', req.path)
  console.log('[DEBUG] Request originalUrl:', req.originalUrl)
  
  // Log incoming payload immediately
  console.log('\n' + '='.repeat(80))
  console.log('📥 INCOMING PAYLOAD (before processing):')
  console.log('='.repeat(80))
  console.log(JSON.stringify(req.body, null, 2))
  console.log('='.repeat(80) + '\n')
  
  // Verify courseName is NOT in the incoming request
  if (req.body && req.body.courseName !== undefined) {
    console.warn('⚠️ [WARNING] courseName found in incoming request body - will be ignored')
    console.warn('   courseName value:', req.body.courseName)
    // Remove it immediately
    delete req.body.courseName
  }
  
  try {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 BACKEND: Received generate-question-package request')
  console.log('='.repeat(80))
    console.log('🔍 [DEBUG] Route handler is executing!')
    console.log('[DEBUG] Payload received:', JSON.stringify(req.body, null, 2))
    console.log('🧾 Received payload:', JSON.stringify(req.body, null, 2))
  console.log('🌐 Request origin:', req.header('Origin'))
  console.log('🌐 Request headers:', JSON.stringify(req.headers, null, 2))
  console.log('🔗 Request URL:', req.url)
  console.log('🔗 Request path:', req.path)
  console.log('🔗 Request method:', req.method)
  console.log('🔗 Request originalUrl:', req.originalUrl)
  console.log('='.repeat(80) + '\n')
  } catch (logError) {
    console.error('❌ [DEBUG] Error in initial logging:', logError)
    console.error('   Error message:', logError.message)
    console.error('   Error stack:', logError.stack)
  }
  
  try {
    console.log('🔍 [DEBUG] Entering try block')
    console.log('🔍 [DEBUG] req.body exists:', !!req.body)
    console.log('🔍 [DEBUG] req.body type:', typeof req.body)
    console.log('🔍 [DEBUG] req.body keys:', req.body ? Object.keys(req.body) : 'N/A')
    
    // Extract new field names from request
    console.log('🔍 [DEBUG] Extracting fields from req.body...')
    const {
      amount = 1,                      // Number of questions to generate (default: 1)
      topic_id,                        // UUID of topic (optional, will be used for saving)
      topic_name,                      // Name of topic (required)
      topicName: bodyTopicName,        // Fallback support
      skills,                          // Skills array (optional, will be parsed)
      question_type = 'code',          // 'code' or 'theoretical'
      programming_language = 'javascript', // Programming language for code questions
      humanLanguage = 'en',            // Human language for questions (default: 'en')
      learnerId: bodyLearnerId
    } = req.body || {}
    
    console.log('🔍 [DEBUG] Extracted raw values:')
    console.log('   - amount:', amount, '(type:', typeof amount, ')')
    console.log('   - topic_id:', topic_id, '(type:', typeof topic_id, ')')
    console.log('   - topic_name:', topic_name, '(type:', typeof topic_name, ')')
    console.log('   - skills:', JSON.stringify(skills), '(type:', typeof skills, ')')
    console.log('   - question_type:', question_type, '(type:', typeof question_type, ')')
    console.log('   - programming_language:', programming_language, '(type:', typeof programming_language, ')')
    console.log('   - humanLanguage:', humanLanguage, '(type:', typeof humanLanguage, ')')
    console.log('   - learnerId:', bodyLearnerId, '(type:', typeof bodyLearnerId, ')')
    
    // Support backward compatibility with old field names
    console.log('🔍 [DEBUG] Normalizing field names with backward compatibility...')
    console.log('   - topic_name:', topic_name, '(type:', typeof topic_name, ')')
    console.log('   - bodyTopicName:', bodyTopicName, '(type:', typeof bodyTopicName, ')')
    console.log('   - req.body?.topicName:', req.body?.topicName, '(type:', typeof req.body?.topicName, ')')
    const topicName = topic_name || bodyTopicName || req.body?.topicName || null
    console.log('   - Final topicName:', topicName, '(type:', typeof topicName, ', isTruthy:', !!topicName, ')')
    const rawQuestionType = question_type || req.body?.questionType || req.body?.question_type || 'code'
    // Normalize questionType: 'coding' -> 'code', 'theoretical' -> 'theoretical'
    const questionType = rawQuestionType === 'coding' ? 'code' : rawQuestionType
    const language = programming_language || req.body?.programming_language || req.body?.language || 'javascript'
    // Extract questionCount/amount - ensure it's a number
    const rawQuestionCount = amount || req.body?.amount || req.body?.questionCount || 1
    const questionCount = typeof rawQuestionCount === 'number' 
      ? rawQuestionCount 
      : parseInt(rawQuestionCount) || 1
    const learnerId = bodyLearnerId ?? req.body?.learnerId ?? null
    
    console.log('🔍 [DEBUG] Normalized values:')
    console.log('   - topicName:', topicName, '(type:', typeof topicName, ')')
    console.log('   - questionType:', questionType, '(type:', typeof questionType, ')')
    console.log('   - language:', language, '(type:', typeof language, ')')
    console.log('   - questionCount:', questionCount, '(type:', typeof questionCount, ')')
    console.log('   - learnerId:', learnerId, '(type:', typeof learnerId, ')')
    
    // Extract skills array - simple and straightforward
    console.log('🔍 [DEBUG] Extracting skills array...')
    const ensureArray = (value) => {
      if (!value && value !== 0) return []
      if (Array.isArray(value)) return value.filter(Boolean) // Remove empty values
      if (typeof value === 'string') return value.trim() ? [value.trim()] : []
      return []
    }

    // Get skills from request - support both 'skills' field and legacy fields for backward compatibility
    const skillsFromRequest = skills ?? req.body?.skills ?? []
    const skillsArray = ensureArray(skillsFromRequest)
    
    // Remove duplicates and filter out empty values
    const finalSkills = Array.from(new Set(skillsArray.filter(Boolean)))
    
    console.log('🔍 [DEBUG] After parameter extraction:')
    console.log('   - topicName:', topicName)
    console.log('   - questionType:', questionType)
    console.log('   - language:', language)
    console.log('   - questionCount:', questionCount)
    console.log('   - skills:', JSON.stringify(finalSkills))
    
    // Validate required fields
    const missingFields = []
    console.log('🔍 [DEBUG] Validating topicName:')
    console.log('   - topicName value:', topicName)
    console.log('   - topicName type:', typeof topicName)
    console.log('   - topicName isTruthy:', !!topicName)
    console.log('   - topicName isString:', typeof topicName === 'string')
    console.log('   - topicName trimmed:', typeof topicName === 'string' ? topicName.trim() : 'N/A')
    console.log('   - topicName isEmpty:', typeof topicName === 'string' && topicName.trim() === '')
    if (!topicName || (typeof topicName === 'string' && topicName.trim() === '')) {
      console.log('❌ [DEBUG] topicName validation FAILED - adding to missingFields')
      missingFields.push('topicName')
    } else {
      console.log('✅ [DEBUG] topicName validation PASSED')
    }
    // Note: skills is optional - if not provided, use empty array
    // Note: learnerId is optional
    // Note: topic_id is optional
    
    if (missingFields.length > 0) {
      console.log('❌ Backend: Missing required field(s):', missingFields)
      return res.status(400).json({
        success: false,
        error: 'Missing one or more required parameters in request body',
        missingFields
      })
    }
    
    // Ensure skills is an array (use empty array if not provided)
    const validatedSkills = Array.isArray(finalSkills) && finalSkills.length > 0 
      ? finalSkills 
      : []
    
    // Validate question_type - only code questions are supported
    if (questionType !== 'code') {
      console.log('❌ Backend: Invalid question_type. Only "code" questions are supported')
      return res.status(400).json({
        success: false,
        error: 'Invalid question_type. Only "code" questions are supported'
      })
    }
    
    console.log('✅ Backend: Starting question generation process...')
    console.log(`   Amount: ${questionCount}`)
    console.log(`   Topic ID: ${topic_id || 'null'}`)
    console.log(`   Topic Name: ${topicName}`)
    console.log(`   Question Type: ${questionType}`)
    console.log(`   Programming Language: ${language}`)
    console.log(`   Human Language: ${humanLanguage}`)
    console.log(`   Skills: ${JSON.stringify(validatedSkills)}`)
    
    // questionCount is already a number from the normalization above
    const finalQuestionCount = questionCount > 0 ? questionCount : 1

    // Generate questions based on question_type
    let questions = []
    let questionsSource = 'unknown'
    let serviceUsed = null
    
    if (questionType === 'code') {
      // Route to Gemini for code questions
      console.log(`🤖 Backend: Generating ${finalQuestionCount} code question(s) with Gemini...`)
      serviceUsed = 'gemini'
      
      console.log('💻 Backend: Generating coding question(s) via unified flow')
      
      // Use validatedSkills - simple skills array (can be empty)
      const combinedSkills = validatedSkills
      
      console.log('   Parameters:', {
        topic: topicName,
        skills: combinedSkills,
        amount: finalQuestionCount,
        language: language,
        options: {
          humanLanguage,
          topic_id: topic_id || null
        }
      })
      
      console.log('🔍 [DEBUG] About to call geminiService.generateCodingQuestion')
      console.log('🔍 [DEBUG] Call parameters:')
      console.log('   - topic:', topicName, '(type:', typeof topicName, ', valid:', !!topicName, ')')
      console.log('   - skills:', JSON.stringify(combinedSkills), '(type:', typeof combinedSkills, ', isArray:', Array.isArray(combinedSkills), ')')
      console.log('   - amount:', finalQuestionCount, '(type:', typeof finalQuestionCount, ', valid:', finalQuestionCount > 0, ')')
      console.log('   - language:', language, '(type:', typeof language, ', valid:', !!language, ')')
      console.log('   - humanLanguage:', humanLanguage, '(type:', typeof humanLanguage, ')')
      console.log('   - topic_id:', topic_id || null, '(type:', typeof topic_id, ')')
      
      // Validate parameters before calling Gemini
      if (!topicName) {
        console.error('❌ [DEBUG] topicName is undefined/null - cannot call Gemini')
        throw new Error('topicName is required but was undefined or null')
      }
      if (!Array.isArray(combinedSkills)) {
        console.error('❌ [DEBUG] combinedSkills is not an array:', typeof combinedSkills)
        throw new Error('combinedSkills must be an array')
      }
      if (!geminiService) {
        console.error('❌ [DEBUG] geminiService is undefined')
        throw new Error('geminiService is not initialized')
      }
      if (typeof geminiService.generateCodingQuestion !== 'function') {
        console.error('❌ [DEBUG] geminiService.generateCodingQuestion is not a function')
        throw new Error('geminiService.generateCodingQuestion is not available')
      }
      
      try {
        // Build the payload that will be sent to Gemini
        const geminiPayload = {
          topicName: topicName,
          skills: combinedSkills,
          amount: finalQuestionCount,
          language: language,
          humanLanguage: humanLanguage,
          topic_id: topic_id || null
        }
        
        // Verify courseName is NOT in the payload
        if (geminiPayload.courseName !== undefined) {
          console.error('❌ [ERROR] courseName found in Gemini payload - removing it!')
          delete geminiPayload.courseName
        }
        
        console.log('\n' + '='.repeat(80))
        console.log('🔍 [DEBUG] Calling geminiService.generateCodingQuestion NOW...')
        console.log('='.repeat(80))
        console.log('📦 Gemini payload:', JSON.stringify(geminiPayload, null, 2))
        console.log('   Parameter 1 (topic):', topicName, '(type:', typeof topicName, ', valid:', !!topicName, ')')
        console.log('   Parameter 2 (skills):', JSON.stringify(combinedSkills), '(type:', typeof combinedSkills, ', isArray:', Array.isArray(combinedSkills), ', length:', Array.isArray(combinedSkills) ? combinedSkills.length : 'N/A', ')')
        console.log('   Parameter 3 (amount):', finalQuestionCount, '(type:', typeof finalQuestionCount, ', valid:', finalQuestionCount > 0, ')')
        console.log('   Parameter 4 (language):', language, '(type:', typeof language, ', valid:', !!language, ')')
        console.log('   Parameter 5 (options):', JSON.stringify({
          humanLanguage,
          topic_id: topic_id || null
        }), '(type: object)')
        console.log('   Starting Gemini API request at:', new Date().toISOString())
        console.log('='.repeat(80) + '\n')
        
        const generated = await geminiService.generateCodingQuestion(
          topicName,
          combinedSkills,
          finalQuestionCount,
          language,
          {
            humanLanguage,
            topic_id: topic_id ?? null
          }
        )
        
        console.log('🔍 [DEBUG] Gemini API request completed at:', new Date().toISOString())
        console.log('🔍 [DEBUG] geminiService.generateCodingQuestion returned successfully')
        console.log('🔍 [DEBUG] Generated result type:', typeof generated)
        console.log('🔍 [DEBUG] Generated is array:', Array.isArray(generated))
        console.log('🔍 [DEBUG] Generated length:', Array.isArray(generated) ? generated.length : 'N/A')
        console.log('🔍 [DEBUG] Generated value:', generated ? JSON.stringify(generated).substring(0, 500) : 'null/undefined')
        
        if (!generated) {
          console.warn('⚠️ [DEBUG] Gemini returned null/undefined - using empty array')
          questions = []
      } else {
          questions = Array.isArray(generated) ? generated : generated ? [generated] : []
        }
        console.log('🔍 [DEBUG] Questions array after processing:', questions.length, 'questions')
      } catch (geminiError) {
        console.error('❌ [DEBUG] Error calling geminiService.generateCodingQuestion')
        console.error('   Error name:', geminiError?.name || 'N/A')
        console.error('   Error message:', geminiError?.message || 'N/A')
        console.error('   Error code:', geminiError?.code || 'N/A')
        console.error('   Error type:', typeof geminiError)
        console.error('   Error stack:', geminiError?.stack || 'N/A')
        if (geminiError?.cause) {
          console.error('   Error cause:', geminiError.cause)
        }
        throw geminiError // Re-throw to be caught by outer catch block
      }
      
      // Validate questions array before processing
      console.log('🔍 [DEBUG] Validating questions array after Gemini call...')
      console.log('   - questions exists:', !!questions)
      console.log('   - questions is array:', Array.isArray(questions))
      console.log('   - questions length:', questions?.length || 0)
      
      if (!Array.isArray(questions)) {
        console.error('❌ [DEBUG] questions is not an array after Gemini call:', typeof questions)
        throw new Error('Gemini service returned invalid response: questions is not an array')
      }
      if (questions.length === 0) {
        console.warn('⚠️ [DEBUG] Gemini returned empty questions array')
      }
      
      // Check if questions are from Gemini or fallback
      const fallbackCount = questions.filter(q => q._isFallback === true || q._source === 'fallback').length
      const geminiCount = questions.length - fallbackCount
      console.log(`✅ Backend: Generated ${questions.length} questions total`)
      if (fallbackCount > 0) {
        console.warn(`⚠️ Backend: ${fallbackCount} question(s) are FALLBACK (NOT from Gemini AI)`)
        console.warn(`   ${geminiCount} question(s) are from Gemini AI`)
        console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
        console.warn('   Check GEMINI_API_KEY and Railway logs for more details')
        questionsSource = 'mixed'
      } else {
        console.log(`✅ Backend: All ${geminiCount} question(s) are from Gemini AI`)
        questionsSource = 'gemini'
      }
    }

    // Process each question to add metadata and structure
    console.log('🔍 [DEBUG] Processing questions...')
    console.log('   - questions array length:', questions.length)
    console.log('   - questions is array:', Array.isArray(questions))
    
    const processedQuestions = []
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      try {
        console.log(`🔍 [DEBUG] Processing question ${i + 1}/${questions.length}...`)
        console.log(`   - question exists:`, !!question)
        console.log(`   - question type:`, typeof question)
        console.log(`   - question keys:`, question ? Object.keys(question) : 'N/A')
        
        if (!question) {
          console.warn(`⚠️ [DEBUG] Question ${i + 1} is null/undefined, skipping`)
          continue
        }
        
      // Get hints from question (generated by Gemini)
      const hints = question.hints || []
        console.log(`   - hints:`, Array.isArray(hints) ? hints.length : 'not array')
      
      // Generate solution explanation for code questions
      let solution = null
      if (questionType === 'code' && question.solution) {
        try {
            console.log(`   - Processing solution (type: ${typeof question.solution})...`)
          if (typeof question.solution === 'string') {
            solution = {
              code: question.solution,
              explanation: question.explanation || null
            }
          } else {
            solution = question.solution
          }
            console.log(`   - Solution processed successfully`)
        } catch (error) {
            console.warn(`⚠️ [DEBUG] Failed to process solution for question ${i + 1}:`, error.message)
          solution = typeof question.solution === 'string' ? question.solution : JSON.stringify(question.solution)
        }
      }

      // Add metadata to question (courseName removed - no longer used)
        console.log(`   - Adding metadata to question ${i + 1}...`)
      
      // Remove deprecated fields before adding metadata
      delete question.courseName
      delete question.nanoSkills
      delete question.macroSkills
      delete question.nano_skills
      delete question.macro_skills
      
      question.topicName = topicName
      question.topic_id = topic_id || question.topic_id || null
      question.skills = validatedSkills
      // Note: difficulty is generated by Gemini/Assessment service, not set by us
      question.language = questionType === 'code' ? language : null
      question.programming_language = questionType === 'code' ? language : null
      question.questionType = questionType
      question.question_type = questionType
      question.hints = hints
      question.solution = solution
      question.humanLanguage = humanLanguage

      processedQuestions.push(question)
        console.log(`✅ [DEBUG] Question ${i + 1} processed successfully`)
      } catch (questionError) {
        console.error(`❌ [DEBUG] Error processing question ${i + 1}:`)
        console.error('   Error name:', questionError?.name || 'N/A')
        console.error('   Error message:', questionError?.message || 'N/A')
        console.error('   Error stack:', questionError?.stack || 'N/A')
        // Continue processing other questions instead of failing completely
        console.warn(`⚠️ [DEBUG] Skipping question ${i + 1} due to error, continuing with next question`)
      }
    }
    
    console.log(`🔍 [DEBUG] Question processing completed: ${processedQuestions.length}/${questions.length} questions processed`)
    
    // Log source information - only code questions are supported
    const fallbackQuestions = processedQuestions.filter(q => q._isFallback === true || q._source === 'fallback')
    const geminiQuestions = processedQuestions.filter(q => q._source === 'gemini' || (!q._source && !q._isFallback))
    
      if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ WARNING: ${fallbackQuestions.length} question(s) are FALLBACK (NOT from Gemini AI)`)
        console.warn(`   ${geminiQuestions.length} question(s) are from Gemini AI`)
        console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
        console.warn('   Check GEMINI_API_KEY and Railway logs for more details')
      } else {
        console.log(`✅ All ${geminiQuestions.length} question(s) are from Gemini AI`)
      }

    // Validate before building response
    console.log('🔍 [DEBUG] Validating data before building response...')
    console.log('   - processedQuestions exists:', !!processedQuestions)
    console.log('   - processedQuestions is array:', Array.isArray(processedQuestions))
    console.log('   - processedQuestions length:', processedQuestions?.length || 0)
    console.log('   - topicName:', topicName)
    console.log('   - questionType:', questionType)
    
    if (!Array.isArray(processedQuestions)) {
      console.error('❌ [DEBUG] processedQuestions is not an array when building response')
      throw new Error('processedQuestions must be an array')
    }
    if (!topicName) {
      console.error('❌ [DEBUG] topicName is missing when building response')
      throw new Error('topicName is required for response')
    }
    
    console.log('🔍 [DEBUG] Building response data...')
    
    // Remove nanoSkills, macroSkills, and courseName from all questions, ensure skills field exists
    const cleanedQuestions = processedQuestions.map(q => {
      const cleaned = { ...q }
      // Remove deprecated fields
      delete cleaned.nanoSkills
      delete cleaned.macroSkills
      delete cleaned.nano_skills
      delete cleaned.macro_skills
      delete cleaned.courseName // Remove courseName - no longer used
      // Ensure skills field exists (use existing skills or empty array)
      if (!cleaned.skills) {
        cleaned.skills = []
      }
      return cleaned
    })
    
    const cleanedSingleQuestion = cleanedQuestions[0] || null

    const responseData = {
      success: true,
      questions: cleanedQuestions,
      question: cleanedSingleQuestion, // Keep backward compatibility
      metadata: {
        amount: finalQuestionCount,
        topic_id: topic_id || null,
        topic_name: topicName,
        topicName: topicName, // Keep backward compatibility
        learnerId,
        skills: validatedSkills,
        skillsList: validatedSkills,
        question_type: questionType,
        questionType: questionType, // Keep backward compatibility
        programming_language: questionType === 'code' ? language : null,
        language: questionType === 'code' ? language : null, // Keep backward compatibility
        humanLanguage: humanLanguage,
        questionCount: processedQuestions.length,
        practiceQuestionsCount: finalQuestionCount,
        generatedAt: new Date().toISOString(),
        questionsSource: questionsSource, // 'gemini', 'assessment', 'fallback', or 'mixed'
        serviceUsed: serviceUsed, // 'gemini' or 'assessment'
        geminiCount: geminiQuestions.length,
        assessmentCount: assessmentQuestions.length,
        fallbackCount: fallbackQuestions.length,
        isFallback: fallbackQuestions.length > 0 // Indicates if any questions are fallback
      }
    }
    
    // Supabase saving is disabled - questions are NOT saved to database
    console.log('\n' + '='.repeat(80))
    console.log('📋 NOTE: Supabase saving is DISABLED')
    console.log('='.repeat(80))
    console.log(`   Question count: ${processedQuestions.length}`)
    console.log(`   Question type: ${questionType}`)
    console.log(`   Topic name: ${topicName}`)
    console.log(`   Questions will be returned to frontend but NOT saved to Supabase`)
    console.log('='.repeat(80) + '\n')
    
    console.log('🔍 [DEBUG] Preparing to send response...')
    console.log('   - responseData exists:', !!responseData)
    console.log('   - responseData.success:', responseData?.success)
    console.log('   - responseData.questions length:', responseData?.questions?.length || 0)
    console.log('   - responseData.metadata exists:', !!responseData?.metadata)
    
    try {
      console.log('📤 Backend: Sending response at:', new Date().toISOString())
      console.log('📤 Backend: Response summary:', {
        success: responseData.success,
        questionsCount: responseData.questions?.length || 0,
        hasMetadata: !!responseData.metadata
      })
    res.json(responseData)
      console.log('✅ [DEBUG] Response sent successfully')
    } catch (responseError) {
      console.error('❌ [DEBUG] Error sending response:')
      console.error('   Error name:', responseError?.name || 'N/A')
      console.error('   Error message:', responseError?.message || 'N/A')
      console.error('   Error stack:', responseError?.stack || 'N/A')
      // Response may have already been sent, so we can't send another
      throw responseError
    }

  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ Backend: Error generating question package')
    console.error('='.repeat(80))
    console.error('🔍 [DEBUG] Error caught in outer catch block')
    console.error('   Error name:', error.name)
    console.error('   Error message:', error.message)
    console.error('   Error code:', error.code || 'N/A')
    console.error('   Error type:', typeof error)
    console.error('   Error constructor:', error.constructor?.name || 'N/A')
    if (error.stack) {
      console.error('   Error stack:', error.stack)
    }
    if (error.cause) {
      console.error('   Error cause:', error.cause)
    }
    console.error('='.repeat(80) + '\n')
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate question package',
      message: error.message || 'Unknown error occurred',
      errorName: error.name || 'Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Reveal solution (only after 3 hints used)
router.post('/reveal-solution', async (req, res) => {
  try {
    const { 
      question, 
      hintsUsed,
      topicName,
      language = 'javascript'
    } = req.body

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      })
    }

    if (hintsUsed < 3) {
      return res.status(400).json({
        error: 'Must use at least 3 hints before revealing solution'
      })
    }

    // Generate solution explanation
    let solution = null
    if (question.solution) {
      solution = {
        code: question.solution,
        explanation: await geminiService.generateLearningRecommendations(
          {
            topicName,
            difficulty: question.difficulty || 'beginner'
          },
          { solution: question.solution }
        )
      }
    } else {
      // Generate solution if not provided
      const solutionCandidates = await geminiService.generateCodingQuestion(
        question.topicName || 'Programming',
        question.skills || [],
        1,
        language,
        {
          humanLanguage: humanLanguage || 'en',
          topic_id: question.topicId || question.topic_id || null
        }
      )
      const generatedSolution = Array.isArray(solutionCandidates)
        ? solutionCandidates[0] || {}
        : solutionCandidates || {}
      
      solution = {
        code: generatedSolution.solution,
        explanation: generatedSolution.explanation
      }
    }

    res.json({
      success: true,
      solution,
      metadata: {
        topicName,
        language,
        revealedAt: new Date().toISOString(),
        hintsUsed
      }
    })

  } catch (error) {
    console.error('Error revealing solution:', error)
    res.status(500).json({
      error: 'Failed to reveal solution',
      message: error.message
    })
  }
})

// Error handler for this router
router.use((err, req, res, next) => {
  console.error('❌ [gemini-question-generation] Router error handler caught error:')
  console.error('   Error name:', err?.name || 'N/A')
  console.error('   Error message:', err?.message || 'N/A')
  console.error('   Error stack:', err?.stack || 'N/A')
  console.error('   Request URL:', req.originalUrl)
  console.error('   Request method:', req.method)
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    errorName: err.name || 'Error'
  })
})

export default router
