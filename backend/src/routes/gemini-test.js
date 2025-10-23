import express from 'express'

const router = express.Router()

// Simple test endpoint for Gemini API
router.get('/test-simple', async (req, res) => {
  try {
    // Check if the package is installed
    let GoogleGenerativeAI
    try {
      const geminiModule = await import('@google/generative-ai')
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI
    } catch (error) {
      // Return mock response if package not installed
      return res.json({
        success: true,
        message: 'Gemini API setup ready (mock mode)',
        generatedQuestion: 'Mock: Write a function that finds the largest number in an array',
        note: 'Install @google/generative-ai package for real AI generation',
        mock: true,
        timestamp: new Date().toISOString()
      })
    }

    // Test with your API key
    const API_KEY = 'AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw'
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = "Generate a simple JavaScript coding question for beginners about arrays. Return only the question text."
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    res.json({
      success: true,
      message: 'Gemini API is working!',
      generatedQuestion: text,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Gemini API test failed:', error)
    res.status(500).json({
      error: 'Gemini API test failed',
      message: error.message,
      suggestion: 'Check your API key and internet connection'
    })
  }
})

// Test question generation
router.post('/test-question', async (req, res) => {
  try {
    const { topic, difficulty } = req.body
    
    // Check if the package is installed
    let GoogleGenerativeAI
    try {
      const geminiModule = await import('@google/generative-ai')
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI
    } catch (error) {
      // Return mock data if package not installed
      return res.json({
        success: true,
        question: {
          title: `Mock ${difficulty} Question about ${topic}`,
          description: `This is a mock question about ${topic} at ${difficulty} level. The Gemini package needs to be installed to generate real AI questions.`,
          example: "Input: [1,2,3], Output: 6",
          difficulty: difficulty,
          note: "Install @google/generative-ai package for real AI generation"
        },
        topic,
        difficulty,
        mock: true,
        timestamp: new Date().toISOString()
      })
    }

    const API_KEY = 'AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw'
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `Generate a ${difficulty} level coding question about ${topic}. 
    Include:
    - Clear problem statement
    - Example input/output
    - Brief explanation
    
    Format as JSON:
    {
      "title": "Question title",
      "description": "Problem description",
      "example": "Input: [1,2,3], Output: 6",
      "difficulty": "${difficulty}"
    }`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    res.json({
      success: true,
      question: text,
      topic,
      difficulty,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error generating question:', error)
    res.status(500).json({
      error: 'Failed to generate question',
      message: error.message
    })
  }
})

export default router
