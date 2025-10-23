# Gemini AI Integration Setup

This guide explains how to integrate Google's Gemini AI API into the DEVLAB Microservice for AI-powered learning features.

## 🚀 Features Enabled by Gemini AI

### **Dynamic Question Generation**
- **Coding Questions**: AI-generated programming challenges
- **Theoretical Questions**: Multiple-choice questions with explanations
- **Adaptive Difficulty**: Questions tailored to user skill level
- **Topic-Specific**: Questions focused on specific programming concepts

### **Intelligent Code Evaluation**
- **Automatic Grading**: AI-powered code assessment
- **Detailed Feedback**: Constructive suggestions for improvement
- **Test Case Analysis**: Evaluation of code against test cases
- **Code Quality Assessment**: Readability, efficiency, and best practices

### **Smart Learning Support**
- **Progressive Hints**: AI-generated hints that don't give away solutions
- **Cheating Detection**: Identify potential plagiarism or external help
- **Personalized Recommendations**: Learning paths based on performance
- **Motivational Feedback**: Encouraging messages and guidance

## 🔧 Setup Instructions

### **1. Get Your Gemini API Key**

1. **Visit [Google AI Studio](https://makersuite.google.com/app/apikey)**
2. **Sign in with your Google account**
3. **Click "Create API Key"**
4. **Copy your API key** (starts with `AIza...`)

### **2. Install Required Package**

```bash
cd backend
npm install @google/generative-ai
```

### **3. Set Environment Variable**

Create a `.env` file in the `backend` directory:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key-here

# Other environment variables...
NODE_ENV=development
PORT=3001
```

### **4. Test the Integration**

```bash
# Test Gemini API
node test-gemini.js

# Or test via API endpoint
curl http://localhost:3001/api/gemini/test
```

## 📡 API Endpoints

### **Generate Coding Question**
```bash
POST /api/gemini/generate-coding-question
Content-Type: application/json

{
  "topic": "JavaScript Arrays",
  "difficulty": "beginner",
  "language": "javascript"
}
```

### **Generate Theoretical Question**
```bash
POST /api/gemini/generate-theoretical-question
Content-Type: application/json

{
  "topic": "JavaScript Closures",
  "difficulty": "intermediate"
}
```

### **Evaluate Code Submission**
```bash
POST /api/gemini/evaluate-code
Content-Type: application/json

{
  "code": "function sum(a, b) { return a + b; }",
  "question": "Write a function that adds two numbers",
  "language": "javascript"
}
```

### **Generate Hint**
```bash
POST /api/gemini/generate-hint
Content-Type: application/json

{
  "question": "Write a function that finds the largest number in an array",
  "userAttempt": "I tried using a for loop but got stuck",
  "hintsUsed": 1
}
```

### **Detect Cheating**
```bash
POST /api/gemini/detect-cheating
Content-Type: application/json

{
  "code": "user's code submission",
  "question": "original question"
}
```

### **Learning Recommendations**
```bash
POST /api/gemini/learning-recommendations
Content-Type: application/json

{
  "userProfile": {
    "skillLevel": "intermediate",
    "weakAreas": ["async programming"],
    "strengths": ["basic syntax"]
  },
  "performanceData": {
    "recentScores": [85, 90, 75],
    "timeSpent": 120
  }
}
```

## 🎯 Usage Examples

### **Frontend Integration**

```javascript
// Generate a coding question
const generateQuestion = async (topic, difficulty) => {
  const response = await fetch('/api/gemini/generate-coding-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, language: 'javascript' })
  })
  return await response.json()
}

// Evaluate user's code
const evaluateCode = async (code, question) => {
  const response = await fetch('/api/gemini/evaluate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, question, language: 'javascript' })
  })
  return await response.json()
}

// Get a hint
const getHint = async (question, userAttempt, hintsUsed) => {
  const response = await fetch('/api/gemini/generate-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, userAttempt, hintsUsed })
  })
  return await response.json()
}
```

## 🔒 Security Considerations

### **API Key Protection**
- **Never commit API keys** to version control
- **Use environment variables** for configuration
- **Rotate keys regularly** for security
- **Monitor API usage** to prevent abuse

### **Rate Limiting**
- **Implement rate limiting** on Gemini endpoints
- **Cache responses** to reduce API calls
- **Monitor usage costs** and set limits

### **Content Filtering**
- **Validate AI responses** before sending to users
- **Implement content moderation** for generated questions
- **Review and approve** AI-generated content

## 💰 Cost Management

### **API Usage Optimization**
- **Cache common questions** to reduce API calls
- **Batch requests** when possible
- **Use efficient prompts** to reduce token usage
- **Monitor usage** through Google Cloud Console

### **Estimated Costs**
- **Free tier**: 15 requests per minute
- **Paid tier**: $0.0005 per 1K characters
- **Typical question**: ~500-1000 characters
- **Cost per question**: ~$0.00025-$0.0005

## 🚨 Troubleshooting

### **Common Issues**

1. **"API key not found"**
   - Check your `.env` file
   - Verify the key is correct
   - Restart the server

2. **"Rate limit exceeded"**
   - Implement caching
   - Add delays between requests
   - Upgrade your API plan

3. **"Invalid response format"**
   - Check your prompt structure
   - Verify JSON parsing
   - Add error handling

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=gemini:* node src/app.js
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

```
✅ Gemini API is working
✅ Coding questions generated successfully
✅ Code evaluation working
✅ Hints generated properly
✅ Learning recommendations active
```

## 📚 Next Steps

1. **Test all endpoints** with your API key
2. **Integrate with frontend** components
3. **Add error handling** for production
4. **Implement caching** for performance
5. **Monitor usage** and costs
6. **Gather user feedback** on AI features

The Gemini AI integration will make DEVLAB a truly intelligent learning platform! 🚀


