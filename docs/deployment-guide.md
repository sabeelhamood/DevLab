# DEVLAB Microservice - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the DEVLAB microservice across different environments, from local development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js**: Version 20 or higher
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **kubectl**: Version 1.28 or higher
- **AWS CLI**: Version 2.0 or higher
- **Terraform**: Version 1.0 or higher

### Required Accounts

- **GitHub**: For repository access and CI/CD
- **AWS**: For cloud infrastructure
- **Docker Hub/GitHub Container Registry**: For container images

### Required Permissions

- **AWS IAM**: EKS, RDS, ElastiCache, S3 permissions
- **Kubernetes**: Cluster admin access
- **GitHub**: Repository write access

## Local Development

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/educore-ai/devlab-microservice.git
cd devlab-microservice

# Install dependencies
npm run install:all
```

### 2. Environment Configuration

Create environment files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env.local
```

Configure environment variables:

```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=devlab
DATABASE_PASSWORD=password
DATABASE_NAME=devlab_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
AUTH_SERVICE_URL=http://localhost:3001
DIRECTORY_SERVICE_URL=http://localhost:3002
GEMINI_API_KEY=your-gemini-api-key
SANDBOX_API_URL=http://localhost:3004

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
docker-compose up --build

# Or start services individually
npm run start:all
```

### 4. Verify Deployment

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 5. Run Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Staging Deployment

### 1. Infrastructure Setup

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan -var="environment=staging" -var="db_password=your-secure-password"

# Apply infrastructure
terraform apply -var="environment=staging" -var="db_password=your-secure-password"
```

### 2. Configure kubectl

```bash
# Update kubeconfig for staging
aws eks update-kubeconfig --region us-west-2 --name devlab-staging

# Verify cluster access
kubectl get nodes
```

### 3. Deploy Application

```bash
# Create namespace
kubectl apply -f k8s/staging/namespace.yaml

# Deploy secrets
kubectl apply -f k8s/staging/secrets.yaml

# Deploy configmap
kubectl apply -f k8s/staging/configmap.yaml

# Deploy backend
kubectl apply -f k8s/staging/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/staging/frontend-deployment.yaml

# Deploy services
kubectl apply -f k8s/staging/services.yaml

# Deploy ingress
kubectl apply -f k8s/staging/ingress.yaml
```

### 4. Verify Staging Deployment

```bash
# Check pod status
kubectl get pods -n devlab-staging

# Check services
kubectl get services -n devlab-staging

# Check ingress
kubectl get ingress -n devlab-staging

# Check logs
kubectl logs -f deployment/devlab-backend -n devlab-staging
kubectl logs -f deployment/devlab-frontend -n devlab-staging
```

### 5. Run Smoke Tests

```bash
# Get ingress URL
INGRESS_URL=$(kubectl get ingress devlab-ingress -n devlab-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoints
curl https://$INGRESS_URL/health
curl https://$INGRESS_URL/api/health

# Test authentication
curl -X POST https://$INGRESS_URL/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'
```

## Production Deployment

### 1. Infrastructure Setup

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan -var="environment=production" -var="db_password=your-secure-password"

# Apply infrastructure
terraform apply -var="environment=production" -var="db_password=your-secure-password"
```

### 2. Configure kubectl

```bash
# Update kubeconfig for production
aws eks update-kubeconfig --region us-west-2 --name devlab-production

# Verify cluster access
kubectl get nodes
```

### 3. Deploy Application

```bash
# Create namespace
kubectl apply -f k8s/production/namespace.yaml

# Deploy secrets
kubectl apply -f k8s/production/secrets.yaml

# Deploy configmap
kubectl apply -f k8s/production/configmap.yaml

# Deploy backend
kubectl apply -f k8s/production/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/production/frontend-deployment.yaml

# Deploy services
kubectl apply -f k8s/production/services.yaml

# Deploy ingress
kubectl apply -f k8s/production/ingress.yaml
```

### 4. Configure Monitoring

```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Deploy ELK Stack
kubectl apply -f k8s/monitoring/elk-stack.yaml
```

### 5. Verify Production Deployment

```bash
# Check pod status
kubectl get pods -n devlab-production

# Check services
kubectl get services -n devlab-production

# Check ingress
kubectl get ingress -n devlab-production

# Check resource usage
kubectl top pods -n devlab-production

# Check logs
kubectl logs -f deployment/devlab-backend -n devlab-production
kubectl logs -f deployment/devlab-frontend -n devlab-production
```

### 6. Run Production Tests

```bash
# Get ingress URL
INGRESS_URL=$(kubectl get ingress devlab-ingress -n devlab-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoints
curl https://$INGRESS_URL/health
curl https://$INGRESS_URL/api/health

# Test authentication
curl -X POST https://$INGRESS_URL/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'

# Test question endpoints
curl -H "Authorization: Bearer test-token" \
  https://$INGRESS_URL/api/questions/personalized
```

## Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Check application health
kubectl get pods -n devlab-production
kubectl describe pod devlab-backend-xxx -n devlab-production

# Check resource usage
kubectl top pods -n devlab-production
kubectl top nodes

# Check events
kubectl get events -n devlab-production --sort-by='.lastTimestamp'
```

### 2. Log Monitoring

```bash
# View application logs
kubectl logs -f deployment/devlab-backend -n devlab-production
kubectl logs -f deployment/devlab-frontend -n devlab-production

# View system logs
kubectl logs -f deployment/devlab-postgres -n devlab-production
kubectl logs -f deployment/devlab-redis -n devlab-production
```

### 3. Performance Monitoring

```bash
# Check database performance
kubectl exec -it devlab-postgres-xxx -n devlab-production -- psql -U devlab_user -d devlab_production -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
kubectl exec -it devlab-redis-xxx -n devlab-production -- redis-cli info stats
```

### 4. Security Monitoring

```bash
# Check security events
kubectl logs -f deployment/devlab-backend -n devlab-production | grep "security"

# Check audit logs
kubectl logs -f deployment/devlab-backend -n devlab-production | grep "audit"
```

### 5. Backup and Recovery

```bash
# Database backup
kubectl exec -it devlab-postgres-xxx -n devlab-production -- pg_dump -U devlab_user devlab_production > backup.sql

# Redis backup
kubectl exec -it devlab-redis-xxx -n devlab-production -- redis-cli BGSAVE
```

## Troubleshooting

### Common Issues

#### 1. Pod Startup Issues

```bash
# Check pod status
kubectl get pods -n devlab-production

# Check pod events
kubectl describe pod devlab-backend-xxx -n devlab-production

# Check pod logs
kubectl logs devlab-backend-xxx -n devlab-production
```

#### 2. Database Connection Issues

```bash
# Check database connectivity
kubectl exec -it devlab-backend-xxx -n devlab-production -- nc -zv devlab-postgres-service 5432

# Check database logs
kubectl logs -f deployment/devlab-postgres -n devlab-production

# Check database status
kubectl exec -it devlab-postgres-xxx -n devlab-production -- psql -U devlab_user -d devlab_production -c "SELECT version();"
```

#### 3. Redis Connection Issues

```bash
# Check Redis connectivity
kubectl exec -it devlab-backend-xxx -n devlab-production -- redis-cli -h devlab-redis-service ping

# Check Redis logs
kubectl logs -f deployment/devlab-redis -n devlab-production

# Check Redis status
kubectl exec -it devlab-redis-xxx -n devlab-production -- redis-cli info
```

#### 4. Authentication Issues

```bash
# Check JWT configuration
kubectl get configmap devlab-config -n devlab-production -o yaml

# Check authentication logs
kubectl logs -f deployment/devlab-backend -n devlab-production | grep "auth"

# Test authentication endpoint
curl -X POST https://$INGRESS_URL/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'
```

#### 5. Performance Issues

```bash
# Check resource usage
kubectl top pods -n devlab-production
kubectl top nodes

# Check slow queries
kubectl exec -it devlab-postgres-xxx -n devlab-production -- psql -U devlab_user -d devlab_production -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check Redis memory usage
kubectl exec -it devlab-redis-xxx -n devlab-production -- redis-cli info memory
```

### Debug Commands

```bash
# Get pod details
kubectl describe pod devlab-backend-xxx -n devlab-production

# Get service details
kubectl describe service devlab-backend-service -n devlab-production

# Get ingress details
kubectl describe ingress devlab-ingress -n devlab-production

# Get events
kubectl get events -n devlab-production --sort-by='.lastTimestamp'

# Get resource usage
kubectl top pods -n devlab-production
kubectl top nodes

# Get logs
kubectl logs -f deployment/devlab-backend -n devlab-production
kubectl logs -f deployment/devlab-frontend -n devlab-production
```

### Rollback Procedures

```bash
# Rollback deployment
kubectl rollout undo deployment/devlab-backend -n devlab-production
kubectl rollout undo deployment/devlab-frontend -n devlab-production

# Check rollout status
kubectl rollout status deployment/devlab-backend -n devlab-production
kubectl rollout status deployment/devlab-frontend -n devlab-production

# Rollback to specific revision
kubectl rollout undo deployment/devlab-backend --to-revision=2 -n devlab-production
```

### Scaling Procedures

```bash
# Scale up deployment
kubectl scale deployment devlab-backend --replicas=5 -n devlab-production
kubectl scale deployment devlab-frontend --replicas=5 -n devlab-production

# Check scaling status
kubectl get pods -n devlab-production

# Scale down deployment
kubectl scale deployment devlab-backend --replicas=3 -n devlab-production
kubectl scale deployment devlab-frontend --replicas=3 -n devlab-production
```

## Best Practices

### 1. Security

- Use strong passwords and secrets
- Enable encryption at rest and in transit
- Implement proper access controls
- Regular security audits
- Monitor for security events

### 2. Performance

- Monitor resource usage
- Implement proper caching
- Optimize database queries
- Use CDN for static assets
- Implement horizontal scaling

### 3. Reliability

- Implement health checks
- Use rolling deployments
- Implement proper backup procedures
- Monitor system health
- Implement alerting

### 4. Maintenance

- Regular updates and patches
- Monitor system performance
- Implement proper logging
- Regular security audits
- Document all changes

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: EduCore AI DevOps Team
