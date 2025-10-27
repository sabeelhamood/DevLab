import { GoogleGenerativeAI } from '@google/generative-ai'

// Test Gemini API directly
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set. Please configure it in your environment variables.');
  process.exit(1);
}

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

