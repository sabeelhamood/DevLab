import express from 'express'
import { geminiService } from '../services/gemini.js'
import { saveQuestionsToSupabase } from '../services/questionStorageService.js'
import { saveTempQuestions, createRequestId } from '../services/tempQuestionStore.js'
import { saveGeminiQuestionsToSupabase } from '../services/tempQuestionStorageService.js'
import { postgres } from '../config/database.js'
import { fetchAssessmentTheoreticalQuestions } from '../services/assessmentClient.js'

const router = express.Router()

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

// Generate question based on course, topic, and skills
router.post('/generate-question', async (req, res) => {
  try {
    const { 
      courseName, 
      topicName, 
      nanoSkills = [], 
      macroSkills = [], 
      difficulty = 'beginner',
      language = 'javascript',
      questionType = 'coding'
    } = req.body

    if (!courseName || !topicName) {
      return res.status(400).json({
        error: 'Course name and topic name are required'
      })
    }

    let question
    if (questionType === 'coding') {
      const generated = await geminiService.generateCodingQuestion(
        topicName,
        [...nanoSkills, ...macroSkills],
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
        nanoSkills,
        microSkills: macroSkills
      })
      question = theoretical?.[0] || {}
    }

    // Add course and topic context to the question
    question.courseName = courseName
    question.topicName = topicName
    question.nanoSkills = nanoSkills
    question.macroSkills = macroSkills
    question.difficulty = difficulty
    question.language = language
    question.questionType = questionType

    res.json({
      success: true,
      question,
      metadata: {
        courseName,
        topicName,
        nanoSkills,
        macroSkills,
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
    courseName,
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
          courseName: courseName || null,
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
              courseName: courseName || null,
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
            courseName: courseName || null,
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
            courseName: courseName || null,
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
          courseName: courseName || null,
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
        courseName: null,
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
    courseName,
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
          courseName,
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
        courseName,
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
        courseName,
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
          courseName: courseName || 'Unknown Course',
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
  console.log('\n' + '='.repeat(80))
  console.log('🚀 BACKEND: Received generate-question-package request')
  console.log('='.repeat(80))
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2))
  console.log('🌐 Request origin:', req.header('Origin'))
  console.log('🌐 Request headers:', JSON.stringify(req.headers, null, 2))
  console.log('🔗 Request URL:', req.url)
  console.log('🔗 Request path:', req.path)
  console.log('🔗 Request method:', req.method)
  console.log('🔗 Request originalUrl:', req.originalUrl)
  console.log('='.repeat(80) + '\n')
  
  try {
    // Extract new field names from request
    const {
      amount = 1,                      // Number of questions to generate (default: 1)
      topic_id,                        // UUID of topic (optional, will be used for saving)
      topic_name,                      // Name of topic (required)
      skills = {},                     // Skills object or array (will be parsed)
      question_type = 'code',          // 'code' or 'theoretical'
      programming_language = 'javascript', // Programming language for code questions
      humanLanguage = 'en'             // Human language for questions (default: 'en')
    } = req.body
    
    // Support backward compatibility with old field names
    const topicName = topic_name || req.body.topicName
    const questionType = question_type || req.body.questionType || req.body.question_type || 'code'
    const language = programming_language || req.body.programming_language || req.body.language || 'javascript'
    const questionCount = amount || req.body.amount || req.body.questionCount || 1
    const courseName = req.body.courseName || req.body.course_name || null // Optional for now
    
    // Parse skills from request
    const ensureArray = (value) => {
      if (!value && value !== 0) return []
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.trim() ? [value.trim()] : []
      return []
    }

    const skillsPayload = skills ?? req.body.skills ?? {}
    const skillsData = parseSkills(skillsPayload)

    let nanoSkills = ensureArray(skillsData.nanoSkills)
    let macroSkills = ensureArray(skillsData.macroSkills)

    const legacyNano = ensureArray(req.body.nanoSkills || req.body.nano_skills)
    const legacyMacro = ensureArray(req.body.macroSkills || req.body.macro_skills)

    if (!nanoSkills.length && legacyNano.length) {
      nanoSkills = legacyNano
    }

    if (!macroSkills.length && legacyMacro.length) {
      macroSkills = legacyMacro
    }

    const combinedSkills = skillsData.skills && skillsData.skills.length
      ? ensureArray(skillsData.skills)
      : [...nanoSkills, ...macroSkills]

    const normalizedSkills = Array.from(new Set((combinedSkills || []).filter(Boolean)))

    if (!nanoSkills.length && normalizedSkills.length) {
      nanoSkills = normalizedSkills
    }

    if (!macroSkills.length && legacyMacro.length === 0 && (!skillsData.macroSkills || !skillsData.macroSkills.length)) {
      macroSkills = []
    }
    
    // Validate required fields
    if (!topicName) {
      console.log('❌ Backend: Missing required field: topic_name')
      return res.status(400).json({
        success: false,
        error: 'Missing required field: topic_name'
      })
    }
    
    // Validate question_type
    if (questionType !== 'code' && questionType !== 'theoretical') {
      console.log('❌ Backend: Invalid question_type. Must be "code" or "theoretical"')
      return res.status(400).json({
        success: false,
        error: 'Invalid question_type. Must be "code" or "theoretical"'
      })
    }
    
    console.log('✅ Backend: Starting question generation process...')
    console.log(`   Amount: ${questionCount}`)
    console.log(`   Topic ID: ${topic_id || 'null'}`)
    console.log(`   Topic Name: ${topicName}`)
    console.log(`   Question Type: ${questionType}`)
    console.log(`   Programming Language: ${language}`)
    console.log(`   Human Language: ${humanLanguage}`)
    console.log(`   Skills: ${JSON.stringify(normalizedSkills)}`)
    if (legacyNano.length || legacyMacro.length) {
      console.log(`   Legacy Nano Skills: ${JSON.stringify(legacyNano)}`)
      console.log(`   Legacy Macro Skills: ${JSON.stringify(legacyMacro)}`)
    }
    
    const finalQuestionCount = questionCount > 0 ? parseInt(questionCount) : 1

    // Generate questions based on question_type
    let questions = []
    let questionsSource = 'unknown'
    let serviceUsed = null
    
    if (questionType === 'code') {
      // Route to Gemini for code questions
      console.log(`🤖 Backend: Generating ${finalQuestionCount} code question(s) with Gemini...`)
      serviceUsed = 'gemini'
      
      console.log('💻 Backend: Generating coding question(s) via unified flow')
      
      // Ensure skills arrays are valid before combining
      const combinedSkills = normalizedSkills.length
        ? normalizedSkills
        : [
            ...(Array.isArray(nanoSkills) ? nanoSkills : []),
            ...(Array.isArray(macroSkills) ? macroSkills : [])
          ]
      
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
      
      try {
        const generated = await geminiService.generateCodingQuestion(
          topicName,
          combinedSkills,
          finalQuestionCount,
          language,
          {
            humanLanguage,
            topic_id: topic_id || null
          }
        )
        questions = Array.isArray(generated) ? generated : generated ? [generated] : []
      } catch (geminiError) {
        console.error('❌ Backend: Error calling geminiService.generateCodingQuestion:', geminiError)
        console.error('   Error message:', geminiError.message)
        console.error('   Error stack:', geminiError.stack)
        throw geminiError // Re-throw to be caught by outer catch block
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
    } else if (questionType === 'theoretical') {
      // Route to Assessment Microservice for theoretical questions
      console.log(`📚 Backend: Generating ${finalQuestionCount} theoretical question(s) with Assessment Microservice...`)
      serviceUsed = 'assessment'
      
      try {
        const assessmentQuestions = await fetchAssessmentTheoreticalQuestions({
          topic_id: topic_id || null,
          topic_name: topicName,
          amount: finalQuestionCount,
          difficulty: 'intermediate', // Default difficulty
          humanLanguage: humanLanguage,
          nanoSkills: nanoSkills,
          microSkills: macroSkills // Assessment service uses microSkills instead of macroSkills
        })
        
        console.log(`✅ Backend: Received ${assessmentQuestions.length} question(s) from Assessment Microservice`)
        
        // Transform Assessment Microservice response to match our question format
        questions = (assessmentQuestions || []).map((item, index) => {
          return {
            question_id: item.id || item.question_id || `theoretical_${topic_id || topicName}_${index + 1}`,
            title: item.title || item.question_title || `${topicName} Theoretical Question ${index + 1}`,
            description: item.question_content || item.question || item.description || '',
            difficulty: item.difficulty || 'intermediate',
            language: null, // Theoretical questions don't have a programming language
            question_type: 'theoretical',
            questionType: 'theoretical',
            testCases: [], // Theoretical questions don't have test cases
            hints: item.hints || [],
            solution: item.expected_answer || item.expectedAnswer || null,
            explanation: item.explanation || null,
            topic_id: item.topic_id || topic_id || null,
            topic_name: item.topic_name || topicName,
            _source: 'assessment',
            _isFallback: false
          }
        })
        
        questionsSource = 'assessment'
        console.log(`✅ Backend: Transformed ${questions.length} question(s) from Assessment Microservice`)
      } catch (error) {
        console.error('❌ Backend: Error fetching theoretical questions from Assessment Microservice:', error.message)
        console.error('   Error stack:', error.stack)
        return res.status(500).json({
          success: false,
          error: 'Failed to generate theoretical questions',
          message: error.message,
          service: 'assessment'
        })
      }
    }

    // Process each question to add metadata and structure
    const processedQuestions = []
    
    for (const question of questions) {
      // For code questions, generate hints on-demand (empty array for now)
      // For theoretical questions, use hints from Assessment Microservice
      const hints = question.hints || []
      
      // Generate solution explanation for code questions
      let solution = null
      if (questionType === 'code' && question.solution) {
        try {
          if (typeof question.solution === 'string') {
            solution = {
              code: question.solution,
              explanation: question.explanation || null
            }
          } else {
            solution = question.solution
          }
        } catch (error) {
          console.warn('Failed to process solution:', error.message)
          solution = typeof question.solution === 'string' ? question.solution : JSON.stringify(question.solution)
        }
      } else if (questionType === 'theoretical') {
        // For theoretical questions, solution is the expected answer
        solution = question.solution || question.expected_answer || null
      }

      // Add metadata to question
      question.courseName = courseName || null
      question.topicName = topicName
      question.topic_id = topic_id || question.topic_id || null
      question.nanoSkills = nanoSkills
      question.macroSkills = macroSkills
      question.skills = normalizedSkills
      question.difficulty = question.difficulty || 'intermediate'
      question.language = questionType === 'code' ? language : null
      question.programming_language = questionType === 'code' ? language : null
      question.questionType = questionType
      question.question_type = questionType
      question.hints = hints
      question.solution = solution
      question.humanLanguage = humanLanguage

      processedQuestions.push(question)
    }
    
    // Log source information
    const fallbackQuestions = processedQuestions.filter(q => q._isFallback === true || q._source === 'fallback')
    const geminiQuestions = processedQuestions.filter(q => q._source === 'gemini' || (!q._source && !q._isFallback))
    const assessmentQuestions = processedQuestions.filter(q => q._source === 'assessment')
    
    if (questionType === 'code') {
      if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ WARNING: ${fallbackQuestions.length} question(s) are FALLBACK (NOT from Gemini AI)`)
        console.warn(`   ${geminiQuestions.length} question(s) are from Gemini AI`)
        console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
        console.warn('   Check GEMINI_API_KEY and Railway logs for more details')
      } else {
        console.log(`✅ All ${geminiQuestions.length} question(s) are from Gemini AI`)
      }
    } else if (questionType === 'theoretical') {
      console.log(`✅ All ${assessmentQuestions.length} question(s) are from Assessment Microservice`)
    }

    const responseData = {
      success: true,
      questions: processedQuestions,
      question: processedQuestions[0], // Keep backward compatibility
      metadata: {
        amount: finalQuestionCount,
        topic_id: topic_id || null,
        topic_name: topicName,
        topicName: topicName, // Keep backward compatibility
        courseName: courseName || null,
        skills: {
          list: normalizedSkills,
          nanoSkills: nanoSkills,
          macroSkills: macroSkills
        },
        skillsList: normalizedSkills,
        nanoSkills: nanoSkills, // Keep backward compatibility
        macroSkills: macroSkills, // Keep backward compatibility
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
    
    // Save questions to temp_questions, topics, and testCases tables (after Gemini generation, before response)
    // TEMPORARILY BLOCKING to debug - will make async again after debugging
    // Questions are saved when response appears on https://dev-lab-three.vercel.app/
    try {
      console.log('\n' + '='.repeat(80))
      console.log('📋 STEP: Saving questions to Supabase tables (temp_questions, topics, testCases)...')
      console.log('='.repeat(80))
      console.log(`   Question count: ${processedQuestions.length}`)
      console.log(`   Question type: ${questionType}`)
      console.log(`   Topic name: ${topicName}`)
      console.log(`   Course name: ${courseName}`)
      console.log(`   Source: dev-lab-three.vercel.app`)
      
      // Prepare metadata for saving questions
      const saveMetadata = {
        courseName: courseName || null,
        topicName: topicName,
        topic_id: topic_id || null, // Use topic_id from request if provided
        course_id: null, // Will be resolved from DEFAULT_COURSE_ID or lookup
        courseId: null,
        nanoSkills: nanoSkills || [],
        macroSkills: macroSkills || [],
        difficulty: 'intermediate', // Default difficulty
        language: questionType === 'code' ? language : null,
        programming_language: questionType === 'code' ? language : null,
        questionType: questionType,
        question_type: questionType,
        humanLanguage: humanLanguage,
        questionCount: processedQuestions.length,
        generatedAt: new Date().toISOString(),
        questionsSource: questionsSource, // 'gemini', 'assessment', 'fallback', or 'mixed'
        serviceUsed: serviceUsed, // 'gemini' or 'assessment'
        geminiCount: geminiQuestions.length,
        assessmentCount: assessmentQuestions.length,
        fallbackCount: fallbackQuestions.length,
        isFallback: fallbackQuestions.length > 0,
        source: 'dev-lab-three.vercel.app',
        frontendUrl: 'https://dev-lab-three.vercel.app/',
        endpoint: '/api/gemini-questions/generate-question-package'
      }
      
      console.log(`   Metadata prepared:`, JSON.stringify(saveMetadata, null, 2))
      console.log(`   Preparing to save ${processedQuestions.length} question(s)...`)
      console.log(`   Questions to save:`, processedQuestions.map(q => ({
        question_id: q.question_id || q.id,
        title: q.title?.substring(0, 50),
        description: q.description?.substring(0, 50)
      })))
      
    // TEMPORARILY BLOCKING: await save to debug errors before response is sent
    // This ensures any errors throw before response is sent
    console.log('\n🔒 BLOCKING MODE: Waiting for save to complete before sending response...')
    console.log(`   resolvedCourseId: ${saveMetadata.course_id || 'null'}`)
    console.log(`   topicId: will be resolved in saveGeminiQuestionsToSupabase`)
    
    const saveResults = await saveGeminiQuestionsToSupabase(processedQuestions, saveMetadata)
    
    // Log resolved IDs after save
    console.log(`   After save - check logs above for resolvedCourseId and topicId`)
    
    console.log(`\n✅ Save operation completed`)
      console.log(`   Saved questions: ${saveResults.savedQuestions.length}`)
      console.log(`   Saved topics: ${saveResults.savedTopics.length}`)
      console.log(`   Saved test cases: ${saveResults.savedTestCases.length}`)
      console.log(`   Errors: ${saveResults.errors.length}`)
      
      if (saveResults.savedQuestions.length > 0) {
        console.log(`   ✅ Question IDs saved:`)
        saveResults.savedQuestions.forEach((q, idx) => {
          console.log(`     ${idx + 1}. ${q.question_id}: ${q.title?.substring(0, 50)}...`)
        })
      } else {
        console.warn(`   ⚠️ No questions were saved to temp_questions table`)
      }
      
      if (saveResults.savedTopics.length > 0) {
        console.log(`   ✅ Topics saved:`)
        saveResults.savedTopics.forEach((topic, idx) => {
          console.log(`     ${idx + 1}. ${topic.topic_id}: ${topic.topic_name}`)
        })
      } else {
        console.warn(`   ⚠️ No topics were saved to topics table`)
      }
      
      if (saveResults.savedTestCases.length > 0) {
        console.log(`   ✅ Test cases saved:`)
        saveResults.savedTestCases.forEach((tc, idx) => {
          console.log(`     ${idx + 1}. ${tc.test_case_id}: ${tc.question_id} (stored in: ${tc.stored_in || 'testCases table'})`)
        })
      } else {
        console.warn(`   ⚠️ No test cases were saved`)
      }
      
      if (saveResults.errors.length > 0) {
        console.error(`   ❌ Errors during save:`)
        saveResults.errors.forEach((err, idx) => {
          console.error(`     ${idx + 1}. [${err.step}] ${err.error} (code: ${err.code || 'N/A'})`)
          if (err.detail) {
            console.error(`        Detail: ${err.detail}`)
          }
          if (err.hint) {
            console.error(`        Hint: ${err.hint}`)
          }
        })
      }
      
      console.log('='.repeat(80))
      
    } catch (error) {
      // Log error and throw to ensure response indicates failure
      console.error('\n' + '='.repeat(80))
      console.error('❌ ERROR: Failed to save questions to Supabase')
      console.error('='.repeat(80))
      console.error(`   Error message: ${error.message}`)
      console.error(`   Error code: ${error.code || 'N/A'}`)
      console.error(`   Error detail: ${error.detail || 'N/A'}`)
      console.error(`   Error hint: ${error.hint || 'N/A'}`)
      console.error(`   Error stack: ${error.stack || 'N/A'}`)
      console.error('='.repeat(80))
      console.error('   Questions were generated successfully but NOT saved to Supabase')
      console.error('   This is a CRITICAL ERROR - saving is now blocking, so this will delay the response')
      console.error('='.repeat(80))
      
      // Don't throw error - still return questions to frontend, but log the failure
      // In production, you might want to throw here to alert monitoring systems
    }
    
    // Save questions to Supabase automatically (after Gemini generation, before response)
    // This runs asynchronously and doesn't block the response
    try {
      console.log('🔍 Saving questions to Supabase (questions table)...')
      console.log(`   Question count: ${processedQuestions.length}`)
      console.log(`   Question type: ${questionType}`)
      console.log(`   Topic name: ${topicName}`)
      console.log(`   Course name: ${courseName}`)
      
      // Transform questions to match storage service format
      const questionsToSave = processedQuestions.map((q, index) => {
        // Extract question text
        const questionText = q.description || q.title || q.question || ''
        
        // Transform test cases to match storage service format
        // Only include test cases that have an expected output
        const testCases = (q.testCases || [])
          .filter(tc => tc.expectedOutput || tc.expected_output || tc.output)
          .map(tc => ({
            input: tc.input || null,
            expected_output: tc.expectedOutput || tc.expected_output || tc.output || null,
            explanation: tc.explanation || null
          }))
        
        // Transform question for storage service
        const questionForStorage = {
          id: `gemini_${topicName}_${index + 1}_${Date.now()}`,
          question: questionText,
          question_text: questionText,
          question_content: questionText,
          prompt: questionText,
          question_type: questionType === 'coding' ? 'code' : 'theoretical',
          topic_id: null, // Will be looked up by topic_name
          topic_name: topicName,
          topicName: topicName,
          difficulty: q.difficulty || difficulty,
          programming_language: questionType === 'coding' ? (q.language || language) : null,
          language: questionType === 'coding' ? (q.language || language) : null,
          test_cases: testCases,
          testCases: testCases,
          hints: q.hints || [],
          clues: q.hints || [],
          title: q.title || questionText.substring(0, 100),
          // For theoretical questions, extract options and correct_answer if available
          options: q.options || [],
          correct_answer: q.correctAnswer || q.correct_answer || q.expectedAnswer || null,
          expectedAnswer: q.correctAnswer || q.correct_answer || q.expectedAnswer || null,
          // Include raw Gemini response if available
          _rawGeminiResponse: q._rawGeminiResponse || null,
          // Include ajax structure if it exists
          ajax: q.ajax || {
            question: questionText,
            testCases: testCases,
            hints: q.hints || [],
            humanLanguage: 'en',
            difficulty: q.difficulty || difficulty
          }
        }
        
        return questionForStorage
      })
      
      // Prepare metadata for storage service
      const saveMetadata = {
        topic_id: null, // Will be looked up by topic_name
        topic_name: topicName,
        topicName: topicName,
        question_type: questionType === 'coding' ? 'code' : 'theoretical',
        programming_language: questionType === 'coding' ? language : null,
        course_id: null, // Can be looked up by course_name if needed
        course_name: courseName,
        nanoSkills: nanoSkills || [],
        microSkills: macroSkills || [], // Note: storage service uses microSkills, not macroSkills
        macroSkills: macroSkills || [],
        humanLanguage: 'en',
        source: 'gemini-question-generation'
      }
      
      // Save questions asynchronously - don't await to avoid blocking response
      saveQuestionsToSupabase(questionsToSave, saveMetadata)
        .then((saveResults) => {
          const savedCount = saveResults.filter(r => r.success).length
          const failedCount = saveResults.filter(r => !r.success && !r.skipped).length
          const skippedCount = saveResults.filter(r => r.skipped).length
          
          if (savedCount > 0) {
            console.log(`✅ Successfully saved ${savedCount} question(s) to Supabase (questions table)`)
            saveResults
              .filter(r => r.success)
              .forEach((result, index) => {
                console.log(`   ${index + 1}. Question ID: ${result.question_id}`)
                console.log(`      Type: ${result.question_type}`)
                console.log(`      Content: ${result.question_content?.substring(0, 50)}...`)
              })
          }
          if (skippedCount > 0) {
            console.log(`⏭️  Skipped ${skippedCount} question(s) (duplicates)`)
          }
          if (failedCount > 0) {
            console.warn(`⚠️ Failed to save ${failedCount} question(s) to Supabase (questions table)`)
            saveResults
              .filter(r => !r.success && !r.skipped)
              .forEach((result, index) => {
                console.warn(`   ${index + 1}. Error: ${result.error || result.message}`)
              })
          }
        })
        .catch((error) => {
          // Log error but don't throw - questions were generated successfully
          console.error('❌ Error saving questions to Supabase (questions table):', error.message)
          console.error('   Questions were generated successfully but not saved to database')
          console.error('   Error stack:', error.stack)
        })
    } catch (error) {
      // Don't fail the request if Supabase save fails - log error and continue
      console.error('❌ Error initiating question save to Supabase (questions table):', error.message)
      console.error('   Questions were generated successfully but save was not initiated')
    }
    
    console.log('📤 Backend: Sending response:', responseData)
    res.json(responseData)

  } catch (error) {
    console.error('❌ Backend: Error generating question package:', error)
    console.error('   Error name:', error.name)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    res.status(500).json({
      success: false,
      error: 'Failed to generate question package',
      message: error.message || 'Unknown error occurred',
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
      courseName,
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
            courseName,
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
        [...(question.nanoSkills || []), ...(question.macroSkills || [])],
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
        courseName,
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

export default router
