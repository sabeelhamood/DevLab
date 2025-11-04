# Feature Planning & Component Breakdown - DEVLAB Microservice

## Executive Summary

This document decomposes all DEVLAB features into actionable components, maps dependencies, estimates tasks, plans sprints, maps user journeys, and generates TDD-ready specifications. Features are prioritized, dependencies resolved, and a comprehensive development roadmap is provided.

---

## Feature Specifications

### Feature 1: Question Generation System

#### F1.1: Dynamic Coding Question Generation

**Description**: Generate coding questions dynamically using Gemini AI based on lesson context, skills, and programming language.

**Components**:
1. **Frontend Component**: `QuestionGenerationForm`
   - Input fields: lesson_id, course_name, lesson_name, nano_skills, micro_skills, question_type, programming_language, quantity
   - Form validation
   - Loading states
   - Error handling

2. **Backend Service**: `questionService.js`
   - Request validation
   - Gemini API integration
   - Question formatting
   - Response formatting

3. **Backend Controller**: `questionController.js`
   - Route handler for `/api/questions/generate`
   - Request/response handling
   - Error handling

4. **External Integration**: `geminiClient.js`
   - Gemini API client
   - Prompt formatting
   - Response parsing

**Acceptance Criteria**:
- ✅ Questions generated based on all input parameters
- ✅ Difficulty automatically distributed (low to high)
- ✅ Test cases included in response
- ✅ Response time < 5 seconds
- ✅ Error handling for API failures

**TDD Test Specifications**:
- Test question generation with valid inputs
- Test automatic difficulty distribution
- Test Gemini API integration
- Test error handling
- Test response format validation

**Dependencies**:
- Gemini API access
- Supabase database (for storing generated questions)
- Frontend form component

**Estimated Effort**: 8 story points

---

#### F1.2: Theoretical Question Routing

**Description**: Route theoretical question requests to Assessment microservice.

**Components**:
1. **Backend Service**: `questionService.js` (theoretical routing logic)
   - Request type detection
   - Assessment microservice client call
   - Response forwarding

2. **Backend Integration**: `microserviceClient.js`
   - Assessment microservice API client
   - Request/response handling
   - Error handling

**Acceptance Criteria**:
- ✅ Theoretical requests correctly identified
- ✅ Requests forwarded to Assessment
- ✅ Response returned to Content Studio
- ✅ Error handling for Assessment unavailability

**TDD Test Specifications**:
- Test theoretical question routing
- Test Assessment microservice integration
- Test error handling

**Dependencies**:
- Assessment microservice API
- Question generation service

**Estimated Effort**: 3 story points

---

### Feature 2: Code Execution System

#### F2.1: Secure Code Execution

**Description**: Execute user-submitted code in Judge0 sandbox securely.

**Components**:
1. **Frontend Component**: `CodeEditor`
   - Monaco Editor or CodeMirror integration
   - Syntax highlighting for multiple languages
   - Code submission handling
   - Execution result display

2. **Frontend Component**: `ExecutionResults`
   - Display execution output
   - Display test case results
   - Error display (compilation, runtime)
   - Loading states

3. **Backend Service**: `codeExecutionService.js`
   - Code validation
   - Judge0 API integration
   - Result parsing
   - Error handling

4. **Backend Controller**: `codeExecutionController.js`
   - Route handler for `/api/code/execute`
   - Request/response handling

5. **External Integration**: `judge0Client.js`
   - Judge0 API client
   - Language ID mapping
   - Execution request formatting
   - Result polling

**Acceptance Criteria**:
- ✅ Code executes in Judge0 sandbox
- ✅ Supports all Judge0-supported languages
- ✅ Execution results correctly parsed
- ✅ Errors captured and displayed
- ✅ Timeout handling

**TDD Test Specifications**:
- Test code execution for multiple languages
- Test compilation error handling
- Test runtime error handling
- Test timeout handling
- Test Judge0 API integration

**Dependencies**:
- Judge0 API access
- Code editor component
- Frontend submission handling

**Estimated Effort**: 10 story points

---

#### F2.2: Syntax Highlighting

**Description**: Provide syntax highlighting for all supported programming languages.

**Components**:
1. **Frontend Component**: `CodeEditor` (syntax highlighting)
   - Language detection
   - Theme support (day/night mode)
   - Real-time highlighting

2. **Frontend Utility**: `languageMapping.js`
   - Judge0 language ID to editor language mapping
   - Language configuration

**Acceptance Criteria**:
- ✅ Syntax highlighting for all Judge0-supported languages
- ✅ Theme-compatible (day/night mode)
- ✅ Real-time updates
- ✅ No performance lag

**TDD Test Specifications**:
- Test language detection
- Test theme switching
- Test highlighting accuracy

**Dependencies**:
- Code editor library (Monaco/CodeMirror)
- Language mapping utility

**Estimated Effort**: 3 story points

---

### Feature 3: Intelligent Feedback System

#### F3.1: AI-Generated Feedback

**Description**: Generate intelligent feedback for user solutions using Gemini AI.

**Components**:
1. **Frontend Component**: `FeedbackPanel`
   - Display feedback message
   - Display suggestions
   - Display improvements
   - Loading states

2. **Backend Service**: `feedbackService.js`
   - Feedback generation logic
   - Gemini API integration
   - Feedback formatting
   - Context preparation

3. **Backend Controller**: `feedbackController.js`
   - Route handler for `/api/feedback/generate`
   - Request/response handling

**Acceptance Criteria**:
- ✅ Feedback generated for correct solutions
- ✅ Feedback generated for incorrect solutions
- ✅ Feedback is educational and encouraging
- ✅ No answer leakage for incorrect solutions
- ✅ Response time < 3 seconds

**TDD Test Specifications**:
- Test feedback generation for correct solutions
- Test feedback generation for incorrect solutions
- Test feedback quality (no answer leakage)
- Test Gemini API integration

**Dependencies**:
- Gemini API
- Submission data
- Execution results

**Estimated Effort**: 6 story points

---

#### F3.2: Progressive Hint System

**Description**: Provide 3 progressive hints per question, generated in single API call.

**Components**:
1. **Frontend Component**: `HintButton`
   - Hint request button
   - Hint display
   - Hint counter (1, 2, 3)
   - "View Answer" button state management

2. **Frontend Component**: `HintDisplay`
   - Display individual hints
   - Progressive reveal animation

3. **Backend Service**: `hintService.js`
   - Single API call for all 3 hints
   - Hint storage in database
   - Hint retrieval from cache

4. **Backend Controller**: `hintController.js`
   - Route handler for `/api/hints/generate`
   - Route handler for `/api/hints/:question_id/:hint_number`
   - Hint caching logic

**Acceptance Criteria**:
- ✅ All 3 hints generated in single Gemini API call
- ✅ Hints stored in database after first generation
- ✅ Subsequent hints retrieved from cache (instant)
- ✅ Hints are progressive (more helpful)
- ✅ "View Answer" enabled after 3 hints

**TDD Test Specifications**:
- Test single API call generates all 3 hints
- Test hint storage
- Test hint retrieval from cache
- Test hint progression logic
- Test "View Answer" button state

**Dependencies**:
- Gemini API
- Supabase database (hint storage)
- Question context

**Estimated Effort**: 8 story points

---

#### F3.3: Solution Viewing

**Description**: Allow learners to view AI-generated solution after using all 3 hints.

**Components**:
1. **Frontend Component**: `SolutionView`
   - "View Answer" button
   - Solution display with syntax highlighting
   - Solution explanation
   - Loading states

2. **Backend Service**: `solutionService.js`
   - Solution generation via Gemini
   - Solution formatting
   - Solution logging

3. **Backend Controller**: `solutionController.js`
   - Route handler for solution viewing
   - Hint validation (must have 3 hints used)

**Acceptance Criteria**:
- ✅ Solution only viewable after 3 hints used
- ✅ Solution includes clear explanation
- ✅ Solution demonstrates best practices
- ✅ View event logged

**TDD Test Specifications**:
- Test "View Answer" availability logic
- Test solution generation
- Test solution viewing logging

**Dependencies**:
- Hint system (3 hints must be used)
- Gemini API
- Question context

**Estimated Effort**: 4 story points

---

### Feature 4: Competition System

#### F4.1: Competition Invitation Creation

**Description**: Create competition invitation when learner completes course (triggered by Course Builder).

**Components**:
1. **Backend Service**: `competitionService.js`
   - Invitation creation logic
   - Competitor matching algorithm
   - Pool generation (3-5 competitors)

2. **Backend Service**: `matchingService.js`
   - Skill level matching
   - Availability checking
   - Duplicate prevention

3. **Backend Controller**: `competitionController.js`
   - Route handler for `/api/competitions/invite`
   - Request from Course Builder
   - Response with potential competitors

**Acceptance Criteria**:
- ✅ Invitation created on course completion
- ✅ Multiple potential competitors found (3-5)
- ✅ Matching algorithm finds appropriate competitors
- ✅ Invitation stored in database
- ✅ Duplicate competitions prevented

**TDD Test Specifications**:
- Test invitation creation
- Test matching algorithm
- Test competitor pool generation
- Test duplicate prevention

**Dependencies**:
- Course Builder microservice
- Supabase database (competitions, invitations)
- User skill level data

**Estimated Effort**: 8 story points

---

#### F4.2: Competitor Selection Interface

**Description**: Allow learners to view and select from anonymous list of potential competitors.

**Components**:
1. **Frontend Component**: `CompetitionInvitation`
   - Invitation card display
   - Course information
   - "View Available Competitors" button

2. **Frontend Component**: `CompetitorList`
   - Modal/panel with competitor list
   - Anonymous identifiers display
   - Competitor selection buttons
   - Skill level match indicators

3. **Backend Service**: `competitionService.js` (competitor retrieval)
   - Retrieve potential competitors
   - Anonymize competitor data
   - Selection handling

4. **Backend Controller**: `competitionController.js`
   - Route handler for `/api/competitions/invitations/:learner_id`
   - Route handler for `/api/competitions/select-competitor`

**Acceptance Criteria**:
- ✅ Anonymous list displayed
- ✅ Competitors shown with anonymous identifiers
- ✅ Selection functionality works
- ✅ Full anonymity maintained

**TDD Test Specifications**:
- Test competitor list retrieval
- Test anonymity maintenance
- Test selection functionality

**Dependencies**:
- Competition invitation system
- Frontend UI components

**Estimated Effort**: 6 story points

---

#### F4.3: Competition Execution

**Description**: Execute anonymous competition between two matched learners.

**Components**:
1. **Frontend Component**: `CompetitionRoom`
   - Competition interface
   - Question display (3 questions)
   - Code editor for each question
   - Timer display
   - Submission handling

2. **Frontend Component**: `CompetitionResults`
   - Winner announcement
   - Performance comparison
   - Anonymous display

3. **Backend Service**: `competitionService.js` (execution)
   - Question generation for competition
   - Solution execution
   - Winner determination via Gemini
   - Performance calculation

4. **Backend Controller**: `competitionController.js`
   - Route handler for competition start
   - Route handler for solution submission
   - Route handler for competition completion

**Acceptance Criteria**:
- ✅ 3 questions generated for competition
- ✅ Solutions executed correctly
- ✅ Winner determined accurately
- ✅ Results stored and sent to Learning Analytics
- ✅ Full anonymity maintained

**TDD Test Specifications**:
- Test competition question generation
- Test solution execution in competition
- Test winner determination
- Test Learning Analytics integration

**Dependencies**:
- Question generation system
- Code execution system
- Gemini API (for winner determination)
- Learning Analytics microservice

**Estimated Effort**: 12 story points

---

### Feature 5: Content Validation System

#### F5.1: Trainer Question Validation

**Description**: Validate trainer-submitted questions using Gemini AI.

**Components**:
1. **Backend Service**: `validationService.js`
   - Validation logic
   - Gemini API integration for validation
   - Score calculation
   - Feedback generation

2. **Backend Controller**: `validationController.js`
   - Route handler for `/api/questions/validate`
   - Request from Content Studio
   - Response with validation results

**Acceptance Criteria**:
- ✅ Question relevance assessed
- ✅ Quality score calculated
- ✅ Constructive feedback provided
- ✅ Response time < 5 seconds

**TDD Test Specifications**:
- Test validation for high-quality questions
- Test validation for low-quality questions
- Test scoring accuracy
- Test feedback quality

**Dependencies**:
- Gemini API
- Content Studio microservice
- Question context

**Estimated Effort**: 5 story points

---

### Feature 6: AI Fraud Detection

#### F6.1: Fraud Detection System

**Description**: Detect if code solutions are AI-generated using Gemini AI.

**Components**:
1. **Frontend Component**: `FraudWarning`
   - Warning message display
   - Fraud level indicator
   - Action buttons (if restricted)

2. **Backend Service**: `fraudDetectionService.js`
   - Fraud detection logic
   - Gemini API integration
   - Risk scoring (0-100%)
   - Action determination

3. **Backend Controller**: `fraudController.js`
   - Route handler for `/api/fraud/detect`
   - Automatic detection on submission
   - Response with fraud score and message

**Acceptance Criteria**:
- ✅ Fraud detection runs automatically
- ✅ Fraud score calculated (0-100%)
- ✅ Appropriate action taken based on risk level
- ✅ Message returned to learner
- ✅ Detection time < 2 seconds

**TDD Test Specifications**:
- Test fraud detection for human-written code
- Test fraud detection for AI-generated code
- Test risk scoring accuracy
- Test action enforcement
- Test response time

**Dependencies**:
- Gemini API
- Submission data
- Code execution system

**Estimated Effort**: 8 story points

---

## Component Breakdown & Dependencies

### Component Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Question Generation                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │──│   Backend    │──│   Gemini     │     │
│  │   Component  │  │   Service    │  │     API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Code Execution                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Code       │──│   Execution  │──│   Judge0     │     │
│  │   Editor     │  │   Service    │  │     API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feedback System                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Feedback   │──│   Feedback   │──│   Gemini     │     │
│  │   Panel      │  │   Service    │  │     API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hint System                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Hint       │──│   Hint       │──│   Gemini     │     │
│  │   Button     │  │   Service    │  │     API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Competition System                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Competition │──│ Competition  │──│ Course       │     │
│  │   UI        │  │   Service    │  │ Builder      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                        │
│                    │ Learning     │                        │
│                    │ Analytics    │                        │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fraud Detection                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Warning    │──│   Fraud      │──│   Gemini     │     │
│  │   Component  │  │   Service    │  │     API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Critical Dependencies

1. **Gemini API**: Required for question generation, feedback, hints, validation, fraud detection, competition evaluation
2. **Judge0 API**: Required for code execution
3. **Supabase Database**: Required for all data persistence
4. **MongoDB Atlas**: Required for logging and operational data
5. **EduCore Microservices**: Required for integration (Course Builder, Content Studio, Assessment, Learning Analytics, RAG)

---

## Task Estimation & Planning

### Story Point Estimation

| Feature | Component | Story Points | Priority |
|---------|-----------|--------------|----------|
| F1.1 | Dynamic Question Generation | 8 | High |
| F1.2 | Theoretical Question Routing | 3 | High |
| F2.1 | Secure Code Execution | 10 | Critical |
| F2.2 | Syntax Highlighting | 3 | Medium |
| F3.1 | AI-Generated Feedback | 6 | High |
| F3.2 | Progressive Hint System | 8 | High |
| F3.3 | Solution Viewing | 4 | Medium |
| F4.1 | Competition Invitation | 8 | High |
| F4.2 | Competitor Selection | 6 | High |
| F4.3 | Competition Execution | 12 | High |
| F5.1 | Trainer Question Validation | 5 | Medium |
| F6.1 | Fraud Detection | 8 | High |
| **Total** | | **81** | |

### Sprint Planning

**Sprint 1: Foundation & Core Infrastructure (2 weeks)**
- Project setup (frontend, backend, tests)
- Database setup (Supabase, MongoDB)
- Basic API structure
- Authentication middleware
- CORS configuration
- **Story Points**: 15

**Sprint 2: Code Execution System (2 weeks)**
- F2.1: Secure Code Execution (10 SP)
- F2.2: Syntax Highlighting (3 SP)
- Judge0 integration
- Code editor component
- **Story Points**: 13

**Sprint 3: Question Generation (2 weeks)**
- F1.1: Dynamic Question Generation (8 SP)
- F1.2: Theoretical Question Routing (3 SP)
- Gemini API integration
- Question storage
- **Story Points**: 11

**Sprint 4: Feedback & Hints (2 weeks)**
- F3.1: AI-Generated Feedback (6 SP)
- F3.2: Progressive Hint System (8 SP)
- F3.3: Solution Viewing (4 SP)
- **Story Points**: 18

**Sprint 5: Competition System Part 1 (2 weeks)**
- F4.1: Competition Invitation (8 SP)
- F4.2: Competitor Selection (6 SP)
- Matching algorithm
- **Story Points**: 14

**Sprint 6: Competition System Part 2 (2 weeks)**
- F4.3: Competition Execution (12 SP)
- Winner determination
- Learning Analytics integration
- **Story Points**: 12

**Sprint 7: Validation & Fraud Detection (2 weeks)**
- F5.1: Trainer Question Validation (5 SP)
- F6.1: Fraud Detection (8 SP)
- **Story Points**: 13

**Sprint 8: Integration & Testing (2 weeks)**
- Integration testing
- E2E testing
- Bug fixes
- Performance optimization
- **Story Points**: 10

**Total Development Time**: 16 weeks (4 months)

---

## User Journeys & Workflows

### User Journey 1: Practice Coding Exercise

```
1. Learner navigates to Practice Page
2. System receives question generation request from Content Studio
3. Questions displayed with code editor
4. Learner writes code solution
5. Learner submits code
6. Code executed in Judge0 sandbox
7. Fraud detection runs automatically
8. Execution results displayed
9. AI feedback generated and displayed
10. Learner can request hints (1, 2, 3)
11. After 3 hints, "View Answer" enabled
12. Learner views solution
13. Progress saved
```

### User Journey 2: Competition Participation

```
1. Learner completes course (Course Builder triggers)
2. Competition invitation created
3. Learner receives invitation notification
4. Learner views available competitors (anonymous list)
5. Learner selects competitor
6. Selected competitor accepts
7. Competition starts with 3 questions
8. Both learners submit solutions
9. Solutions executed via Judge0
10. Fraud detection for both solutions
11. Winner determined via Gemini
12. Results displayed (anonymous)
13. Performance data sent to Learning Analytics
```

### User Journey 3: Trainer Question Validation

```
1. Trainer submits question via Content Studio
2. Content Studio sends validation request to DEVLAB
3. DEVLAB validates question using Gemini
4. Validation results returned (relevance score, quality score, feedback)
5. Content Studio displays results to trainer
6. Trainer can revise and resubmit
```

---

## Feature Prioritization & Release Plans

### Release 1.0: MVP (Minimum Viable Product)
**Priority: Critical**
- F2.1: Secure Code Execution
- F2.2: Syntax Highlighting
- F1.1: Dynamic Question Generation
- F3.1: AI-Generated Feedback
- F3.2: Progressive Hint System (basic)
- **Timeline**: Sprints 1-4 (8 weeks)

### Release 1.1: Competition System
**Priority: High**
- F4.1: Competition Invitation
- F4.2: Competitor Selection
- F4.3: Competition Execution
- **Timeline**: Sprints 5-6 (4 weeks)

### Release 1.2: Quality & Security
**Priority: High**
- F5.1: Trainer Question Validation
- F6.1: Fraud Detection
- F3.3: Solution Viewing (enhancement)
- **Timeline**: Sprint 7 (2 weeks)

### Release 1.3: Integration & Polish
**Priority: Medium**
- Full integration testing
- E2E testing
- Performance optimization
- Bug fixes
- **Timeline**: Sprint 8 (2 weeks)

---

## Cross-Functional Coordination

### Development Team
- **Frontend Developers**: React components, UI/UX implementation
- **Backend Developers**: API development, service logic
- **Full-Stack Developers**: Integration, end-to-end features

### QA Team
- **Test Engineers**: TDD test creation, integration testing
- **QA Analysts**: Manual testing, user acceptance testing

### DevOps Team
- **Infrastructure**: Database setup, environment configuration
- **CI/CD**: Pipeline setup, deployment automation

### Design Team
- **UI/UX Designers**: Component design, user flow validation

---

## TDD Integration

### TDD Workflow for Each Component

**RED Phase**:
1. Write failing unit test
2. Write failing integration test (if applicable)
3. Run tests (should fail)

**GREEN Phase**:
1. Write minimal code to pass tests
2. Run tests (should pass)
3. Verify all tests pass

**REFACTOR Phase**:
1. Optimize code while maintaining passing tests
2. Run tests continuously
3. Ensure no regressions

### Test Coverage Targets

- **Unit Tests**: > 90% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Complete user journeys

### Test Organization

```
tests/
├── unit/
│   ├── frontend/components/  # Component tests (TDD)
│   ├── frontend/services/    # Service tests (TDD)
│   ├── backend/controllers/  # Controller tests (TDD)
│   └── backend/services/     # Service tests (TDD)
├── integration/
│   ├── api/                  # API integration tests
│   └── database/             # Database integration tests
└── e2e/                      # E2E tests (user journeys)
```

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Project setup
- Database configuration
- Basic infrastructure
- Authentication setup

### Phase 2: Core Features (Weeks 3-8)
- Code execution system
- Question generation
- Feedback system
- Hint system

### Phase 3: Competition Features (Weeks 9-12)
- Competition invitations
- Competitor selection
- Competition execution

### Phase 4: Quality & Security (Weeks 13-14)
- Trainer validation
- Fraud detection

### Phase 5: Integration & Testing (Weeks 15-16)
- Full integration
- E2E testing
- Performance optimization
- Bug fixes

---

## Validation Checkpoint

✅ **Feature Specifications**: All features decomposed with detailed components  
✅ **Component Breakdown**: Clear component mapping with dependencies  
✅ **Task Estimation**: Story points assigned, sprint planning complete  
✅ **User Journeys**: Complete user flows mapped  
✅ **Feature Prioritization**: Release plan defined  
✅ **TDD Integration**: Test specifications for all components  
✅ **Development Roadmap**: 16-week plan with clear milestones  

---

**Document Status**: ✅ Complete - Ready for Implementation  
**Created**: Feature Planning & Component Breakdown Phase  
**Next Phase**: Development Environment & Infrastructure Setup


