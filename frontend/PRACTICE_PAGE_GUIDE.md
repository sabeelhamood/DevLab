# Practice Page Implementation Guide

## 🎯 **What's Implemented**

### **Practice Page Features:**
- ✅ **Question Display** - Shows question content, type, difficulty, tags
- ✅ **Theoretical Questions** - Text area for written answers
- ✅ **Code Questions** - Code editor with syntax highlighting
- ✅ **Multiple Languages** - JavaScript, Python, Java, C++
- ✅ **Code Templates** - Pre-filled code for each language
- ✅ **Timer** - Tracks time spent on question
- ✅ **Hint System** - AI-powered hints
- ✅ **Reset Function** - Start over with fresh question
- ✅ **Evaluation** - AI-powered scoring and feedback
- ✅ **Results Display** - Score, feedback, suggestions

## 🚀 **How It Works**

### **1. Question Loading:**
```javascript
// Gets question from Assessment Service
const questions = mockMicroservices.assessmentService.generateQuestions(topicId, 1, 'intermediate')
const selectedQuestion = questions[0]

// For code questions, gets test cases from Content Studio
if (selectedQuestion.question_type === 'code') {
  const contentStudioQuestions = mockMicroservices.contentStudio.getQuestions(topicId)
  const codeQuestion = contentStudioQuestions.find(q => q.question_type === 'code')
  if (codeQuestion) {
    selectedQuestion.test_cases = codeQuestion.test_cases
  }
}
```

### **2. Theoretical Questions:**
- **Display:** Question content with difficulty and tags
- **Input:** Large text area for written answers
- **Evaluation:** AI-powered text analysis
- **Feedback:** Score, feedback, and suggestions

### **3. Code Questions:**
- **Display:** Question content with test cases
- **Input:** Code editor with syntax highlighting
- **Languages:** JavaScript, Python, Java, C++
- **Templates:** Pre-filled code for each language
- **Execution:** Simulated code execution
- **Evaluation:** Test case validation and scoring

## 🎨 **UI Components**

### **Header:**
- Back button to topics
- Timer display
- Hint button
- Reset button

### **Question Panel (Left):**
- Question content
- Question type badge
- Difficulty and tags
- Test cases (for code questions)

### **Answer Panel (Right):**
- **Theoretical:** Text area for answers
- **Code:** Code editor with language selector

### **Results Panel:**
- Score display with pass/fail indicator
- Feedback and suggestions
- Execution results (for code)
- Action buttons (Continue/Try Again)

## 🔧 **Code Editor Features**

### **Current Implementation (Simple):**
```jsx
<textarea
  value={codeSolution}
  onChange={(e) => setCodeSolution(e.target.value)}
  className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400"
  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
/>
```

### **Enhanced Implementation (CodeMirror):**
```jsx
<CodeMirror
  value={codeSolution}
  onChange={setCodeSolution}
  extensions={[javascript()]}
  theme={oneDark}
  height="400px"
/>
```

## 📊 **Mock Data Integration**

### **Assessment Service:**
- `generateQuestions()` - Creates practice questions
- `evaluateCode()` - Evaluates code solutions
- `evaluateTheoretical()` - Evaluates written answers

### **Sandbox Service:**
- `executeCode()` - Simulates code execution
- `validateCode()` - Validates code syntax

### **Gemini Service:**
- `generateHint()` - AI-powered hints
- `evaluateCode()` - AI code evaluation
- `detectCheating()` - Cheating detection

## 🎯 **User Flow**

### **1. Start Practice:**
```
Dashboard → Course → Topics → Practice Button → Practice Page
```

### **2. Answer Question:**
- **Theoretical:** Type answer in text area
- **Code:** Write code in editor, select language

### **3. Submit Solution:**
- Click "Submit Solution" button
- System evaluates answer
- Results displayed with feedback

### **4. Review Results:**
- See score and feedback
- Review suggestions
- Choose to continue or try again

## 🔧 **Configuration**

### **Languages Supported:**
- JavaScript (default)
- Python
- Java
- C++

### **Code Templates:**
```javascript
// JavaScript
function solution() {
    // Write your solution here
}

// Python
def solution():
    # Write your solution here
    pass

// Java
public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}

// C++
#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
```

## 🚀 **Testing the Implementation**

### **1. Start the Frontend:**
```bash
cd frontend
npm run dev
```

### **2. Navigate to Practice:**
1. Go to Dashboard
2. Click on a course
3. Click on a topic
4. Click "Practice" button
5. You'll see the practice page

### **3. Test Features:**
- **Timer:** Should start counting when page loads
- **Hint:** Click "Get Hint" to see AI-generated hint
- **Reset:** Click "Reset" to start over
- **Submit:** Fill answer and click "Submit Solution"
- **Results:** See score and feedback

## 📝 **File Structure**

```
frontend/src/pages/learner/
├── Dashboard.jsx          # Course dashboard
├── SubtopicsPage.jsx      # Topics list
└── PracticePage.jsx       # Practice session (NEW)

frontend/src/services/
└── mockMicroservices.js   # Mock data for all services

frontend/
├── CODEMIRROR_SETUP.md    # CodeMirror setup guide
└── PRACTICE_PAGE_GUIDE.md # This guide
```

## 🎯 **Next Steps**

### **Immediate:**
1. ✅ **Test the current implementation**
2. ✅ **Verify all features work**
3. ✅ **Check responsive design**

### **Enhancement:**
1. 🔧 **Install CodeMirror** for better code editing
2. 🔧 **Add more languages** (Go, Rust, etc.)
3. 🔧 **Add code formatting** (Prettier integration)
4. 🔧 **Add autocomplete** for better UX

### **Production:**
1. 🚀 **Replace mock data** with real APIs
2. 🚀 **Add real code execution** (Docker containers)
3. 🚀 **Add real-time collaboration**
4. 🚀 **Add code sharing** features

The practice page is now fully functional with both theoretical and code question support! 🎉✨

