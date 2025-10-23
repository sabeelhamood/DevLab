# Database Schema Update - ERD Implementation

## 📋 **Updated Database Schema According to ERD**

### **🗄️ PostgreSQL Tables (Business Logic - Supabase)**

#### **1. userProfiles Table**
- **Primary Key:** `user_id` (bigint)
- **Fields:**
  - `user_id` (pk) - Primary key
  - `name` (string) - User's full name
  - `email` (string) - User's email address
  - `role` (enum) - 'learner', 'trainer', 'both'
  - `organizationId` (bigint) - Foreign key to organization
  - `completed_courses` (json) - Array of completed course IDs
  - `active_courses` (json) - Array of active course IDs
  - `created_at` (timestamp) - Account creation date

#### **2. competitions Table**
- **Primary Key:** `competition_id` (bigint)
- **Fields:**
  - `competition_id` (pk) - Primary key
  - `course_id` (fk) - Foreign key to courses
  - `learner1_id` (fk) - Foreign key to userProfiles
  - `learner2_id` (fk) - Foreign key to userProfiles
  - `result` (json) - Competition results and scores
  - `created_at` (timestamp) - Competition creation date

#### **3. courses Table**
- **Primary Key:** `course_id` (bigint)
- **Fields:**
  - `course_id` (pk) - Primary key
  - `trainer_id` (fk) - Foreign key to userProfiles (trainer)
  - `level` (string) - Course difficulty level
  - `ai_feedback` (json) - AI-generated feedback and insights
  - `created_at` (timestamp) - Course creation date

#### **4. topics Table**
- **Primary Key:** `topic_id` (bigint)
- **Fields:**
  - `topic_id` (pk) - Primary key
  - `course_id` (fk) - Foreign key to courses
  - `topic_name` (string) - Name of the topic
  - `nano_skills` (json) - Array of nano skills
  - `macro_skills` (json) - Array of macro skills
  - `created_at` (timestamp) - Topic creation date

#### **5. questions Table**
- **Primary Key:** `question_id` (bigint)
- **Fields:**
  - `question_id` (pk) - Primary key
  - `practice_id` (fk) - Foreign key to practices
  - `course_id` (fk) - Foreign key to courses
  - `question_type` (enum) - 'code', 'theoretical'
  - `question_content` (string) - The actual question text
  - `tags` (json) - Array of question tags
  - `created_at` (timestamp) - Question creation date

#### **6. testCases Table**
- **Primary Key:** `testCase_id` (bigint)
- **Fields:**
  - `testCase_id` (pk) - Primary key
  - `question_id` (fk) - Foreign key to questions
  - `input` (string) - Test input data
  - `expected_output` (string) - Expected output for the test
  - `created_at` (timestamp) - Test case creation date

#### **7. practices Table**
- **Primary Key:** `practice_id` (bigint)
- **Fields:**
  - `practice_id` (pk) - Primary key
  - `learner_id` (fk) - Foreign key to userProfiles (learner)
  - `course_id` (fk) - Foreign key to courses
  - `topic_id` (fk) - Foreign key to topics
  - `content` (string) - Submitted practice content
  - `score` (float) - Practice session score
  - `status` (enum) - 'in_progress', 'completed', 'abandoned'
  - `created_at` (timestamp) - Practice start date
  - `updated_at` (timestamp) - Last update date

### **🔗 Relationships**

#### **One-to-Many Relationships:**
- **userProfiles → courses** (1:*): A trainer can create multiple courses
- **courses → topics** (1:*): A course contains multiple topics
- **topics → questions** (1:*): A topic has multiple questions
- **questions → testCases** (1:*): A question can have multiple test cases
- **userProfiles → practices** (1:*): A learner can have multiple practice sessions
- **topics → practices** (1:*): A topic can be practiced multiple times
- **questions → practices** (1:*): A question can be part of multiple practices

#### **Many-to-Many Relationships:**
- **userProfiles ↔ competitions** (*:*): Users can participate in multiple competitions
- **courses ↔ competitions** (1:*): A course can have multiple competitions

### **📊 Data Types Used**

- **bigint**: Primary and foreign keys
- **string**: Text fields (names, content, etc.)
- **enum**: Restricted value sets (roles, question types, status)
- **json**: Complex data structures (skills, results, feedback)
- **timestamp**: Creation and update dates
- **float**: Scores and numeric values

### **🎯 Key Features**

#### **User Management:**
- Role-based access control (learner, trainer, both)
- Organization-based user grouping
- Course enrollment tracking

#### **Learning Structure:**
- Hierarchical course → topic → question structure
- Skills-based learning (nano & macro skills)
- AI-powered feedback and insights

#### **Practice System:**
- Individual practice sessions
- Competition-based learning
- Comprehensive scoring and progress tracking

#### **Question System:**
- Multiple question types (code, theoretical)
- Test case validation for code questions
- Tag-based question organization

### **📁 Updated Files**

#### **Models:**
- `backend/src/models/User.js` → `UserProfileModel`
- `backend/src/models/Course.js` → Updated with trainer_id, level, ai_feedback
- `backend/src/models/Question.js` → Updated with practice_id, question_type, tags
- `backend/src/models/Competition.js` → **NEW** - Competition tracking
- `backend/src/models/Topic.js` → **NEW** - Topic management
- `backend/src/models/TestCase.js` → **NEW** - Test case validation
- `backend/src/models/Practice.js` → **NEW** - Practice sessions

#### **Configuration:**
- `backend/src/config/database.js` → Updated table names
- `backend/src/config/initDatabase.js` → Updated schema logging

### **🚀 Next Steps**

1. **Database Migration**: Create actual tables in Supabase
2. **API Integration**: Update API endpoints to use new models
3. **Frontend Updates**: Update frontend to use new data structure
4. **Testing**: Test all relationships and data flows
5. **Documentation**: Update API documentation

### **💡 Benefits of New Schema**

- **Better Data Organization**: Clear separation of concerns
- **Enhanced Relationships**: Proper foreign key relationships
- **Scalable Structure**: Supports complex learning scenarios
- **AI Integration**: Built-in support for AI feedback
- **Competition System**: Learner vs learner competitions
- **Skills Tracking**: Detailed nano and macro skills management
- **Flexible Practice**: Multiple practice types and tracking

This updated schema fully implements your ERD diagram and provides a robust foundation for the DEVLAB learning platform! 🎓✨

