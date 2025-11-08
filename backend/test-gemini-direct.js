// Direct test of Gemini service
import { geminiService } from './src/services/gemini.js'

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini service directly...')
    console.log('Is available:', geminiService.isAvailable)
    console.log('Is mock mode:', geminiService.isMockMode)
    
    const question = await geminiService.generateCodingQuestion(
      'JavaScript Arrays', 
      'beginner', 
      'javascript'
    )
    
    console.log('✅ Success!')
    console.log('Generated question:', JSON.stringify(question, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

testGemini()

