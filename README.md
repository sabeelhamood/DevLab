# DEVLAB Microservice

An advanced, AI-powered microservice within the EduCore AI learning platform, designed to provide interactive, intelligent learning experiences for organizational employees.

## Overview

DEVLAB provides personalized, practical coding exercises and theoretical questions tailored to individual learners' skill levels, course requirements, and organizational needs. The microservice integrates seamlessly with other EduCore AI services while maintaining independent development and deployment capabilities.

## Key Features

- **AI-Powered Question Generation**: Dynamic, personalized questions using Gemini AI
- **Multi-Language Support**: Python, Java, JavaScript, C++, Go, Rust with syntax highlighting
- **Secure Code Execution**: Sandboxed environment for safe code testing
- **Real-Time Feedback**: AI-generated guidance and improvement suggestions
- **Learning Analytics**: Comprehensive progress tracking and reporting
- **Instructor Tools**: Content management and question repository
- **Microservice Integration**: Seamless data flow with EduCore AI ecosystem

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js 20 + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + MongoDB Atlas
- **Infrastructure**: Vercel + Railway
- **AI Integration**: Gemini API + SandBox API
- **Monitoring**: Application monitoring and logging

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- MongoDB Atlas account
- Vercel account
- Railway account

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd devlab-microservice
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Configure environment variables in Vercel and Railway
   # No .env files needed - all secrets managed through cloud platforms
   ```

3. **Start Development Environment**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm run test
   npm run test:coverage
   ```

## Project Structure

```
devlab-microservice/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── tests/              # Frontend tests
├── backend/                 # Express backend application
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   ├── tests/              # Backend tests
│   └── migrations/         # Database migrations
├── tests/                   # Integration & E2E Tests
│   ├── integration/        # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── fixtures/          # Test data fixtures
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## Development Workflow

### TDD Methodology

This project follows strict Test-Driven Development (TDD) principles:

1. **RED**: Write failing tests first
2. **GREEN**: Implement minimal code to pass tests
3. **REFACTOR**: Optimize and clean code while maintaining tests

### Code Quality

- **TypeScript**: Full type safety across frontend and backend
- **ESLint + Prettier**: Automated code formatting and linting
- **Jest**: Comprehensive testing framework
- **Coverage**: 95% test coverage requirement
- **Pre-commit Hooks**: Automated quality checks

### Git Workflow

1. **Feature Branches**: Create feature branches from `develop`
2. **Pull Requests**: All changes require PR review
3. **Quality Gates**: Automated testing and quality checks
4. **Deployment**: Automated deployment to staging/production

## API Documentation

### Authentication Endpoints

- `POST /api/auth/validate` - Validate JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/roles` - Get user roles

### Question Management

- `GET /api/questions/personalized` - Get personalized questions
- `POST /api/questions/{id}/submit` - Submit code solution
- `GET /api/questions/{id}/feedback` - Get AI feedback

### Learning Analytics

- `GET /api/analytics/learner/{id}` - Get learner progress
- `POST /api/analytics/practice-completion` - Send completion data
- `GET /api/analytics/dashboard` - Get analytics dashboard

## External Integrations

### EduCore AI Services

- **Directory Service**: Learner profiles and quotas
- **Authentication Service**: JWT validation and user roles
- **Assessment Service**: Theoretical questions and code questions
- **Content Studio**: GPT-generated and trainer questions
- **Learning Analytics**: Progress tracking and reporting
- **HR Reporting**: Practice levels and competencies
- **Contextual Assistant**: Performance insights and chatbot

### AI Services

- **Gemini API**: Question generation and feedback
- **SandBox API**: Secure code execution

## Monitoring & Observability

- **Application Monitoring**: Performance and error tracking
- **Logging**: Comprehensive logging with MongoDB Atlas
- **Health Checks**: Automated health monitoring
- **Analytics**: Learning analytics and reporting

## Security

- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Role-based access control
- **Sandbox Isolation**: Secure code execution
- **Data Encryption**: At rest and in transit
- **Security Scanning**: Automated vulnerability detection

## Performance

- **Response Time**: < 2 seconds for code execution
- **Concurrent Users**: 10,000+ supported
- **Auto-scaling**: Railway auto-scaling
- **Caching**: Redis for performance optimization
- **CDN**: Vercel global CDN

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TDD methodology
4. Ensure 95% test coverage
5. Submit a pull request

## License

This project is proprietary software developed for EduCore AI learning platform.

## Support

For technical support and questions, please contact the development team or create an issue in the repository.