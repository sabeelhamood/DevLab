import { GoogleGenerativeAI } from '@google/generative-ai'

// Test Gemini API directly
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set. Please configure it in your environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...')
    
    const prompt = "Generate a simple JavaScript coding question for beginners about arrays. Return only the question text."
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini API is working!')
    console.log('Generated question:', text)
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message)
  }
}

testGemini()