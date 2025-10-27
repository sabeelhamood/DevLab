# 🚀 Gemini AI Quick Setup

Your Gemini API key has been integrated! Here's how to test it:

## ✅ **Your API Key is Ready:**
```
your_gemini_api_key_here
```

## 🔧 **Setup Steps:**

### **1. Install the Gemini Package:**
```bash
cd backend
npm install @google/generative-ai
```

### **2. Start the Backend:**
```bash
node src/app.js
```

### **3. Test the Integration:**

#### **Test 1: Simple API Test**
```bash
curl http://localhost:3001/api/gemini-test/test-simple
```

#### **Test 2: Generate a Question**
```bash
curl -X POST http://localhost:3001/api/gemini-test/test-question \
  -H "Content-Type: application/json" \
  -d '{"topic": "JavaScript Arrays", "difficulty": "beginner"}'
```

#### **Test 3: Full Gemini API**
```bash
curl http://localhost:3001/api/gemini/test
```

## 🎯 **What You'll Get:**

### **AI-Generated Questions:**
- **Coding challenges** tailored to difficulty
- **Theoretical questions** with explanations
- **Adaptive content** based on user skill

### **Smart Features:**
- **Code evaluation** with detailed feedback
- **Progressive hints** that guide learning
- **Cheating detection** for academic integrity
- **Personalized recommendations**

## 📡 **Available Endpoints:**

### **Test Endpoints (No Package Required):**
- `GET /api/gemini-test/test-simple` - Basic API test
- `POST /api/gemini-test/test-question` - Generate question

### **Full Gemini API (Package Required):**
- `GET /api/gemini/test` - Test connection
- `POST /api/gemini/generate-coding-question` - Generate coding question
- `POST /api/gemini/generate-theoretical-question` - Generate theory question
- `POST /api/gemini/evaluate-code` - Evaluate code submission
- `POST /api/gemini/generate-hint` - Generate learning hint
- `POST /api/gemini/detect-cheating` - Detect cheating
- `POST /api/gemini/learning-recommendations` - Get recommendations

## 🧪 **Test Examples:**

### **Generate a Coding Question:**
```bash
curl -X POST http://localhost:3001/api/gemini/generate-coding-question \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "JavaScript Functions",
    "difficulty": "intermediate",
    "language": "javascript"
  }'
```

### **Evaluate Code:**
```bash
curl -X POST http://localhost:3001/api/gemini/evaluate-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function sum(a, b) { return a + b; }",
    "question": "Write a function that adds two numbers",
    "language": "javascript"
  }'
```

### **Get a Hint:**
```bash
curl -X POST http://localhost:3001/api/gemini/generate-hint \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Write a function that finds the largest number in an array",
    "userAttempt": "I tried using a for loop but got stuck",
    "hintsUsed": 1
  }'
```

## 🎉 **Success Indicators:**

When everything works, you should see:
```
✅ Gemini API is working!
📝 Generated Question: [AI-generated question text]
```

## 🚨 **Troubleshooting:**

### **If you get "package not installed":**
```bash
cd backend
npm install @google/generative-ai
```

### **If you get "API key error":**
- Check your internet connection
- Verify the API key is correct
- Make sure you have API access

### **If you get rate limit errors:**
- Wait a moment and try again
- The free tier has usage limits

## 🚀 **Next Steps:**

1. **Test the basic endpoints** first
2. **Install the package** for full functionality
3. **Integrate with frontend** components
4. **Add error handling** for production
5. **Monitor usage** and costs

Your DEVLAB platform now has AI superpowers! 🤖✨


