import { GoogleGenerativeAI } from '@google/generative-ai'

// Test Gemini API directly
const API_KEY = 'AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw'
const genAI = new GoogleGenerativeAI(API_KEY)

async function listModels() {
  try {
    console.log('🔍 Checking available models...')
    
    const models = await genAI.listModels()
    console.log('Available models:')
    models.forEach(model => {
      console.log(`- ${model.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message)
  }
}

listModels()

