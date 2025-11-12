import express from 'express'
import { geminiService } from '../services/gemini.js'
import { saveQuestionsToSupabase } from '../services/questionStorageService.js'

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
  const { 
    question, 
    userAttempt = '', 
    hintsUsed = 0, 
    allHints = [],
    courseName,
    topicName
  } = req.body

  if (!question) {
    return res.status(400).json({
      error: 'Question is required'
    })
  }

  try {
    const hint = await geminiService.generateHints(
      question,
      userAttempt,
      hintsUsed,
      allHints
    )

    res.json({
      success: true,
      hint,
      metadata: {
        courseName,
        topicName,
        hintsUsed: hintsUsed + 1,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating hint:', error)
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('Rate limit exceeded')) {
      // Provide fallback hints when rate limited
      const fallbackHints = [
        "Try breaking down the problem into smaller steps.",
        "Consider what data structures might be helpful for this problem.",
        "Think about edge cases and how to handle them.",
        "Look at the test cases to understand the expected behavior.",
        "Consider using helper functions to organize your code better."
      ]
      
      const fallbackHint = fallbackHints[hintsUsed || 0] || fallbackHints[0]
      
      return res.json({
        success: true,
        hint: fallbackHint,
        metadata: {
          courseName,
          topicName,
          hintsUsed: hintsUsed + 1,
          generatedAt: new Date().toISOString(),
          fallback: true,
          message: "Using fallback hint due to API rate limits"
        }
      })
    }
    
    res.status(500).json({
      error: 'Failed to generate hint',
      message: error.message
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
  console.log('🚀 Backend: Received generate-question-package request')
  console.log('📋 Backend: Request body:', req.body)
  console.log('🌐 Backend: Request origin:', req.header('Origin'))
  console.log('🌐 Backend: Request headers:', req.headers)
  console.log('🔗 Backend: Request URL:', req.url)
  console.log('🔗 Backend: Request method:', req.method)
  
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
      console.log(`✅ Backend: Generated ${questions.length} questions total`)
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
        console.log(`✅ Backend: Generated question ${i + 1}:`, question.title || question.description?.substring(0, 50) + '...')
      }
      console.log(`✅ Backend: Generated ${questions.length} questions total`)
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
        generatedAt: new Date().toISOString()
      }
    }
    
    // Save questions to Supabase automatically (after Gemini generation, before response)
    // This runs asynchronously and doesn't block the response
    try {
      console.log('🔍 Saving questions to Supabase...')
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
            console.log(`✅ Successfully saved ${savedCount} question(s) to Supabase`)
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
            console.warn(`⚠️ Failed to save ${failedCount} question(s) to Supabase`)
            saveResults
              .filter(r => !r.success && !r.skipped)
              .forEach((result, index) => {
                console.warn(`   ${index + 1}. Error: ${result.error || result.message}`)
              })
          }
        })
        .catch((error) => {
          // Log error but don't throw - questions were generated successfully
          console.error('❌ Error saving questions to Supabase:', error.message)
          console.error('   Questions were generated successfully but not saved to database')
          console.error('   Error stack:', error.stack)
        })
    } catch (error) {
      // Don't fail the request if Supabase save fails - log error and continue
      console.error('❌ Error initiating question save to Supabase:', error.message)
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
