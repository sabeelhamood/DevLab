# Mock Data Examples - Rollback Mechanism

This document shows examples of mock data returned when microservices or external APIs are unavailable.

## Content Studio Requests - Coding Questions (Gemini API Unavailable)

### Scenario
Content Studio sends a request to DEVLAB to create coding practice questions, but Gemini API is unavailable.

### Content Studio Request
```javascript
POST /api/questions/generate
{
  "quantity": 4,
  "lesson_id": "lesson_123",
  "course_name": "Python Fundamentals",
  "lesson_name": "Functions and Loops",
  "nano_skills": ["functions", "loops", "arrays"],
  "micro_skills": ["control_flow", "data_structures"],
  "question_type": "code",
  "programming_language": "python"
}
```

### Mock Response Content Studio Will Receive
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "q_1703123456789_0",
      "question_text": "[Mock] Python Fundamentals Question 1: Write a function that demonstrates functions concepts in python.",
      "difficulty": "easy",
      "test_cases": [
        {
          "input": "test_input_1",
          "expected_output": "expected_output_1",
          "is_hidden": false
        },
        {
          "input": "hidden_test_1",
          "expected_output": "hidden_expected_1",
          "is_hidden": true
        }
      ],
      "tags": ["functions"],
      "estimated_time": 10,
      "programming_language": "python",
      "style": {
        "tags": ["functions"],
        "estimated_time": 10
      },
      "source": "mock",
      "mock_note": "Generated using mock data - Gemini API unavailable"
    },
    {
      "question_text": "[Mock] Python Fundamentals Question 2: Write a function that demonstrates loops concepts in python.",
      "difficulty": "medium",
      "test_cases": [...],
      "source": "mock",
      ...
    },
    {
      "question_text": "[Mock] Python Fundamentals Question 3: Write a function that demonstrates arrays concepts in python.",
      "difficulty": "hard",
      "test_cases": [...],
      "source": "mock",
      ...
    },
    {
      "question_text": "[Mock] Python Fundamentals Question 4: Write a function that demonstrates functions concepts in python.",
      "difficulty": "easy",
      "test_cases": [...],
      "source": "mock",
      ...
    }
  ]
}
```

### Key Indicators
- Each question has `"source": "mock"` field
- Question text includes `[Mock]` prefix
- `"mock_note"` explains why mock data is used
- Questions maintain proper structure with test cases, difficulty levels, etc.

---

## Content Studio Requests - Theoretical Questions (Assessment Microservice Unavailable)

### Scenario
Content Studio sends a request to DEVLAB to create theoretical questions, but Assessment microservice is unavailable.

### Content Studio Request
```javascript
POST /api/questions/generate
{
  "quantity": 4,
  "lesson_id": "lesson_456",
  "course_name": "Data Structures",
  "lesson_name": "Arrays and Lists",
  "nano_skills": ["arrays", "lists"],
  "micro_skills": ["data_manipulation"],
  "question_type": "theoretical",
  "programming_language": null
}
```

### Mock Response Content Studio Will Receive
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "mock_q_1703123456789_0",
      "question_text": "[Mock] Data Structures Question 1: Explain the concept of arrays principles.",
      "question_type": "theoretical",
      "difficulty": "easy",
      "options": [
        "Option A: Correct answer",
        "Option B: Incorrect answer",
        "Option C: Incorrect answer",
        "Option D: Incorrect answer"
      ],
      "correct_answer": "A",
      "explanation": "This is a mock theoretical question used when Assessment microservice is unavailable.",
      "tags": ["arrays"],
      "estimated_time": 5,
      "style": {
        "tags": ["data_manipulation"],
        "estimated_time": 5
      },
      "lesson_context": {
        "lesson_id": "lesson_456",
        "lesson_name": "Arrays and Lists",
        "course_name": "Data Structures"
      }
    },
    {
      "question_id": "mock_q_1703123456789_1",
      "question_text": "[Mock] Data Structures Question 2: Explain the concept of lists principles.",
      "difficulty": "medium",
      ...
    }
  ],
  "source": "mock",
  "message": "Using mock data - Assessment microservice unavailable"
}
```

### Key Indicators
- Response has `"source": "mock"` field
- Questions have `[Mock]` prefix in question text
- All questions have proper structure (options, correct_answer, explanation)
- Message field explains the fallback

---

## Gemini Available, Content Studio Unavailable

### Scenario
Content Studio sends a request to DEVLAB to create coding questions. Gemini API works perfectly and generates questions successfully. However, when DEVLAB tries to notify Content Studio about the successful generation, Content Studio is unavailable.

### Flow
1. **Content Studio Request** → DEVLAB
   ```javascript
   POST /api/questions/generate
   {
     "quantity": 4,
     "lesson_id": "lesson_789",
     "course_name": "JavaScript Basics",
     "lesson_name": "Async Programming",
     "nano_skills": ["promises", "async-await"],
     "micro_skills": ["asynchronous_programming"],
     "question_type": "code",
     "programming_language": "javascript"
   }
   ```

2. **DEVLAB Processes Request** → ✅ Gemini API works fine
   - Questions generated successfully by Gemini
   - Questions stored in database
   - Questions ready to return

3. **DEVLAB Tries to Notify Content Studio** → ❌ Content Studio unavailable
   - DEVLAB attempts to send notification to Content Studio
   - Content Studio service is down/unreachable
   - System falls back to mock notification response

### Response Content Studio Will Receive (from DEVLAB)
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "q_1703123456789_0",
      "question_text": "Write an async function that fetches data from an API...",
      "difficulty": "medium",
      "test_cases": [
        {
          "input": "...",
          "expected_output": "...",
          "is_hidden": false
        }
      ],
      "tags": ["promises", "async-await"],
      "estimated_time": 15,
      "programming_language": "javascript",
      "source": "real"  // ✅ Real questions from Gemini
    },
    {
      "question_id": "q_1703123456789_1",
      "question_text": "...",
      "source": "real"  // ✅ Real questions from Gemini
    },
    {
      "question_id": "q_1703123456789_2",
      "question_text": "...",
      "source": "real"  // ✅ Real questions from Gemini
    },
    {
      "question_id": "q_1703123456789_3",
      "question_text": "...",
      "source": "real"  // ✅ Real questions from Gemini
    }
  ]
}
```

### Internal Notification (DEVLAB → Content Studio - Failed)
When DEVLAB tries to notify Content Studio, it receives mock response:

```json
{
  "success": true,
  "notification_id": "mock_notification_1703123456789",
  "status": "logged_locally",
  "message": "Question generation notification logged locally - Content Studio service unavailable",
  "question_ids": [
    "q_1703123456789_0",
    "q_1703123456789_1",
    "q_1703123456789_2",
    "q_1703123456789_3"
  ],
  "lesson_id": "lesson_789",
  "quantity": 4,
  "question_type": "code",
  "source": "mock",
  "timestamp": "2024-01-15T10:30:56.789Z",
  "note": "Content Studio microservice unavailable - notification will be retried later"
}
```

### Key Points
- ✅ **Questions are successfully generated** - Gemini API works fine
- ✅ **Content Studio receives real questions** - The API response contains actual generated questions
- ⚠️ **Notification fails silently** - DEVLAB logs notification locally but Content Studio doesn't receive confirmation
- ✅ **Application continues working** - No errors, questions are delivered
- 🔄 **Retry mechanism** - Notification can be retried later when Content Studio is back online

### Log Output
```
INFO: Questions generated successfully
  quantity: 4
  programming_language: javascript

WARN: Content Studio microservice unavailable, using mock notification
  error: "ECONNREFUSED"
  lesson_id: "lesson_789"
```

### Benefits
- Content Studio still receives questions even if notification fails
- No interruption to user workflow
- Questions are generated and stored successfully
- Notification failure doesn't block question delivery

---

## Course Builder Course Completion Notification

### Scenario
Course Builder sends a one-way notification to DEVLAB when a learner completes a course. DEVLAB receives this notification and creates an anonymous competition invitation for that learner internally.

**Important**: Course Builder does NOT need or wait for a response from DEVLAB. This is a fire-and-forget notification pattern.

### Flow: Course Builder → DEVLAB (One-Way Notification)
1. **Learner completes course** in Course Builder
2. **Course Builder sends notification** to DEVLAB (fire-and-forget, doesn't wait for response)
3. **DEVLAB receives notification** and processes it internally
4. **DEVLAB creates competition invitation** and finds potential competitors
5. **DEVLAB stores invitation** in its database
6. **DEVLAB returns simple acknowledgment** (Course Builder doesn't process this)

### Course Builder Request to DEVLAB
```javascript
POST /api/competitions/invite
{
  "course_id": "course_456",
  "learner_id": "learner_123"
}
```

### DEVLAB Response (Simple Acknowledgment)
DEVLAB returns a simple acknowledgment. **Course Builder doesn't process this response** - it's fire-and-forget:

```json
{
  "success": true,
  "message": "Notification received"
}
```

**Note**: Course Builder sends the notification and continues with its own workflow. It doesn't wait for or process DEVLAB's response. The invitation creation happens asynchronously in DEVLAB.

### Mock Data for Testing (When Course Builder is Unavailable)

If Course Builder is unavailable and you need to test the invitation creation, you can use mock data:

```javascript
// Mock request payload from Course Builder
const mockRequest = {
  course_id: "course_456",
  learner_id: "learner_123",
  completed_at: "2024-01-15T10:30:00.000Z",
  course_name: "Python Fundamentals",
  completion_status: "passed",
  score: 85,
  source: "mock",
  note: "Mock data - Course Builder service unavailable"
};
```

### Scenario: Course Builder Unavailable - Manual Testing

When Course Builder is unavailable, you can manually test by sending:

```bash
curl -X POST http://localhost:3001/api/competitions/invite \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "course_456",
    "learner_id": "learner_123"
  }'
```

### What Happens After Invitation Creation

1. **Invitation stored in DEVLAB** with status "pending"
2. **Learner can view invitation** via `GET /api/competitions/invitations/:learnerId`
3. **Learner sees anonymous list** of potential competitors
4. **Learner selects competitor** from the list
5. **Competition starts** when both learners accept

### Key Points
- ✅ **One-way notification**: Course Builder sends notification and doesn't wait for response
- ✅ Course Builder sends `course_id` and `learner_id`
- ✅ **Fire-and-forget pattern**: Course Builder continues its workflow immediately
- ✅ DEVLAB processes notification asynchronously
- ✅ DEVLAB creates invitation internally (not sent to other services)
- ✅ Invitation includes anonymous competitor list
- ✅ Competition invitation is stored in DEVLAB database
- ✅ Learner receives invitation to participate in anonymous competition
- ⚠️ **Course Builder doesn't need or process DEVLAB's response**

---

## Content Studio API Unavailable (Direct Call)

### Scenario
When Content Studio API is unavailable (connection refused, timeout, or returns error), the system automatically falls back to mock data.

### Example Request
```javascript
// Calling the microservice
const result = await microserviceClient.validateContent({
  content_id: 'content_123',
  content_type: 'lesson',
  course_id: 'course_456'
});
```

### Mock Response You Will See
```json
{
  "success": true,
  "validated": true,
  "validation_id": "mock_validation_1703123456789",
  "validation_status": "approved",
  "validation_score": 85,
  "feedback": "Content validation completed using mock data - Content Studio service unavailable",
  "recommendations": [
    "Content structure appears valid",
    "Consider adding more examples",
    "Ensure all required fields are present"
  ],
  "source": "mock",
  "timestamp": "2024-01-15T10:30:56.789Z",
  "note": "Content Studio microservice unavailable - using mock validation"
}
```

### Key Indicators
- `"source": "mock"` - Identifies this as mock data
- `"validation_id"` - Starts with "mock_validation_" prefix
- `"note"` - Explains why mock data is being used
- Application continues to function normally

### Log Output
```
WARN: Content Studio microservice unavailable, using mock data
  error: "ECONNREFUSED" or "ETIMEDOUT" or "Request failed with status code 500"
```

---

## Assessment Microservice Unavailable

### Scenario
When Assessment microservice is unavailable and you request theoretical questions.

### Example Request
```javascript
const questions = await microserviceClient.createTheoreticalQuestions({
  quantity: 4,
  topic_name: "Data Structures",
  programming_language: "Python",
  nano_skills: ["arrays", "lists"],
  micro_skills: ["data_manipulation"]
});
```

### Mock Response You Will See
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "mock_q_1703123456789_0",
      "question_text": "[Mock] Data Structures Question 1: Explain the concept of arrays principles.",
      "question_type": "theoretical",
      "difficulty": "easy",
      "options": [
        "Option A: Correct answer",
        "Option B: Incorrect answer",
        "Option C: Incorrect answer",
        "Option D: Incorrect answer"
      ],
      "correct_answer": "A",
      "explanation": "This is a mock theoretical question used when Assessment microservice is unavailable.",
      "tags": ["arrays", "lists"],
      "estimated_time": 5,
      "style": {
        "tags": ["data_manipulation"],
        "estimated_time": 5
      }
    },
    {
      "question_id": "mock_q_1703123456789_1",
      "question_text": "[Mock] Data Structures Question 2: Explain the concept of arrays principles.",
      "question_type": "theoretical",
      "difficulty": "medium",
      ...
    }
  ],
  "source": "mock",
  "message": "Using mock data - Assessment microservice unavailable"
}
```

---

## Learning Analytics Microservice Unavailable

### Scenario
When sending competition performance data and Learning Analytics is unavailable.

### Example Request
```javascript
await microserviceClient.sendCompetitionPerformance({
  learner1_id: "learner_123",
  learner2_id: "learner_456",
  course_id: "course_789",
  competition_id: "comp_001",
  performance_learner1: { score: 85, time: 1200 },
  performance_learner2: { score: 90, time: 1100 }
});
```

### Mock Response You Will See
```json
{
  "success": true,
  "message": "Competition performance data received (mock mode)",
  "competition_id": "comp_001",
  "status": "recorded_mock",
  "source": "mock",
  "note": "Learning Analytics microservice unavailable - data logged locally"
}
```

---

## How to Test

### Simulate Content Studio Failure

1. **Stop Content Studio service** (if running locally)
2. **Or set incorrect URL** in environment:
   ```env
   CONTENT_STUDIO_URL=http://localhost:9999  # Non-existent port
   ```
3. **Make a validation request**:
   ```javascript
   const result = await microserviceClient.validateContent({...});
   console.log(result.source); // Will output: "mock"
   ```

### Check Logs
Look for warning messages like:
```
WARN: Content Studio microservice unavailable, using mock data
  error: "ECONNREFUSED"
```

---

## Benefits

1. **No Application Crashes**: Application continues working
2. **Clear Identification**: `source: "mock"` field shows it's mock data
3. **Proper Structure**: Mock responses match expected API structure
4. **Monitoring**: All rollback events are logged

