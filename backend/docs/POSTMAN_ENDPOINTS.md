# Postman Endpoints Guide

## Base URL

**Production (Railway):**
```
https://devlab-backend-production-0bcb.up.railway.app
```

**Local Development:**
```
http://localhost:3000
```

## Available Endpoints for Testing

### 1. Test Supabase Connection and Insertion

**Endpoint:** `POST /api/gemini-questions/test-supabase-insert`

**Full URL:**
```
POST https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/test-supabase-insert
```

**Description:** Tests Supabase connection and inserts a test question into `temp_questions` table, then verifies and cleans up.

**Headers:**
```
Content-Type: application/json
```

**Body:** (No body required)

**Response:**
```json
{
  "success": true,
  "message": "Supabase connection and insertion test successful",
  "test": {
    "question_id": "test_1234567890",
    "inserted": true,
    "verified": true,
    "cleaned_up": true
  },
  "connection": {
    "connected": true,
    "database_time": "2025-01-12T18:00:00.000Z"
  },
  "table": {
    "exists": true,
    "columns": ["question_id", "question_content", "title", ...]
  }
}
```

---

### 2. Generate Question Package (Main Endpoint)

**Endpoint:** `POST /api/gemini-questions/generate-question-package`

**Full URL:**
```
POST https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package
```

**Description:** Generates questions using Gemini AI (for code questions) or Assessment Microservice (for theoretical questions) and automatically saves them to Supabase (`temp_questions`, `topics`, `testCases` tables).

**Headers:**
```
Content-Type: application/json
```

**Request Body (Current Format):**
```json
{
  "amount": 4,
  "topic_id": "uuid-of-topic",
  "topic_name": "Functions and Basic Operations",
  "skills": ["Function Declaration", "Parameters", "Return Values"],
  "question_type": "code",
  "programming_language": "javascript",
  "humanLanguage": "en"
}
```

**Request Fields:**
- `amount` (number, required): Number of questions to generate (default: 1)
- `topic_id` (UUID, optional): UUID of topic (will be used for saving to Supabase)
- `topic_name` (string, required): Name of topic
- `skills` (array, optional): List of skills or focus areas for the questions
- `question_type` (string, required): Either `"code"` or `"theoretical"`
  - `"code"`: Routes to Gemini AI for coding questions
  - `"theoretical"`: Routes to Assessment Microservice for theoretical questions
- `programming_language` (string, optional): Programming language for code questions (default: "javascript")
- `humanLanguage` (string, optional): Human language for questions (default: "en")

**Note:** 
- If `question_type` is `"code"`, questions are generated using Gemini AI
- If `question_type` is `"theoretical"`, questions are generated using Assessment Microservice
- The endpoint automatically saves questions to Supabase after generation

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "demo_1234567890_0",
      "title": "Calculate Total Grocery Bill",
      "description": "Create a function...",
      "language": "javascript",
      "question_type": "code",
      "programming_language": "javascript",
      "testCases": [
        {
          "input": "('Alice', 'Smith', 'admin')",
          "expectedOutput": "Welcome back, Alice Smith (Admin User)!",
          "explanation": "The userType 'admin' triggers..."
        }
      ],
      "hints": [],
      "solution": null,
      "topic_id": "uuid-of-topic",
      "topic_name": "Functions and Basic Operations",
      "humanLanguage": "en"
    }
  ],
  "metadata": {
    "amount": 4,
    "topic_id": "uuid-of-topic",
    "topic_name": "Functions and Basic Operations",
    "skills": ["Function Declaration", "Parameters"],
    "question_type": "code",
    "programming_language": "javascript",
    "humanLanguage": "en",
    "questionCount": 4,
    "generatedAt": "2025-01-12T18:00:00.000Z",
    "questionsSource": "gemini",
    "serviceUsed": "gemini",
    "geminiCount": 4,
    "assessmentCount": 0,
    "fallbackCount": 0,
    "isFallback": false
  }
}
```

**Note:** 
- This endpoint automatically saves questions to Supabase. Check Railway logs for save operation details.
- For `question_type: "code"`, questions are generated using Gemini AI
- For `question_type: "theoretical"`, questions are generated using Assessment Microservice
- The `metadata.serviceUsed` field indicates which service was used: `"gemini"` or `"assessment"`

---

### 3. Health Check

**Endpoint:** `GET /api/gemini-questions/health`

**Full URL:**
```
GET https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/health
```

**Description:** Checks if the question generation service is healthy.

**Headers:** (No headers required)

**Body:** (No body required)

**Response:**
```json
{
  "status": "healthy",
  "service": "question-generation",
  "timestamp": "2025-01-12T18:00:00.000Z",
  "cors": {
    "origin": null,
    "allowed": true
  }
}
```

---

### 4. Test CORS

**Endpoint:** `GET /api/gemini-questions/test-cors`

**Full URL:**
```
GET https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/test-cors
```

**Description:** Tests CORS configuration.

**Headers:** (No headers required)

**Body:** (No body required)

**Response:**
```json
{
  "success": true,
  "message": "CORS test successful",
  "origin": null,
  "timestamp": "2025-01-12T18:00:00.000Z"
}
```

---

### 5. Generate Single Question

**Endpoint:** `POST /api/gemini-questions/generate-question`

**Full URL:**
```
POST https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question
```

**Description:** Generates a single question (legacy endpoint).

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "courseName": "JavaScript Programming",
  "topicName": "Functions",
  "skills": ["Function Declaration", "Problem Solving"],
  "language": "javascript",
  "questionType": "coding"
}
```

---

### 6. Generate Hint

**Endpoint:** `POST /api/gemini-questions/generate-hint`

**Full URL:**
```
POST https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-hint
```

**Description:** Generates a hint for a question.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "question": "Create a function that calculates the sum of two numbers",
  "attempts": 0
}
```

---

## Authentication

**Note:** For production endpoints (Railway), you may need to include service authentication headers:

**Headers (if required):**
```
x-api-key: <your-service-api-key>
x-service-id: <any-service-id>
Content-Type: application/json
```

**However:** The `/api/gemini-questions/*` endpoints are **excluded** from service authentication, so these headers are **NOT required** for testing question generation endpoints.

---

## Testing in Postman

### Step 1: Test Supabase Connection

1. **Method:** `POST`
2. **URL:** `https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/test-supabase-insert`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body:** (Leave empty or remove body)
5. **Click Send**

**Expected Response:**
- `200 OK` with `success: true`
- Connection test passed
- Table structure verified
- Test question inserted and verified
- Test question cleaned up

---

### Step 2: Generate Questions and Save to Supabase

#### 2a. Generate Code Questions (Gemini)

1. **Method:** `POST`
2. **URL:** `https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (JSON):**
   ```json
   {
     "amount": 4,
     "topic_id": "uuid-of-topic",
     "topic_name": "Functions and Basic Operations",
     "skills": ["Function Declaration", "Parameters", "Problem Solving"],
     "question_type": "code",
     "programming_language": "javascript",
     "humanLanguage": "en"
   }
   ```
5. **Click Send**

**Expected Response:**
- `200 OK` with `success: true`
- Questions array with generated coding questions
- `metadata.serviceUsed: "gemini"`
- Questions automatically saved to Supabase
- Check Railway logs for save operation details

#### 2b. Generate Theoretical Questions (Assessment Microservice)

1. **Method:** `POST`
2. **URL:** `https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (JSON):**
   ```json
   {
     "amount": 4,
     "topic_id": "uuid-of-topic",
     "topic_name": "Functions and Basic Operations",
     "skills": ["Function Declaration", "Parameters", "Problem Solving"],
     "question_type": "theoretical",
     "humanLanguage": "en"
   }
   ```
5. **Click Send**

**Expected Response:**
- `200 OK` with `success: true`
- Questions array with generated theoretical questions
- `metadata.serviceUsed: "assessment"`
- Questions automatically saved to Supabase
- Check Railway logs for save operation details

**Note:** For theoretical questions, `programming_language` is not required (will be `null`)

---

### Step 3: Verify Questions in Supabase

After generating questions, verify they were saved:

1. Go to Supabase Dashboard
2. Navigate to `temp_questions` table
3. Check for newly inserted questions
4. Verify `topics` table for topic creation
5. Verify `testCases` table for test cases (if `question_id` is UUID)

---

## Common Issues

### 1. 401 Unauthorized

**Issue:** Service authentication required

**Solution:** The `/api/gemini-questions/*` endpoints are excluded from authentication. If you still get 401, check:
- Are you using the correct endpoint path?
- Is the endpoint registered correctly?
- Check Railway logs for authentication middleware logs

### 2. 500 Internal Server Error

**Issue:** Server error during question generation or saving

**Solution:**
- Check Railway logs for error details
- Verify `GEMINI_API_KEY` is set in Railway
- Verify `SUPABASE_URL` is set in Railway
- Check if `DEFAULT_COURSE_ID` is set (for topic creation)

### 3. Questions Not Saved to Supabase

**Issue:** Questions generated but not appearing in `temp_questions` table

**Solution:**
- Check Railway logs for save operation details
- Verify `resolvedCourseId` is not null (check `DEFAULT_COURSE_ID`)
- Verify `topicId` is resolved (check topic creation logs)
- Check for errors in save operation logs
- Use test endpoint to verify Supabase connection

### 4. Connection Timeout

**Issue:** Request times out

**Solution:**
- Check if Railway backend is running
- Verify network connectivity
- Check Railway logs for backend status
- Try health check endpoint first

---

## Postman Collection

You can create a Postman collection with these endpoints:

```json
{
  "info": {
    "name": "DevLab Question Generation API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Test Supabase Connection",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/test-supabase-insert",
          "protocol": "https",
          "host": ["devlab-backend-production-0bcb", "up", "railway", "app"],
          "path": ["api", "gemini-questions", "test-supabase-insert"]
        }
      }
    },
    {
      "name": "Generate Code Questions (Gemini)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 4,\n  \"topic_id\": \"uuid-of-topic\",\n  \"topic_name\": \"Functions and Basic Operations\",\n  \"skills\": [\"Function Declaration\", \"Parameters\", \"Problem Solving\"],\n  \"question_type\": \"code\",\n  \"programming_language\": \"javascript\",\n  \"humanLanguage\": \"en\"\n}"
        },
        "url": {
          "raw": "https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package",
          "protocol": "https",
          "host": ["devlab-backend-production-0bcb", "up", "railway", "app"],
          "path": ["api", "gemini-questions", "generate-question-package"]
        }
      }
    },
    {
      "name": "Generate Theoretical Questions (Assessment)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 4,\n  \"topic_id\": \"uuid-of-topic\",\n  \"topic_name\": \"Functions and Basic Operations\",\n  \"skills\": [\"Function Declaration\", \"Parameters\", \"Problem Solving\"],\n  \"question_type\": \"theoretical\",\n  \"humanLanguage\": \"en\"\n}"
        },
        "url": {
          "raw": "https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package",
          "protocol": "https",
          "host": ["devlab-backend-production-0bcb", "up", "railway", "app"],
          "path": ["api", "gemini-questions", "generate-question-package"]
        }
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/health",
          "protocol": "https",
          "host": ["devlab-backend-production-0bcb", "up", "railway", "app"],
          "path": ["api", "gemini-questions", "health"]
        }
      }
    }
  ]
}
```

---

## Quick Test Checklist

- [ ] Test Supabase connection: `POST /api/gemini-questions/test-supabase-insert`
- [ ] Generate questions: `POST /api/gemini-questions/generate-question-package`
- [ ] Check Railway logs for save operation
- [ ] Verify questions in Supabase `temp_questions` table
- [ ] Verify topics in Supabase `topics` table
- [ ] Verify test cases in Supabase `testCases` table (if UUID question_id)

---

## Support

If you encounter issues:
1. Check Railway logs for detailed error messages
2. Verify environment variables are set correctly
3. Test Supabase connection using test endpoint
4. Check Supabase table structure matches expected schema

