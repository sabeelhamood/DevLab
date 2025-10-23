# Mock Microservices Data Guide

## 📍 **Where Mock Data is Located**

### **Backend Mock Data:**
**File:** `backend/src/services/mockMicroservices.js`

This file contains all the mock data that simulates responses from various microservices in the DEVLAB ecosystem.

### **Frontend Mock Data:**
**File:** `frontend/src/services/mockMicroservices.js`

This file contains the same mock data structure for frontend components to use.

---

## 🏗️ **Mock Microservices Structure**

### **1. Directory Service** (`directoryService`)
**Purpose:** User profiles, organizations, question quotas

**Available Methods:**
- `getLearnerProfile(userId)` - Get learner profile with quotas
- `getTrainerProfile(userId)` - Get trainer profile
- `getOrganizationSettings(orgId)` - Get organization settings

**Example Usage:**
```javascript
import { mockMicroservices } from './services/mockMicroservices'

const learnerProfile = mockMicroservices.directoryService.getLearnerProfile(1)
console.log(learnerProfile.question_quotas.daily_limit) // 20
```

### **2. Content Studio Service** (`contentStudio`)
**Purpose:** Courses, topics, skills, questions

**Available Methods:**
- `getCourses()` - Get all courses
- `getTopics(courseId)` - Get topics for a course
- `getQuestions(topicId)` - Get questions for a topic

**Example Usage:**
```javascript
const courses = mockMicroservices.contentStudio.getCourses()
const topics = mockMicroservices.contentStudio.getTopics(1)
const questions = mockMicroservices.contentStudio.getQuestions(101)
```

### **3. Assessment Service** (`assessmentService`)
**Purpose:** Question generation, code evaluation

**Available Methods:**
- `generateQuestions(topicId, count, difficulty)` - Generate questions
- `evaluateCode(code, testCases)` - Evaluate code submissions
- `evaluateTheoretical(answer, expectedAnswer)` - Evaluate theoretical answers

**Example Usage:**
```javascript
const questions = mockMicroservices.assessmentService.generateQuestions(101, 5, 'intermediate')
const evaluation = mockMicroservices.assessmentService.evaluateCode(code, testCases)
```

### **4. Learning Analytics Service** (`learningAnalytics`)
**Purpose:** Progress tracking, insights, recommendations

**Available Methods:**
- `getUserProgress(userId)` - Get user progress
- `getCourseAnalytics(courseId)` - Get course analytics
- `getRecommendations(userId)` - Get personalized recommendations

**Example Usage:**
```javascript
const progress = mockMicroservices.learningAnalytics.getUserProgress(1)
const analytics = mockMicroservices.learningAnalytics.getCourseAnalytics(1)
const recommendations = mockMicroservices.learningAnalytics.getRecommendations(1)
```

### **5. HR Reporting Service** (`hrReporting`)
**Purpose:** Employee performance, reporting

**Available Methods:**
- `getEmployeeProgress(userId)` - Get employee progress
- `generateReport(organizationId, period)` - Generate reports

**Example Usage:**
```javascript
const employeeProgress = mockMicroservices.hrReporting.getEmployeeProgress(1)
const report = mockMicroservices.hrReporting.generateReport(1, '2024-01')
```

### **6. Contextual Corporate Assistant** (`contextualAssistant`)
**Purpose:** AI-powered assistance, learning paths

**Available Methods:**
- `getPersonalizedContent(userId, context)` - Get personalized content
- `getLearningPath(userId, goals)` - Get learning path recommendations

**Example Usage:**
```javascript
const content = mockMicroservices.contextualAssistant.getPersonalizedContent(1, 'learning')
const learningPath = mockMicroservices.contextualAssistant.getLearningPath(1, ['JavaScript', 'React'])
```

### **7. Sandbox Service** (`sandboxService`)
**Purpose:** Code execution, validation

**Available Methods:**
- `executeCode(code, language, testCases)` - Execute code
- `validateCode(code, requirements)` - Validate code

**Example Usage:**
```javascript
const result = await mockMicroservices.sandboxService.executeCode(code, 'javascript', testCases)
const validation = mockMicroservices.sandboxService.validateCode(code, requirements)
```

### **8. Gemini Service** (`geminiService`)
**Purpose:** AI-powered features

**Available Methods:**
- `generateQuestion(topic, difficulty, language)` - Generate AI questions
- `evaluateCode(code, question)` - AI code evaluation
- `generateHint(question, userAttempt)` - Generate hints
- `detectCheating(code, question)` - Detect cheating patterns

**Example Usage:**
```javascript
const question = await mockMicroservices.geminiService.generateQuestion('JavaScript', 'intermediate', 'javascript')
const evaluation = await mockMicroservices.geminiService.evaluateCode(code, question)
const hint = await mockMicroservices.geminiService.generateHint(question, userAttempt)
```

---

## 🔧 **Helper Functions**

### **Data Generation:**
```javascript
import { generateMockData } from './services/mockMicroservices'

// Create mock users
const user = generateMockData.createUser('learner')
const trainer = generateMockData.createUser('trainer')

// Create mock courses
const course = generateMockData.createCourse('intermediate')

// Create mock questions
const question = generateMockData.createQuestion('code')

// Create mock practices
const practice = generateMockData.createPractice(1, 1, 101)
```

---

## 📊 **Data Structure Examples**

### **Learner Profile:**
```javascript
{
  user_id: 1,
  name: "John Doe",
  email: "learner@devlab.com",
  role: "learner",
  organizationId: 1,
  completed_courses: [1, 2],
  active_courses: [3, 4],
  question_quotas: {
    daily_limit: 20,
    used_today: 8,
    weekly_limit: 100,
    used_this_week: 35
  }
}
```

### **Course Data:**
```javascript
{
  course_id: 1,
  name: "JavaScript Fundamentals",
  level: "beginner",
  description: "Learn the basics of JavaScript programming",
  trainer_id: 2,
  topics: [101, 102, 103],
  ai_feedback: {
    difficulty_analysis: "Suitable for beginners",
    recommendations: ["Add more examples", "Include practical exercises"]
  }
}
```

### **Topic Data:**
```javascript
{
  topic_id: 101,
  course_id: 1,
  topic_name: "Variables and Data Types",
  nano_skills: ["Variable Declaration", "Data Type Identification", "Type Conversion"],
  macro_skills: ["JavaScript Basics", "Programming Fundamentals"]
}
```

---

## 🚀 **How to Use in Components**

### **Frontend Component Example:**
```javascript
import React, { useState, useEffect } from 'react'
import { mockMicroservices } from '../services/mockMicroservices'

function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    // Get data from mock microservices
    const learnerProfile = mockMicroservices.directoryService.getLearnerProfile(1)
    const courses = mockMicroservices.contentStudio.getCourses()
    const progress = mockMicroservices.learningAnalytics.getUserProgress(1)
    
    setData({
      profile: learnerProfile,
      courses: courses,
      progress: progress
    })
  }, [])
  
  return (
    <div>
      {/* Render your component */}
    </div>
  )
}
```

### **Backend API Example:**
```javascript
import { mockMicroservices } from '../services/mockMicroservices'

// In your API route
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params
  const userProfile = mockMicroservices.directoryService.getLearnerProfile(userId)
  res.json(userProfile)
})
```

---

## 🔄 **Integration with Real APIs**

When you're ready to integrate with real microservices:

1. **Replace mock calls** with actual API calls
2. **Keep the same data structure** for consistency
3. **Add error handling** for network requests
4. **Implement caching** for better performance

### **Example Migration:**
```javascript
// Before (Mock)
const userProfile = mockMicroservices.directoryService.getLearnerProfile(userId)

// After (Real API)
const userProfile = await fetch(`/api/directory/users/${userId}`)
  .then(res => res.json())
```

---

## 📝 **Adding New Mock Data**

To add new mock data:

1. **Add new methods** to the appropriate service
2. **Update the data structure** if needed
3. **Add helper functions** for data generation
4. **Update documentation** with examples

### **Example:**
```javascript
// Add to mockMicroservices.js
contentStudio: {
  // ... existing methods
  
  getNewFeature: (params) => ({
    // Your mock data here
  })
}
```

---

## 🎯 **Benefits of This Approach**

1. **Centralized Data:** All mock data in one place
2. **Consistent Structure:** Same data format across frontend/backend
3. **Easy Testing:** Predictable data for testing
4. **Simple Migration:** Easy to replace with real APIs
5. **Documentation:** Clear examples and usage patterns

The mock microservices data is now properly organized and ready to use throughout your DEVLAB application! 🚀✨

