# API Endpoints Update - New Database Schema

## 🚀 **Updated API Endpoints for ERD Implementation**

### **📋 Overview**

All API endpoints have been updated to work with the new database schema based on your ERD diagram.
The endpoints now support the new entity relationships and data structures.

---

## **👥 User Profiles API**

### **Base URL:** `/api/userProfiles`

| Method   | Endpoint                        | Description                       | Parameters                                           |
| -------- | ------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `GET`    | `/`                             | Get all user profiles (paginated) | `page`, `limit`                                      |
| `GET`    | `/:userId`                      | Get user profile by ID            | `userId`                                             |
| `GET`    | `/email/:email`                 | Get user profile by email         | `email`                                              |
| `POST`   | `/`                             | Create new user profile           | `user_id`, `name`, `email`, `role`, `organizationId` |
| `PUT`    | `/:userId`                      | Update user profile               | `userId` + update data                               |
| `DELETE` | `/:userId`                      | Delete user profile               | `userId`                                             |
| `GET`    | `/organization/:organizationId` | Get users by organization         | `organizationId`                                     |
| `GET`    | `/role/:role`                   | Get users by role                 | `role` (learner/trainer/both)                        |
| `GET`    | `/:userId/completed-courses`    | Get completed courses             | `userId`                                             |
| `GET`    | `/:userId/active-courses`       | Get active courses                | `userId`                                             |

---

## **📚 Courses API**

### **Base URL:** `/api/courses`

| Method   | Endpoint                 | Description                 | Parameters                             |
| -------- | ------------------------ | --------------------------- | -------------------------------------- |
| `GET`    | `/`                      | Get all courses (paginated) | `page`, `limit`, `level`, `trainer_id` |
| `GET`    | `/:courseId`             | Get course by ID            | `courseId`                             |
| `POST`   | `/`                      | Create new course           | `trainer_id`, `level`, `ai_feedback`   |
| `PUT`    | `/:courseId`             | Update course               | `courseId` + update data               |
| `DELETE` | `/:courseId`             | Delete course               | `courseId`                             |
| `GET`    | `/trainer/:trainerId`    | Get courses by trainer      | `trainerId`                            |
| `GET`    | `/level/:level`          | Get courses by level        | `level`                                |
| `PUT`    | `/:courseId/ai-feedback` | Update AI feedback          | `courseId`, `ai_feedback`              |

---

## **📖 Topics API**

### **Base URL:** `/api/topics`

| Method   | Endpoint                     | Description                | Parameters                                               |
| -------- | ---------------------------- | -------------------------- | -------------------------------------------------------- |
| `GET`    | `/`                          | Get all topics (paginated) | `page`, `limit`, `course_id`                             |
| `GET`    | `/:topicId`                  | Get topic by ID            | `topicId`                                                |
| `POST`   | `/`                          | Create new topic           | `course_id`, `topic_name`, `nano_skills`, `macro_skills` |
| `PUT`    | `/:topicId`                  | Update topic               | `topicId` + update data                                  |
| `DELETE` | `/:topicId`                  | Delete topic               | `topicId`                                                |
| `GET`    | `/course/:courseId`          | Get topics by course       | `courseId`                                               |
| `GET`    | `/nano-skills/:nanoSkills`   | Get topics by nano skills  | `nanoSkills` (comma-separated)                           |
| `GET`    | `/macro-skills/:macroSkills` | Get topics by macro skills | `macroSkills` (comma-separated)                          |
| `PUT`    | `/:topicId/nano-skills`      | Update nano skills         | `topicId`, `nano_skills` array                           |
| `PUT`    | `/:topicId/macro-skills`     | Update macro skills        | `topicId`, `macro_skills` array                          |
| `GET`    | `/:topicId/stats`            | Get topic statistics       | `topicId`                                                |

---

## **❓ Questions API**

### **Base URL:** `/api/questions`

| Method   | Endpoint                | Description                  | Parameters                                                   |
| -------- | ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| `GET`    | `/`                     | Get all questions (existing) | Standard pagination                                          |
| `GET`    | `/:id`                  | Get question by ID           | `id`                                                         |
| `POST`   | `/`                     | Create question              | `question_content`, `question_type`, `course_id`, `topic_id` |
| `PUT`    | `/:id`                  | Update question              | `id` + update data                                           |
| `DELETE` | `/:id`                  | Delete question              | `id`                                                         |
| `GET`    | `/practice/:practiceId` | Get questions by practice    | `practiceId`                                                 |
| `GET`    | `/type/:questionType`   | Get questions by type        | `questionType` (code/theoretical)                            |
| `GET`    | `/tags/:tags`           | Get questions by tags        | `tags` (comma-separated)                                     |
| `GET`    | `/random/:topicId`      | Get random questions         | `topicId`, `count`, `difficulty`, `questionType`             |
| `GET`    | `/course/:courseId`     | Get questions by course      | `courseId`                                                   |

---

## **🧪 Test Cases API**

### **Base URL:** `/api/testCases`

| Method   | Endpoint                 | Description                        | Parameters                                |
| -------- | ------------------------ | ---------------------------------- | ----------------------------------------- |
| `GET`    | `/`                      | Get all test cases (paginated)     | `page`, `limit`                           |
| `GET`    | `/:testCaseId`           | Get test case by ID                | `testCaseId`                              |
| `POST`   | `/`                      | Create test case                   | `question_id`, `input`, `expected_output` |
| `POST`   | `/bulk`                  | Create multiple test cases         | `question_id`, `testCases` array          |
| `PUT`    | `/:testCaseId`           | Update test case                   | `testCaseId` + update data                |
| `DELETE` | `/:testCaseId`           | Delete test case                   | `testCaseId`                              |
| `DELETE` | `/question/:questionId`  | Delete all test cases for question | `questionId`                              |
| `GET`    | `/question/:questionId`  | Get test cases by question         | `questionId`                              |
| `GET`    | `/course/:courseId`      | Get test cases by course           | `courseId`                                |
| `GET`    | `/topic/:topicId`        | Get test cases by topic            | `topicId`                                 |
| `GET`    | `/execution/:questionId` | Get test cases for execution       | `questionId`                              |
| `POST`   | `/:testCaseId/validate`  | Validate test case                 | `testCaseId`, `actualOutput`              |
| `GET`    | `/stats/:questionId`     | Get test case statistics           | `questionId`                              |

---

## **💪 Practices API**

### **Base URL:** `/api/practices`

| Method   | Endpoint                    | Description                   | Parameters                                                       |
| -------- | --------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `GET`    | `/`                         | Get all practices (paginated) | `page`, `limit`, `learner_id`, `course_id`, `topic_id`, `status` |
| `GET`    | `/:practiceId`              | Get practice by ID            | `practiceId`                                                     |
| `POST`   | `/`                         | Create practice session       | `learner_id`, `course_id`, `topic_id`, `content`                 |
| `PUT`    | `/:practiceId`              | Update practice               | `practiceId` + update data                                       |
| `PUT`    | `/:practiceId/status`       | Update practice status        | `practiceId`, `status`                                           |
| `PUT`    | `/:practiceId/score`        | Update practice score         | `practiceId`, `score`                                            |
| `PUT`    | `/:practiceId/content`      | Update practice content       | `practiceId`, `content`                                          |
| `DELETE` | `/:practiceId`              | Delete practice               | `practiceId`                                                     |
| `GET`    | `/learner/:learnerId`       | Get practices by learner      | `learnerId`, `limit`                                             |
| `GET`    | `/course/:courseId`         | Get practices by course       | `courseId`, `limit`                                              |
| `GET`    | `/topic/:topicId`           | Get practices by topic        | `topicId`, `limit`                                               |
| `GET`    | `/active/:learnerId?`       | Get active practices          | `learnerId` (optional)                                           |
| `GET`    | `/completed/:learnerId?`    | Get completed practices       | `learnerId` (optional)                                           |
| `GET`    | `/stats/learner/:learnerId` | Get learner practice stats    | `learnerId`                                                      |
| `GET`    | `/stats/topic/:topicId`     | Get topic practice stats      | `topicId`                                                        |
| `GET`    | `/recent/:limit?`           | Get recent practices          | `limit` (default: 10)                                            |

---

## **🏆 Competitions API**

### **Base URL:** `/api/competitions`

| Method   | Endpoint                 | Description                     | Parameters                                |
| -------- | ------------------------ | ------------------------------- | ----------------------------------------- |
| `GET`    | `/`                      | Get all competitions (existing) | Standard pagination                       |
| `GET`    | `/:id`                   | Get competition by ID           | `id`                                      |
| `POST`   | `/`                      | Create competition              | `course_id`, `learner1_id`, `learner2_id` |
| `PUT`    | `/:competitionId/result` | Update competition result       | `competitionId`, `result`                 |
| `DELETE` | `/:competitionId`        | Delete competition              | `competitionId`                           |
| `GET`    | `/course/:courseId`      | Get competitions by course      | `courseId`                                |
| `GET`    | `/learner/:learnerId`    | Get competitions by learner     | `learnerId`                               |
| `GET`    | `/active/all`            | Get active competitions         | None                                      |
| `GET`    | `/completed/all`         | Get completed competitions      | None                                      |

---

## **🔧 Data Types & Validation**

### **User Profile Fields:**

- `user_id` (bigint, PK)
- `name` (string)
- `email` (string, unique)
- `role` (enum: 'learner', 'trainer', 'both')
- `organizationId` (bigint, FK)
- `completed_courses` (json array)
- `active_courses` (json array)

### **Course Fields:**

- `course_id` (bigint, PK)
- `trainer_id` (bigint, FK to userProfiles)
- `level` (string)
- `ai_feedback` (json)

### **Topic Fields:**

- `topic_id` (bigint, PK)
- `course_id` (bigint, FK to courses)
- `topic_name` (string)
- `nano_skills` (json array)
- `macro_skills` (json array)

### **Question Fields:**

- `question_id` (bigint, PK)
- `practice_id` (bigint, FK to practices)
- `course_id` (bigint, FK to courses)
- `question_type` (enum: 'code', 'theoretical')
- `question_content` (string)
- `tags` (json array)

### **Test Case Fields:**

- `testCase_id` (bigint, PK)
- `question_id` (bigint, FK to questions)
- `input` (string)
- `expected_output` (string)

### **Practice Fields:**

- `practice_id` (bigint, PK)
- `learner_id` (bigint, FK to userProfiles)
- `course_id` (bigint, FK to courses)
- `topic_id` (bigint, FK to topics)
- `content` (string)
- `score` (float)
- `status` (enum: 'in_progress', 'completed', 'abandoned')

### **Competition Fields:**

- `competition_id` (bigint, PK)
- `course_id` (bigint, FK to courses)
- `learner1_id` (bigint, FK to userProfiles)
- `learner2_id` (bigint, FK to userProfiles)
- `result` (json)

---

## **🚀 Usage Examples**

### **Create a User Profile:**

```bash
POST /api/userProfiles
{
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "learner",
  "organizationId": 1,
  "completed_courses": [],
  "active_courses": [1, 2]
}
```

### **Create a Course:**

```bash
POST /api/courses
{
  "trainer_id": 2,
  "level": "intermediate",
  "ai_feedback": {
    "difficulty_analysis": "Medium complexity",
    "recommendations": ["Add more examples"]
  }
}
```

### **Create a Practice Session:**

```bash
POST /api/practices
{
  "learner_id": 1,
  "course_id": 1,
  "topic_id": 1,
  "content": "Practice session content",
  "status": "in_progress"
}
```

### **Get Random Questions:**

```bash
GET /api/questions/random/1?count=5&difficulty=intermediate&questionType=code
```

---

## **📊 Response Formats**

### **Success Response:**

```json
{
  "data": [...],
  "count": 100,
  "page": 1,
  "limit": 10
}
```

### **Error Response:**

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

---

## **🔗 Relationships Supported**

- **User → Courses** (1:\*): Trainers create courses
- **Course → Topics** (1:\*): Courses contain topics
- **Topic → Questions** (1:\*): Topics have questions
- **Question → TestCases** (1:\*): Questions have test cases
- **User → Practices** (1:\*): Learners have practice sessions
- **Topic → Practices** (1:\*): Topics are practiced
- **Competitions**: Many-to-many relationships

All endpoints now fully support the new ERD schema with proper relationships, data types, and
validation! 🎯✨
