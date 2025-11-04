# Clarifications & Refinements Log

This document maintains a centralized log of all clarifications, adjustments, and refinements made throughout the development process. All entries are organized by feature and categorized by Backend, Frontend, and Database when applicable.

**Important**: This file is append-only. Never modify or delete existing entries. Only append new refinements to ensure traceability and version safety.

---

## Project Foundation Phase - Initial Clarifications

### Feature: Integration Architecture

#### Backend
- **Integration Protocol**: Use REST API as primary communication method, gRPC for two-way communication requirements (competitions, real-time features)
- **No WebSocket**: Do not implement WebSocket - use gRPC or polling for real-time requirements
- **Local Development**: All code must work in localhost environment before deployment considerations

#### Database
- **Dual Database Architecture**: 
  - MongoDB Atlas for operational data (errors, logs, high-volume writes)
  - Supabase (PostgreSQL) for logic data (transactions, relationships, business logic)
- **Environment Variables**: 
  - MongoDB connection: `MONGO_URL`
  - Supabase connection: `SUPABASE_URL`, `SUPABASE_KEY`

### Feature: External API Integration

#### Backend
- **Gemini API Integration**:
  - Generate questions and test cases tailored to data from Content Studio or Assessment
  - Check solutions and return feedback
  - Identify suspicious patterns and cheating
  - Validate trainer-submitted questions
  - Provide 3 hints per question (short, directional, non-revealing)
  - Provide feedback for both correct and incorrect solutions
  - Enable "View Answer" button only after 3 hints are used (learner-initiated)
- **Judge0 API Integration via RapidAPI Free Plan**:
  - Execute code safely in isolated sandboxes
  - Support multiple languages (Python, Java, JavaScript, C++, Go, Rust)
  - Return execution results, errors, and test case outcomes
  - Act as code execution engine for real-time feedback
  - **Integration Method**: Uses RapidAPI's free plan for Judge0
  - **API Endpoint**: `https://judge0-ce.p.rapidapi.com`
  - **Authentication**: Both RapidAPI key and host automatically loaded from Railway Service Variables
    - `x-rapidapi-key`: RapidAPI key (X-RapidAPI-Key header)
    - `x-rapidapi-host`: RapidAPI host (X-RapidAPI-Host header)
  - **No Manual Configuration**: No local .env file needed - both values come directly from Railway Service Variables
  - **Setup**: 
    1. Subscribe to free plan at https://rapidapi.com/judge0-official/api/judge0-ce
    2. Get your RapidAPI key and host from the dashboard
    3. Set both `x-rapidapi-key` and `x-rapidapi-host` in Railway Service Variables (exact variable names)
    4. System automatically uses both values from Railway - no manual configuration required
  - **Error Handling**: 
    - Handles authentication errors (401/403)
    - Handles rate limit errors (429)
    - Handles server errors (500+)
    - Handles network errors gracefully
  - **Implementation**: `backend/src/clients/judge0Client.js`

### Feature: Microservice Integration

#### Backend
- **Course Builder Integration**:
  - Receives: `course_id`, `learner_id` when learner completes course
  - Action: DEVLAB creates competition invitation (stored internally in DEVLAB, not sent to other services)
  - **Communication Pattern**: Fire-and-forget notification - Course Builder sends notification and doesn't wait for or process DEVLAB's response. Course Builder continues its workflow immediately after sending the notification.
- **Content Studio Integration**:
  - Request Type 1 (Practice Question Creation):
    - Receives: `quantity` (e.g., 4), `lesson_id`, `course_name`, `lesson_name`, `nano_skills`, `micro_skills`, `question_type`, `programming_language`
    - Logic: If theoretical → forward to Assessment; If code → create via Gemini
    - Response: AJAX with question, style, test cases, full package
  - Request Type 2 (Trainer Question Validation):
    - Receives: `question`, `lesson_id`, `course_name`, `lesson_name`, `nano_skills`, `micro_skills`, `question_type`, `programming_language` (null if theoretical)
    - Action: Validate relevance using Gemini
- **Assessment Microservice Integration**:
  - Request 1: Creates coding questions for assessments
    - Receives: `topic_name`, `programming_language`, `quantity`, `nano_skills`, `micro_skills`
    - Response: AJAX with question, style, test cases (NO solution - assessment handles checking)
    - Note: Include Judge0 test cases, but hide solution from learner
  - Request 2: Creates theoretical questions (forwarded from Content Studio requests)
    - DEVLAB validates theoretical question solutions with Gemini
- **Learning Analytics Integration**:
  - Sends competition performance data after competition completes
  - Data: `learner1_id`, `learner2_id`, `course_id`, `performance_learner1`, `performance_learner2`, `competition_id`
- **RAG Microservice Integration**:
  - Provides chatbot for customer support

### Feature: Technology Stack

#### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS (user will provide specific styles when needed)
- **Language**: JavaScript ES6 only (no TypeScript)
- **Hosting**: Vercel Cloud
- **Environment Variable**: `VITE_API_URL`

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript ES6 only (no TypeScript)
- **Hosting**: Railway
- **Environment Variables**: `GEMINI_API_KEY`, `MONGO_URL`, `SUPABASE_KEY`, `SUPABASE_URL`

### Feature: Competition System

#### Backend
- Competition invitations are created and stored in DEVLAB (not sent to other microservices)
- Competition pages are managed internally by DEVLAB
- After competition completion, performance data is sent to Learning Analytics

### Feature: UI/UX Design & Styling

#### Frontend
- **Theme System**: Dark Emerald color palette with rich, elegant design
- **Color Palette**:
  - Primary: `--primary-blue: #065f46`, `--primary-purple: #047857`, `--primary-cyan: #0f766e`
  - Accent: `--accent-gold: #d97706`, `--accent-green: #047857`, `--accent-orange: #f59e0b`
  - Background: Light mode (`--bg-primary: #f8fafc`) and Dark mode (`--bg-primary: #0f172a`)
- **Gradient System**: 
  - Primary gradient: `linear-gradient(135deg, #065f46, #047857)`
  - Secondary gradient: `linear-gradient(135deg, #0f766e, #047857)`
  - Accent gradient: `linear-gradient(135deg, #d97706, #f59e0b)`
- **Theme Modes**: Day mode (default) and Night mode with smooth transitions
- **Accessibility Features**:
  - Color blind friendly overrides
  - High contrast mode
  - Large font mode
  - Reduced motion support
  - Focus indicators (3px solid outline with offset)
  - Skip links for keyboard navigation
  - Screen reader support (sr-only class)
  - ARIA live regions
  - Touch target minimums (44px x 44px)
- **Gamification Colors**:
  - XP: `--xp-color: #f59e0b`
  - Level: `--level-color: #047857`
  - Badge: `--badge-color: #10b981`
  - Streak: `--streak-color: #ef4444`
- **Shadow Effects**: 
  - Glow shadow: `0 0 30px rgba(6, 95, 70, 0.3)`
  - Card shadow: `0 10px 40px rgba(0, 0, 0, 0.1)`
  - Hover shadow: `0 20px 60px rgba(6, 95, 70, 0.2)`
- **Responsive Breakpoints**:
  - Ultra-wide: 1920px+
  - Large Desktop: 1400px+
  - Desktop: 1200px-1399px
  - Tablet Landscape: 992px-1199px
  - Tablet Portrait: 768px-991px
  - Mobile Landscape: 576px-767px
  - Mobile Portrait: up to 575px
- **Animation Guidelines**:
  - Smooth transitions (0.3s ease) for theme changes
  - Floating card animations (6s ease-in-out infinite)
  - Background gradient shifts (8s ease-in-out infinite)
  - Particle animations (20s infinite linear)
  - XP glow effects (2s ease-in-out infinite)
  - Pulse animations for interactive elements
  - Respects `prefers-reduced-motion` media query
- **Component Styling Requirements**:
  - Dashboard cards with gradient backgrounds and hover effects
  - User profile avatars with role-based styling (learner, trainer, organization)
  - Gamification elements (XP bars, achievement badges, progress indicators)
  - Microservice cards with icon-based design
  - Floating chatbot widget with notification pulse
  - Accessibility controls panel (fixed position, top-right)
  - Loading animations with spinner
  - Print styles (hide non-essential elements)

#### Design Patterns
- **Card Design**: Gradient backgrounds, border radius 12px-16px, backdrop blur effects
- **Button Styles**: Primary (gradient), Secondary (transparent with border), hover effects with transform
- **Typography**: Inter font family for body, Space Grotesk for headings
- **Layout**: Grid-based responsive layouts, max-width containers (1200px default)
- **Visual Effects**: Subtle background animations, floating particles, glassmorphism effects

---

### Feature: Code Execution & Language Support

#### Backend
- **Judge0 Language Support**: System supports all languages that Judge0 API supports, not limited to a specific subset
- **Dynamic Language Support**: Language capabilities determined by Judge0 API, system must dynamically adapt
- **Language Mapping**: System must map programming language identifiers to Judge0 language IDs correctly

### Feature: Question Generation

#### Backend
- **No Difficulty Input**: System does not accept explicit difficulty level as input parameter
- **Automatic Difficulty Distribution**: Gemini AI automatically distributes difficulty levels from low to high among all generated questions
- **Difficulty Based on Skills**: Difficulty determined by Gemini based on nano_skills and micro_skills complexity
- **Difficulty Progression**: When generating multiple questions, Gemini ensures difficulty progression (easy → medium → hard)

### Feature: Progressive Hint System

#### Backend
- **Single API Call Optimization**: All 3 hints generated in single Gemini API call for performance
- **Hint Caching**: Hints stored immediately after first API call, subsequent requests retrieve from database (no additional API calls)
- **Performance**: Initial hint response < 3 seconds, subsequent hints instant (retrieved from cache)

#### Frontend
- **Progressive Display**: Hints displayed one at a time as user requests them
- **Fast Experience**: User experiences fast initial hint, then instant delivery of hints 2 and 3

### Feature: Competition System

#### Backend
- **Competitor Pool**: System finds multiple matching learners (3-5 potential competitors)
- **Anonymous List**: Learner can view anonymous list of other learners who received same invitation
- **Competitor Selection**: Learner selects preferred competitor from anonymous list
- **Anonymity**: Names and personal information remain completely hidden (only anonymous identifiers shown)

#### Frontend
- **Competitor Selection UI**: 
  - Competition invitation card
  - "View Available Competitors" button
  - Modal/panel showing anonymous competitor list
  - Each competitor shows: anonymous identifier, skill level match, course completion badge, availability status
  - "Select" button for each competitor

### Feature: AI Fraud Detection

#### Backend
- **Automatic Detection**: Fraud detection runs automatically on all code submissions before feedback
- **Gemini Analysis**: Uses Gemini AI to analyze code for AI generation patterns
- **Detection Criteria**: Analyzes code patterns, comments, variable naming, error handling, code completeness, consistency
- **Fraud Score**: Returns score from 0-100% (Low: 0-30%, Medium: 31-60%, High: 61-90%, Very High: 91-100%)
- **Risk-Based Actions**:
  - Low: Normal feedback, no restrictions
  - Medium: Warning, limited feedback, flag for review, log incident
  - High: Restrict submission, limited/disabled feedback, notify instructors, log incident
  - Very High: Block submission, escalate to administrators, require re-attempt
- **Performance**: Detection time < 2 seconds
- **Integration**: Applied to practice questions, competitions, and assessments
- **Privacy**: Learners informed about detection system, false positive handling, appeal process

#### Database
- **Incident Logging**: All fraud detection results stored in MongoDB Atlas for audit trail
- **Score Storage**: Fraud scores stored with each submission record

---

### Feature: Project Structure & Organization

#### Architecture
- **Clear Separation**: Frontend, backend, and test directories completely separated
- **Frontend Location**: `/frontend` directory contains all React/Vite code
- **Backend Location**: `/backend` directory contains all Node.js/Express code
- **Test Location**: `/tests` directory contains all test code (unit, integration, e2e)
- **Organization**: Tests organized by type and layer (frontend/backend)
- **Modularity**: Each feature in separate directory, clear separation between layers
- **Scalability**: Structure supports growth and easy feature addition

---

### Feature: API Integration Classification

#### Backend
- **External APIs**: 
  - Gemini API (external third-party)
  - Judge0 API (external third-party)
- **Internal EduCore Microservices**:
  - Learning Analytics (EduCore platform microservice)
  - RAG Microservice (EduCore platform microservice)
  - Course Builder (EduCore platform microservice)
  - Content Studio (EduCore platform microservice)
  - Assessment (EduCore platform microservice)

### Feature: Frontend UI Pages

#### Frontend
- **Pages**: Only Practice pages and Competition pages (no Dashboard UI)
- **Practice Page**: Main interface for coding practice and exercises
- **Competition Page**: Interface for competition invitations, selection, and execution

### Feature: Fraud Detection Implementation

#### Backend
- **No Separate Table**: No fraud_incidents table required
- **Real-time Detection**: Gemini analyzes code and returns message to learner immediately
- **Score Storage**: Fraud score stored in submissions table for reference only
- **No Incident Tracking**: No incident tracking, resolution workflow, or database storage needed

### Feature: TDD Methodology

#### Testing
- **TDD Approach**: RED-GREEN-REFACTOR cycle enforced for all development
- **Test Organization**: Tests organized by layer (frontend/backend) and type (unit/integration/e2e)
- **Coverage**: > 90% coverage for all services and utilities
- **Testing Tools**: Jest, React Testing Library, Supertest, MSW

---

### Feature: Microservice Rollback Mechanism

#### Backend
- **Automatic Fallback System**: All microservice calls implement automatic rollback to mock data when services fail
- **Error Detection**: System detects and handles:
  - Non-2xx HTTP status codes
  - Network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
  - Timeout errors
  - Malformed response data (invalid JSON, missing required fields)
- **Rollback Triggers**: 
  - HTTP status codes outside 200-299 range
  - Connection refused errors
  - Timeout errors (request exceeds configured timeout)
  - DNS resolution failures
  - JSON parsing errors
  - Missing required fields in response structure
- **Mock Data Fallback**: Each microservice has dedicated mock data that maintains application functionality:
  - **Assessment Microservice**: Mock theoretical questions with proper structure
  - **Learning Analytics**: Mock competition performance acknowledgment
  - **Course Builder**: Mock course completion notification
  - **RAG Microservice**: Mock chatbot response with helpful message
  - **Content Studio**: Mock content validation response
- **Response Validation**: All microservice responses are validated for:
  - Correct HTTP status codes
  - Expected data structure
  - Required field presence
  - Data type correctness
- **Graceful Degradation**: Application continues to function even when multiple microservices are unavailable
- **Logging**: All rollback events are logged with appropriate warning levels for monitoring
- **Implementation Location**:
  - Rollback logic: `backend/src/clients/microserviceClient.js`
  - Mock data definitions: `backend/src/clients/microserviceMocks.js`
- **Benefits**:
  - Zero downtime when microservices fail
  - Improved user experience (no error messages for non-critical failures)
  - Better resilience and fault tolerance
  - Easier local development and testing
  - Clear separation between real and mock responses (via `source: 'mock'` field)

#### Microservice Methods with Rollback:
1. **Assessment Microservice**:
   - `createTheoreticalQuestions()` - Falls back to mock theoretical questions
   - Validates response structure (requires `questions` array and `success` field)
   
2. **Learning Analytics Microservice**:
   - `sendCompetitionPerformance()` - Falls back to mock acknowledgment
   - Non-critical operation (doesn't block user flow)
   
3. **Course Builder Microservice**:
   - `notifyCourseCompletion()` - Falls back to mock notification
   - Non-critical operation (doesn't block user flow)
   
4. **RAG Microservice**:
   - `queryRAG()` - Falls back to mock chatbot response
   - Provides helpful message when service unavailable
   
5. **Content Studio Microservice**:
   - `validateContent()` - Falls back to mock validation response
   - Ensures content validation doesn't block workflows

#### Response Structure:
- All mock responses include `source: 'mock'` field to identify fallback usage
- Mock responses maintain same structure as real responses for compatibility
- All rollback events are logged with context (service name, error type, request data)

---

### Feature: Judge0 RapidAPI Integration (Free Plan)

#### Backend
- **Integration Method**: Judge0 API via RapidAPI Free Plan
- **API Endpoint**: `https://judge0-ce.p.rapidapi.com`
- **Authentication Headers** (both from Railway Service Variables):
  - `X-RapidAPI-Key`: From `x-rapidapi-key` environment variable in Railway
  - `X-RapidAPI-Host`: From `x-rapidapi-host` environment variable in Railway (defaults to `judge0-ce.p.rapidapi.com` if not set)
- **Configuration**:
  - **No Manual .env Required**: Both API key and host automatically loaded from Railway Service Variables
  - **Environment Variables** (set in Railway Service Variables - exact names):
    - `x-rapidapi-key`: Your RapidAPI key (becomes X-RapidAPI-Key header)
    - `x-rapidapi-host`: RapidAPI host (becomes X-RapidAPI-Host header), defaults to `judge0-ce.p.rapidapi.com` if not set
  - **Automatic Loading**: System reads both values from Railway automatically using exact variable names
- **Setup Steps**:
  1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
  2. Subscribe to the **Free Plan** (no credit card required for basic free tier)
  3. Get your RapidAPI key and host from the dashboard
  4. Set in Railway Service Variables (use exact variable names):
     - `x-rapidapi-key`: Your RapidAPI key
     - `x-rapidapi-host`: Your RapidAPI host (e.g., `judge0-ce.p.rapidapi.com`)
  5. System automatically uses both values - no code changes or manual configuration needed
- **Main Function**: `executeCode(code, programming_language, test_cases, question_id)`
  - Creates code submission in Judge0 sandbox
  - Polls for execution results
  - Returns formatted execution results with test case outcomes
- **Supported Languages**:
  - Python (language_id: 92)
  - Java (language_id: 91)
  - JavaScript (language_id: 93)
  - C++ (language_id: 54)
  - Go (language_id: 95)
  - Rust (language_id: 73)
  - And all other languages supported by Judge0
- **Error Handling**:
  - **401/403 Errors**: Authentication failed - prompts to check RapidAPI key in Railway
  - **429 Errors**: Rate limit exceeded - suggests retrying later
  - **500+ Errors**: Server errors - suggests retrying later
  - **Network Errors**: Connection issues - provides clear error messages
  - **Timeout Handling**: Polling mechanism with max attempts (10 attempts, 1 second intervals)
- **Response Format**:
  ```javascript
  {
    status: "Accepted",
    status_id: 3,
    stdout: "...",
    stderr: "",
    compile_output: "",
    time: "0.100",
    memory: 1024,
    test_case_results: [...],
    is_correct: true
  }
  ```
- **Benefits**:
  - ✅ Free tier available (no subscription cost for basic usage)
  - ✅ No manual configuration needed - key comes from Railway
  - ✅ Secure sandboxed execution environment
  - ✅ Supports all major programming languages
  - ✅ Automatic polling for results
  - ✅ Comprehensive error handling
- **Implementation Location**: `backend/src/clients/judge0Client.js`
- **Configuration Location**: `backend/src/config/environment.js` (reads from Railway env vars)

---

**Last Updated**: Deployment Handover Phase  
**Status**: ✅ All Phases Complete - Ready for Localhost Testing
