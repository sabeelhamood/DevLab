import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './src/config/environment.js'

console.log('🚀 Testing Gemini AI Integration...\n')

// Test 1: Check API Key
console.log('1. Checking API Key...')
const apiKey = config.ai.gemini.apiKey
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment variables')
  console.log('Please set GEMINI_API_KEY in your .env file')
  process.exit(1)
}
console.log('✅ API Key found:', apiKey.substring(0, 10) + '...')

// Test 2: Initialize Gemini
console.log('\n2. Initializing Gemini AI...')
try {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  console.log('✅ Gemini AI initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize Gemini:', error.message)
  process.exit(1)
}

// Test 3: Simple API Call
console.log('\n3. Testing simple API call...')
try {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  const prompt = "Generate a simple JavaScript coding question for beginners about arrays. Return only the question text."
  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  console.log('✅ API call successful!')
  console.log('Generated question:', text.substring(0, 100) + '...')
} catch (error) {
  console.error('❌ API call failed:', error.message)
  process.exit(1)
}

// Test 4: Test Gemini Service
console.log('\n4. Testing Gemini Service...')
try {
  const { geminiService } = await import('./src/services/gemini.js')
  
  // Test coding question generation
  const codingQuestion = await geminiService.generateCodingQuestion(
    'JavaScript Arrays',
    'beginner',
    'javascript',
    ['array methods', 'iteration'],
    ['data manipulation']
  )
  
  console.log('✅ Coding question generated successfully!')
  console.log('Title:', codingQuestion.title)
  console.log('Description:', codingQuestion.description?.substring(0, 100) + '...')
  
  // Test theoretical question generation
  const theoreticalQuestion = await geminiService.generateTheoreticalQuestion(
    'JavaScript Closures',
    'intermediate',
    ['scope', 'closures'],
    ['functional programming']
  )
  
  console.log('✅ Theoretical question generated successfully!')
  console.log('Question:', theoreticalQuestion.question?.substring(0, 100) + '...')
  
} catch (error) {
  console.error('❌ Gemini Service test failed:', error.message)
  process.exit(1)
}

// Test 5: Test API Endpoints
console.log('\n5. Testing API Endpoints...')
try {
  const response = await fetch('http://localhost:3001/api/gemini-test/test-simple')
  const data = await response.json()
  
  if (data.success) {
    console.log('✅ API endpoint working!')
    console.log('Response:', data.message)
  } else {
    console.error('❌ API endpoint failed:', data.error)
  }
} catch (error) {
  console.error('❌ API endpoint test failed:', error.message)
  console.log('Make sure the server is running on port 3001')
}

console.log('\n🎉 Gemini AI Integration Test Complete!')
console.log('\nAvailable endpoints:')
console.log('- GET  /api/gemini-test/test-simple')
console.log('- POST /api/gemini-test/test-question')
console.log('- POST /api/gemini/generate-question')
console.log('- POST /api/gemini/evaluate-code')
console.log('- POST /api/gemini/generate-hint')
console.log('- POST /api/gemini/detect-cheating')
console.log('\n🚀 Your Gemini AI integration is ready to use!')
