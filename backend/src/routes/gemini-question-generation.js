import express from 'express'
import { geminiService } from '../services/gemini.js'
import { saveQuestionsToSupabase } from '../services/questionStorageService.js'
import { saveTempQuestions, createRequestId } from '../services/tempQuestionStore.js'
import { saveGeminiQuestionsToSupabase } from '../services/tempQuestionStorageService.js'
import { postgres } from '../config/database.js'

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
      question = await geminiService.generateCodingQuestion(
        topicName,
        difficulty,
        language,
        nanoSkills,
        macroSkills
      )
    } else {
      question = await geminiService.generateTheoreticalQuestion(
        topicName,
        difficulty,
        nanoSkills,
        macroSkills
      )
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
    const { 
      courseName, 
      topicName, 
      nanoSkills = [], 
      macroSkills = [], 
      difficulty = 'beginner',
      language = 'javascript',
      questionType = 'coding',
      questionCount = 1,
      userId = 'learner_1' // Default user ID for mock
    } = req.body

    if (!courseName || !topicName) {
      console.log('❌ Backend: Missing required fields')
      return res.status(400).json({
        error: 'Course name and topic name are required'
      })
    }

    console.log('✅ Backend: Starting question generation process...')
    
    const finalQuestionCount = questionCount > 0 ? questionCount : 1

    // Generate questions (single or multiple)
    console.log(`🤖 Backend: Generating ${finalQuestionCount} question(s) with Gemini...`)
    let questions = []
    
    if (questionType === 'coding' && finalQuestionCount > 1) {
      // Use bulk generation for multiple coding questions
      console.log('💻 Backend: Generating multiple coding questions at once')
      questions = await geminiService.generateMultipleCodingQuestions(
        topicName,
        difficulty,
        language,
        nanoSkills,
        macroSkills,
        finalQuestionCount
      )
      
      // Check if questions are from Gemini or fallback
      const fallbackCount = questions.filter(q => q._isFallback === true || q._source === 'fallback').length
      const geminiCount = questions.length - fallbackCount
      console.log(`✅ Backend: Generated ${questions.length} questions total`)
      if (fallbackCount > 0) {
        console.warn(`⚠️ Backend: ${fallbackCount} question(s) are FALLBACK (NOT from Gemini AI)`)
        console.warn(`   ${geminiCount} question(s) are from Gemini AI`)
        console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
        console.warn('   Check GEMINI_API_KEY and Railway logs for more details')
      } else {
        console.log(`✅ Backend: All ${geminiCount} question(s) are from Gemini AI`)
      }
    } else {
      // Generate questions one by one (for theoretical or single questions)
      for (let i = 0; i < finalQuestionCount; i++) {
        console.log(`📝 Backend: Generating question ${i + 1} of ${finalQuestionCount}`)
        let question
        if (questionType === 'coding') {
          console.log('💻 Backend: Generating coding question')
          question = await geminiService.generateCodingQuestion(
            topicName,
            difficulty,
            language,
            nanoSkills,
            macroSkills
          )
        } else {
          console.log('📚 Backend: Generating theoretical question')
          question = await geminiService.generateTheoreticalQuestion(
            topicName,
            difficulty,
            nanoSkills,
            macroSkills
          )
        }
        
        questions.push(question)
        const isFallback = question._isFallback === true || question.summary?.includes('fallback') || question._source === 'fallback'
        if (isFallback) {
          console.warn(`⚠️ Backend: Question ${i + 1} is FALLBACK (NOT from Gemini AI):`, question.title || question.description?.substring(0, 50) + '...')
        } else {
          console.log(`✅ Backend: Generated question ${i + 1} from Gemini AI:`, question.title || question.description?.substring(0, 50) + '...')
        }
      }
      
      // Check if any questions are fallback
      const fallbackCount = questions.filter(q => q._isFallback === true || q._source === 'fallback').length
      const geminiCount = questions.length - fallbackCount
      console.log(`✅ Backend: Generated ${questions.length} questions total`)
      if (fallbackCount > 0) {
        console.warn(`⚠️ Backend: ${fallbackCount} question(s) are FALLBACK (NOT from Gemini AI)`)
        console.warn(`   ${geminiCount} question(s) are from Gemini AI`)
      } else {
        console.log(`✅ Backend: All ${geminiCount} question(s) are from Gemini AI`)
      }
    }

    // Process each question to add metadata and structure
    const processedQuestions = []
    
    for (const question of questions) {
      // Don't generate hints upfront - generate on-demand for better performance
      const hints = [] // Empty array - hints will be generated when requested

      // Generate solution explanation
      let solution = null
      try {
        if (questionType === 'coding' && question.solution) {
          solution = {
            code: question.solution,
            explanation: await geminiService.generateLearningRecommendations(
              { courseName, topicName, difficulty },
              { solution: question.solution }
            )
          }
        }
      } catch (error) {
        console.warn('Failed to generate solution explanation:', error.message)
      }

      // Add metadata to question
      question.courseName = courseName
      question.topicName = topicName
      question.nanoSkills = nanoSkills
      question.macroSkills = macroSkills
      question.difficulty = difficulty
      question.language = language
      question.questionType = questionType
      question.hints = hints
      question.solution = solution

      processedQuestions.push(question)
    }
    
    // Check if questions are from Gemini or fallback
    const fallbackQuestions = processedQuestions.filter(q => q._isFallback === true || q._source === 'fallback')
    const geminiQuestions = processedQuestions.filter(q => q._isFallback !== true && q._source !== 'fallback')
    const questionsSource = fallbackQuestions.length > 0 ? 'mixed' : (geminiQuestions.length > 0 ? 'gemini' : 'unknown')
    
    if (fallbackQuestions.length > 0) {
      console.warn(`⚠️ WARNING: ${fallbackQuestions.length} question(s) are FALLBACK (NOT from Gemini AI)`)
      console.warn(`   ${geminiQuestions.length} question(s) are from Gemini AI`)
      console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
      console.warn('   Check GEMINI_API_KEY and Railway logs for more details')
    } else {
      console.log(`✅ All ${geminiQuestions.length} question(s) are from Gemini AI`)
    }

    const responseData = {
      success: true,
      questions: processedQuestions,
      question: processedQuestions[0], // Keep backward compatibility
      metadata: {
        courseName,
        topicName,
        nanoSkills,
        macroSkills,
        difficulty,
        language,
        questionType,
        questionCount: processedQuestions.length,
        practiceQuestionsCount: finalQuestionCount,
        generatedAt: new Date().toISOString(),
        questionsSource: questionsSource, // 'gemini', 'fallback', or 'mixed'
        geminiCount: geminiQuestions.length,
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
        courseName,
        topicName,
        course_id: null, // Will be resolved from DEFAULT_COURSE_ID or lookup
        courseId: null,
        nanoSkills: nanoSkills || [],
        macroSkills: macroSkills || [],
        difficulty,
        language,
        questionType,
        questionCount: processedQuestions.length,
        generatedAt: new Date().toISOString(),
        questionsSource: questionsSource, // 'gemini', 'fallback', or 'mixed'
        geminiCount: geminiQuestions.length,
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
    res.status(500).json({
      error: 'Failed to generate question package',
      message: error.message
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
      const generatedSolution = await geminiService.generateCodingQuestion(
        question.topicName || 'Programming',
        question.difficulty || 'beginner',
        language,
        question.nanoSkills || [],
        question.macroSkills || []
      )
      
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
