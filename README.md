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

- **Frontend**: React 18 + TypeScript + Next.js 14
- **Backend**: Node.js 20 + NestJS + TypeScript
- **Database**: PostgreSQL + Redis + MongoDB
- **Infrastructure**: Kubernetes + Docker + AWS
- **AI Integration**: Gemini API + SandBox API
- **Monitoring**: Prometheus + Grafana + ELK Stack

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kubernetes (minikube/Docker Desktop)
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd devlab-microservice
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure environment variables
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

### Docker Development

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Stop services
npm run docker:down
```

### Kubernetes Deployment

```bash
# Deploy to local Kubernetes
npm run k8s:deploy

# Remove deployment
npm run k8s:delete
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
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── shared/         # Shared utilities
│   │   └── config/         # Configuration files
│   ├── tests/              # Backend tests
│   └── migrations/         # Database migrations
├── infrastructure/          # Infrastructure as Code
│   ├── kubernetes/         # K8s manifests
│   ├── terraform/          # Terraform configurations
│   └── docker/             # Docker configurations
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

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation and analysis
- **Jaeger**: Distributed tracing
- **Health Checks**: Automated health monitoring

## Security

- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Role-based access control
- **Sandbox Isolation**: Secure code execution
- **Data Encryption**: At rest and in transit
- **Security Scanning**: Automated vulnerability detection

## Performance

- **Response Time**: < 2 seconds for code execution
- **Concurrent Users**: 10,000+ supported
- **Auto-scaling**: Kubernetes HPA
- **Caching**: Redis for performance optimization
- **CDN**: Global content delivery

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