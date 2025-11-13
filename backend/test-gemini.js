// Test script for Gemini API integration
import { geminiService } from './src/services/gemini.js'

const testGeminiAPI = async () => {
  console.log('🧪 Testing Gemini API Integration...\n')
  
  try {
    // Test 1: Generate a coding question
    console.log('1️⃣ Testing: Generate Coding Question')
    const codingQuestions = await geminiService.generateCodingQuestion(
      'JavaScript Arrays',
      ['Array basics', 'Iteration'],
      1,
      'javascript',
      { humanLanguage: 'en' }
    )
    console.log('✅ Coding Question Generated:')
    console.log(JSON.stringify(codingQuestions?.[0] || {}, null, 2))
    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Evaluate code
    console.log('2️⃣ Testing: Evaluate Code Submission')
    const codeEvaluation = await geminiService.evaluateCodeSubmission(
      'function sum(a, b) { return a + b; }',
      'Write a function that adds two numbers',
      'javascript'
    )
    console.log('✅ Code Evaluation:')
    console.log(JSON.stringify(codeEvaluation, null, 2))
    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Generate hint
    console.log('3️⃣ Testing: Generate Hint')
    const hint = await geminiService.generateHints(
      'Write a function that finds the largest number in an array',
      'I tried using a for loop but got stuck',
      1
    )
    console.log('✅ Hint Generated:')
    console.log(JSON.stringify(hint, null, 2))
    console.log('\n' + '='.repeat(50) + '\n')

    console.log('🎉 All Gemini API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message)
    console.log('\n💡 Make sure to:')
    console.log('1. Set your GEMINI_API_KEY environment variable')
    console.log('2. Install the @google/generative-ai package: npm install @google/generative-ai')
    console.log('3. Check your internet connection')
  }
}

// Run the test
testGeminiAPI()


