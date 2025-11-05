# Deployment Handover - DEVLAB Microservice

## Executive Summary

This document provides the final deployment handover information for the DEVLAB Microservice, including localhost testing instructions, deployment prerequisites, production deployment checklist, monitoring setup, and operational runbooks. **This project is ready for localhost testing. No deployment to production will occur until localhost testing is complete and approved.**

---

## Localhost Testing Guide

### Prerequisites for Localhost Testing

**Required Software**:
- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- Git (for version control)

**Required Accounts** (for full functionality):
- Supabase account (free tier available)
- MongoDB Atlas account (free tier available)
- Gemini API key (Google AI Studio)
- Judge0 API key (RapidAPI)

**Optional** (for local development):
- MongoDB local installation (alternative to Atlas)
- VS Code or preferred IDE

### Step-by-Step Localhost Setup

#### 1. Verify Project Structure

Ensure you have the following structure:
```
DevLab/
├── backend/
│   ├── src/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── tests/
├── README.md
└── SETUP_GUIDE.md
```

#### 2. Install Dependencies

**Backend**:
```bash
cd backend
npm install
```

**Frontend**:
```bash
cd frontend
npm install
```

#### 3. Configure Environment Variables

**Backend** - Create `backend/.env`:
```env
# Environment
NODE_ENV=development
PORT=3001

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
MONGO_URL=mongodb://localhost:27017/devlab-dev
# OR MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/devlab-dev

# External APIs
GEMINI_API_KEY=your-gemini-api-key
JUDGE0_API_KEY=your-judge0-api-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# EduCore Microservices (use localhost for local testing)
COURSE_BUILDER_URL=http://localhost:3002
CONTENT_STUDIO_URL=http://localhost:3003
ASSESSMENT_URL=http://localhost:3004
LEARNING_ANALYTICS_URL=http://localhost:3005
RAG_URL=http://localhost:3006

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key-change-in-production
SERVICE_API_KEY=dev-service-api-key
MICROSERVICE_API_KEYS=dev-api-key-1,dev-api-key-2

# Logging
LOG_LEVEL=debug
```

**Frontend** - Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

#### 4. Start Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

Expected output:
```
DEVLAB Backend Server running on port 3001
Connected to Supabase
Connected to MongoDB
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### 5. Test the Application

**Open Browser**: http://localhost:5173

**Test Checklist**:
- [ ] Frontend loads successfully
- [ ] Header with navigation visible
- [ ] Theme toggle works (day/night mode)
- [ ] Practice page accessible
- [ ] Competition page accessible
- [ ] Backend health check: http://localhost:3001/health
- [ ] API root: http://localhost:3001/ (should return API info)

#### 6. Test API Endpoints

**Health Check**:
```bash
curl http://localhost:3001/health
```

**API Root**:
```bash
curl http://localhost:3001/
```

**Expected Response**:
```json
{
  "message": "DEVLAB Microservice API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## Localhost Testing Checklist

### Basic Functionality

- [ ] Frontend loads without errors
- [ ] Backend starts without errors
- [ ] Database connections successful
- [ ] API endpoints respond
- [ ] CORS configured correctly
- [ ] Theme toggle works
- [ ] Navigation works

### Feature Testing (Requires API Keys)

- [ ] Question generation (requires Gemini API key)
- [ ] Code execution (requires Judge0 API key)
- [ ] Feedback generation (requires Gemini API key)
- [ ] Hint system (requires Gemini API key)
- [ ] Competition system (requires database setup)

### Error Handling

- [ ] Invalid API requests return proper errors
- [ ] Missing environment variables handled gracefully
- [ ] Database connection errors handled
- [ ] API timeout errors handled

---

## Troubleshooting Localhost Issues

### Common Issues and Solutions

#### Issue 1: Backend Won't Start

**Symptoms**: Error starting backend server

**Solutions**:
1. Check Node.js version: `node --version` (should be 18+)
2. Check if port 3001 is available: `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Mac/Linux)
3. Verify environment variables in `backend/.env`
4. Check for missing dependencies: `cd backend && npm install`

#### Issue 2: Frontend Won't Start

**Symptoms**: Error starting frontend server

**Solutions**:
1. Check if port 5173 is available
2. Verify `frontend/.env.local` exists and has `VITE_API_URL`
3. Check for missing dependencies: `cd frontend && npm install`
4. Clear Vite cache: `cd frontend && rm -rf node_modules/.vite`

#### Issue 3: Database Connection Errors

**Symptoms**: Supabase or MongoDB connection failures

**Solutions**:
1. Verify database URLs in `backend/.env`
2. Check database credentials
3. For MongoDB Atlas: Verify IP whitelist includes your IP
4. For local MongoDB: Ensure MongoDB service is running

#### Issue 4: CORS Errors

**Symptoms**: CORS errors in browser console

**Solutions**:
1. Verify `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173`
2. Restart backend server after changing CORS settings
3. Clear browser cache

#### Issue 5: API Key Errors

**Symptoms**: 401/403 errors from external APIs

**Solutions**:
1. Verify API keys in `backend/.env`
2. Check API key validity
3. Verify API quotas not exceeded
4. For Judge0: Check RapidAPI subscription status

---

## Deployment Prerequisites

### Production Environment Requirements

**Infrastructure**:
- **Frontend Hosting**: Vercel (https://dev-lab-phi.vercel.app/)
- **Backend Hosting**: Railway (devlab-backend-production.up.railway.app)
- **Database**: Supabase (PostgreSQL) + MongoDB Atlas

**Domain Configuration**:
- Frontend: `https://dev-lab-phi.vercel.app/`
- Backend: `devlab-backend-production.up.railway.app`

**Environment Variables** (Production):

**Backend** (Railway):
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=<production-url>
SUPABASE_KEY=<production-key>
MONGO_URL=<production-mongodb-url>
GEMINI_API_KEY=<production-key>
JUDGE0_API_KEY=<production-key>
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
CORS_ORIGINS=https://dev-lab-phi.vercel.app
JWT_SECRET=<strong-production-secret>
SERVICE_API_KEY=<production-api-key>
MICROSERVICE_API_KEYS=<production-keys>
LOG_LEVEL=info
```

**Frontend** (Vercel):
```env
VITE_API_URL=https://devlab-backend-production.up.railway.app
VITE_ENV=production
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] API keys rotated (if needed)
- [ ] Documentation updated

### Deployment

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database connections verified
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Monitoring configured

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Performance metrics verified
- [ ] Error logs reviewed
- [ ] User acceptance testing completed
- [ ] Rollback plan ready (if needed)

---

## Monitoring & Observability

### Monitoring Setup

**Application Monitoring**:
- Winston logging (backend)
- Console logging (development)
- File logging (production)
- MongoDB error logging

**Health Checks**:
- Backend: `/health` endpoint
- Database connectivity
- External API availability

**Metrics to Monitor**:
- API response times
- Error rates
- Database query performance
- External API response times
- Code execution success rate

### Logging

**Log Levels**:
- `error`: Critical errors requiring attention
- `warn`: Warning messages
- `info`: General information
- `debug`: Detailed debugging information (development only)

**Log Locations**:
- Development: Console output
- Production: `backend/logs/` directory + MongoDB

---

## Operational Runbooks

### Runbook 1: Service Restart

**Scenario**: Service needs restart

**Steps**:
1. Check current status: `curl http://localhost:3001/health`
2. Stop service: `Ctrl+C` in terminal
3. Start service: `npm run dev` (backend) or `npm run dev` (frontend)
4. Verify health: `curl http://localhost:3001/health`

### Runbook 2: Database Connection Issues

**Scenario**: Database connection fails

**Steps**:
1. Verify database URLs in `.env`
2. Check database credentials
3. Test database connectivity
4. Check network connectivity
5. Review error logs

### Runbook 3: API Key Rotation

**Scenario**: API keys need rotation

**Steps**:
1. Generate new API keys
2. Update `.env` files
3. Test with new keys
4. Restart services
5. Verify functionality

### Runbook 4: Rollback Procedure

**Scenario**: Need to rollback deployment

**Steps**:
1. Identify previous working version
2. Stop current service
3. Deploy previous version
4. Verify functionality
5. Document rollback reason

---

## Support & Documentation

### Documentation Locations

- **Project Foundation**: `PROJECT_FOUNDATION.md`
- **Requirements**: `REQUIREMENTS_DISCOVERY.md`
- **Architecture**: `ARCHITECTURE_DESIGN.md`
- **Feature Planning**: `FEATURE_PLANNING.md`
- **Environment Setup**: `ENVIRONMENT_SETUP.md`
- **Core Development**: `CORE_DEVELOPMENT.md`
- **Code Review**: `CODE_REVIEW.md`
- **Testing Strategy**: `TESTING_STRATEGY.md`
- **Security & Compliance**: `SECURITY_COMPLIANCE.md`
- **Setup Guide**: `SETUP_GUIDE.md`
- **README**: `README.md`

### Key Contacts

- **Development Team**: DEVLAB Development Team
- **DevOps Team**: DevOps Team
- **Security Team**: Security Team

---

## Deployment Status

### Current Status

✅ **Development Phase**: Complete  
✅ **Code Review**: Complete  
✅ **Testing Strategy**: Complete  
✅ **Security Implementation**: Complete  
✅ **Localhost Ready**: ✅ Ready for Testing  
⏳ **Production Deployment**: Pending Localhost Testing Approval  

### Next Steps

1. **Localhost Testing** (Current Phase):
   - Test all functionality locally
   - Verify all features work
   - Fix any issues found
   - Approve for production deployment

2. **Production Deployment** (After Approval):
   - Deploy to Vercel (frontend)
   - Deploy to Railway (backend)
   - Configure production environment variables
   - Run smoke tests
   - Monitor for issues

---

## Important Notes

### ⚠️ No GitHub Push

**As requested, this project has NOT been pushed to GitHub.**
- All code is local only
- No remote repository exists
- Ready for localhost testing
- Will push only after localhost testing approval

### 🔒 Security Considerations

- **Never commit `.env` files** to version control
- **Never commit API keys** to code
- **Use environment variables** for all secrets
- **Rotate keys** before production deployment

### 📝 Testing Priority

**Before Production Deployment**:
1. ✅ Test locally (localhost)
2. ✅ Fix any issues
3. ✅ Verify all features
4. ✅ Security review
5. ✅ Performance testing
6. ✅ User acceptance testing

---

## Validation Checkpoint

✅ **Localhost Setup Guide**: Complete instructions provided  
✅ **Troubleshooting Guide**: Common issues and solutions documented  
✅ **Deployment Prerequisites**: Production requirements defined  
✅ **Production Checklist**: Pre/during/post deployment checklist  
✅ **Monitoring Setup**: Logging and monitoring configured  
✅ **Operational Runbooks**: Common scenarios documented  
✅ **Documentation**: All phase documents complete  
✅ **No GitHub Push**: Code remains local as requested  

---

**Document Status**: ✅ Complete - Ready for Localhost Testing  
**Created**: Deployment Handover Phase (Phase 9)  
**Next Action**: Localhost Testing & Approval  

**🚀 Ready to test on localhost! Follow the setup guide above to get started.**




