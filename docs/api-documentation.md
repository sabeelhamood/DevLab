# DEVLAB Microservice - API Documentation

## Overview

The DEVLAB Microservice provides a comprehensive REST API for AI-powered interactive learning environments. This documentation covers all available endpoints, request/response formats, and authentication requirements.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.devlab.educore-ai.com/api`
- **Production**: `https://api.devlab.educore-ai.com/api`

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns HTTP 429 with retry-after information

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## API Endpoints

### Authentication

#### POST /auth/validate

Validate a JWT token and return user information.

**Request:**
```json
{
  "token": "jwt_token_here"
}
```

**Response:**
```json
{
  "valid": true,
  "userId": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["learner"],
  "organizationId": "org-123",
  "skillLevel": 3,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Invalid or expired token
- `429 Too Many Requests`: Rate limit exceeded

#### POST /auth/refresh

Refresh a JWT token using a refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "valid": true,
  "userId": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["learner"],
  "organizationId": "org-123",
  "skillLevel": 3,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### GET /auth/roles

Get user roles for the authenticated user.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "roles": ["learner", "instructor"]
}
```

#### POST /auth/session/validate

Validate a user session.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "valid": true
}
```

#### POST /auth/session/destroy

Destroy a user session.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true
}
```

### Questions

#### GET /questions/personalized

Get personalized questions for a learner.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `topic` (optional): Question topic (e.g., "algorithms", "data-structures")
- `language` (optional): Programming language (e.g., "python", "javascript", "java")
- `limit` (optional): Number of questions (default: 10, max: 50)

**Example Request:**
```http
GET /questions/personalized?topic=algorithms&language=python&limit=5
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "questions": [
    {
      "id": "question-123",
      "title": "Binary Search Implementation",
      "description": "Implement binary search algorithm",
      "difficulty_level": 3,
      "programming_language": "python",
      "question_type": "coding",
      "topic": "algorithms",
      "micro_skills": ["binary-search"],
      "nano_skills": ["recursion"],
      "test_cases": [
        {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        }
      ],
      "hints": ["Use recursion", "Compare middle element"],
      "ai_validated": true,
      "quality_score": 0.85,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_count": 1,
  "has_more": false,
  "learner_profile": {
    "skill_level": 3,
    "daily_quota_used": 5,
    "daily_quota_remaining": 45,
    "weekly_quota_used": 25,
    "weekly_quota_remaining": 275
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `429 Too Many Requests`: Rate limit exceeded

#### GET /questions/:id

Get a specific question by ID.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "question-123",
  "title": "Binary Search Implementation",
  "description": "Implement binary search algorithm",
  "difficulty_level": 3,
  "programming_language": "python",
  "question_type": "coding",
  "topic": "algorithms",
  "micro_skills": ["binary-search"],
  "nano_skills": ["recursion"],
  "test_cases": [
    {
      "input": "[1, 2, 3, 4, 5], 3",
      "expected_output": "2",
      "is_hidden": false
    }
  ],
  "hints": ["Use recursion", "Compare middle element"],
  "ai_validated": true,
  "quality_score": 0.85,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Question not found
- `401 Unauthorized`: Invalid or expired token

#### POST /questions/:id/submit

Submit a code solution for a question.

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request:**
```json
{
  "code": "def binary_search(arr, target):\n    # Implementation here\n    pass",
  "language": "python"
}
```

**Response:**
```json
{
  "execution_result": {
    "success": true,
    "output": "2",
    "error_message": null,
    "execution_time": 150,
    "memory_usage": 1024,
    "test_results": [
      {
        "test_case": {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        },
        "passed": true,
        "actual_output": "2",
        "execution_time": 150
      }
    ]
  },
  "feedback": {
    "feedback": "Great job! Your solution is efficient and well-structured.",
    "suggestions": [
      "Consider adding input validation",
      "You could optimize the space complexity"
    ],
    "score": 0.85,
    "skill_improvement": {
      "binary_search": 0.1,
      "recursion": 0.05
    },
    "insights": [
      "Strong understanding of binary search",
      "Good use of recursion",
      "Consider edge cases"
    ]
  },
  "score": 0.85,
  "session_status": "completed",
  "attempts_remaining": 2
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: Question not found
- `429 Too Many Requests`: Rate limit exceeded

### Learning Sessions

#### GET /questions/sessions

Get learning sessions for a learner.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status` (optional): Session status filter ("active", "completed", "abandoned")
- `limit` (optional): Number of sessions (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```http
GET /questions/sessions?status=completed&limit=10&offset=0
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-123",
      "learner_id": "user-123",
      "question_id": "question-123",
      "session_start": "2024-01-01T10:00:00Z",
      "session_end": "2024-01-01T10:30:00Z",
      "status": "completed",
      "attempts": 1,
      "max_attempts": 3,
      "score": 0.85,
      "ai_feedback": "Great job! Your solution is efficient and well-structured.",
      "question": {
        "id": "question-123",
        "title": "Binary Search Implementation",
        "difficulty_level": 3,
        "programming_language": "python"
      }
    }
  ],
  "total_count": 1,
  "has_more": false
}
```

#### GET /questions/sessions/:sessionId

Get specific learning session details.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "session-123",
  "learner_id": "user-123",
  "question_id": "question-123",
  "session_start": "2024-01-01T10:00:00Z",
  "session_end": "2024-01-01T10:30:00Z",
  "status": "completed",
  "attempts": 1,
  "max_attempts": 3,
  "score": 0.85,
  "ai_feedback": "Great job! Your solution is efficient and well-structured.",
  "code_submissions": [
    {
      "code": "def binary_search(arr, target):\n    # Implementation here\n    pass",
      "language": "python",
      "submitted_at": "2024-01-01T10:15:00Z"
    }
  ],
  "execution_results": {
    "success": true,
    "output": "2",
    "execution_time": 150,
    "test_results": [
      {
        "test_case": {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        },
        "passed": true,
        "actual_output": "2",
        "execution_time": 150
      }
    ]
  },
  "question": {
    "id": "question-123",
    "title": "Binary Search Implementation",
    "description": "Implement binary search algorithm",
    "difficulty_level": 3,
    "programming_language": "python",
    "question_type": "coding",
    "topic": "algorithms",
    "micro_skills": ["binary-search"],
    "nano_skills": ["recursion"],
    "test_cases": [
      {
        "input": "[1, 2, 3, 4, 5], 3",
        "expected_output": "2",
        "is_hidden": false
      }
    ],
    "hints": ["Use recursion", "Compare middle element"],
    "ai_validated": true,
    "quality_score": 0.85
  }
}
```

### Health & Monitoring

#### GET /health

Get application health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  }
}
```

#### GET /ready

Get application readiness status.

**Response:**
```json
{
  "ready": true,
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": "ready",
    "redis": "ready",
    "external_apis": "ready"
  }
}
```

#### GET /metrics

Get application metrics (Prometheus format).

**Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/health",status="200"} 100

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",endpoint="/health",le="0.1"} 95
http_request_duration_seconds_bucket{method="GET",endpoint="/health",le="0.5"} 98
http_request_duration_seconds_bucket{method="GET",endpoint="/health",le="1.0"} 100
```

## Data Models

### Question

```typescript
interface Question {
  id: string;
  title: string;
  description: string;
  difficulty_level: number; // 1-10
  programming_language: string;
  question_type: 'coding' | 'theoretical' | 'multiple_choice';
  topic: string;
  micro_skills?: string[];
  nano_skills?: string[];
  test_cases?: TestCase[];
  hints?: string[];
  ai_validated: boolean;
  quality_score?: number; // 0-1
  created_at: string;
  updated_at: string;
}
```

### Learning Session

```typescript
interface LearningSession {
  id: string;
  learner_id: string;
  question_id: string;
  session_start: string;
  session_end?: string;
  status: 'active' | 'completed' | 'abandoned';
  attempts: number;
  max_attempts: number;
  score?: number; // 0-1
  ai_feedback?: string;
  code_submissions?: CodeSubmission[];
  execution_results?: ExecutionResult;
}
```

### Test Case

```typescript
interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}
```

### Code Submission

```typescript
interface CodeSubmission {
  code: string;
  language: string;
  submitted_at: string;
}
```

### Execution Result

```typescript
interface ExecutionResult {
  success: boolean;
  output?: string;
  error_message?: string;
  execution_time: number; // milliseconds
  memory_usage: number; // bytes
  test_results: TestResult[];
}
```

### Test Result

```typescript
interface TestResult {
  test_case: TestCase;
  passed: boolean;
  actual_output?: string;
  execution_time: number; // milliseconds
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TOKEN` | Invalid or expired JWT token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `QUESTION_NOT_FOUND` | Question with specified ID not found |
| `SESSION_NOT_FOUND` | Learning session not found |
| `QUOTA_EXCEEDED` | Daily or weekly question quota exceeded |
| `INVALID_LANGUAGE` | Unsupported programming language |
| `EXECUTION_FAILED` | Code execution failed |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/*` | 10 requests | 1 minute |
| `/questions/personalized` | 20 requests | 1 minute |
| `/questions/*/submit` | 5 requests | 1 minute |
| `/questions/sessions` | 30 requests | 1 minute |
| All others | 100 requests | 1 minute |

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('wss://ws.devlab.educore-ai.com');
```

### Authentication

```javascript
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));
```

### Events

#### Question Updates

```javascript
{
  "type": "question_update",
  "questionId": "question-123",
  "status": "available",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Session Updates

```javascript
{
  "type": "session_update",
  "sessionId": "session-123",
  "status": "completed",
  "score": 0.85,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### System Notifications

```javascript
{
  "type": "notification",
  "message": "New questions available in your skill area",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { DevLabAPI } from '@educore-ai/devlab-sdk';

const api = new DevLabAPI({
  baseURL: 'https://api.devlab.educore-ai.com',
  token: 'your-jwt-token'
});

// Get personalized questions
const questions = await api.questions.getPersonalized({
  topic: 'algorithms',
  language: 'python',
  limit: 10
});

// Submit code solution
const result = await api.questions.submitSolution('question-123', {
  code: 'def solution():\n    pass',
  language: 'python'
});
```

### Python

```python
from devlab_sdk import DevLabAPI

api = DevLabAPI(
    base_url='https://api.devlab.educore-ai.com',
    token='your-jwt-token'
)

# Get personalized questions
questions = api.questions.get_personalized(
    topic='algorithms',
    language='python',
    limit=10
)

# Submit code solution
result = api.questions.submit_solution(
    question_id='question-123',
    code='def solution():\n    pass',
    language='python'
)
```

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial API release
- Authentication endpoints
- Question management
- Learning sessions
- Code execution
- Real-time updates via WebSocket

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Contact**: api-support@educore-ai.com
