// Frontend Question Generation API service
const API_BASE_URL = 'http://localhost:3000/api'

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
  // Generate a single question based on course, topic, and skills
  async generateQuestion({
    courseName,
    topicName,
    nanoSkills = [],
    macroSkills = [],
    difficulty = 'beginner',
    language = 'javascript',
    questionType = 'coding'
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini-questions/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName,
          topicName,
          nanoSkills,
          macroSkills,
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
    courseName,
    topicName,
    nanoSkills = [],
    macroSkills = [],
    difficulty = 'beginner',
    language = 'javascript',
    questionType = 'coding',
    questionCount = 1
  }, externalSignal = null) {
    console.log('🔧 API: generateQuestionPackage called with params:', {
      courseName,
      topicName,
      nanoSkills,
      macroSkills,
      difficulty,
      language,
      questionType,
      questionCount
    })
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏰ API: Request timeout reached, aborting...')
        controller.abort()
      }, 300000) // Increased to 5 minutes for multiple questions with rate limiting

      // Use external signal if provided, otherwise use internal controller
      const signal = externalSignal || controller.signal

      console.log('📡 API: Making fetch request to:', `${API_BASE_URL}/gemini-questions/generate-question-package`)
      const response = await safeFetch(`${API_BASE_URL}/gemini-questions/generate-question-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName,
          topicName,
          nanoSkills,
          macroSkills,
          difficulty,
          language,
          questionType,
          questionCount
        }),
        signal
      })

      clearTimeout(timeoutId)
      console.log('📨 API: Received response:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ API: Response not OK:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📦 API: Parsed response:', result)
      
      // Return questions array if available, otherwise return single question for backward compatibility
      if (result.questions && Array.isArray(result.questions)) {
        console.log('🎯 API: Returning questions array:', result.questions.length, 'questions')
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
    courseName,
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
          courseName,
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
    courseName,
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
          courseName,
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
    courseName,
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
          courseName,
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
    courseName,
    topicName,
    nanoSkills = [],
    macroSkills = [],
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
            courseName,
            topicName,
            nanoSkills,
            macroSkills,
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
