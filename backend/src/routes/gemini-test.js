import express from 'express'

const router = express.Router()

// Simple test endpoint for Gemini API
router.get('/test-simple', async (req, res) => {
  try {
    // Import the Gemini service
    const { geminiService } = await import('../services/gemini.js')
    
    // Test basic question generation
    const question = await geminiService.generateCodingQuestion(
      'JavaScript Arrays', 
      'beginner', 
      'javascript'
    )
    
    res.json({
      success: true,
      message: geminiService.isMockMode ? 'Gemini API is working in mock mode!' : 'Gemini API is working!',
      generatedQuestion: question,
      mockMode: geminiService.isMockMode,
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

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured',
        message: 'Please set GEMINI_API_KEY in your environment variables',
        suggestion: 'Configure the API key in Railway environment variables'
      });
    }
    
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
