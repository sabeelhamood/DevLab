// Frontend Question Generation API service
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://devlab-backend-production-0bcb.up.railway.app/api' : 'http://localhost:3001/api')

// Helper function to safely handle fetch requests
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    // Handle message channel errors gracefully
    if (error.message?.includes('message channel closed')) {
      throw new Error('Request was cancelled due to message channel closure')
    }
    throw error
  }
}

class QuestionGenerationAPI {
  // Generate a single question based on topic and skills
  async generateQuestion({
    topicName,
    skills = [],
    difficulty = 'beginner',
    language = 'javascript',
    questionType = 'coding'
  }) {
    try {
      const normalizedSkills = Array.isArray(skills) ? skills : skills ? [skills] : []
      const response = await fetch(`${API_BASE_URL}/gemini-questions/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName,
          skills: normalizedSkills,
          difficulty,
          language,
          questionType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.question
    } catch (error) {
      console.error('Question generation API error:', error)
      throw new Error(`Failed to generate question: ${error.message}`)
    }
  }

  // Generate a complete question package (question + hints + solution)
  async generateQuestionPackage({
    topicName,
    topicId = null,
    topic_id = null,
    skills = [],
    language = 'javascript',
    questionType = 'coding',
    questionCount = 1,
    humanLanguage = 'en'
  }, externalSignal = null) {
    console.log('\n' + '='.repeat(80))
    console.log('🚀 [FRONTEND] generateQuestionPackage CALLED')
    console.log('='.repeat(80))
    console.log('📋 Received Parameters:')
    console.log('   - topicName:', topicName, '(type:', typeof topicName, ')')
    console.log('   - topicId:', topicId, '(type:', typeof topicId, ')')
    console.log('   - topic_id:', topic_id, '(type:', typeof topic_id, ')')
    console.log('   - skills:', JSON.stringify(skills), '(type:', typeof skills, ', isArray:', Array.isArray(skills), ', length:', Array.isArray(skills) ? skills.length : 'N/A', ')')
    console.log('   - language:', language, '(type:', typeof language, ')')
    console.log('   - questionType:', questionType, '(type:', typeof questionType, ')')
    console.log('   - questionCount:', questionCount, '(type:', typeof questionCount, ')')
    console.log('   - humanLanguage:', humanLanguage, '(type:', typeof humanLanguage, ')')
    console.log('='.repeat(80) + '\n')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏰ API: Request timeout reached, aborting...')
        controller.abort()
      }, 300000) // Increased to 5 minutes for multiple questions with rate limiting

      // Use external signal if provided, otherwise use internal controller
      const signal = externalSignal || controller.signal

      console.log('📡 API: Making fetch request to:', `${API_BASE_URL}/gemini-questions/generate-question-package`)
      const normalizedSkills = Array.isArray(skills)
        ? skills
        : skills
          ? [skills]
          : []

      const normalizedQuestionType = questionType === 'coding' ? 'code' : questionType

      console.log('\n' + '='.repeat(80))
      console.log('🔧 [FRONTEND] Normalizing questionType...')
      console.log('='.repeat(80))
      console.log('   - Original questionType:', questionType)
      console.log('   - Normalized questionType:', normalizedQuestionType)
      console.log('   - Will route to:', normalizedQuestionType === 'code' ? '✅ CODING (Gemini)' : '❌ OTHER')
      console.log('='.repeat(80) + '\n')

      const payload = {
        humanLanguage,
        programmingLanguage: language,
        questionCount,
        questionType,
        skills: normalizedSkills,
        topicId: topicId ?? topic_id ?? null,
        topicName,
        courseName: ' ' // Temporary workaround: sending space to bypass old validation if Railway still running old code
      }

      console.log('\n' + '='.repeat(80))
      console.log('📦 [FRONTEND] Payload being sent to backend:')
      console.log('='.repeat(80))
      console.log(JSON.stringify(payload, null, 2))
      console.log('='.repeat(80))
      console.log('   ✅ questionType:', payload.questionType, '→ Will route to', normalizedQuestionType === 'code' ? 'CODING (Gemini)' : 'OTHER')
      console.log('   ✅ Endpoint:', `${API_BASE_URL}/gemini-questions/generate-question-package`)
      console.log('='.repeat(80) + '\n')

      const response = await safeFetch(`${API_BASE_URL}/gemini-questions/generate-question-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal
      })

      clearTimeout(timeoutId)
      console.log('📨 API: Received response:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ API: Response not OK:', response.status, response.statusText)
        // Try to read the error message from response body
        let errorMessage = `${response.status}: ${response.statusText}`
        try {
          const errorData = await response.clone().json()
          console.error('❌ API: Error response body:', errorData)
          if (errorData.error) {
            errorMessage = `HTTP ${response.status}: ${errorData.error}`
          }
          if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
            errorMessage += ` (Missing fields: ${errorData.missingFields.join(', ')})`
          }
        } catch (parseError) {
          console.error('❌ API: Failed to parse error response:', parseError)
          try {
            const errorText = await response.clone().text()
            console.error('❌ API: Error response text:', errorText)
            errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
          } catch (textError) {
            console.error('❌ API: Failed to read error response as text:', textError)
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('📦 API: Parsed response:', result)
      
      // Check if questions are from Gemini or fallback
      if (result.metadata) {
        console.log('🔍 API: Response metadata:', {
          questionsSource: result.metadata.questionsSource,
          serviceUsed: result.metadata.serviceUsed,
          geminiCount: result.metadata.geminiCount,
          fallbackCount: result.metadata.fallbackCount,
          isFallback: result.metadata.isFallback
        })
        
        if (result.metadata.isFallback) {
          console.warn('⚠️ API: Questions are FALLBACK (NOT from Gemini AI)')
          console.warn('   This usually means Gemini API is rate-limited, overloaded, or unavailable')
        } else {
          console.log('✅ API: Questions are from Gemini AI')
        }
      }
      
      // Return questions array if available, otherwise return single question for backward compatibility
      if (result.questions && Array.isArray(result.questions)) {
        console.log('🎯 API: Returning questions array:', result.questions.length, 'questions')
        
        // Log first question structure to debug testCases
        if (result.questions.length > 0) {
          const firstQuestion = result.questions[0]
          console.log('🔍 API: First question structure:', {
            keys: Object.keys(firstQuestion),
            hasTestCases: !!firstQuestion.testCases,
            hasTest_cases: !!firstQuestion.test_cases,
            testCases: firstQuestion.testCases,
            test_cases: firstQuestion.test_cases,
            _source: firstQuestion._source,
            _isFallback: firstQuestion._isFallback,
            title: firstQuestion.title,
            description: firstQuestion.description
          })
        }
        
        return result.questions
      } else {
        console.log('🎯 API: Returning single question:', result.question)
        return result.question
      }
    } catch (error) {
      console.error('❌ API: Question package generation error:', error)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.')
      }
      if (error.message.includes('message channel closed')) {
        throw new Error('Connection lost. Please check your internet connection and try again.')
      }
      throw new Error(`Failed to generate question package: ${error.message}`)
    }
  }

  // Generate hint for a specific question
  async generateHint({
    question,
    userAttempt = '',
    hintsUsed = 0,
    allHints = [],
    topicName
  }, externalSignal = null) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏰ API: Hint generation timeout reached, aborting...')
        controller.abort()
      }, 120000) // Increased to 2 minutes for hint generation with rate limiting

      // Use external signal if provided, otherwise use internal controller
      const signal = externalSignal || controller.signal

      console.log('📡 API: Making hint generation request')
      const response = await safeFetch(`${API_BASE_URL}/gemini-questions/generate-hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userAttempt,
          hintsUsed,
          allHints,
          topicName
        }),
        signal
      })

      clearTimeout(timeoutId)
      console.log('📨 API: Hint generation response received:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📦 API: Hint generation result:', result)
      // Return the hint object or extract hint text
      return result.hint || result
    } catch (error) {
      console.error('❌ API: Hint generation error:', error)
      if (error.name === 'AbortError') {
        throw new Error('Hint generation timed out. Please try again.')
      }
      if (error.message.includes('message channel closed')) {
        throw new Error('Connection lost while generating hint. Please try again.')
      }
      throw new Error(`Failed to generate hint: ${error.message}`)
    }
  }

  // Check solution and get feedback
  async checkSolution({
    question,
    userSolution,
    language = 'javascript',
    topicName
  }) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏰ API: Solution checking timeout reached, aborting...')
        controller.abort()
      }, 120000) // Increased to 2 minutes for solution checking with rate limiting

      const response = await safeFetch(`${API_BASE_URL}/gemini-questions/check-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userSolution,
          language,
          topicName
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📦 API: Solution checking result:', result)
      return {
        evaluation: result.evaluation,
        feedback: result.feedback
      }
    } catch (error) {
      console.error('❌ API: Solution checking error:', error)
      if (error.name === 'AbortError') {
        throw new Error('Solution checking timed out. Please try again.')
      }
      if (error.message.includes('message channel closed')) {
        throw new Error('Connection lost while checking solution. Please try again.')
      }
      throw new Error(`Failed to check solution: ${error.message}`)
    }
  }

  // Reveal solution (only after 3 hints used)
  async revealSolution({
    question,
    hintsUsed,
    topicName,
    language = 'javascript'
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini-questions/reveal-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          hintsUsed,
          topicName,
          language
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.solution
    } catch (error) {
      console.error('Solution reveal API error:', error)
      throw new Error(`Failed to reveal solution: ${error.message}`)
    }
  }

  // Generate multiple questions for a practice session
  async generatePracticeQuestions({
    topicName,
    skills = [],
    difficulty = 'beginner',
    language = 'javascript',
    questionType = 'coding',
    count = 5
  }) {
    try {
      const questions = []
      
      for (let i = 0; i < count; i++) {
        try {
          const question = await this.generateQuestion({
            topicName,
            skills,
            difficulty,
            language,
            questionType
          })
          questions.push(question)
        } catch (error) {
          console.warn(`Failed to generate question ${i + 1}:`, error.message)
          // Continue with other questions
        }
      }

      return questions
    } catch (error) {
      console.error('Practice questions generation error:', error)
      throw new Error(`Failed to generate practice questions: ${error.message}`)
    }
  }
}

export const questionGenerationAPI = new QuestionGenerationAPI()
export default questionGenerationAPI
