# DevLab Microservices Integration

## 🔗 **Real Microservices Integration Complete!**

DevLab has been updated to integrate with real microservices as specified by your development team. Each service includes both real API endpoints and fallback mock data.

## 📋 **Microservices Integration Summary:**

### 1. **Directory Service** (Port 3002)
- **Purpose**: User profiles, organizations, quotas
- **Data Received**: `first_name`, `last_name`, `role`, `email`, `organizationId`, `completed_courses`, `active_courses`, `question_quotas`
- **Endpoints**:
  - `GET /api/users/{userId}` - Get user profile
- **Fallback**: Mock data if service unavailable

### 2. **Content Studio Service** (Port 3003)
- **Purpose**: Course and topic management
- **Data Received**: `course_name`, `course_id`, `topic_name`, `topic_id`, `question_type`, `macro_skills`, `nano_skills`, `course_level`, `organizationId`
- **Endpoints**:
  - `GET /api/courses` - Get all courses
  - `GET /api/courses/{courseId}/topics` - Get topics for course
- **Fallback**: Mock data if service unavailable

### 3. **Assessment Service** (Port 3004)
- **Purpose**: Question generation (HTML content)
- **Data Received**: HTML content for theoretical and coding questions
- **Endpoints**:
  - `POST /api/questions/theoretical` - Get theoretical question HTML
  - `POST /api/questions/coding` - Get coding question HTML
- **Parameters**: `course_name`, `topic`, `nano_skills`, `macro_skills`
- **Fallback**: Mock HTML content if service unavailable

### 4. **HR Reporting Service** (Port 3005) - OUTBOUND ONLY
- **Purpose**: Send practice level data to HR
- **Data Sent**: `user_id`, `practice_level`, `course_name`, `topic`, `score`, `completion_time`
- **Endpoints**:
  - `POST /api/practice-levels` - Send practice data
- **No Fallback**: Outbound only, errors logged

### 5. **Contextual Corporate Assistant** (Port 3006)
- **Purpose**: Performance data and chatbot integration
- **Data Sent**: `exercise_performance`, `learning_progress`, `skill_improvements`
- **Data Received**: Chatbot integration details
- **Endpoints**:
  - `POST /api/performance` - Send performance data
  - `GET /api/chatbot/integration` - Get chatbot integration
- **Fallback**: Mock chatbot integration if service unavailable

### 6. **Gemini API** (Already Integrated)
- **Purpose**: AI question generation, evaluation, hints
- **Features**: Real AI integration with no mock fallbacks
- **Endpoints**: All Gemini endpoints working with real AI

### 7. **Sandbox API** (Port 3007)
- **Purpose**: Safe code execution
- **Data Sent**: `code`, `language`, `test_cases`, `timeout`, `memory_limit`
- **Endpoints**:
  - `POST /api/execute` - Execute code safely
- **Fallback**: Mock execution results if service unavailable

## 🔧 **Environment Configuration:**

Create a `.env` file in the backend directory with:

```env
# Directory Service
DIRECTORY_SERVICE_URL=http://localhost:3002
DIRECTORY_SERVICE_TOKEN=your-token

# Content Studio Service  
CONTENT_STUDIO_SERVICE_URL=http://localhost:3003
CONTENT_STUDIO_SERVICE_TOKEN=your-token

# Assessment Service
ASSESSMENT_SERVICE_URL=http://localhost:3004
ASSESSMENT_SERVICE_TOKEN=your-token

# HR Reporting Service
HR_REPORTING_SERVICE_URL=http://localhost:3005
HR_REPORTING_SERVICE_TOKEN=your-token

# Contextual Corporate Assistant
CONTEXTUAL_ASSISTANT_SERVICE_URL=http://localhost:3006
CONTEXTUAL_ASSISTANT_SERVICE_TOKEN=your-token

# Sandbox API
SANDBOX_API_URL=http://localhost:3007
SANDBOX_API_KEY=your-api-key

# Gemini API (Already configured)
GEMINI_API_KEY=AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw
```

## 🚀 **How It Works:**

1. **Real API Calls**: DevLab attempts to call real microservice endpoints
2. **Fallback System**: If real services are unavailable, mock data is used
3. **Error Handling**: Proper error logging and graceful degradation
4. **No UI Changes**: All existing UI/UX preserved as requested

## 📊 **Data Flow:**

```
DevLab Frontend → DevLab Backend → Real Microservices
                     ↓
                Fallback Mock Data (if services unavailable)
```

## ✅ **Integration Status:**

- ✅ Directory Service - Real endpoints + mock fallback
- ✅ Content Studio Service - Real endpoints + mock fallback  
- ✅ Assessment Service - Real endpoints + mock fallback
- ✅ HR Reporting Service - Outbound only
- ✅ Contextual Corporate Assistant - Real endpoints + mock fallback
- ✅ Gemini API - Real AI integration (no fallback)
- ✅ Sandbox API - Real endpoints + mock fallback

All microservices are now integrated with real endpoints and fallback mock data as requested! 🎉
