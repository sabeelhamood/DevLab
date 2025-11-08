# Database Setup Guide

This guide explains how to set up the real database connections for the DEVLAB Microservice.

## Database Architecture

### PostgreSQL (Supabase) - Business Logic Data
- **Users**: User accounts, profiles, authentication
- **Courses**: Course definitions, metadata, content
- **Questions**: Practice questions, coding challenges
- **Submissions**: User answers, code submissions
- **Progress**: Learning progress, completion tracking
- **Organizations**: Company/org data, user assignments

### MongoDB Atlas - Operational Data
- **Logs**: Application logs, system events
- **Errors**: Error tracking, debugging data
- **Analytics**: User behavior, learning analytics
- **Sessions**: Practice sessions, timing data
- **Submissions**: Code execution results, sandbox data

## Setup Instructions

### 1. PostgreSQL (Supabase) Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Set Environment Variables**:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

3. **Create Tables** (Run in Supabase SQL Editor):
   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL,
     organization_id INTEGER,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Courses table
   CREATE TABLE courses (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     level VARCHAR(50) NOT NULL,
     organization_id INTEGER,
     created_by UUID REFERENCES users(id),
     status VARCHAR(50) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Questions table
   CREATE TABLE questions (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     content TEXT NOT NULL,
     type VARCHAR(50) NOT NULL,
     difficulty VARCHAR(50) NOT NULL,
     topic_id INTEGER,
     created_by UUID REFERENCES users(id),
     status VARCHAR(50) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Submissions table
   CREATE TABLE submissions (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     question_id INTEGER REFERENCES questions(id),
     answer TEXT,
     code TEXT,
     status VARCHAR(50) NOT NULL,
     score INTEGER,
     feedback TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Progress table
   CREATE TABLE progress (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     course_id INTEGER REFERENCES courses(id),
     topic_id INTEGER,
     completion_percentage INTEGER DEFAULT 0,
     last_accessed TIMESTAMP DEFAULT NOW(),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

### 2. MongoDB Atlas Setup

1. **Create MongoDB Atlas Cluster**:
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a new cluster
   - Create a database user
   - Get your connection string

2. **Set Environment Variables**:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devlab
   ```

3. **Collections will be created automatically** when the application starts.

### 3. Environment Configuration

1. **Copy the example environment file**:
   ```bash
   cp env.example .env
   ```

2. **Update the .env file** with your actual values:
   ```bash
   # PostgreSQL (Supabase)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devlab
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

### 4. Test the Connections

1. **Start the backend server**:
   ```bash
   npm run dev
   ```

2. **Check the console output**:
   ```
   ✅ MongoDB Atlas connected
   ✅ Supabase PostgreSQL connected
   ✅ Database initialization complete
   ```

3. **Test the health endpoint**:
   ```bash
   curl http://localhost:3001/health
   ```

## Database Models

### PostgreSQL Models (Business Logic)
- `UserModel` - User management
- `CourseModel` - Course management  
- `QuestionModel` - Question management

### MongoDB Models (Operational Data)
- `LogModel` - Application logging
- `AnalyticsModel` - Learning analytics
- `ErrorModel` - Error tracking
- `SessionModel` - Practice sessions

## Data Flow

1. **User Authentication** → PostgreSQL (users table)
2. **Course Content** → PostgreSQL (courses, questions tables)
3. **User Progress** → PostgreSQL (progress, submissions tables)
4. **System Logs** → MongoDB (logs collection)
5. **Analytics Data** → MongoDB (analytics collection)
6. **Error Tracking** → MongoDB (errors collection)

## Security Considerations

- **Row Level Security (RLS)** enabled on Supabase tables
- **MongoDB Atlas** with IP whitelisting
- **Environment variables** for sensitive data
- **JWT tokens** for authentication
- **Rate limiting** on API endpoints

## Monitoring

- **Supabase Dashboard** for PostgreSQL monitoring
- **MongoDB Atlas Dashboard** for MongoDB monitoring
- **Application logs** in MongoDB for debugging
- **Health check endpoint** for system status


