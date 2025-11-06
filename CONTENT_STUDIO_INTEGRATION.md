# Content Studio Integration Guide

## Overview

DEVLAB is designed to receive question generation requests from **Content Studio**, an external system. The integration is built with a real communication channel structure, but currently uses mock data for testing until Content Studio is available.

## Architecture

```
Content Studio → DEVLAB → Gemini API → Response
     (Mock)      (Real)      (Real)
```

### Current Status
- ✅ **Real Integration Structure**: Content Studio endpoint is ready
- ✅ **Language Support**: Full multi-language support (Hebrew, English, Arabic, Russian, etc.)
- ✅ **Mock Data**: Simulated Content Studio requests for testing
- ⏳ **Real Content Studio**: Will be connected when available

## API Endpoints

### 1. Generate Questions (Primary Endpoint)

**Endpoint:** `POST /api/content-studio/questions/generate`

**Request Body:**
```json
{
  "lesson_id": "string (required)",
  "course_name": "string (required)",
  "lesson_name": "string (required)",
  "nano_skills": ["string"] (required),
  "micro_skills": ["string"] (required),
  "question_type": "code" | "theoretical" (required),
  "programming_language": "string" (required for code questions),
  "quantity": number (default: 4),
  "language": "hebrew" | "english" | "arabic" | "russian" | etc. (REQUIRED),
  "difficulty": "easy" | "medium" | "hard" (optional),
  "category": "string" (optional),
  "answer_options": [...] (optional, for theoretical questions)
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "string",
      "question_text": "string (in requested language)",
      "test_cases": [...],
      "programming_language": "string",
      "style": {
        "difficulty": "string",
        "tags": [...],
        "estimated_time": number
      },
      "source": "gemini" | "mock"
    }
  ],
  "metadata": {
    "lesson_id": "string",
    "course_name": "string",
    "lesson_name": "string",
    "question_type": "string",
    "language": "string",
    "quantity": number,
    "generated_at": "ISO timestamp"
  }
}
```

### 2. Batch Generation

**Endpoint:** `POST /api/content-studio/questions/batch`

**Request Body:**
```json
{
  "requests": [
    { /* Content Studio request 1 */ },
    { /* Content Studio request 2 */ },
    { /* ... */ }
  ]
}
```

### 3. Health Check

**Endpoint:** `GET /api/content-studio/health`

## Language Support

DEVLAB supports question generation in multiple languages:

- ✅ **Hebrew** (`hebrew`)
- ✅ **English** (`english`)
- ✅ **Arabic** (`arabic`)
- ✅ **Russian** (`russian`)
- ✅ **Spanish** (`spanish`)
- ✅ **French** (`french`)
- ✅ **German** (`german`)
- ✅ **Chinese** (`chinese`)
- ✅ **Japanese** (`japanese`)
- ✅ **Korean** (`korean`)

The `language` parameter is **REQUIRED** and determines:
- Language of question text
- Language of instructions
- Language of explanations
- Code examples can remain in English, but explanations are in the requested language

## Mock Data Structure

### Example: English Coding Question Request
```json
{
  "lesson_id": "lesson_001",
  "course_name": "Python Fundamentals",
  "lesson_name": "Introduction to Functions",
  "nano_skills": ["functions", "parameters", "return"],
  "micro_skills": ["function_definitions", "code_organization"],
  "question_type": "code",
  "programming_language": "python",
  "quantity": 4,
  "language": "english"
}
```

### Example: Hebrew Coding Question Request
```json
{
  "lesson_id": "lesson_002",
  "course_name": "יסודות Python",
  "lesson_name": "מבוא לפונקציות",
  "nano_skills": ["פונקציות", "פרמטרים", "החזרת ערכים"],
  "micro_skills": ["הגדרת פונקציות", "ארגון קוד"],
  "question_type": "code",
  "programming_language": "python",
  "quantity": 4,
  "language": "hebrew"
}
```

### Example: Arabic Coding Question Request
```json
{
  "lesson_id": "lesson_003",
  "course_name": "أساسيات Python",
  "lesson_name": "مقدمة للدوال",
  "nano_skills": ["الدوال", "المعاملات", "إرجاع القيم"],
  "micro_skills": ["تعريف الدوال", "تنظيم الكود"],
  "question_type": "code",
  "programming_language": "python",
  "quantity": 4,
  "language": "arabic"
}
```

## Testing the Integration

### 1. Using Mock Data

You can test the integration using the provided mock data:

```javascript
import contentStudioSimulator from './utils/contentStudioSimulator.js';
import { mockContentStudioHebrewRequest } from './mocks/contentStudioMocks.js';

// Simulate a Hebrew question request
const result = await contentStudioSimulator.simulateContentStudioRequest(
  mockContentStudioHebrewRequest
);

console.log('Generated questions:', result.questions);
console.log('Language:', result.metadata.language);
```

### 2. Direct API Call

```bash
curl -X POST http://localhost:3001/api/content-studio/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "lesson_001",
    "course_name": "Python Fundamentals",
    "lesson_name": "Introduction to Functions",
    "nano_skills": ["functions", "parameters"],
    "micro_skills": ["function_definitions"],
    "question_type": "code",
    "programming_language": "python",
    "quantity": 4,
    "language": "hebrew"
  }'
```

### 3. Test Multiple Languages

```javascript
import contentStudioSimulator from './utils/contentStudioSimulator.js';

// Test all supported languages
const results = await contentStudioSimulator.testLanguageSupport();
console.log(results);
```

## Workflow

### Current Flow (With Mock Data)

1. **Content Studio** (simulated) sends request to DEVLAB
2. **DEVLAB** receives request at `/api/content-studio/questions/generate`
3. **DEVLAB** validates request and extracts language parameter
4. **DEVLAB** calls **Gemini API** with language-specific prompt
5. **Gemini** generates questions in requested language
6. **DEVLAB** returns questions to Content Studio (simulated)

### Future Flow (With Real Content Studio)

1. **Content Studio** sends real HTTP request to DEVLAB
2. **DEVLAB** processes request (same as above)
3. **DEVLAB** returns questions to **Content Studio** via HTTP response
4. **DEVLAB** optionally notifies Content Studio about completion

## Integration Checklist

When Content Studio is ready:

- [ ] Update `CONTENT_STUDIO_URL` in Railway environment variables
- [ ] Test real HTTP connection from Content Studio to DEVLAB
- [ ] Verify language parameter is passed correctly
- [ ] Test question generation in all required languages
- [ ] Verify response format matches Content Studio expectations
- [ ] Test error handling and fallback mechanisms
- [ ] Set up monitoring and logging

## Error Handling

DEVLAB handles errors gracefully:

- **Missing required fields**: Returns 400 with list of missing fields
- **Invalid question_type**: Returns 400 with allowed types
- **Gemini API failure**: Falls back to mock questions
- **Network errors**: Returns appropriate error response
- **Language not supported**: Logs warning, uses English as fallback

## Response Format

All responses follow this structure:

```json
{
  "success": true | false,
  "questions": [...],
  "metadata": {
    "lesson_id": "string",
    "language": "string",
    "generated_at": "ISO timestamp"
  },
  "error": "string" (only if success: false)
}
```

## Next Steps

1. ✅ Content Studio endpoint created
2. ✅ Language support implemented
3. ✅ Mock data structure created
4. ✅ Integration structure ready
5. ⏳ Wait for Content Studio to be available
6. ⏳ Test real integration
7. ⏳ Deploy to production

---

**Last Updated:** After Content Studio integration setup

