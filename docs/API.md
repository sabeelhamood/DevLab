# DEVLAB API Documentation

## Overview

The DEVLAB microservice provides a comprehensive REST API for AI-powered learning experiences. This document outlines all available endpoints, request/response formats, and authentication requirements.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Staging**: `https://devlab-staging-api.railway.app/api`
- **Production**: `https://devlab-api.railway.app/api`

## Authentication

### JWT Authentication
Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Service Authentication
External service endpoints require service authentication:

```
X-API-Key: <service-api-key>
X-Service-ID: <service-id>
```

## Endpoints

### Authentication

#### POST /auth/login
Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "learner",
    "organizationId": "org-123",
    "token": "jwt-token"
  }
}
```

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "learner",
  "organizationId": "org-123"
}
```

### Questions

#### GET /questions/personalized
Get personalized questions for a learner.

**Query Parameters:**
- `courseId` (required): Course ID
- `topicId` (optional): Topic ID
- `type` (optional): Question type (code/theoretical)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "q-1",
      "title": "Python Hello World",
      "description": "Write a Python program that prints 'Hello, World!'",
      "type": "code",
      "difficulty": "beginner",
      "language": "python",
      "testCases": [...],
      "hints": [...],
      "macroSkills": [...],
      "microSkills": [...],
      "nanoSkills": [...]
    }
  ]
}
```

#### POST /questions/{id}/submit
Submit an answer to a question.

**Request Body:**
```json
{
  "solution": "print('Hello, World!')",
  "language": "python",
  "timeSpent": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "score": 100,
    "feedback": "Great job! Your solution is correct.",
    "testResults": [...]
  }
}
```

### Sessions

#### POST /sessions/start
Start a new practice session.

**Request Body:**
```json
{
  "courseId": "course-1",
  "sessionType": "practice",
  "questionTypes": ["code", "theoretical"]
}
```

#### POST /sessions/{id}/submit
Submit an answer during a session.

**Request Body:**
```json
{
  "questionId": "q-1",
  "answer": "print('Hello, World!')",
  "timeSpent": 120
}
```

### Competitions

#### POST /competitions/join
Join a competition.

**Request Body:**
```json
{
  "courseId": "course-1"
}
```

#### GET /competitions/{id}
Get competition details.

#### POST /competitions/{id}/submit
Submit an answer in a competition.

### Analytics

#### GET /analytics/learner/{learnerId}
Get learner analytics.

#### GET /analytics/course/{courseId}
Get course analytics.

#### GET /analytics/dashboard
Get dashboard analytics.

## External Service Endpoints

### Unified Gateway

#### POST /api/data-request
Generic entry point for all microservices. The request body must include `requester_service` and a `payload` object. The gateway routes the payload to the appropriate internal handler (Content Studio, Assessment, Analytics, Course Builder) and returns the JSON response emitted by that handler.

### Content Studio

#### POST /external/content-studio/generate-questions
Create question packages for a topic. Payload includes `amount`, `topic_id`, `topic_name`, `skills`, `question_type`, `programming_language`, `humanLanguage`.
Gemini assigns a monotonically increasing difficulty label for each generated question (first = basic, last = hardest).

#### POST /external/content-studio/validate-question
Validate trainer-authored questions and, when relevant, transform them into structured coding packages.

### Assessment Service

#### POST /external/assessment/code
Assessment requests code questions without hints or solutions. Payload includes `topic_name`, `programming_language`, `number_of_questions`, `nano_skills`, `micro_skills`.

### Learning Analytics

#### POST /external/analytics/competition-summary
Send anonymized competition summaries for downstream analysis.

### Course Builder

#### POST /external/course-builder/course-completion
Notify DevLab that a learner has completed a course so an anonymous competition invitation can be queued. Fire-and-forget acknowledgement (`202 Accepted`).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "Additional error details"
  }
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **External Services**: 50 requests per 15 minutes

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Examples

### Complete Learning Flow

1. **Login**
```bash
curl -X POST https://devlab-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

2. **Get Personalized Questions**
```bash
curl -X GET "https://devlab-api.railway.app/api/questions/personalized?courseId=course-1" \
  -H "Authorization: Bearer <jwt-token>"
```

3. **Submit Answer**
```bash
curl -X POST https://devlab-api.railway.app/api/questions/q-1/submit \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"solution": "print(\"Hello, World!\")", "language": "python", "timeSpent": 120}'
```

## SDKs and Libraries

### JavaScript/TypeScript
```typescript
import { DevLabAPI } from '@devlab/api-client'

const api = new DevLabAPI({
  baseURL: 'https://devlab-api.railway.app/api',
  token: 'your-jwt-token'
})

const questions = await api.questions.getPersonalized('course-1')
```

### Python
```python
from devlab_api import DevLabClient

client = DevLabClient(
    base_url='https://devlab-api.railway.app/api',
    token='your-jwt-token'
)

questions = client.questions.get_personalized('course-1')
```

## Support

For API support and questions:
- **Documentation**: [https://devlab-docs.vercel.app](https://devlab-docs.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/devlab/microservice/issues)
- **Email**: api-support@devlab.com




