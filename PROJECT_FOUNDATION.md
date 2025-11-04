# DEVLAB Microservice - Project Foundation & Strategic Planning

## Project Vision & Objectives

### Vision Statement
DEVLAB Microservice is an advanced, AI-powered interactive learning environment within the EduCore AI platform, providing personalized, practical coding exercises and exam preparation for employees in large organizations. DEVLAB enables skill development through intelligent, adaptive practice sessions tailored to individual learner profiles, course requirements, and organizational competency goals.

### Mission
To eliminate skill gaps within organizations by delivering highly personalized, practical coding exercises and theoretical questions that adapt to each employee's current level, course progress, and the macro/micro-skills required by their organization. DEVLAB empowers learners to practice independently while providing AI-driven feedback and competitive learning experiences.

### Primary Objectives

**Business Objectives:**
1. **Skill Development**: Close critical skill gaps in organizational workforces through targeted practice
2. **Engagement**: Increase learner engagement through gamified competition features and personalized feedback
3. **Scalability**: Support large-scale organizational learning programs with automatic scalability
4. **Quality Assurance**: Maintain high content quality through AI validation of instructor-submitted questions

**Technical Objectives:**
1. **Personalization**: Deliver exercises tailored to course, sub-topic, skill level, and macro/micro-skills
2. **Intelligence**: Leverage Gemini AI for question generation, solution checking, feedback, and content validation
3. **Security**: Provide secure, sandboxed code execution environment using Judge0
4. **Integration**: Seamlessly integrate with EduCore AI ecosystem (Course Builder, Content Studio, Assessment, Learning Analytics)
5. **Performance**: Ensure high availability, low latency, and multi-region deployment capability

### Problem Statement
Organizations face significant challenges in providing personalized, practical learning experiences that:
- Adapt to individual learner skill levels and learning paths
- Provide immediate, intelligent feedback on coding solutions
- Maintain content quality and relevance to course objectives
- Engage learners through interactive and competitive elements
- Scale to support thousands of concurrent learners

### Solution Concept
DEVLAB addresses these challenges through:
1. **AI-Driven Personalization**: Gemini AI generates questions dynamically based on learner profile, course content, and skill requirements
2. **Intelligent Feedback System**: Real-time AI feedback for both correct and incorrect solutions, guiding learners without revealing answers prematurely
3. **Secure Code Execution**: Judge0 sandbox ensures safe, isolated code execution without server risks
4. **Gamified Learning**: Anonymous competitions between peers at similar skill levels increase engagement
5. **Quality Assurance**: AI validation ensures trainer-submitted questions meet quality and relevance standards
6. **Microservice Architecture**: Cloud-native, event-driven design enabling seamless integration with EduCore AI platform

---

## Scope, Target Audience, and Expected Impact

### Project Scope

**In-Scope:**
- Multi-language code execution support (Python, Java, JavaScript, C++, Go, Rust)
- AI-generated dynamic questions and test cases
- Intelligent feedback system with progressive hints (3 hints per question)
- Anonymous competition system between learners
- Trainer question submission and AI validation
- Integration with Course Builder, Content Studio, Assessment, Learning Analytics microservices
- Support for both coding and theoretical questions
- Syntax highlighting for multiple programming languages
- Progress tracking and analytics data export
- Secure, sandboxed code execution environment

**Out-of-Scope:**
- User authentication and authorization (handled by EduCore platform)
- Course content creation and management (handled by Content Studio)
- Final assessment administration (handled by Assessment microservice)
- Learning path generation (handled by other EduCore microservices)
- User management and organizational hierarchy (handled by Directory Service)
- Video/rich media content delivery

### Target Audience

**Primary Users:**
1. **Employees/Learners**: 
   - Employees in large organizations requiring skill development
   - Individuals at various skill levels needing practice and exam preparation
   - Learners seeking personalized, adaptive coding exercises

2. **Instructors/Trainers**:
   - Organizational trainers creating custom questions
   - Course creators validating question relevance and quality

**Secondary Users:**
1. **EduCore AI Platform Services**:
   - Course Builder (initiates competition invitations)
   - Content Studio (requests practice question generation)
   - Assessment (requests coding questions for assessments)
   - Learning Analytics (receives competition performance data)

### Expected Impact

**Quantitative Impact:**
- Support 10,000+ concurrent learners
- Process 100+ code executions per second
- Generate 1000+ personalized questions per day
- Maintain 99.9% uptime availability
- Average response time < 2 seconds for question generation
- 95%+ learner satisfaction with feedback quality

**Qualitative Impact:**
- Improved employee competency development through targeted practice
- Enhanced learning engagement through gamified competitions
- Reduced skill gaps within organizations
- Increased confidence in exam preparation
- Better alignment between practice exercises and organizational requirements
- Higher content quality through AI validation

---

## Requirements Summary

### Functional Requirements

**Core Functionality:**
1. **Question Generation**:
   - Generate coding questions dynamically based on course, lesson, skill level, nano-skills, micro-skills
   - Support multiple programming languages (Python, Java, JavaScript, C++, Go, Rust)
   - Generate test cases automatically via Gemini AI
   - Support theoretical questions (routed to Assessment microservice)

2. **Code Execution**:
   - Execute user-submitted code securely in sandboxed environment (Judge0)
   - Support syntax highlighting for all supported languages
   - Return execution results, errors, and test case outcomes
   - Handle compilation errors, runtime errors, and infinite loops

3. **Intelligent Feedback System**:
   - Provide AI-generated feedback for correct solutions (improvement suggestions)
   - Provide AI-generated feedback for incorrect solutions (guidance without revealing answers)
   - Generate 3 progressive hints per question (short, directional, non-revealing)
   - Enable "View Answer" after 3 hints are used

4. **Competition System**:
   - Create competition invitations when learner completes a course (triggered by Course Builder)
   - Match learners at similar skill levels
   - Generate 3 code questions per competition
   - Execute and evaluate solutions via Gemini
   - Determine winner based on correctness, code quality, and performance
   - Store competition results and send to Learning Analytics

5. **Content Validation**:
   - Validate trainer-submitted questions for relevance and quality
   - Check alignment with course objectives, nano-skills, and micro-skills
   - Provide quality assessment and suggestions

6. **Integration Capabilities**:
   - REST API endpoints for microservice communication
   - gRPC support for two-way communication (competitions, real-time features)
   - Receive requests from Course Builder, Content Studio, Assessment
   - Send data to Learning Analytics
   - Integrate with RAG microservice for chatbot support

### Non-Functional Requirements

**Performance:**
- Response time: < 2 seconds for question generation
- Code execution: < 5 seconds for standard programs
- Support 10,000+ concurrent users
- Handle 100+ code executions per second
- 99.9% uptime availability

**Security:**
- Secure code execution in isolated sandboxes
- API authentication via service keys and JWT
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- Protection against malicious code execution
- Cheating detection via AI pattern recognition

**Scalability:**
- Auto-scaling based on load
- Multi-region deployment capability
- Database connection pooling
- Caching strategies for frequently accessed data
- Event-driven architecture for asynchronous processing

**Reliability:**
- Error handling and graceful degradation
- Retry mechanisms for external API calls
- Health check endpoints
- Monitoring and alerting
- Backup and disaster recovery procedures

**Compliance:**
- Data privacy and anonymization (especially for competitions)
- Logging and audit trails
- GDPR compliance for learner data

---

## Unique Approach & Innovation

### Differentiators

1. **AI-First Learning Experience**:
   - Gemini AI integrated throughout the learning journey (not just as an add-on)
   - Dynamic question generation tailored to exact skill requirements
   - Intelligent feedback that adapts to individual solution approaches
   - Proactive learning support (hints system prevents frustration without enabling cheating)

2. **Progressive Feedback Model**:
   - 3-tier hint system that guides without revealing
   - Feedback for correct solutions encourages improvement and deeper learning
   - View Answer only available after attempting all hints (promotes active learning)

3. **Gamified Competitive Learning**:
   - Anonymous competitions increase engagement without social pressure
   - Skill-level matching ensures fair competition
   - Gemini-powered evaluation considers code quality, not just correctness

4. **Microservice Integration Excellence**:
   - Seamless API integration with entire EduCore AI ecosystem
   - Event-driven architecture enables real-time updates
   - Dual-database architecture (MongoDB for operations, Supabase for logic)

5. **Quality Assurance Automation**:
   - AI validation of trainer questions ensures content quality
   - Automatic relevance checking against course objectives
   - Maintains high standards without manual review bottlenecks

### Technical Innovation

1. **Hybrid Database Architecture**:
   - MongoDB Atlas for operational data (logs, errors, high-volume writes)
   - Supabase (PostgreSQL) for transactional/relational logic data
   - Optimal performance for different data access patterns

2. **Multi-Protocol Communication**:
   - REST for standard CRUD operations
   - gRPC for efficient two-way communication (competitions, real-time features)
   - No WebSocket dependency reduces complexity

3. **Security-First Sandboxing**:
   - Judge0 integration provides industry-standard code isolation
   - Resource limits prevent server abuse
   - AI-based cheating detection identifies suspicious patterns

---

## Technology Stack (Initial Selection)

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Language**: JavaScript ES6 (no TypeScript)
- **Hosting**: Vercel Cloud
- **Domain**: https://dev-lab-phi.vercel.app/

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript ES6 (no TypeScript)
- **Hosting**: Railway
- **Domain**: devlab-backend-production.up.railway.app

### Databases
- **Operational Data**: MongoDB Atlas (errors, logs, high-volume operational data)
- **Logic Data**: Supabase (PostgreSQL) (transactions, relationships, business logic)

### External Services
- **AI Engine**: Google Gemini API (question generation, feedback, validation, evaluation)
- **Code Execution**: Judge0 API (secure sandboxed code execution)
- **RAG Chatbot**: RAG Microservice (customer support chatbot)

### Integration
- **API Style**: REST (primary)
- **Real-time**: gRPC (for two-way communication, competitions)
- **No WebSocket**: As per requirements

---

## Integration Specifications

### Course Builder Integration
- **Trigger**: Learner completes course
- **Input**: `course_id`, `learner_id`
- **Action**: DEVLAB creates competition invitation (stored in DEVLAB)
- **Protocol**: REST API

### Content Studio Integration
- **Request Type 1 - Practice Question Creation**:
  - **Input**: `quantity` (e.g., 4), `lesson_id`, `course_name`, `lesson_name`, `nano_skills`, `micro_skills`, `question_type`, `programming_language`
  - **Logic**: 
    - If `question_type` = theoretical → DEVLAB forwards to Assessment microservice
    - If `question_type` = code → DEVLAB creates via Gemini API
  - **Response**: AJAX response with question, style, test cases, full package
  
- **Request Type 2 - Trainer Question Validation**:
  - **Input**: `question`, `lesson_id`, `course_name`, `lesson_name`, `nano_skills`, `micro_skills`, `question_type`, `programming_language` (null if theoretical)
  - **Action**: DEVLAB validates question relevance using Gemini
  - **Response**: Validation result, quality assessment, suggestions

### Assessment Microservice Integration
- **Request 1 - Coding Question Creation**:
  - **Input**: `topic_name`, `programming_language`, `quantity`, `nano_skills`, `micro_skills`
  - **Response**: AJAX with question, style, test cases (NO solution - assessment checks in their backend)
  - **Note**: Test cases included, but solution hidden
  
- **Request 2 - Theoretical Question Creation**:
  - **Trigger**: DEVLAB receives theoretical request from Content Studio
  - **Action**: DEVLAB sends request to Assessment to create theoretical questions
  - **Solution Checking**: DEVLAB uses Gemini to validate theoretical question solutions

### Learning Analytics Integration
- **Trigger**: Competition completes
- **Data Sent**: `learner1_id`, `learner2_id`, `course_id`, `performance_learner1`, `performance_learner2`, `competition_id`
- **Protocol**: REST API

### RAG Microservice Integration
- **Purpose**: Customer support chatbot
- **Protocol**: REST API (chatbot interface)

---

## Development Approach

### Local Development First
- All code must work in localhost environment
- Environment variables configured for local development
- No deployment until local functionality verified

### Style Guidelines
- User will provide specific style requirements when needed
- Tailwind CSS for all styling
- Consistent design system across components

### Code Standards
- JavaScript ES6 only (no TypeScript)
- REST API primary communication
- gRPC for two-way communication requirements
- No WebSocket implementation
- Clean, maintainable, documented code

---

## AI Enhancement Insights

### AI-Assisted Validation Opportunities
1. **Business Model Validation**: DEVLAB addresses real organizational skill gap challenges with measurable ROI potential
2. **Technical Feasibility**: All required APIs (Gemini, Judge0) are production-ready and well-documented
3. **Integration Complexity**: Microservice architecture allows incremental development and testing
4. **Scalability Assessment**: Cloud-native architecture supports growth from hundreds to tens of thousands of users

### Risk Considerations
1. **API Dependencies**: Reliance on external APIs (Gemini, Judge0) requires robust error handling and fallback strategies
2. **Cost Management**: Gemini API usage can scale with user base - monitoring and optimization critical
3. **Integration Coordination**: Multiple microservice dependencies require clear API contracts and versioning
4. **Security**: Code execution requires careful sandboxing and resource limits

---

## Validation Checkpoint

### Foundation Elements Status

✅ **Project Vision & Objectives**: Defined and documented  
✅ **Scope & Target Audience**: Clearly outlined with in/out-of-scope boundaries  
✅ **Requirements Summary**: Functional and non-functional requirements captured  
✅ **Unique Approach**: Differentiators and technical innovations identified  
✅ **Integration Specifications**: All microservice and external API integrations documented  
✅ **Technology Stack**: Initial selections made based on requirements  
✅ **AI Enhancement**: Opportunities and risks assessed  

### Next Steps

1. **Stakeholder Review**: Review and approve this foundation document
2. **Proceed to Phase 2**: Requirements Discovery & Analysis (detailed user stories, acceptance criteria)
3. **Proceed to Phase 3**: System Architecture & Technical Design (detailed technical specifications)

---

**Document Status**: ✅ Complete - Ready for Stakeholder Review  
**Created**: Initial Phase 1 Deliverable  
**Next Phase**: Requirements Discovery & Analysis



