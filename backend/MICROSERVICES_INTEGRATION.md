# DevLab Microservices Integration

## 🔄 Current Microservice Contracts

DevLab now exchanges data with a reduced set of EduCore services through a single gateway endpoint at `/api/data-request`. Directory, HR Reporting, Skills Engine, Learner AI, and Management & Reporting are no longer in scope. The gateway routes requests based on the `requester_service` field while preserving existing logic. The active interfaces are:

### 1. Content Studio (Inbound)
- **Purpose:** Generate new questions or validate trainer-authored content.
- **Create Question Payload:** `amount` (default 4), `topic_id`, `topic_name`, `skills`, `question_type`, `programming_language`, `humanLanguage`.
- **Validate Question Payload:** `question`, `topic_id`, `topic_name`, `skills`, `question_type`, `programming_language?`, `humanLanguage`.
- **Response:** AJAX-friendly packages containing the question, Judge0 execution context, test cases, up to three clues, and a Gemini-assigned difficulty ladder (basic → hardest).

### 2. Assessment Service (Bidirectional)
- **Inbound (from Content Studio via DevLab):** Theoretical question generation requests are proxied to Assessment.
- **Inbound (from Assessment):** Assessment can request code questions with `topic_name`, `programming_language`, `number_of_questions`, `nano_skills`, `micro_skills`. DevLab returns code questions **without** hints or solutions.
- **Response Format:** AJAX payload with question text, Judge0 metadata, and test cases.

### 3. Course Builder (Inbound, Fire-and-Forget)
- **Purpose:** Notify DevLab when a learner finishes a course so an anonymous competition invitation can be queued.
- **Payload:** `course_id`, `course_name`, `learner_id`.
- **Response:** HTTP 202 acknowledgement. DevLab matches the learner with another recent graduate asynchronously.

### 4. Learning Analytics (Outbound)
- **Purpose:** Persist anonymized competition results.
- **Payload:** `learner1_id`, `learner2_id`, `course_id`, `timer`, `performance_learner1`, `performance_learner2`, `score`, `questions_answered`, `competition_id`, `created_at`.
- **Endpoint:** `POST /api/external/analytics/competition-summary`.

### 5. Gemini API (Core AI)
- **Usage:** Question generation, validation, hints, and feedback. Prompts now incorporate `humanLanguage`, `skills`, and optional trainer question seeds.

### 6. Sandbox / Judge0
- **Usage:** Code execution remains unchanged; no contract updates required.

## 🔧 Environment Variables

Add the following variables to your backend `.env`:

```env
# Content Studio
CONTENT_STUDIO_URL=http://localhost:3003

# Assessment Service
ASSESSMENT_SERVICE_URL=http://localhost:3004

# Learning Analytics
LEARNING_ANALYTICS_URL=http://localhost:3006

# Course Builder
COURSE_BUILDER_URL=http://localhost:3007

# Sandbox API
SANDBOX_API_URL=http://localhost:3010
SANDBOX_API_KEY=your-sandbox-api-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key
```

## 🧭 Data Flow Overview

```
Course Builder ──► DevLab ──► Competition Engine
Content Studio ──► DevLab ──► Gemini / Assessment ──► Content Studio
DevLab ──► Learning Analytics
DevLab ◄─► Assessment (code question pulls)
```

## ✅ Status

- ✅ Content Studio pathways updated (new payloads + AJAX responses)
- ✅ Assessment integration refreshed (theoretical forwarding + code pulls without hints)
- ✅ Course Builder webhook accepted and acknowledged (fire-and-forget)
- ✅ Learning Analytics receives consolidated competition summaries
- ✅ Legacy Directory, HR Reporting, Learner AI, and Skills Engine integrations removed

DevLab is now aligned with the streamlined microservice architecture and the latest payload expectations. 🎉
