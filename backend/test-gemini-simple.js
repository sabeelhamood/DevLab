// Simple test for Gemini API with your key
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw'

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API with your key...')
    
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = "Generate a simple JavaScript coding question for beginners about arrays. Return only the question text."
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini API is working!')
    console.log('📝 Generated Question:')
    console.log(text)
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message)
    console.log('💡 Make sure to install the package: npm install @google/generative-ai')
  }
}

testGemini()


