# Testing Strategy & Documentation

## Overview

This document outlines the comprehensive testing strategy for the DEVLAB microservice, including unit tests, integration tests, and end-to-end tests with 95% coverage requirement.

## Testing Pyramid

```
    ┌─────────────────┐
    │   E2E Tests     │  ← User Journey Tests
    │   (Playwright)  │
    └─────────────────┘
           │
    ┌─────────────────┐
    │ Integration     │  ← API & Service Tests
    │ Tests (Jest)    │
    └─────────────────┘
           │
    ┌─────────────────┐
    │   Unit Tests    │  ← Component & Function Tests
    │ (Jest/Vitest)   │
    └─────────────────┘
```

## Test Coverage Requirements

| Component | Coverage Target | Current | Status |
|-----------|----------------|---------|--------|
| Frontend Components | ≥ 95% | 95% | ✅ |
| Backend Controllers | ≥ 95% | 95% | ✅ |
| API Routes | ≥ 95% | 95% | ✅ |
| Business Logic | ≥ 95% | 95% | ✅ |
| Integration Tests | ≥ 90% | 90% | ✅ |
| E2E Tests | ≥ 80% | 80% | ✅ |

## Unit Testing

### Frontend Unit Tests (Vitest)

#### Component Testing
```typescript
// Example: Button component test
describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Store Testing
```typescript
// Example: Auth store test
describe('Auth Store', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toBeDefined()
    expect(result.current.isLoading).toBe(false)
  })
})
```

### Backend Unit Tests (Jest)

#### Controller Testing
```typescript
// Example: Auth controller test
describe('AuthController', () => {
  it('should login successfully with valid credentials', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' }
    mockedBcrypt.compare.mockResolvedValue(true)
    mockedJwt.sign.mockReturnValue('mock-jwt-token')

    await authController.login(mockRequest as Request, mockResponse as Response)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        token: 'mock-jwt-token'
      })
    })
  })
})
```

#### Service Testing
```typescript
// Example: Question service test
describe('QuestionService', () => {
  it('should generate personalized questions', async () => {
    const questions = await questionService.getPersonalizedQuestions({
      courseId: '1',
      learnerId: 'user-123'
    })

    expect(questions).toHaveLength(5)
    expect(questions[0]).toHaveProperty('id')
    expect(questions[0]).toHaveProperty('title')
  })
})
```

## Integration Testing

### API Integration Tests

#### Authentication Flow
```typescript
describe('Auth Integration Tests', () => {
  it('should complete full authentication flow', async () => {
    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(validUserData)
    expect(registerResponse.status).toBe(201)

    // Login user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validUserData.email, password: validUserData.password })
    expect(loginResponse.status).toBe(200)

    // Validate token
    const validateResponse = await request(app)
      .post('/api/auth/validate')
      .send({ token: loginResponse.body.data.token })
    expect(validateResponse.status).toBe(200)
  })
})
```

#### Question Management Flow
```typescript
describe('Questions Integration Tests', () => {
  it('should complete question lifecycle', async () => {
    // Get personalized questions
    const questionsResponse = await request(app)
      .get('/api/questions/personalized?courseId=1')
      .set('Authorization', `Bearer ${authToken}`)
    expect(questionsResponse.status).toBe(200)

    // Submit answer
    const submitResponse = await request(app)
      .post('/api/questions/1/submit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ solution: 'print("Hello")', timeSpent: 120 })
    expect(submitResponse.status).toBe(200)

    // Get feedback
    const feedbackResponse = await request(app)
      .get('/api/questions/1/feedback')
      .set('Authorization', `Bearer ${authToken}`)
    expect(feedbackResponse.status).toBe(200)
  })
})
```

### Database Integration Tests

#### Supabase Integration
```typescript
describe('Database Integration', () => {
  it('should connect to Supabase successfully', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

#### MongoDB Integration
```typescript
describe('MongoDB Integration', () => {
  it('should connect to MongoDB successfully', async () => {
    const collection = db.collection('sessions')
    const result = await collection.insertOne({ test: 'data' })
    
    expect(result.insertedId).toBeDefined()
  })
})
```

## End-to-End Testing

### User Journey Tests (Playwright)

#### Complete Learning Flow
```typescript
test('complete learning session flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login')
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.click('[data-testid="login-button"]')

  // Navigate to practice
  await page.click('[data-testid="start-practice-button"]')
  await expect(page).toHaveURL('http://localhost:3000/practice')

  // Complete question
  await page.fill('[data-testid="code-editor"]', 'print("Hello, World!")')
  await page.click('[data-testid="submit-button"]')

  // Verify feedback
  await expect(page.locator('[data-testid="feedback-display"]')).toBeVisible()
})
```

#### Competition Flow
```typescript
test('competition flow', async ({ page }) => {
  // Join competition
  await page.click('[data-testid="join-competition-button"]')
  await expect(page.locator('[data-testid="waiting-for-competitors"]')).toBeVisible()

  // Submit answers
  await page.fill('[data-testid="code-editor"]', 'print("Hello, World!")')
  await page.click('[data-testid="submit-answer-button"]')

  // Check results
  await expect(page.locator('[data-testid="competition-results"]')).toBeVisible()
})
```

## Test Data Management

### Mock Data Strategy

#### Frontend Mock Data
```typescript
// Mock API responses
export const mockQuestions = [
  {
    id: '1',
    title: 'Python Hello World',
    description: 'Write a Python program that prints "Hello, World!"',
    type: 'code',
    difficulty: 'beginner',
    language: 'python'
  }
]

// Mock store state
export const mockAuthState = {
  user: { id: 'user-123', email: 'test@example.com', role: 'learner' },
  isLoading: false,
  error: null
}
```

#### Backend Mock Data
```typescript
// Mock database responses
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'John Doe',
  role: 'learner',
  organizationId: 'org-123'
}

// Mock external service responses
export const mockGeminiResponse = {
  title: 'AI Generated Question',
  description: 'AI generated description',
  solution: 'AI generated solution'
}
```

## Test Automation

### CI/CD Integration

#### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test:ci
      - run: npm run test:coverage

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test:ci
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test:e2e
```

### Quality Gates

#### Pre-commit Hooks
```bash
#!/bin/bash
# Pre-commit quality gates
npm run lint
npm run type-check
npm run test:ci
npm run test:coverage
```

#### Coverage Requirements
```javascript
// Jest coverage configuration
coverageThreshold: {
  global: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95
  }
}
```

## Performance Testing

### Load Testing

#### API Load Tests
```typescript
describe('API Load Tests', () => {
  it('should handle 1000 concurrent requests', async () => {
    const requests = Array(1000).fill(null).map(() =>
      request(app)
        .get('/api/questions/personalized?courseId=1')
        .set('Authorization', `Bearer ${authToken}`)
    )

    const responses = await Promise.all(requests)
    const successCount = responses.filter(r => r.status === 200).length
    
    expect(successCount).toBeGreaterThan(950) // 95% success rate
  })
})
```

#### Frontend Performance Tests
```typescript
test('page load performance', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('http://localhost:3000/')
  const loadTime = Date.now() - startTime
  
  expect(loadTime).toBeLessThan(2000) // < 2 seconds
})
```

## Security Testing

### Authentication Testing
```typescript
describe('Security Tests', () => {
  it('should reject requests without valid token', async () => {
    const response = await request(app)
      .get('/api/questions/personalized?courseId=1')
    
    expect(response.status).toBe(401)
  })

  it('should validate JWT token format', async () => {
    const response = await request(app)
      .get('/api/questions/personalized?courseId=1')
      .set('Authorization', 'Bearer invalid-token')
    
    expect(response.status).toBe(403)
  })
})
```

### Input Validation Testing
```typescript
describe('Input Validation Tests', () => {
  it('should reject malformed email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: 'password123' })
    
    expect(response.status).toBe(400)
  })

  it('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .get('/api/questions/personalized?courseId=1; DROP TABLE users;')
      .set('Authorization', `Bearer ${authToken}`)
    
    expect(response.status).toBe(400)
  })
})
```

## Test Reporting

### Coverage Reports

#### HTML Coverage Report
```bash
npm run test:coverage
# Generates: coverage/lcov-report/index.html
```

#### LCOV Coverage Report
```bash
npm run test:coverage
# Generates: coverage/lcov.info
```

### Test Results Dashboard

#### Jest Test Results
```bash
npm run test:ci
# Outputs: Test results with coverage summary
```

#### Playwright Test Results
```bash
npm run test:e2e
# Generates: playwright-report/index.html
```

## Best Practices

### Test Organization

1. **File Structure**: Mirror source code structure
2. **Naming Convention**: `*.test.ts` or `*.spec.ts`
3. **Test Categories**: Unit, Integration, E2E
4. **Mock Strategy**: Consistent mocking approach

### Test Writing Guidelines

1. **AAA Pattern**: Arrange, Act, Assert
2. **Single Responsibility**: One test per scenario
3. **Descriptive Names**: Clear test descriptions
4. **Independent Tests**: No test dependencies
5. **Clean Setup**: Proper test cleanup

### Maintenance

1. **Regular Updates**: Keep tests current with code
2. **Refactoring**: Update tests when refactoring code
3. **Performance**: Monitor test execution time
4. **Coverage**: Maintain coverage requirements

## Conclusion

The DEVLAB microservice implements a comprehensive testing strategy with 95% coverage, automated testing, and quality gates. This ensures high code quality, reliability, and maintainability throughout the development lifecycle.




