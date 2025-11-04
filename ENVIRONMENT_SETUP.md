# Development Environment & Infrastructure Setup - DEVLAB Microservice

## Executive Summary

This document defines and standardizes all development, testing, staging, and production environments for the DEVLAB Microservice. It includes CI/CD pipeline configuration, testing infrastructure, monitoring, logging, security measures, cloud infrastructure provisioning, development tools, and TDD environment setup.

---

## Environment Configuration

### Development Environment

**Purpose**: Local development and testing by developers

**Configuration**:
- **Frontend**: 
  - URL: `http://localhost:5173` (Vite default port)
  - Hot Module Replacement (HMR) enabled
  - Development mode with source maps
  - Environment variables from `.env.local`

- **Backend**:
  - URL: `http://localhost:3001`
  - Development mode with detailed error messages
  - Hot reload with nodemon
  - Environment variables from `.env`

- **Databases**:
  - **Supabase**: Local development project or shared dev instance
  - **MongoDB**: Local MongoDB or MongoDB Atlas free tier cluster

- **External Services**:
  - **Gemini API**: Development API key (separate from production)
  - **Judge0 API**: Development API key or free tier

**Environment Variables (.env.local for frontend)**:
```bash
# Frontend Development Environment
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

**Environment Variables (.env for backend)**:
```bash
# Backend Development Environment
NODE_ENV=development
PORT=3001

# Database Configuration
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_KEY=your-dev-supabase-key
MONGO_URL=mongodb://localhost:27017/devlab-dev
# OR MongoDB Atlas
# MONGO_URL=mongodb+srv://username:password@dev-cluster.mongodb.net/devlab-dev

# External APIs
GEMINI_API_KEY=your-dev-gemini-key
JUDGE0_API_KEY=your-dev-judge0-key
JUDGE0_API_URL=https://judge0-dev.example.com

# EduCore Microservices (Development URLs)
COURSE_BUILDER_URL=http://localhost:3002
CONTENT_STUDIO_URL=http://localhost:3003
ASSESSMENT_URL=http://localhost:3004
LEARNING_ANALYTICS_URL=http://localhost:3005
RAG_URL=http://localhost:3006

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key-change-in-production
SERVICE_API_KEY=dev-service-api-key

# Logging
LOG_LEVEL=debug
```

**Features**:
- ✅ Hot reload for rapid development
- ✅ Source maps for debugging
- ✅ Detailed error messages
- ✅ Development API keys
- ✅ Local database instances
- ✅ Mock services for unavailable microservices

---

### Testing Environment

**Purpose**: Automated testing and continuous integration

**Configuration**:
- **Frontend**: 
  - Test server: `http://localhost:5174` (different port for tests)
  - Test database: Separate Supabase test project
  - Mock API responses

- **Backend**:
  - Test server: `http://localhost:3002` (different port)
  - Test databases: Separate instances
  - Mock external APIs

**Environment Variables**:
```bash
# Testing Environment
NODE_ENV=test
PORT=3002

# Test Databases
SUPABASE_TEST_URL=https://your-test-project.supabase.co
SUPABASE_TEST_KEY=your-test-supabase-key
MONGO_TEST_URL=mongodb://localhost:27017/devlab-test

# Test API Keys (or mocks)
GEMINI_API_KEY=test-key-or-mock
JUDGE0_API_KEY=test-key-or-mock

# Test Microservices (mocked)
COURSE_BUILDER_URL=http://localhost:3002
CONTENT_STUDIO_URL=http://localhost:3003
# ... (all mocked)

# Test Configuration
CORS_ORIGINS=http://localhost:5174
LOG_LEVEL=error
```

**Features**:
- ✅ Isolated test databases
- ✅ Mock external services
- ✅ Fast test execution
- ✅ Parallel test execution
- ✅ Test coverage reporting

---

### Staging Environment

**Purpose**: Pre-production testing and validation

**Configuration**:
- **Frontend**: 
  - URL: `https://devlab-staging.vercel.app`
  - Production build optimizations
  - Staging API endpoints

- **Backend**:
  - URL: `https://devlab-staging-api.railway.app`
  - Production-like configuration
  - Staging databases

- **Databases**:
  - **Supabase**: Staging project
  - **MongoDB**: Staging cluster

**Environment Variables (Vercel Staging)**:
```bash
VITE_API_URL=https://devlab-staging-api.railway.app
VITE_ENV=staging
```

**Environment Variables (Railway Staging)**:
```bash
NODE_ENV=staging
PORT=3001

SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_KEY=your-staging-supabase-key
MONGO_URL=mongodb+srv://username:password@staging-cluster.mongodb.net/devlab-staging

GEMINI_API_KEY=staging-gemini-key
JUDGE0_API_KEY=staging-judge0-key

COURSE_BUILDER_URL=https://course-builder-staging.railway.app
CONTENT_STUDIO_URL=https://content-studio-staging.railway.app
ASSESSMENT_URL=https://assessment-staging.railway.app
LEARNING_ANALYTICS_URL=https://learning-analytics-staging.railway.app
RAG_URL=https://rag-staging.railway.app

CORS_ORIGINS=https://devlab-staging.vercel.app
LOG_LEVEL=info
```

**Features**:
- ✅ Production-like setup
- ✅ Real external APIs
- ✅ Real microservice integrations
- ✅ Performance testing
- ✅ Security validation

---

### Production Environment

**Purpose**: Live production deployment

**Configuration**:
- **Frontend**: 
  - URL: `https://dev-lab-phi.vercel.app`
  - Production optimizations
  - CDN distribution
  - SSL/TLS encryption

- **Backend**:
  - URL: `devlab-backend-production.up.railway.app`
  - Auto-scaling enabled
  - Production databases
  - High availability

- **Databases**:
  - **Supabase**: Production project
  - **MongoDB Atlas**: Production cluster

**Environment Variables (Vercel Production)**:
```bash
VITE_API_URL=https://devlab-backend-production.up.railway.app
VITE_ENV=production
```

**Environment Variables (Railway Production)**:
```bash
NODE_ENV=production
PORT=3001

SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_KEY=your-production-supabase-key
MONGO_URL=mongodb+srv://username:password@production-cluster.mongodb.net/devlab

GEMINI_API_KEY=production-gemini-key
JUDGE0_API_KEY=production-judge0-key

COURSE_BUILDER_URL=https://course-builder-production.railway.app
CONTENT_STUDIO_URL=https://content-studio-production.railway.app
ASSESSMENT_URL=https://assessment-production.railway.app
LEARNING_ANALYTICS_URL=https://learning-analytics-production.railway.app
RAG_URL=https://rag-production.railway.app

CORS_ORIGINS=https://dev-lab-phi.vercel.app
LOG_LEVEL=warn
```

**Features**:
- ✅ Production optimizations
- ✅ Auto-scaling
- ✅ High availability (99.9% uptime target)
- ✅ SSL/TLS encryption
- ✅ Monitoring and alerting
- ✅ Backup and disaster recovery

---

## CI/CD Pipeline Setup

### GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yml`

**Workflow Stages**:

1. **Lint & Format Check**
   - Run ESLint on frontend and backend
   - Check code formatting (Prettier)
   - Fail if linting errors found

2. **Unit Tests**
   - Run frontend unit tests (Jest + React Testing Library)
   - Run backend unit tests (Jest)
   - Generate coverage reports
   - Fail if coverage < 90%

3. **Integration Tests**
   - Run API integration tests
   - Run database integration tests
   - Test external API integrations (mocked)

4. **Build**
   - Build frontend (Vite production build)
   - Build backend (check for errors)
   - Verify build artifacts

5. **E2E Tests**
   - Run end-to-end tests (Playwright/Cypress)
   - Test complete user flows

6. **Deploy to Staging** (on merge to `develop`)
   - Deploy frontend to Vercel staging
   - Deploy backend to Railway staging
   - Run smoke tests

7. **Deploy to Production** (on merge to `main`)
   - Deploy frontend to Vercel production
   - Deploy backend to Railway production
   - Run smoke tests
   - Health check verification

**Workflow Configuration**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Lint frontend
        run: cd frontend && npm run lint
      - name: Lint backend
        run: cd backend && npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Run frontend tests
        run: cd frontend && npm test -- --coverage
      - name: Run backend tests
        run: cd backend && npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Build frontend
        run: cd frontend && npm run build
      - name: Build backend
        run: cd backend && npm run build

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
      - name: Deploy to Railway (Staging)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
          environment: staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
      - name: Deploy to Railway (Production)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
          environment: production
```

### TDD Integration in CI/CD

**Test-First Requirements**:
- ✅ All tests must pass before deployment
- ✅ Coverage thresholds enforced (>90%)
- ✅ TDD workflow validated (RED-GREEN-REFACTOR)
- ✅ No deployment if tests fail

**Test Execution Order**:
1. Unit tests (fast, isolated)
2. Integration tests (API, database)
3. E2E tests (complete flows)

---

## Testing Infrastructure

### Test Environment Setup

**Test Databases**:
- **Supabase Test Project**: Separate from dev/prod
- **MongoDB Test Database**: Isolated test database
- **Test Data**: Fixtures and seed data

**Mock Services**:
- **MSW (Mock Service Worker)**: API mocking for frontend tests
- **Nock**: HTTP mocking for backend tests
- **Mock External APIs**: Gemini, Judge0, Microservices

**Test Runner Configuration**:

**Frontend (Jest + Vite)**:
```javascript
// vite.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/testSetup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
})
```

**Backend (Jest)**:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js']
}
```

### Test Data Management

**Fixtures**:
- Pre-defined test data in JSON files
- Reusable across tests
- Version controlled

**Seed Data**:
- Database seed scripts
- Consistent test data
- Reset between test runs

**Mock Data Generators**:
- Generate random test data
- Faker.js for realistic data
- Custom generators for domain-specific data

---

## Monitoring & Logging

### Application Logging

**Log Levels**:
- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages
- **ERROR**: Error messages
- **FATAL**: Critical errors

**Logging Framework**: Winston (Node.js)

**Log Configuration**:
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// MongoDB transport for operational logs
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.MongoDB({
    db: process.env.MONGO_URL,
    collection: 'application_logs',
    level: 'info'
  }));
}
```

**Log Storage**:
- **Development**: Console + local files
- **Staging/Production**: MongoDB Atlas (operational_logs collection)
- **Error Logs**: MongoDB Atlas (error_logs collection)

### Performance Monitoring

**Metrics Tracked**:
- Response times
- Request throughput
- Error rates
- Database query performance
- External API call performance

**Monitoring Tools**:
- **Railway Metrics**: Built-in monitoring
- **Vercel Analytics**: Frontend performance
- **Custom Metrics**: MongoDB for custom metrics

### Health Checks

**Health Check Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "gemini": "available",
    "judge0": "available",
    "supabase": "connected",
    "mongodb": "connected"
  },
  "uptime": 3600
}
```

**Health Check Monitoring**:
- Automated health checks every 30 seconds
- Alert on health check failures
- Auto-restart on critical failures

---

## Security Infrastructure

### Access Controls

**Development Environment**:
- Local development (no external access)
- Developer VPN (if remote access needed)
- Environment variable encryption

**Staging Environment**:
- Limited access (developers, QA)
- API key authentication
- Rate limiting enabled

**Production Environment**:
- Restricted access
- API key authentication
- JWT token validation
- Rate limiting (strict)

### Secret Management

**Development**:
- `.env` files (gitignored)
- Environment variable files
- Local secret storage

**Staging/Production**:
- **Vercel**: Environment variables in dashboard
- **Railway**: Environment variables in dashboard
- **GitHub Secrets**: For CI/CD workflows
- **No hardcoded secrets**: All secrets in environment variables

**Secret Rotation**:
- Regular rotation schedule
- Automated rotation for API keys
- Audit trail for secret access

### Encryption

**Data at Rest**:
- Supabase: Encrypted by default
- MongoDB Atlas: Encrypted by default
- Database backups encrypted

**Data in Transit**:
- HTTPS/TLS for all communications
- Encrypted database connections
- Secure API communications

### Security Headers

**Frontend**:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

**Backend**:
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation

---

## Cloud Infrastructure Provisioning

### Vercel Configuration

**Frontend Deployment**:
- Automatic deployments from GitHub
- Branch previews for PRs
- Production deployment from main branch
- Environment variables per environment

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Railway Configuration

**Backend Deployment**:
- Automatic deployments from GitHub
- Environment-based deployments
- Auto-scaling based on load
- Health checks

**Railway Configuration** (`railway.json`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Railway Configuration** (`railway.toml`):
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Database Provisioning

**Supabase**:
- Automatic provisioning via dashboard
- Separate projects per environment
- Automated backups
- Point-in-time recovery

**MongoDB Atlas**:
- Cluster provisioning via dashboard
- Separate clusters per environment
- Automated backups
- Auto-scaling enabled

---

## Development Tools & Workflow Automation

### IDE Configuration

**Recommended IDE**: VS Code

**Extensions**:
- ESLint
- Prettier
- JavaScript/ES6 support
- GitLens
- REST Client
- Thunder Client (API testing)

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript"],
  "javascript.preferences.quoteStyle": "single",
  "files.eol": "\n",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Linting & Formatting

**ESLint Configuration**:
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error'
  }
}
```

**Prettier Configuration**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Workflow

**Branch Strategy**:
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Hotfix branches

**Commit Convention**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

**Pre-commit Hooks**:
- Lint-staged (run linter on staged files)
- Pre-commit (run tests before commit)
- Commit message validation

---

## TDD Environment Setup

### Test Runner Configuration

**Jest Setup**:
- Unit test execution
- Coverage reporting
- Mock support
- Snapshot testing

**React Testing Library Setup**:
- Component testing
- User interaction testing
- Accessibility testing

**Supertest Setup**:
- API endpoint testing
- Request/response validation
- Integration testing

### TDD Workflow Tools

**Watch Mode**:
- Automatic test execution on file changes
- Fast feedback loop
- Continuous testing

**Coverage Tools**:
- Jest coverage reports
- Codecov integration
- Coverage thresholds enforcement

**Test Debugging**:
- VS Code debugger integration
- Breakpoint support
- Step-through debugging

---

## AI/Automation Enhancements

### Environment Validation

**Automated Checks**:
- Environment variable validation
- Database connection validation
- External API connectivity checks
- Configuration validation

### Cost Optimization

**Resource Monitoring**:
- API usage tracking (Gemini, Judge0)
- Database usage monitoring
- Cloud resource optimization
- Cost alerts

### Performance Optimization

**Automated Optimization**:
- Build optimization
- Bundle size optimization
- Database query optimization
- Caching strategies

---

## Validation Checkpoint

✅ **Environment Configuration**: Development, testing, staging, production environments defined  
✅ **CI/CD Pipeline**: Complete GitHub Actions workflow with TDD integration  
✅ **Testing Infrastructure**: Test environment, data management, test runners configured  
✅ **Monitoring & Logging**: Logging framework, monitoring tools, health checks set up  
✅ **Security Infrastructure**: Access controls, secret management, encryption configured  
✅ **Cloud Infrastructure**: Vercel and Railway provisioning configured  
✅ **Development Tools**: IDE, linting, formatting, Git workflow configured  
✅ **TDD Environment**: Test runners, TDD workflow tools, coverage tools set up  
✅ **AI Enhancements**: Environment validation, cost optimization, performance optimization  

---

**Document Status**: ✅ Complete - Ready for Implementation  
**Created**: Development Environment & Infrastructure Setup Phase  
**Next Phase**: Core Development & Implementation


