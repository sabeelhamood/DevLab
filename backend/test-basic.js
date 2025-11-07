import { GoogleGenerativeAI } from '@google/generative-ai';

async function testBasic() {
  try {
    console.log('🧪 Testing basic Gemini connection...');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not set. Please configure it in your environment variables.'
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Try with the most basic model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Hello, how are you?');
    const response = await result.response;
    const text = response.text();

    console.log('✅ Success!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testBasic();
