# System Architecture & Technical Design - DEVLAB Microservice

## Executive Summary

This document defines the complete system architecture for the DEVLAB Microservice, including technology stack selection, database design, API specifications, security architecture, infrastructure planning, and project structure with clear separation between frontend, backend, and test directories.

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         EduCore AI Platform                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Course Builder│  │Content Studio│  │  Assessment  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │   DEVLAB     │  │Learning      │  │    RAG       │          │
│  │  Microservice│  │Analytics     │  │ Microservice  │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                         │
│         └─────────────────────────────────────────┐             │
│                                                     │             │
└─────────────────────────────────────────────────────┼─────────────┘
                                                      │
         ┌───────────────────────────────────────────┼─────────────┐
         │                                           │             │
    ┌────▼─────┐                              ┌─────▼─────┐       │
    │  Gemini  │                              │  Judge0  │       │
    │   API    │                              │   API    │       │
    │(External)│                              │(External)│       │
    └──────────┘                              └──────────┘       │
                                                                   │
```

### DEVLAB Internal Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DEVLAB Microservice                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (Vite + React)            │  │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │   Practice   │  │ Competition  │                  │  │
│  │  │   Interface  │  │  Interface   │                  │  │
│  │  └──────┬───────┘  └──────┬───────┘                  │  │
│  └─────────┼──────────────────┼──────────────────────────┘  │
│            │                  │                │            │
│            └──────────────────┼────────────────┘            │
│                               │                              │
│  ┌────────────────────────────▼──────────────────────────┐  │
│  │              BACKEND (Node.js + Express)              │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Question   │  │    Code     │  │ Competition │   │  │
│  │  │  Generator  │  │  Execution  │  │   Manager   │   │  │
│  │  │   Service   │  │   Service   │  │   Service   │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │  │
│  │         │                │                 │           │  │
│  │  ┌──────▼──────────┐  ┌──▼──────┐  ┌──────▼──────┐   │  │
│  │  │  Feedback &     │  │ Fraud   │  │ Integration │   │  │
│  │  │  Hint Service   │  │Detection│  │   Service   │   │  │
│  │  └─────────────────┘  └─────────┘  └─────────────┘   │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │           External & Internal API Integrations     │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │  │
│  │  │  │  Gemini  │  │  Judge0  │  │EduCore Micros│ │   │  │
│  │  │  │  Client  │  │  Client  │  │ervice Client │ │   │  │
│  │  │  │(External)│  │(External)│  │(Internal)    │ │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────────┘ │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                               │                                │
│  ┌────────────────────────────▼──────────────────────────────┐ │
│  │                      DATA LAYER                            │ │
│  │  ┌──────────────┐              ┌──────────────┐         │ │
│  │  │  Supabase    │              │ MongoDB Atlas │         │ │
│  │  │(PostgreSQL)  │              │  (Operational)│         │ │
│  │  │  Logic Data  │              │ Errors & Logs │         │ │
│  │  └──────────────┘              └──────────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              TEST SUITE (TDD Methodology)               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │  │   Unit   │  │Integration│  │    E2E   │              │ │
│  │  │   Tests  │  │   Tests   │  │   Tests  │              │ │
│  │  │ (TDD)    │  │  (TDD)    │  │  (TDD)   │              │ │
│  │  └──────────┘  └──────────┘  └──────────┘              │ │
│  │                                                           │ │
│  │  RED → GREEN → REFACTOR cycle enforced for all tests   │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Justification

### Frontend Technology Stack

**Framework: React 18+**
- **Rationale**: Industry standard, large ecosystem, excellent performance, component-based architecture
- **Justification**: 
  - Mature and stable
  - Extensive library ecosystem
  - Strong TypeScript/JavaScript support
  - Excellent developer experience
  - Virtual DOM for efficient rendering

**Build Tool: Vite**
- **Rationale**: Fast development server, instant HMR, optimized production builds
- **Justification**:
  - Significantly faster than Create React App
  - Native ES modules support
  - Optimized production builds
  - Better developer experience

**Styling: Tailwind CSS**
- **Rationale**: Utility-first CSS framework, rapid UI development, consistent design system
- **Justification**:
  - Matches provided design system
  - Rapid development
  - Small production bundle size
  - Easy theme customization (day/night mode)
  - Responsive design utilities

**Language: JavaScript ES6+**
- **Rationale**: No TypeScript as per requirements, modern ES6+ features
- **Justification**:
  - Async/await for API calls
  - Destructuring for cleaner code
  - Arrow functions
  - Modules (import/export)
  - Template literals

**State Management: React Context API + Custom Hooks**
- **Rationale**: Built-in solution, no external dependencies needed for moderate complexity
- **Justification**:
  - Lightweight for this use case
  - No additional library needed
  - Sufficient for global state (theme, auth, user data)
  - Can scale to Redux if needed later

**HTTP Client: Axios**
- **Rationale**: Promise-based, interceptors, automatic JSON handling
- **Justification**:
  - Better than fetch API
  - Request/response interceptors
  - Automatic JSON parsing
  - Error handling
  - Request cancellation

**Code Editor: Monaco Editor or CodeMirror**
- **Rationale**: Syntax highlighting for multiple languages
- **Justification**:
  - Monaco: VS Code's editor, excellent language support
  - CodeMirror: Lightweight alternative
  - Both support multiple languages
  - Theme support (day/night mode)

---

### Backend Technology Stack

**Runtime: Node.js 18+**
- **Rationale**: JavaScript runtime, non-blocking I/O, excellent for microservices
- **Justification**:
  - Single language (JavaScript) for full stack
  - Fast I/O operations
  - Large ecosystem
  - Microservice-friendly
  - Excellent for API development

**Framework: Express.js**
- **Rationale**: Minimal, flexible, extensive middleware ecosystem
- **Justification**:
  - Industry standard
  - Lightweight and fast
  - Middleware support (CORS, body-parser, etc.)
  - RESTful API development
  - Easy to learn and maintain

**Language: JavaScript ES6+**
- **Rationale**: Consistent with frontend, no TypeScript per requirements
- **Justification**:
  - Single codebase language
  - Modern async features
  - ES6 modules support
  - Clean, readable code

**Database Clients:**
- **Supabase Client**: PostgreSQL connection for logic data
- **MongoDB Driver**: Native MongoDB driver for operational data

**HTTP Client: Axios**
- **Rationale**: External API calls (Gemini, Judge0) and Internal EduCore microservice calls
- **Justification**: 
  - External APIs: Gemini (external), Judge0 (external)
  - Internal APIs: Learning Analytics (EduCore), RAG (EduCore), Course Builder, Content Studio, Assessment
  - Unified client for all HTTP requests

**Validation: Joi or Express-validator**
- **Rationale**: Input validation and sanitization
- **Justification**:
  - Security best practice
  - Prevents invalid data
  - Clear error messages

**Authentication: jsonwebtoken**
- **Rationale**: JWT token validation for microservice communication
- **Justification**:
  - Stateless authentication
  - Industry standard
  - Secure token verification

---

### Database Technology Stack

**Primary Database: Supabase (PostgreSQL)**
- **Purpose**: Transactional/relational logic data
- **Rationale**: 
  - ACID compliance for transactions
  - Relational data integrity
  - Complex queries
  - Foreign key constraints
  - User data, questions, competitions, submissions
- **Justification**:
  - Production-ready PostgreSQL
  - Managed service (reduces DevOps)
  - Row Level Security (RLS)
  - RESTful API auto-generated
  - Real-time subscriptions (if needed)

**Operational Database: MongoDB Atlas**
- **Purpose**: High-volume operational data
- **Rationale**:
  - Document store for logs and errors
  - High write throughput
  - Flexible schema
  - Operational analytics
- **Justification**:
  - Scales for log storage
  - Flexible for varying log formats
  - Fast writes
  - Cloud-managed
  - Automatic backups

---

## Database Design

### Supabase (PostgreSQL) Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    skill_level INTEGER DEFAULT 1,
    role VARCHAR(50) DEFAULT 'learner', -- learner, trainer, admin
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Courses Table
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(255) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Lessons Table
```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id VARCHAR(255) UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id),
    lesson_name VARCHAR(255) NOT NULL,
    nano_skills TEXT[], -- Array of nano skills
    micro_skills TEXT[], -- Array of micro skills
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Questions Table
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id VARCHAR(255) UNIQUE NOT NULL,
    lesson_id UUID REFERENCES lessons(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'code' or 'theoretical'
    programming_language VARCHAR(50),
    difficulty VARCHAR(50), -- 'easy', 'medium', 'hard' (auto-generated by Gemini)
    test_cases JSONB, -- Array of test cases
    hints JSONB, -- Array of 3 hints [hint1, hint2, hint3]
    solution TEXT, -- Generated solution (hidden until hints used)
    style JSONB, -- Style metadata (tags, estimated_time, etc.)
    created_by VARCHAR(255), -- 'system' or trainer_id
    validation_status VARCHAR(50) DEFAULT 'pending', -- For trainer questions
    relevance_score INTEGER,
    quality_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Submissions Table
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(255) UNIQUE NOT NULL,
    question_id UUID REFERENCES questions(id),
    learner_id UUID REFERENCES users(id),
    code TEXT NOT NULL,
    programming_language VARCHAR(50) NOT NULL,
    execution_results JSONB, -- Judge0 execution results
    is_correct BOOLEAN DEFAULT FALSE,
    feedback TEXT, -- Gemini-generated feedback
    fraud_score INTEGER, -- 0-100 AI fraud detection score
    fraud_level VARCHAR(50), -- 'low', 'medium', 'high', 'very_high'
    hints_used INTEGER DEFAULT 0, -- Number of hints used (0-3)
    solution_viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Competitions Table
```sql
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id VARCHAR(255) UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id),
    learner1_id UUID REFERENCES users(id),
    learner2_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed'
    questions JSONB, -- Array of 3 question IDs
    learner1_solutions JSONB, -- Solutions for learner1
    learner2_solutions JSONB, -- Solutions for learner2
    winner_id UUID REFERENCES users(id),
    performance_data JSONB, -- Performance metrics for both learners
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

#### Competition Invitations Table
```sql
CREATE TABLE competition_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id VARCHAR(255) UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id),
    learner_id UUID REFERENCES users(id),
    potential_competitors JSONB, -- Array of {competitor_id, anonymous_id, skill_level, available}
    selected_competitor_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

#### Note: Fraud Detection
- **No separate fraud_incidents table required**
- Fraud detection is real-time: Gemini analyzes code and returns message to learner
- Fraud score stored in `submissions` table for reference
- No incident tracking or resolution workflow needed

#### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_submissions_learner_id ON submissions(learner_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);
CREATE INDEX idx_questions_lesson_id ON questions(lesson_id);
CREATE INDEX idx_competitions_course_id ON competitions(course_id);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competition_invitations_learner_id ON competition_invitations(learner_id);
CREATE INDEX idx_submissions_fraud_score ON submissions(fraud_score);
```

---

### MongoDB Atlas Collections

#### Error Logs Collection
```javascript
{
  _id: ObjectId,
  level: String, // 'error', 'warning', 'info'
  message: String,
  stack: String,
  context: {
    endpoint: String,
    method: String,
    userId: String,
    requestId: String
  },
  timestamp: Date,
  metadata: Object
}
```

#### API Request Logs Collection
```javascript
{
  _id: ObjectId,
  endpoint: String,
  method: String,
  statusCode: Number,
  responseTime: Number,
  userId: String,
  timestamp: Date,
  requestBody: Object,
  responseBody: Object
}
```

#### External API Calls Collection
```javascript
{
  _id: ObjectId,
  api_name: String, // 'gemini', 'judge0', 'course_builder', etc.
  endpoint: String,
  method: String,
  statusCode: Number,
  responseTime: Number,
  requestPayload: Object,
  responsePayload: Object,
  error: Object,
  timestamp: Date
}
```

---

## API Definitions

### REST API Endpoints

#### Question Generation Endpoints

**POST /api/questions/generate**
- **Description**: Generate practice questions
- **Request Body**:
```json
{
  "quantity": 4,
  "lesson_id": "lesson_123",
  "course_name": "Python Fundamentals",
  "lesson_name": "Variables and Data Types",
  "nano_skills": ["variable_declaration", "data_types"],
  "micro_skills": ["python_basics", "programming_fundamentals"],
  "question_type": "code",
  "programming_language": "Python"
}
```
- **Response**:
```json
{
  "success": true,
  "questions": [
    {
      "question_id": "q_123",
      "question_text": "...",
      "test_cases": [...],
      "programming_language": "Python",
      "style": {
        "difficulty": "easy",
        "tags": [...],
        "estimated_time": 15
      }
    }
  ]
}
```

**POST /api/questions/validate**
- **Description**: Validate trainer-submitted question
- **Request Body**:
```json
{
  "question": "...",
  "lesson_id": "lesson_123",
  "course_name": "...",
  "lesson_name": "...",
  "nano_skills": [...],
  "micro_skills": [...],
  "question_type": "code",
  "programming_language": "Python"
}
```
- **Response**:
```json
{
  "is_valid": true,
  "relevance_score": 85,
  "quality_score": 90,
  "feedback": "...",
  "suggestions": [...],
  "issues": [...]
}
```

#### Code Execution Endpoints

**POST /api/code/execute**
- **Description**: Execute code in Judge0 sandbox
- **Request Body**:
```json
{
  "code": "def hello(): print('Hello')",
  "programming_language": "Python",
  "test_cases": [...],
  "question_id": "q_123"
}
```
- **Response**:
```json
{
  "success": true,
  "execution_id": "exec_123",
  "results": {
    "status": "success",
    "output": "...",
    "test_case_results": [...],
    "execution_time": 1.2
  }
}
```

#### Feedback and Hints Endpoints

**POST /api/feedback/generate**
- **Description**: Generate AI feedback for solution
- **Request Body**:
```json
{
  "code": "...",
  "question_context": {...},
  "execution_results": {...},
  "is_correct": true
}
```
- **Response**:
```json
{
  "feedback": "...",
  "suggestions": [...],
  "improvements": [...]
}
```

**POST /api/hints/generate**
- **Description**: Generate all 3 hints for a question (single API call)
- **Request Body**:
```json
{
  "question_id": "q_123",
  "question_context": {...}
}
```
- **Response**:
```json
{
  "hints": [
    "Hint 1: Think about the data structure...",
    "Hint 2: Consider using a loop...",
    "Hint 3: You might want to check the edge cases..."
  ]
}
```

**GET /api/hints/:question_id/:hint_number**
- **Description**: Retrieve specific hint (from cache)
- **Response**:
```json
{
  "hint_number": 1,
  "hint_text": "..."
}
```

#### Competition Endpoints

**POST /api/competitions/invite**
- **Description**: Create competition invitation (from Course Builder)
- **Request Body**:
```json
{
  "course_id": "course_123",
  "learner_id": "learner_456"
}
```
- **Response**:
```json
{
  "success": true,
  "invitation_id": "inv_789",
  "potential_competitors": [
    {
      "anonymous_id": "Competitor #1",
      "skill_level": 5,
      "available": true
    }
  ]
}
```

**GET /api/competitions/invitations/:learner_id**
- **Description**: Get pending invitations for learner
- **Response**:
```json
{
  "invitations": [
    {
      "invitation_id": "inv_789",
      "course_name": "...",
      "potential_competitors": [...]
    }
  ]
}
```

**POST /api/competitions/select-competitor**
- **Description**: Learner selects competitor from list
- **Request Body**:
```json
{
  "invitation_id": "inv_789",
  "selected_competitor_anonymous_id": "Competitor #1"
}
```

**POST /api/competitions/:competition_id/submit**
- **Description**: Submit solution in competition
- **Request Body**:
```json
{
  "question_id": "q_123",
  "code": "...",
  "programming_language": "Python"
}
```

#### Fraud Detection Endpoints

**POST /api/fraud/detect**
- **Description**: Detect AI fraud in code submission
- **Request Body**:
```json
{
  "code": "...",
  "learner_id": "learner_456",
  "question_id": "q_123"
}
```
- **Response**:
```json
{
  "fraud_score": 25,
  "fraud_level": "low",
  "detection_details": {...},
  "action": "proceed"
}
```

---

## Project Structure

### Root Directory Structure

```
DevLab/
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/           # API services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── contexts/           # Context providers
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # Global styles
│   │   └── App.jsx              # Main App component
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── .env.local               # Frontend environment variables
│
├── backend/                     # Backend application
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── services/           # Business logic services
│   │   ├── models/             # Data models
│   │   ├── routes/              # Express routes
│   │   ├── middleware/          # Express middleware
│   │   ├── utils/               # Utility functions
│   │   ├── config/              # Configuration files
│   │   ├── clients/             # External API clients
│   │   │   ├── geminiClient.js
│   │   │   ├── judge0Client.js
│   │   │   └── microserviceClient.js
│   │   ├── database/            # Database connection and setup
│   │   │   ├── supabase.js
│   │   │   └── mongodb.js
│   │   └── app.js               # Express app setup
│   ├── package.json
│   ├── .env                      # Backend environment variables
│   └── server.js                # Server entry point
│
├── tests/                        # Test suite (TDD Methodology)
│   ├── unit/                     # Unit tests (TDD)
│   │   ├── frontend/
│   │   │   ├── components/       # Component tests (RED-GREEN-REFACTOR)
│   │   │   ├── services/         # Service tests (TDD)
│   │   │   └── utils/            # Utility tests (TDD)
│   │   └── backend/
│   │       ├── controllers/      # Controller tests (TDD)
│   │       ├── services/         # Service tests (TDD)
│   │       └── utils/         # Utility tests (TDD)
│   ├── integration/             # Integration tests (TDD)
│   │   ├── api/                  # API integration tests
│   │   ├── database/             # Database integration tests
│   │   └── external-apis/        # External API integration tests
│   ├── e2e/                      # End-to-end tests (TDD)
│   │   ├── practice-flow.spec.js
│   │   ├── competition-flow.spec.js
│   │   └── fraud-detection.spec.js
│   ├── fixtures/                # Test fixtures and mocks
│   ├── setup/                    # Test setup files
│   └── jest.config.js            # Jest configuration
│
├── docs/                         # Documentation
│   ├── API.md                    # API documentation
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── DEVELOPMENT.md            # Development guide
│
├── .github/                      # GitHub workflows
│   └── workflows/
│       ├── ci-cd.yml
│       └── tests.yml
│
├── PROJECT_FOUNDATION.md         # Phase 1 deliverable
├── REQUIREMENTS_DISCOVERY.md    # Phase 2 deliverable
├── ARCHITECTURE_DESIGN.md        # Phase 3 deliverable (this file)
├── clarificationsAndRefinements.md
├── README.md
└── .gitignore
```

### Frontend Structure (Detailed)

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/               # Reusable components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   ├── Loading/
│   │   │   └── ErrorBoundary/
│   │   ├── practice/             # Practice-related components
│   │   │   ├── CodeEditor/
│   │   │   ├── QuestionCard/
│   │   │   ├── TestCaseResults/
│   │   │   ├── FeedbackPanel/
│   │   │   └── HintButton/
│   │   ├── competition/          # Competition components
│   │   │   ├── CompetitionInvitation/
│   │   │   ├── CompetitorList/
│   │   │   ├── CompetitionRoom/
│   │   │   └── CompetitionResults/
│   │   ├── layout/                # Layout components
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── ThemeToggle/
│   │   └── accessibility/         # Accessibility components
│   │       ├── AccessibilityControls/
│   │       └── SkipLink/
│   │
│   ├── pages/
│   │   ├── PracticePage.jsx
│   │   ├── CompetitionPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── services/
│   │   ├── api.js                # API client setup
│   │   ├── questionService.js
│   │   ├── codeExecutionService.js
│   │   ├── feedbackService.js
│   │   ├── competitionService.js
│   │   └── fraudDetectionService.js
│   │
│   ├── hooks/
│   │   ├── useTheme.js
│   │   ├── useAuth.js
│   │   ├── useQuestions.js
│   │   ├── useCompetition.js
│   │   └── useCodeExecution.js
│   │
│   ├── contexts/
│   │   ├── ThemeContext.js
│   │   ├── AuthContext.js
│   │   └── UserContext.js
│   │
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── formatters.js
│   │
│   ├── styles/
│   │   ├── globals.css           # Global styles
│   │   ├── themes.css            # Theme variables
│   │   └── components.css        # Component styles
│   │
│   └── App.jsx
│
├── public/
│   ├── index.html
│   └── assets/
│       ├── images/
│       └── icons/
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.local
```

### Backend Structure (Detailed)

```
backend/
├── src/
│   ├── controllers/
│   │   ├── questionController.js
│   │   ├── codeExecutionController.js
│   │   ├── feedbackController.js
│   │   ├── competitionController.js
│   │   ├── fraudDetectionController.js
│   │   └── healthController.js
│   │
│   ├── services/
│   │   ├── questionService.js
│   │   ├── codeExecutionService.js
│   │   ├── feedbackService.js
│   │   ├── hintService.js
│   │   ├── competitionService.js
│   │   ├── fraudDetectionService.js
│   │   └── matchingService.js
│   │
│   ├── models/
│   │   ├── Question.js
│   │   ├── Submission.js
│   │   ├── Competition.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── questionRoutes.js
│   │   ├── codeExecutionRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── competitionRoutes.js
│   │   ├── fraudRoutes.js
│   │   └── index.js
│   │
│   ├── middleware/
│   │   ├── auth.js                # Authentication middleware
│   │   ├── validation.js          # Request validation
│   │   ├── errorHandler.js        # Error handling
│   │   ├── rateLimiter.js         # Rate limiting
│   │   └── cors.js                # CORS configuration
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── validators.js
│   │   └── helpers.js
│   │
│   ├── config/
│   │   ├── environment.js         # Environment configuration
│   │   ├── database.js            # Database configuration
│   │   └── constants.js
│   │
│   ├── clients/
│   │   ├── geminiClient.js        # Gemini API client
│   │   ├── judge0Client.js        # Judge0 API client
│   │   └── microserviceClient.js  # Microservice HTTP client
│   │
│   ├── database/
│   │   ├── supabase.js            # Supabase connection
│   │   ├── mongodb.js             # MongoDB connection
│   │   └── migrations/            # Database migrations
│   │
│   └── app.js                     # Express app
│
├── package.json
├── .env
└── server.js                      # Entry point
```

### Test Structure (Detailed)

```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   │   ├── CodeEditor.test.jsx
│   │   │   ├── QuestionCard.test.jsx
│   │   │   └── CompetitionInvitation.test.jsx
│   │   ├── services/
│   │   │   ├── questionService.test.js
│   │   │   └── codeExecutionService.test.js
│   │   └── hooks/
│   │       ├── useQuestions.test.js
│   │       └── useCompetition.test.js
│   │
│   └── backend/
│       ├── controllers/
│       │   ├── questionController.test.js
│       │   └── competitionController.test.js
│       ├── services/
│       │   ├── questionService.test.js
│       │   ├── fraudDetectionService.test.js
│       │   └── matchingService.test.js
│       └── utils/
│           └── validators.test.js
│
├── integration/
│   ├── api/
│   │   ├── questionRoutes.test.js
│   │   ├── competitionRoutes.test.js
│   │   └── fraudRoutes.test.js
│   ├── database/
│   │   ├── supabase.test.js
│   │   └── mongodb.test.js
│   └── external-apis/
│       ├── geminiIntegration.test.js
│       └── judge0Integration.test.js
│
├── e2e/
│   ├── practice-flow.spec.js      # Complete practice flow
│   ├── competition-flow.spec.js   # Complete competition flow
│   ├── fraud-detection.spec.js    # Fraud detection flow
│   └── hint-system.spec.js        # Hint system flow
│
├── fixtures/
│   ├── questions.json
│   ├── users.json
│   └── competitions.json
│
├── setup/
│   ├── testSetup.js               # Test environment setup
│   ├── mockData.js                # Mock data generators
│   └── mockApis.js                # API mocks
│
└── jest.config.js
```

---

## Security Architecture

### Authentication & Authorization

**Microservice Authentication**:
- API keys stored in environment variables
- Service-to-service authentication via JWT tokens
- Request validation and signature verification

**User Authentication**:
- Handled by EduCore platform (not DEVLAB responsibility)
- DEVLAB receives authenticated user context from platform
- User identity passed via JWT tokens in request headers

### Input Validation

**Request Validation**:
- All inputs validated using Joi or express-validator
- Sanitization of user-provided code
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- Command injection prevention (code execution in sandbox only)

### Code Execution Security

**Judge0 Sandbox**:
- Complete isolation from server
- Resource limits (time, memory, CPU)
- Network access restrictions
- File system restrictions
- Automatic timeout handling

### API Security

**CORS Configuration**:
- Whitelist of allowed origins
- Credentials support for authenticated requests
- Proper headers configuration

**Rate Limiting**:
- Per-IP rate limiting
- Per-user rate limiting
- API endpoint-specific limits
- Exponential backoff for retries

### Data Privacy

**Anonymization**:
- Competition data fully anonymized
- No PII in logs or analytics
- Anonymous identifiers for competitors

**Encryption**:
- HTTPS/TLS for all communications
- Encrypted database connections
- Encrypted secrets storage

---

## Infrastructure Design

### Cloud Architecture

**Frontend Hosting: Vercel**
- CDN distribution
- Automatic SSL
- Edge functions support
- Environment variable management
- Domain: https://dev-lab-phi.vercel.app/

**Backend Hosting: Railway**
- Auto-scaling containers
- Environment variable management
- Database connections
- Domain: devlab-backend-production.up.railway.app

**Database Hosting**:
- Supabase: Managed PostgreSQL
- MongoDB Atlas: Managed MongoDB

### Deployment Strategy

**Development Environment**:
- Local development with hot reload
- Environment variables in .env files
- Local database connections for testing

**Staging Environment**:
- Automated deployment on branch push
- Staging databases
- Test environment variables

**Production Environment**:
- Automated deployment on main branch
- Production databases
- Production environment variables
- Health check monitoring

### Monitoring & Observability

**Logging**:
- Application logs → MongoDB Atlas
- Error logs → MongoDB Atlas
- External API call logs → MongoDB Atlas
- Request/response logs → MongoDB Atlas

**Monitoring**:
- Health check endpoints
- Uptime monitoring
- Performance metrics
- Error rate tracking

---

## Data Quality & Validation

### Validation Rules

**Question Validation**:
- Required fields validation
- Skill alignment validation
- Language compatibility
- Test case completeness

**Code Validation**:
- Syntax validation (pre-execution)
- Size limits (max file size)
- Language verification
- Malicious code detection

**Competition Validation**:
- Participant matching validation
- Question generation validation
- Solution submission validation
- Winner determination validation

---

## AI/Automation Enhancements

### Intelligent Question Generation
- AI analyzes skill requirements
- Difficulty distribution automation
- Test case generation automation
- Quality validation automation

### Smart Feedback System
- Context-aware feedback generation
- Error pattern recognition
- Personalized improvement suggestions
- Progressive hint optimization

### Fraud Detection Automation
- Automatic pattern recognition
- Risk scoring automation
- Action enforcement automation
- Incident logging automation

---

## Folder Organization Principles

### Separation of Concerns

1. **Frontend** (`/frontend`):
   - All UI-related code
   - React components and pages
   - Client-side logic
   - Styling and theming

2. **Backend** (`/backend`):
   - All server-side code
   - API endpoints
   - Business logic
   - External API integrations (Gemini, Judge0)
   - Internal EduCore microservice integrations (Learning Analytics, RAG, Course Builder, Content Studio, Assessment)

3. **Tests** (`/tests`):
   - All test code
   - Organized by type (unit, integration, e2e)
   - Organized by layer (frontend, backend)
   - Test fixtures and mocks

### Modularity

- Each module/feature in separate directory
- Clear separation between layers
- Reusable components/services
- Easy to locate and modify code

### Scalability

- Structure supports growth
- Easy to add new features
- Clear organization patterns
- Consistent naming conventions

---

## Validation Checkpoint

✅ **Architecture Diagrams**: High-level and component diagrams provided  
✅ **Technology Stack**: All technologies justified with rationale  
✅ **Database Design**: Complete schema for Supabase and MongoDB  
✅ **API Definitions**: All REST endpoints specified with request/response formats  
✅ **Security Architecture**: Authentication, authorization, and security measures defined  
✅ **Infrastructure Plan**: Cloud hosting, deployment, and monitoring strategy  
✅ **Project Structure**: Clear separation of frontend, backend, and test directories  
✅ **Folder Organization**: Principles and organization patterns defined  
✅ **Data Quality**: Validation rules and governance strategies  
✅ **AI Enhancements**: Automation opportunities identified  

---

## Testing Strategy (TDD Methodology)

### Test-Driven Development Approach

**RED-GREEN-REFACTOR Cycle**:
1. **RED**: Write failing tests first (before implementation)
2. **GREEN**: Write minimal code to make tests pass
3. **REFACTOR**: Optimize code while maintaining passing tests

### Test Coverage Requirements

- **Unit Tests**: > 90% coverage for all services and utilities
- **Integration Tests**: All API endpoints and database operations
- **E2E Tests**: Complete user flows (practice, competition, fraud detection)

### Testing Tools

- **Jest**: Primary testing framework
- **React Testing Library**: Frontend component testing
- **Supertest**: API endpoint testing
- **MSW (Mock Service Worker)**: API mocking for tests

### Test Organization

- Tests organized by layer (frontend/backend)
- Tests organized by type (unit/integration/e2e)
- Clear naming conventions: `*.test.js` or `*.spec.js`
- Test fixtures and mocks in dedicated directories

---

**Document Status**: ✅ Complete - Ready for Stakeholder Approval  
**Created**: Architecture Design Phase Deliverable  
**Next Phase**: Feature Planning & Component Breakdown

**IMPORTANT**: Please review and approve this architecture before proceeding to implementation.

