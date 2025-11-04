# Testing Strategy - DEVLAB Microservice

## Executive Summary

This document defines the comprehensive testing strategy for the DEVLAB Microservice, including test pyramid structure, unit/integration/E2E test specifications, test data management, mocking strategies, test automation, CI/CD integration, performance testing, and security testing. All testing follows strict Test-Driven Development (TDD) methodology with >90% coverage requirements.

---

## Testing Philosophy & Test Pyramid

### Testing Philosophy

**Test-Driven Development (TDD)**: All code is developed following the RED-GREEN-REFACTOR cycle:
1. **RED**: Write failing tests first
2. **GREEN**: Write minimal code to pass tests
3. **REFACTOR**: Improve code while keeping tests passing

**Test-First Approach**: Tests are written before implementation, ensuring:
- Requirements are clearly defined
- Code is designed for testability
- High coverage from the start
- Regression prevention

### Test Pyramid Structure

```
                    /\
                   /  \
                  /E2E \         10% - E2E Tests
                 /______\
                /        \
               /Integration\     20% - Integration Tests
              /____________\
             /              \
            /   Unit Tests    \   70% - Unit Tests
           /__________________\
```

**Test Distribution**:
- **Unit Tests (70%)**: Fast, isolated, test individual functions/components
- **Integration Tests (20%)**: Test API endpoints, database interactions, external services
- **E2E Tests (10%)**: Test complete user flows, critical paths

**Test Execution Speed**:
- Unit tests: < 1 second per test
- Integration tests: < 5 seconds per test
- E2E tests: < 30 seconds per test

---

## Unit Test Specifications

### Backend Unit Tests

#### Test Organization

**Structure**:
```
tests/
├── unit/
│   ├── backend/
│   │   ├── services/
│   │   │   ├── questionService.test.js
│   │   │   ├── codeExecutionService.test.js
│   │   │   ├── feedbackService.test.js
│   │   │   ├── hintService.test.js
│   │   │   ├── competitionService.test.js
│   │   │   └── fraudDetectionService.test.js
│   │   ├── controllers/
│   │   │   ├── questionController.test.js
│   │   │   ├── codeExecutionController.test.js
│   │   │   └── ...
│   │   ├── clients/
│   │   │   ├── geminiClient.test.js
│   │   │   ├── judge0Client.test.js
│   │   │   └── microserviceClient.test.js
│   │   └── utils/
│   │       ├── logger.test.js
│   │       └── validator.test.js
```

#### Service Tests

**Question Service Tests** (`tests/unit/backend/services/questionService.test.js`):

```javascript
describe('QuestionService', () => {
  describe('generateCodingQuestions', () => {
    it('should generate coding questions with valid inputs', async () => {
      // RED: Write failing test
      // Test implementation
    });

    it('should handle Gemini API errors', async () => {
      // Test error handling
    });

    it('should store questions in database', async () => {
      // Test database interaction
    });

    it('should validate question parameters', async () => {
      // Test input validation
    });
  });

  describe('validateTrainerQuestion', () => {
    it('should validate trainer question relevance', async () => {
      // Test validation logic
    });

    it('should return validation feedback', async () => {
      // Test feedback generation
    });
  });
});
```

**Code Execution Service Tests** (`tests/unit/backend/services/codeExecutionService.test.js`):

```javascript
describe('CodeExecutionService', () => {
  describe('executeCode', () => {
    it('should execute code successfully', async () => {
      // Test successful execution
    });

    it('should validate code size limits', async () => {
      // Test size validation
    });

    it('should handle Judge0 API errors', async () => {
      // Test error handling
    });

    it('should format execution results', async () => {
      // Test result formatting
    });
  });
});
```

**Feedback Service Tests** (`tests/unit/backend/services/feedbackService.test.js`):

```javascript
describe('FeedbackService', () => {
  describe('generateFeedback', () => {
    it('should generate feedback for correct solution', async () => {
      // Test correct solution feedback
    });

    it('should generate feedback for incorrect solution', async () => {
      // Test incorrect solution feedback
    });

    it('should include improvement suggestions', async () => {
      // Test suggestions generation
    });
  });
});
```

**Hint Service Tests** (`tests/unit/backend/services/hintService.test.js`):

```javascript
describe('HintService', () => {
  describe('generateHints', () => {
    it('should generate all 3 hints in single API call', async () => {
      // Test single API call for all hints
    });

    it('should cache hints in database', async () => {
      // Test hint caching
    });

    it('should retrieve cached hints', async () => {
      // Test cache retrieval
    });
  });
});
```

**Competition Service Tests** (`tests/unit/backend/services/competitionService.test.js`):

```javascript
describe('CompetitionService', () => {
  describe('createInvitation', () => {
    it('should create competition invitation', async () => {
      // Test invitation creation
    });

    it('should find potential competitors', async () => {
      // Test competitor matching
    });
  });

  describe('selectCompetitor', () => {
    it('should select competitor from list', async () => {
      // Test competitor selection
    });
  });

  describe('determineWinner', () => {
    it('should determine competition winner', async () => {
      // Test winner determination
    });
  });
});
```

**Fraud Detection Service Tests** (`tests/unit/backend/services/fraudDetectionService.test.js`):

```javascript
describe('FraudDetectionService', () => {
  describe('detectFraud', () => {
    it('should detect AI-generated code', async () => {
      // Test fraud detection
    });

    it('should calculate fraud score', async () => {
      // Test score calculation
    });

    it('should determine fraud level', async () => {
      // Test level determination
    });

    it('should return appropriate action', async () => {
      // Test action determination
    });
  });
});
```

#### Controller Tests

**Question Controller Tests**:

```javascript
describe('QuestionController', () => {
  describe('POST /api/questions/generate', () => {
    it('should generate questions with valid request', async () => {
      // Test successful generation
    });

    it('should return 400 for invalid request', async () => {
      // Test validation
    });

    it('should handle service errors', async () => {
      // Test error handling
    });
  });
});
```

#### Client Tests

**Gemini Client Tests**:

```javascript
describe('GeminiClient', () => {
  describe('generateQuestions', () => {
    it('should call Gemini API with correct parameters', async () => {
      // Test API call
    });

    it('should handle API errors', async () => {
      // Test error handling
    });

    it('should parse API response', async () => {
      // Test response parsing
    });
  });
});
```

### Frontend Unit Tests

#### Test Organization

**Structure**:
```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   │   ├── practice/
│   │   │   │   ├── CodeEditor.test.jsx
│   │   │   │   ├── QuestionCard.test.jsx
│   │   │   │   └── ...
│   │   │   └── competition/
│   │   │       ├── CompetitionInvitation.test.jsx
│   │   │       └── ...
│   │   ├── services/
│   │   │   ├── questionService.test.js
│   │   │   ├── codeExecutionService.test.js
│   │   │   └── ...
│   │   └── utils/
│   │       └── ...
```

#### Component Tests

**CodeEditor Component Tests** (`tests/unit/frontend/components/practice/CodeEditor.test.jsx`):

```javascript
describe('CodeEditor', () => {
  it('should render code editor', () => {
    // Test rendering
  });

  it('should call onChange when code is edited', async () => {
    // Test user interaction
  });

  it('should call onSubmit when submit button is clicked', async () => {
    // Test form submission
  });

  it('should apply theme correctly', () => {
    // Test theme application
  });
});
```

**QuestionCard Component Tests**:

```javascript
describe('QuestionCard', () => {
  it('should display question text', () => {
    // Test question display
  });

  it('should display test cases', () => {
    // Test test case display
  });

  it('should show difficulty indicator', () => {
    // Test difficulty display
  });
});
```

**FeedbackPanel Component Tests**:

```javascript
describe('FeedbackPanel', () => {
  it('should display feedback text', () => {
    // Test feedback display
  });

  it('should display suggestions', () => {
    // Test suggestions display
  });

  it('should display improvements', () => {
    // Test improvements display
  });
});
```

#### Service Tests

**Question Service Tests**:

```javascript
describe('QuestionService', () => {
  it('should call API with correct parameters', async () => {
    // Test API call
  });

  it('should handle API errors', async () => {
    // Test error handling
  });

  it('should return formatted data', async () => {
    // Test data formatting
  });
});
```

---

## Integration Test Specifications

### Backend Integration Tests

#### Test Organization

**Structure**:
```
tests/
├── integration/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── questions.test.js
│   │   │   ├── codeExecution.test.js
│   │   │   ├── feedback.test.js
│   │   │   ├── competitions.test.js
│   │   │   └── fraud.test.js
│   │   ├── database/
│   │   │   ├── supabase.test.js
│   │   │   └── mongodb.test.js
│   │   └── external/
│   │       ├── gemini.test.js
│   │       └── judge0.test.js
```

#### API Integration Tests

**Question API Tests** (`tests/integration/backend/api/questions.test.js`):

```javascript
describe('Question API Integration', () => {
  describe('POST /api/questions/generate', () => {
    it('should generate questions end-to-end', async () => {
      // Test complete flow: request → service → database → response
    });

    it('should validate request body', async () => {
      // Test validation middleware
    });

    it('should handle database errors', async () => {
      // Test database error handling
    });
  });

  describe('POST /api/questions/validate', () => {
    it('should validate trainer question', async () => {
      // Test validation flow
    });
  });
});
```

**Code Execution API Tests** (`tests/integration/backend/api/codeExecution.test.js`):

```javascript
describe('Code Execution API Integration', () => {
  describe('POST /api/code/execute', () => {
    it('should execute code end-to-end', async () => {
      // Test complete execution flow
    });

    it('should handle Judge0 API integration', async () => {
      // Test external API integration
    });

    it('should store execution results', async () => {
      // Test database storage
    });
  });
});
```

**Feedback API Tests** (`tests/integration/backend/api/feedback.test.js`):

```javascript
describe('Feedback API Integration', () => {
  describe('POST /api/feedback/generate', () => {
    it('should generate feedback end-to-end', async () => {
      // Test feedback generation flow
    });

    it('should integrate with Gemini API', async () => {
      // Test external API integration
    });
  });
});
```

**Competition API Tests** (`tests/integration/backend/api/competitions.test.js`):

```javascript
describe('Competition API Integration', () => {
  describe('POST /api/competitions/invite', () => {
    it('should create invitation end-to-end', async () => {
      // Test invitation creation flow
    });

    it('should find and match competitors', async () => {
      // Test competitor matching
    });
  });

  describe('POST /api/competitions/select-competitor', () => {
    it('should select competitor end-to-end', async () => {
      // Test competitor selection flow
    });
  });
});
```

#### Database Integration Tests

**Supabase Integration Tests**:

```javascript
describe('Supabase Integration', () => {
  it('should connect to Supabase', async () => {
    // Test database connection
  });

  it('should perform CRUD operations', async () => {
    // Test database operations
  });

  it('should handle connection errors', async () => {
    // Test error handling
  });
});
```

**MongoDB Integration Tests**:

```javascript
describe('MongoDB Integration', () => {
  it('should connect to MongoDB', async () => {
    // Test database connection
  });

  it('should log errors to MongoDB', async () => {
    // Test logging functionality
  });
});
```

#### External API Integration Tests

**Gemini API Integration Tests**:

```javascript
describe('Gemini API Integration', () => {
  it('should call Gemini API successfully', async () => {
    // Test API call
  });

  it('should handle API rate limits', async () => {
    // Test rate limit handling
  });

  it('should handle API errors', async () => {
    // Test error handling
  });
});
```

**Judge0 API Integration Tests**:

```javascript
describe('Judge0 API Integration', () => {
  it('should execute code via Judge0', async () => {
    // Test code execution
  });

  it('should handle timeout errors', async () => {
    // Test timeout handling
  });
});
```

---

## E2E Test Specifications

### E2E Test Organization

**Structure**:
```
tests/
├── e2e/
│   ├── user-flows/
│   │   ├── practice-flow.test.js
│   │   ├── competition-flow.test.js
│   │   └── hint-system-flow.test.js
│   └── critical-paths/
│       ├── question-generation.test.js
│       ├── code-execution.test.js
│       └── fraud-detection.test.js
```

### User Flow Tests

**Practice Flow Test** (`tests/e2e/user-flows/practice-flow.test.js`):

```javascript
describe('Practice Flow E2E', () => {
  it('should complete practice session end-to-end', async () => {
    // 1. Load practice page
    // 2. Generate question
    // 3. Write code
    // 4. Submit code
    // 5. View feedback
    // 6. Request hints
    // 7. View solution
  });

  it('should handle multiple questions in session', async () => {
    // Test multiple question flow
  });
});
```

**Competition Flow Test** (`tests/e2e/user-flows/competition-flow.test.js`):

```javascript
describe('Competition Flow E2E', () => {
  it('should complete competition end-to-end', async () => {
    // 1. Receive invitation
    // 2. View competitors
    // 3. Select competitor
    // 4. Start competition
    // 5. Answer questions
    // 6. Submit solutions
    // 7. View results
  });
});
```

**Hint System Flow Test** (`tests/e2e/user-flows/hint-system-flow.test.js`):

```javascript
describe('Hint System Flow E2E', () => {
  it('should use all hints progressively', async () => {
    // 1. Request hint 1
    // 2. Request hint 2
    // 3. Request hint 3
    // 4. View answer (after 3 hints)
  });
});
```

### Critical Path Tests

**Question Generation Test** (`tests/e2e/critical-paths/question-generation.test.js`):

```javascript
describe('Question Generation Critical Path', () => {
  it('should generate questions from Content Studio request', async () => {
    // Test Content Studio integration
  });

  it('should generate questions from Assessment request', async () => {
    // Test Assessment integration
  });
});
```

**Code Execution Test** (`tests/e2e/critical-paths/code-execution.test.js`):

```javascript
describe('Code Execution Critical Path', () => {
  it('should execute code and return results', async () => {
    // Test complete execution flow
  });

  it('should handle execution errors gracefully', async () => {
    // Test error handling
  });
});
```

---

## Test Data Management

### Test Data Strategy

**Test Data Sources**:
1. **Fixtures**: Static test data files
2. **Factories**: Dynamic test data generation
3. **Mocks**: Mocked API responses
4. **Seeds**: Database seed data for integration tests

### Test Data Structure

```
tests/
├── fixtures/
│   ├── questions.json
│   ├── users.json
│   ├── competitions.json
│   └── submissions.json
├── factories/
│   ├── questionFactory.js
│   ├── userFactory.js
│   └── competitionFactory.js
└── mocks/
    ├── geminiResponses.js
    └── judge0Responses.js
```

### Test Data Examples

**Question Fixtures** (`tests/fixtures/questions.json`):

```json
{
  "codingQuestion": {
    "question_id": "q_test_001",
    "question_text": "Write a function that returns the sum of two numbers",
    "programming_language": "Python",
    "test_cases": [
      {
        "input": "2, 3",
        "expected_output": "5"
      }
    ]
  }
}
```

**Factory Example** (`tests/factories/questionFactory.js`):

```javascript
export const createQuestion = (overrides = {}) => ({
  question_id: `q_${Date.now()}`,
  question_text: 'Test question',
  programming_language: 'Python',
  ...overrides
});
```

### Test Database Management

**Test Database Strategy**:
- Separate test database (Supabase test project)
- Test data cleanup after each test
- Database transactions for isolation
- Seed data for consistent test environment

---

## Mocking Strategies

### Mocking Philosophy

**What to Mock**:
- External APIs (Gemini, Judge0)
- Database operations (for unit tests)
- Microservice calls (Learning Analytics, Assessment, etc.)
- File system operations
- Time-dependent operations

**What NOT to Mock**:
- Business logic (test real implementation)
- Internal utilities
- Data transformations

### Mocking Tools

**Backend**:
- **nock**: HTTP request mocking
- **jest.mock**: Module mocking
- **Manual mocks**: Custom mock implementations

**Frontend**:
- **MSW (Mock Service Worker)**: API mocking
- **jest.mock**: Module mocking
- **React Testing Library**: Component mocking

### Mock Examples

**Gemini API Mock** (`tests/mocks/geminiResponses.js`):

```javascript
export const mockGeminiQuestionResponse = {
  questions: [
    {
      question_text: 'Test question',
      difficulty: 'medium',
      test_cases: []
    }
  ]
};

export const mockGeminiFeedbackResponse = {
  feedback: 'Good solution!',
  suggestions: ['Consider edge cases'],
  improvements: ['Add error handling']
};
```

**Judge0 API Mock** (`tests/mocks/judge0Responses.js`):

```javascript
export const mockJudge0SuccessResponse = {
  status: 'Accepted',
  stdout: 'Hello World',
  stderr: '',
  time: 0.1,
  memory: 1024
};
```

**MSW Setup** (`tests/setup/mswSetup.js`):

```javascript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## Test Automation & CI/CD Integration

### Test Execution Strategy

**Local Development**:
- Run unit tests on file save (watch mode)
- Run integration tests before commit
- Run E2E tests before push

**CI/CD Pipeline**:
- Run all tests on PR creation
- Run tests on every commit
- Block merge if tests fail
- Generate coverage reports

### GitHub Actions Workflow

**Test Workflow** (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run backend unit tests
        run: |
          cd backend
          npm run test:unit
      
      - name: Run frontend unit tests
        run: |
          cd frontend
          npm run test:unit
      
      - name: Run integration tests
        run: |
          cd backend
          npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json,./frontend/coverage/coverage-final.json
```

### Test Coverage Reporting

**Coverage Tools**:
- **Jest**: Backend coverage (built-in)
- **Vitest**: Frontend coverage (built-in)
- **Codecov**: Coverage reporting and tracking

**Coverage Reports**:
- HTML reports generated locally
- Coverage badges in README
- Coverage trends tracked in CI/CD

---

## Performance Testing Strategy

### Performance Test Types

1. **Load Testing**: Test system under expected load
2. **Stress Testing**: Test system beyond normal capacity
3. **Endurance Testing**: Test system over extended period
4. **Spike Testing**: Test system response to sudden load spikes

### Performance Metrics

**API Response Times**:
- Question generation: < 5 seconds
- Code execution: < 10 seconds
- Feedback generation: < 3 seconds
- Hint generation: < 5 seconds

**System Metrics**:
- CPU usage: < 70%
- Memory usage: < 80%
- Database query time: < 500ms
- API response time: < 2 seconds (p95)

### Performance Test Tools

**Tools**:
- **Artillery**: Load testing
- **k6**: Performance testing
- **Apache Bench**: Simple load testing

**Performance Test Examples**:

```javascript
// Load test for question generation
import { check } from 'k6';
import http from 'k6/http';

export default function () {
  const response = http.post('http://localhost:3001/api/questions/generate', {
    quantity: 4,
    lesson_id: 'lesson_123',
    // ... other params
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
}
```

---

## Security Testing Strategy

### Security Test Types

1. **Authentication Testing**: Test JWT validation
2. **Authorization Testing**: Test access control
3. **Input Validation Testing**: Test injection attacks
4. **Rate Limiting Testing**: Test rate limit enforcement
5. **CORS Testing**: Test CORS configuration

### Security Test Examples

**Input Validation Tests**:

```javascript
describe('Security: Input Validation', () => {
  it('should reject SQL injection attempts', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    // Test that input is sanitized
  });

  it('should reject XSS attempts', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    // Test that input is sanitized
  });
});
```

**Rate Limiting Tests**:

```javascript
describe('Security: Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    // Make 100+ requests rapidly
    // Verify rate limit is enforced
  });
});
```

---

## Test Coverage Requirements

### Coverage Thresholds

**Minimum Coverage**:
- **Backend Services**: > 90%
- **Backend Controllers**: > 90%
- **Backend Clients**: > 90%
- **Frontend Components**: > 80%
- **Frontend Services**: > 90%
- **Overall Project**: > 90%

### Coverage Enforcement

**Jest Configuration**:
```javascript
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

**Coverage Exclusions**:
- Configuration files
- Test files
- Build files
- Vendor files

---

## Test Maintenance & Best Practices

### Test Maintenance

**Regular Updates**:
- Update tests when requirements change
- Refactor tests when code is refactored
- Remove obsolete tests
- Update mocks when APIs change

### Best Practices

1. **Test Naming**: Use descriptive test names
2. **Test Isolation**: Each test should be independent
3. **Test Data**: Use factories for test data
4. **Test Cleanup**: Clean up after each test
5. **Test Documentation**: Document complex tests
6. **Test Speed**: Keep tests fast (< 1s for unit, < 5s for integration)

---

## Validation Checkpoint

✅ **Test Pyramid**: Defined with 70/20/10 distribution  
✅ **Unit Tests**: Comprehensive specifications for all services/components  
✅ **Integration Tests**: API, database, and external service tests defined  
✅ **E2E Tests**: User flows and critical paths defined  
✅ **Test Data Management**: Fixtures, factories, and mocks strategy defined  
✅ **Mocking Strategy**: Clear guidelines on what to mock  
✅ **Test Automation**: CI/CD integration defined  
✅ **Performance Testing**: Strategy and metrics defined  
✅ **Security Testing**: Security test types and examples defined  
✅ **Coverage Requirements**: > 90% threshold enforced  

---

**Document Status**: ✅ Complete - Testing Strategy Defined  
**Created**: Testing Strategy Phase (Phase 7)  
**Next Phase**: Security Implementation & Compliance (Phase 8)



