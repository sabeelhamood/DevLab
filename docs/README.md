# DEVLAB Microservice - Complete Documentation

## Overview

The DEVLAB Microservice is an advanced, AI-powered interactive learning environment designed for employees in large organizations. It provides personalized coding challenges, real-time feedback, and comprehensive learning analytics within the broader EduCore AI learning platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [API Documentation](#api-documentation)
4. [Deployment Guide](#deployment-guide)
5. [Security](#security)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kubernetes 1.28+
- AWS CLI (for cloud deployment)
- Terraform 1.0+ (for infrastructure)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/educore-ai/devlab-microservice.git
   cd devlab-microservice
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development environment**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

### Development Setup

1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Run Tests**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm test
   
   # All tests
   npm run test:all
   ```

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVLAB Microservice                     │
├─────────────────────────────────────────────────────────────┤
│ Frontend (Next.js)          │ Backend (NestJS)             │
│ - React 18+                 │ - TypeScript                 │
│ - TypeScript                │ - Express.js                 │
│ - Tailwind CSS              │ - PostgreSQL                 │
│ - Zustand                   │ - Redis                      │
│ - React Query               │ - JWT Authentication        │
└─────────────────────────────────────────────────────────────┘
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│ Auth Service │ Directory │ Content Studio │ Assessment     │
│ Skills Engine │ Learner AI │ Gemini AI │ Sandbox API      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Testing**: Jest, React Testing Library

#### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT
- **Testing**: Jest, Supertest

#### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Cloud**: AWS
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitHub Actions

## API Documentation

### Authentication Endpoints

#### POST /api/auth/validate
Validate JWT token and return user information.

**Request:**
```json
{
  "token": "jwt_token_here"
}
```

**Response:**
```json
{
  "valid": true,
  "userId": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["learner"],
  "organizationId": "org-123",
  "skillLevel": 3,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### POST /api/auth/refresh
Refresh JWT token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "valid": true,
  "userId": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["learner"],
  "organizationId": "org-123",
  "skillLevel": 3,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Question Endpoints

#### GET /api/questions/personalized
Get personalized questions for a learner.

**Query Parameters:**
- `topic` (optional): Question topic
- `language` (optional): Programming language
- `limit` (optional): Number of questions (default: 10)

**Response:**
```json
{
  "questions": [
    {
      "id": "question-123",
      "title": "Binary Search Implementation",
      "description": "Implement binary search algorithm",
      "difficulty_level": 3,
      "programming_language": "python",
      "question_type": "coding",
      "topic": "algorithms",
      "micro_skills": ["binary-search"],
      "nano_skills": ["recursion"],
      "test_cases": [
        {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        }
      ],
      "hints": ["Use recursion", "Compare middle element"],
      "ai_validated": true,
      "quality_score": 0.85
    }
  ],
  "total_count": 1,
  "has_more": false,
  "learner_profile": {
    "skill_level": 3,
    "daily_quota_used": 5,
    "daily_quota_remaining": 45
  }
}
```

#### POST /api/questions/:id/submit
Submit code solution for a question.

**Request:**
```json
{
  "code": "def binary_search(arr, target):\n    # Implementation here\n    pass",
  "language": "python"
}
```

**Response:**
```json
{
  "execution_result": {
    "success": true,
    "output": "2",
    "error_message": null,
    "execution_time": 150,
    "memory_usage": 1024,
    "test_results": [
      {
        "test_case": {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        },
        "passed": true,
        "actual_output": "2",
        "execution_time": 150
      }
    ]
  },
  "feedback": {
    "feedback": "Great job! Your solution is efficient and well-structured.",
    "suggestions": [
      "Consider adding input validation",
      "You could optimize the space complexity"
    ],
    "score": 0.85,
    "skill_improvement": {
      "binary_search": 0.1,
      "recursion": 0.05
    },
    "insights": [
      "Strong understanding of binary search",
      "Good use of recursion",
      "Consider edge cases"
    ]
  },
  "score": 0.85,
  "session_status": "completed",
  "attempts_remaining": 2
}
```

### Learning Session Endpoints

#### GET /api/questions/sessions
Get learning sessions for a learner.

**Query Parameters:**
- `status` (optional): Session status filter
- `limit` (optional): Number of sessions (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-123",
      "learner_id": "user-123",
      "question_id": "question-123",
      "session_start": "2024-01-01T10:00:00Z",
      "session_end": "2024-01-01T10:30:00Z",
      "status": "completed",
      "attempts": 1,
      "max_attempts": 3,
      "score": 0.85,
      "ai_feedback": "Great job! Your solution is efficient and well-structured.",
      "question": {
        "id": "question-123",
        "title": "Binary Search Implementation",
        "difficulty_level": 3,
        "programming_language": "python"
      }
    }
  ],
  "total_count": 1,
  "has_more": false
}
```

#### GET /api/questions/sessions/:sessionId
Get specific learning session details.

**Response:**
```json
{
  "id": "session-123",
  "learner_id": "user-123",
  "question_id": "question-123",
  "session_start": "2024-01-01T10:00:00Z",
  "session_end": "2024-01-01T10:30:00Z",
  "status": "completed",
  "attempts": 1,
  "max_attempts": 3,
  "score": 0.85,
  "ai_feedback": "Great job! Your solution is efficient and well-structured.",
  "code_submissions": [
    {
      "code": "def binary_search(arr, target):\n    # Implementation here\n    pass",
      "language": "python",
      "submitted_at": "2024-01-01T10:15:00Z"
    }
  ],
  "execution_results": {
    "success": true,
    "output": "2",
    "execution_time": 150,
    "test_results": [
      {
        "test_case": {
          "input": "[1, 2, 3, 4, 5], 3",
          "expected_output": "2",
          "is_hidden": false
        },
        "passed": true,
        "actual_output": "2",
        "execution_time": 150
      }
    ]
  },
  "question": {
    "id": "question-123",
    "title": "Binary Search Implementation",
    "description": "Implement binary search algorithm",
    "difficulty_level": 3,
    "programming_language": "python",
    "question_type": "coding",
    "topic": "algorithms",
    "micro_skills": ["binary-search"],
    "nano_skills": ["recursion"],
    "test_cases": [
      {
        "input": "[1, 2, 3, 4, 5], 3",
        "expected_output": "2",
        "is_hidden": false
      }
    ],
    "hints": ["Use recursion", "Compare middle element"],
    "ai_validated": true,
    "quality_score": 0.85
  }
}
```

## Deployment Guide

### Local Development

1. **Prerequisites**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Environment Setup**
   ```bash
   # Clone repository
   git clone https://github.com/educore-ai/devlab-microservice.git
   cd devlab-microservice
   
   # Install dependencies
   npm run install:all
   
   # Start services
   docker-compose up --build
   ```

### Staging Deployment

1. **Prerequisites**
   - AWS CLI configured
   - kubectl configured
   - Terraform installed

2. **Deploy Infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan -var="environment=staging"
   terraform apply -var="environment=staging"
   ```

3. **Deploy Application**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --region us-west-2 --name devlab-staging
   
   # Deploy to Kubernetes
   kubectl apply -f k8s/staging/
   ```

### Production Deployment

1. **Infrastructure Deployment**
   ```bash
   cd terraform
   terraform init
   terraform plan -var="environment=production"
   terraform apply -var="environment=production"
   ```

2. **Application Deployment**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --region us-west-2 --name devlab-production
   
   # Deploy to Kubernetes
   kubectl apply -f k8s/production/
   ```

3. **Verify Deployment**
   ```bash
   # Check pods
   kubectl get pods -n devlab-production
   
   # Check services
   kubectl get services -n devlab-production
   
   # Check ingress
   kubectl get ingress -n devlab-production
   ```

## Security

### Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: AES-256-GCM encryption for data at rest and in transit
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Advanced rate limiting and abuse prevention
- **Threat Detection**: Real-time threat detection and behavioral analysis
- **Audit Logging**: Comprehensive audit logging and compliance tracking

### Security Configuration

1. **Environment Variables**
   ```bash
   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   
   # Encryption
   ENCRYPTION_KEY=your-encryption-key
   
   # Security Settings
   SECURITY_RATE_LIMIT=100
   SECURITY_SESSION_TIMEOUT=3600000
   SECURITY_SUSPICIOUS_THRESHOLD=10
   ```

2. **Security Headers**
   ```bash
   # CORS Configuration
   CORS_ORIGIN=https://devlab.educore-ai.com
   CORS_CREDENTIALS=true
   
   # Security Headers
   SECURITY_HEADERS_ENABLED=true
   CSP_ENABLED=true
   HSTS_ENABLED=true
   ```

### Compliance

- **GDPR**: Data protection and privacy rights
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Security, availability, and processing integrity
- **OWASP Top 10**: Protection against common web vulnerabilities

## Monitoring

### Health Checks

- **Backend Health**: `GET /health`
- **Frontend Health**: `GET /`
- **Database Health**: Connection and query performance
- **Redis Health**: Connection and memory usage

### Metrics

- **Application Metrics**: Request count, response time, error rate
- **Business Metrics**: User engagement, learning progress
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Security Metrics**: Threat detection, audit events

### Logging

- **Application Logs**: Structured logging with correlation IDs
- **Audit Logs**: Security events and user actions
- **Error Logs**: Exception tracking and debugging
- **Performance Logs**: Slow queries and performance bottlenecks

### Alerting

- **Critical Alerts**: System down, security breaches
- **Warning Alerts**: High error rates, performance issues
- **Info Alerts**: Deployment notifications, maintenance windows

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   kubectl exec -it devlab-backend-xxx -- nc -zv devlab-postgres-service 5432
   
   # Check database logs
   kubectl logs -f devlab-postgres-xxx
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis connectivity
   kubectl exec -it devlab-backend-xxx -- redis-cli -h devlab-redis-service ping
   
   # Check Redis logs
   kubectl logs -f devlab-redis-xxx
   ```

3. **Authentication Issues**
   ```bash
   # Check JWT configuration
   kubectl get configmap devlab-config -o yaml
   
   # Check authentication logs
   kubectl logs -f devlab-backend-xxx | grep "auth"
   ```

### Debug Commands

```bash
# Check pod status
kubectl get pods -n devlab-production

# Check service endpoints
kubectl get endpoints -n devlab-production

# Check ingress configuration
kubectl describe ingress devlab-ingress -n devlab-production

# Check resource usage
kubectl top pods -n devlab-production

# Check logs
kubectl logs -f devlab-backend-xxx -n devlab-production
kubectl logs -f devlab-frontend-xxx -n devlab-production
```

### Performance Optimization

1. **Database Optimization**
   - Index optimization
   - Query performance tuning
   - Connection pooling

2. **Caching Strategy**
   - Redis cache optimization
   - Application-level caching
   - CDN configuration

3. **Scaling**
   - Horizontal pod autoscaling
   - Database read replicas
   - Load balancer configuration

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes and commit**
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a pull request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with security rules
- **Prettier**: Code formatting
- **Jest**: Unit and integration tests
- **Security**: OWASP Top 10 compliance

### Testing

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security
```

### Documentation

- **API Documentation**: OpenAPI/Swagger specifications
- **Code Documentation**: JSDoc comments
- **Architecture Documentation**: System design and diagrams
- **Deployment Documentation**: Step-by-step deployment guides

## Support

### Getting Help

- **Documentation**: Check this documentation first
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Security**: Report security issues privately

### Contact Information

- **Email**: support@educore-ai.com
- **Slack**: #devlab-support
- **GitHub**: https://github.com/educore-ai/devlab-microservice

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**License**: MIT
