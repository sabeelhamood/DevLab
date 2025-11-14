# Mock Microservices Data Guide

## 📍 Sources

- **Backend mocks:** `backend/src/services/mockMicroservices.js`
- **Frontend mocks:** `frontend/src/services/mockMicroservices.js`

Both files share the same structure so UI components and API handlers can rely on consistent sample payloads.

---

## 🧩 Available Mock Services

### 1. Content Studio (`contentStudio`)
- **Purpose:** course catalogs, topics, default skills, and seed questions.
- **Key helpers:**
  - `getCourses()`
  - `getTopics(courseId)`
  - `getQuestions(topicId)`
- **Difficulty Gradient:** mock question generators now assign increasing difficulty labels (`basic`, `basic-plus`, …, `expert`) so the first question is easiest and the last is hardest.
- **Usage:**
  ```js
  const courses = mockMicroservices.contentStudio.getCourses();
  const topics = mockMicroservices.contentStudio.getTopics(201);
  ```

### 2. Assessment Service (`assessmentService`)
- **Purpose:** theoretical question generation, simulated evaluations, and competition utilities.
- **Key helpers:**
  - `generateQuestions(topicId, count, difficulty)`
  - `submitPracticeSession(sessionData)`
  - `competitionService.createCompetitionInvitation(courseId, topicId)`
- **Usage:**
  ```js
  const questions = mockMicroservices.assessmentService.generateQuestions(301, 3, 'intermediate');
  const invitation = mockMicroservices.assessmentService.competitionService.createCompetitionInvitation(1, 101);
  ```

### 3. Learning Analytics (`learningAnalytics`)
- **Purpose:** learner progress snapshots and insight recommendations.
- **Key helpers:**
  - `getUserProgress(userId)`
  - `getCourseAnalytics(courseId)`
  - `generateInsights(userId, range)`
- **Usage:**
  ```js
  const analytics = mockMicroservices.learningAnalytics.getCourseAnalytics(1);
  const insights = mockMicroservices.learningAnalytics.generateInsights(1, 'last_30_days');
  ```

### 4. Sandbox / Judge0 (`sandboxService`)
- **Purpose:** mock code execution and validation responses.
- **Key helpers:**
  - `executeCode(code, language, testCases)`
  - `validateCode(code, requirements)`
- **Usage:**
  ```js
  const execution = await mockMicroservices.sandboxService.executeCode(code, 'javascript', testCases);
  ```

### 5. Gemini Helpers (`geminiService`)
- **Purpose:** local fallbacks for AI-driven flows when the real Gemini API is unavailable.
- **Key helpers:**
  - `generateQuestion(topic, difficulty, language)`
  - `evaluateCode(code, question)`
  - `generateHint(question, userAttempt)`

---

## 🛠️ Test Data Builders

`generateMockData` exports convenience factories for unit tests and storybook fixtures:

```js
import { generateMockData } from './services/mockMicroservices';

const learner = generateMockData.createUser('learner');
const course = generateMockData.createCourse('intermediate');
const practice = generateMockData.createPractice(course.id, 201, 401);
```

---

## 📦 Sample Structures

### Content Studio Topic
```json
{
  "topic_id": 301,
  "course_id": 201,
  "topic_name": "Functions and Scope",
  "skills": ["Function Declaration", "Closures", "JavaScript Functions", "Scope Management"]
}
```

### Assessment Code Question Response
```json
{
  "id": "assessment_code_1",
  "topic_name": "Asynchronous JavaScript",
  "programming_language": "javascript",
  "question": "Implement a Promise-based delay utility.",
  "test_cases": [
    { "input": { "ms": 100 }, "expected_output": "resolves after 100ms" }
  ],
  "judge0": { "language": "javascript", "runtime": "node", "sandbox": true }
}
```

### Learning Analytics Summary
```json
{
  "user_id": 1,
  "skill_levels": {
    "JavaScript": "Intermediate",
    "Data Structures": "Advanced"
  },
  "recommendations": [
    "Focus on async programming concepts",
    "Practice more algorithm problems"
  ]
}
```

---

## ✅ Notes

- Directory, HR, Skills Engine, and Learner Assistant mocks were removed in favour of the streamlined microservice architecture.
- Competition helpers now live under `assessmentService.competitionService`.
- Update both backend and frontend mocks if you expand the microservice contracts; keep this document in sync for future contributors.

