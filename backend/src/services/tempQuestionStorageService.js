import { randomUUID } from 'crypto'
import { postgres } from '../config/database.js'
import { config } from '../config/environment.js'

/**
 * Service to save Gemini-generated questions to temp_questions, topics, and testCases tables
 * 
 * This service handles:
 * - Creating/updating topics in topics table
 * - Saving questions to temp_questions table with question_id from Gemini
 * - Saving test cases to testCases table linked to question_id
 * - Proper error handling and logging
 * - Authentication: Uses SUPABASE_URL connection string for database authentication
 *   SERVICE_API_KEYS are checked for production environment logging
 */

// Default course_id to use when course_id is not provided
const DEFAULT_COURSE_ID = process.env.DEFAULT_COURSE_ID || null

// Check if SERVICE_API_KEYS are configured (for logging purposes)
const isProduction = config.nodeEnv === 'production'
const hasServiceApiKeys = config.security.apiKeys && config.security.apiKeys.trim().length > 0

/**
 * Save questions from Gemini response to Supabase tables
 * @param {Array} questions - Array of question objects from Gemini
 * @param {Object} metadata - Metadata containing courseName, topicName, course_id, etc.
 * @returns {Promise<Object>} Result with saved questions, topics, and test cases
 */
export const saveGeminiQuestionsToSupabase = async (questions = [], metadata = {}) => {
  console.log('\n' + '='.repeat(80))
  console.log('📋 [tempQuestionStorage] saveGeminiQuestionsToSupabase called')
  console.log('='.repeat(80))
  console.log(`   Environment: ${config.nodeEnv}`)
  console.log(`   Production: ${isProduction}`)
  console.log(`   SERVICE_API_KEYS configured: ${hasServiceApiKeys}`)
  console.log(`   Database authentication: SUPABASE_URL (connection string)`)
  console.log(`   Questions count: ${questions.length}`)
  console.log(`   Metadata:`, JSON.stringify(metadata, null, 2))
  
  // Verify SUPABASE_URL is configured
  if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not configured')
    return {
      success: false,
      error: 'SUPABASE_URL not configured',
      savedQuestions: [],
      savedTopics: [],
      savedTestCases: []
    }
  }
  
  // In production, verify SERVICE_API_KEYS are configured (for service authentication logging)
  if (isProduction && !hasServiceApiKeys) {
    console.warn('⚠️ SERVICE_API_KEYS not configured in production')
    console.warn('   Database operations will still work using SUPABASE_URL')
    console.warn('   Service authentication headers are not required for database operations')
  }
  
  if (!Array.isArray(questions) || questions.length === 0) {
    console.warn('⚠️ No questions to save')
    return {
      success: false,
      error: 'No questions provided',
      savedQuestions: [],
      savedTopics: [],
      savedTestCases: []
    }
  }

  const {
    courseName,
    topicName,
    course_id: metaCourseId,
    courseId: metaCourseIdAlt,
    nanoSkills = [],
    macroSkills = []
  } = metadata

  if (!courseName || !topicName) {
    console.error('❌ Missing required metadata: courseName and topicName are required')
    return {
      success: false,
      error: 'Missing required metadata: courseName and topicName are required',
      savedQuestions: [],
      savedTopics: [],
      savedTestCases: []
    }
  }

  // Resolve course_id
  let resolvedCourseId = metaCourseId || metaCourseIdAlt || DEFAULT_COURSE_ID
  
  console.log('\n🔍 Resolving course_id and topic_id:')
  console.log(`   metaCourseId: ${metaCourseId || 'null'}`)
  console.log(`   metaCourseIdAlt: ${metaCourseIdAlt || 'null'}`)
  console.log(`   DEFAULT_COURSE_ID: ${DEFAULT_COURSE_ID || 'null'}`)
  console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
  
  if (!resolvedCourseId) {
    console.warn('⚠️ course_id not provided and DEFAULT_COURSE_ID not set')
    console.warn('   Will attempt to create topic without course_id (may fail if topics table requires it)')
    console.warn('   Topic creation may fail, but question saving will continue')
  } else {
    console.log(`✅ Resolved course_id: ${resolvedCourseId}`)
    console.log(`   Course ID type: ${typeof resolvedCourseId}`)
    console.log(`   Course ID is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedCourseId)}`)
  }

  const results = {
    success: true,
    savedQuestions: [],
    savedTopics: [],
    savedTestCases: [],
    errors: []
  }

  try {
    // Step 1: Create or update topic in topics table
    console.log('\n' + '='.repeat(80))
    console.log('📋 STEP 1: Creating/updating topic in topics table')
    console.log('='.repeat(80))
    console.log(`   Topic name: ${topicName}`)
    console.log(`   Course ID: ${resolvedCourseId || 'N/A'}`)
    console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
    console.log(`   resolvedCourseId type: ${resolvedCourseId ? typeof resolvedCourseId : 'null'}`)
    
    let topicId = null
    try {
      if (resolvedCourseId) {
        console.log(`   Checking if topic exists: topic_name="${topicName}", course_id="${resolvedCourseId}"`)
        
        // Check if topic already exists
        const existingTopic = await postgres.query(
          `SELECT "topic_id", "course_id", "topic_name" 
           FROM "topics" 
           WHERE "topic_name" = $1::text 
             AND "course_id" = $2::uuid
           LIMIT 1`,
          [topicName, resolvedCourseId]
        )

        console.log(`   Topic lookup result: ${existingTopic.rows.length} row(s) found`)
        if (existingTopic.rows.length > 0) {
          console.log(`   Existing topic data:`, JSON.stringify(existingTopic.rows[0], null, 2))
        }

        if (existingTopic.rows.length > 0) {
          topicId = existingTopic.rows[0].topic_id
          console.log(`✅ Topic already exists: ${topicId}`)
          console.log(`   topicId: ${topicId}`)
          console.log(`   topicId type: ${typeof topicId}`)
          
          // Update topic with nano_skills and macro_skills if provided
          if (nanoSkills.length > 0 || macroSkills.length > 0) {
            await postgres.query(
              `UPDATE "topics" 
               SET "nano_skills" = $1::jsonb,
                   "macro_skills" = $2::jsonb,
                   "updated_at" = now()
               WHERE "topic_id" = $3::uuid`,
              [
                JSON.stringify(nanoSkills),
                JSON.stringify(macroSkills),
                topicId
              ]
            )
            console.log(`✅ Updated topic with skills`)
          }
        } else {
          // Create new topic
          topicId = randomUUID()
          console.log(`   Creating new topic with ID: ${topicId}`)
          console.log(`   Insert parameters:`, {
            topic_id: topicId,
            course_id: resolvedCourseId,
            topic_name: topicName,
            nano_skills: nanoSkills,
            macro_skills: macroSkills
          })
          
          await postgres.query(
            `INSERT INTO "topics" (
              "topic_id",
              "course_id",
              "topic_name",
              "nano_skills",
              "macro_skills",
              "created_at",
              "updated_at"
            )
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, now(), now())
            ON CONFLICT ("topic_id") DO UPDATE
            SET "topic_name" = EXCLUDED."topic_name",
                "nano_skills" = EXCLUDED."nano_skills",
                "macro_skills" = EXCLUDED."macro_skills",
                "updated_at" = now()`,
            [
              topicId,
              resolvedCourseId,
              topicName,
              JSON.stringify(nanoSkills),
              JSON.stringify(macroSkills)
            ]
          )
          console.log(`✅ Created new topic: ${topicId}`)
          console.log(`   topicId: ${topicId}`)
          console.log(`   topicId type: ${typeof topicId}`)
        }
        results.savedTopics.push({ topic_id: topicId, topic_name: topicName })
        console.log(`✅ Topic ID resolved: ${topicId}`)
      } else {
        console.warn('⚠️ Skipping topic creation: course_id is missing')
        console.warn('   Topics table requires course_id (NOT NULL constraint)')
        console.warn('   topicId will be null - questions will be saved without topic_id')
        console.warn('   resolvedCourseId:', resolvedCourseId)
        console.warn('   DEFAULT_COURSE_ID:', DEFAULT_COURSE_ID)
      }
      
      console.log(`   Final topicId: ${topicId || 'null'}`)
      console.log('='.repeat(80))
      
      // CRITICAL LOG: Log resolved IDs before question insertion
      console.log(`\n🔍 CRITICAL LOG: Resolved IDs before question insertion`)
      console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
      console.log(`   topicId: ${topicId || 'null'}`)
      console.log(`   resolvedCourseId type: ${resolvedCourseId ? typeof resolvedCourseId : 'null'}`)
      console.log(`   topicId type: ${topicId ? typeof topicId : 'null'}`)
      
    } catch (topicError) {
      console.error('❌ Error creating/updating topic:')
      console.error(`   Error: ${topicError.message}`)
      console.error(`   Code: ${topicError.code || 'N/A'}`)
      console.error(`   Detail: ${topicError.detail || 'N/A'}`)
      console.error(`   Hint: ${topicError.hint || 'N/A'}`)
      console.error(`   Stack: ${topicError.stack || 'N/A'}`)
      results.errors.push({
        step: 'topic_creation',
        error: topicError.message,
        code: topicError.code,
        detail: topicError.detail,
        hint: topicError.hint
      })
      // Continue with question saving even if topic creation fails
      console.warn('   Continuing with question saving even though topic creation failed')
    }

    // Step 2: Ensure temp_questions table has the correct structure
    console.log('\n📋 STEP 2: Ensuring temp_questions table structure')
    
    // Check if temp_questions table exists and has the required columns
    const tableCheck = await postgres.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'temp_questions'
    `)

    const hasQuestionIdColumn = tableCheck.rows.some(col => col.column_name === 'question_id')
    const hasQuestionContentColumn = tableCheck.rows.some(col => col.column_name === 'question_content')
    const hasTitleColumn = tableCheck.rows.some(col => col.column_name === 'title')
    const hasDifficultyColumn = tableCheck.rows.some(col => col.column_name === 'difficulty')
    const hasLanguageColumn = tableCheck.rows.some(col => col.column_name === 'language')
    const hasQuestionTypeColumn = tableCheck.rows.some(col => col.column_name === 'question_type')
    const hasSolutionColumn = tableCheck.rows.some(col => col.column_name === 'solution')
    const hasHintsColumn = tableCheck.rows.some(col => col.column_name === 'hints')
    const hasCourseIdColumn = tableCheck.rows.some(col => col.column_name === 'course_id')
    const hasTopicIdColumn = tableCheck.rows.some(col => col.column_name === 'topic_id')
    const hasTestCasesColumn = tableCheck.rows.some(col => col.column_name === 'test_cases')

    // If table exists but doesn't have the required structure, alter it
    if (tableCheck.rows.length > 0) {
          if (!hasQuestionIdColumn) {
            console.log('   Altering temp_questions table: adding question_id column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "question_id" text;
            `)
          }
          if (!hasQuestionContentColumn) {
            console.log('   Altering temp_questions table: adding question_content column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "question_content" text;
            `)
          }
          if (!hasTitleColumn) {
            console.log('   Altering temp_questions table: adding title column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "title" text;
            `)
          }
          if (!hasDifficultyColumn) {
            console.log('   Altering temp_questions table: adding difficulty column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "difficulty" text;
            `)
          }
          if (!hasLanguageColumn) {
            console.log('   Altering temp_questions table: adding language column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "language" text;
            `)
          }
          if (!hasQuestionTypeColumn) {
            console.log('   Altering temp_questions table: adding question_type column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "question_type" text;
            `)
          }
          if (!hasSolutionColumn) {
            console.log('   Altering temp_questions table: adding solution column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "solution" text;
            `)
          }
          if (!hasHintsColumn) {
            console.log('   Altering temp_questions table: adding hints column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "hints" jsonb DEFAULT '[]'::jsonb;
            `)
          }
          if (!hasCourseIdColumn && resolvedCourseId) {
            console.log('   Altering temp_questions table: adding course_id column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "course_id" uuid;
            `)
          }
          if (!hasTopicIdColumn && topicId) {
            console.log('   Altering temp_questions table: adding topic_id column')
            await postgres.query(`
              ALTER TABLE "temp_questions" 
              ADD COLUMN IF NOT EXISTS "topic_id" uuid;
            `)
          }
          
      if (!hasTestCasesColumn) {
        console.log('   Altering temp_questions table: adding test_cases column')
        await postgres.query(`
          ALTER TABLE "temp_questions" 
          ADD COLUMN IF NOT EXISTS "test_cases" jsonb DEFAULT '[]'::jsonb;
        `)
      }
      
      // Add unique index on question_id if it doesn't exist
      try {
        await postgres.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS temp_questions_question_id_idx 
          ON "temp_questions" ("question_id");
        `)
      } catch (idxError) {
        // Index might already exist, ignore
        console.log('   Index on question_id already exists or cannot be created')
      }
    } else {
      // Table doesn't exist, create it with the new structure
      console.log('   Creating temp_questions table with new structure')
      await postgres.query(`
        CREATE TABLE IF NOT EXISTS "temp_questions" (
          "question_id" text PRIMARY KEY,
          "question_content" text NOT NULL,
          "title" text,
          "difficulty" text,
          "language" text,
          "question_type" text,
          "solution" text,
          "hints" jsonb DEFAULT '[]'::jsonb,
          "test_cases" jsonb DEFAULT '[]'::jsonb,
          "course_id" uuid,
          "topic_id" uuid,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now()
        );
      `)
      
      if (resolvedCourseId) {
        await postgres.query(`
          CREATE INDEX IF NOT EXISTS temp_questions_course_id_idx 
          ON "temp_questions" ("course_id");
        `)
      }
      
      if (topicId) {
        await postgres.query(`
          CREATE INDEX IF NOT EXISTS temp_questions_topic_id_idx 
          ON "temp_questions" ("topic_id");
        `)
      }
    }

    // Step 3: Save each question to temp_questions table
    console.log('\n' + '='.repeat(80))
    console.log('📋 STEP 3: Saving questions to temp_questions table')
    console.log('='.repeat(80))
    console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
    console.log(`   topicId: ${topicId || 'null'}`)
    console.log(`   Questions to save: ${questions.length}`)
    
    // CRITICAL LOG: Log resolved IDs at start of question insertion
    console.log(`\n🔍 CRITICAL LOG: Starting question insertion with resolved IDs`)
    console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
    console.log(`   topicId: ${topicId || 'null'}`)
    if (!resolvedCourseId) {
      console.warn(`   ⚠️ WARNING: resolvedCourseId is null - questions will be saved without course_id`)
    }
    if (!topicId) {
      console.warn(`   ⚠️ WARNING: topicId is null - questions will be saved without topic_id`)
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      console.log(`\n   Processing question ${i + 1} of ${questions.length}`)
      
      try {
        // Extract question data
        const questionId = question.question_id || question.id || `demo_${Date.now()}_${i}`
        const questionContent = question.description || question.question_content || question.question || question.title || ''
        const title = question.title || questionContent.substring(0, 100) || 'Untitled Question'
        const difficulty = question.difficulty || metadata.difficulty || 'intermediate'
        const language = question.language || metadata.language || 'javascript'
        const questionType = question.question_type || question.questionType || metadata.questionType || 'coding'
        const solution = question.solution ? (typeof question.solution === 'string' ? question.solution : JSON.stringify(question.solution)) : null
        const hints = Array.isArray(question.hints) ? question.hints : (question.hints ? [question.hints] : [])
        
        console.log(`   Question ID: ${questionId}`)
        console.log(`   Title: ${title.substring(0, 50)}...`)
        console.log(`   Question Content (first 50 chars): ${questionContent.substring(0, 50)}...`)
        console.log(`   Difficulty: ${difficulty}`)
        console.log(`   Language: ${language}`)
        console.log(`   Question Type: ${questionType}`)
        console.log(`   Hints: ${hints.length}`)
        console.log(`   Test Cases: ${(question.testCases || question.test_cases || []).length}`)
        console.log(`   resolvedCourseId: ${resolvedCourseId || 'null'}`)
        console.log(`   topicId: ${topicId || 'null'}`)
        
        // FORCE LOG: Log before insertion
        console.log(`\n   🔍 FORCE LOG: Saving question to temp_questions`)
        console.log(`      questionId: ${questionId}`)
        console.log(`      questionContent: ${questionContent.substring(0, 50)}...`)
        console.log(`      title: ${title.substring(0, 50)}...`)
        console.log(`      course_id: ${resolvedCourseId || 'null'}`)
        console.log(`      topic_id: ${topicId || 'null'}`)

        // Insert or update question in temp_questions
        console.log(`   Executing INSERT query for question: ${questionId}`)
        console.log(`   Query parameters:`, {
          questionId,
          questionContent: questionContent.substring(0, 50) + '...',
          title: title.substring(0, 50) + '...',
          difficulty,
          language,
          questionType,
          solution: solution ? solution.substring(0, 50) + '...' : 'null',
          hints: hints.length,
          course_id: resolvedCourseId || 'null',
          topic_id: topicId || 'null'
        })
        
        const insertResult = await postgres.query(
          `INSERT INTO "temp_questions" (
            "question_id",
            "question_content",
            "title",
            "difficulty",
            "language",
            "question_type",
            "solution",
            "hints",
            "course_id",
            "topic_id",
            "created_at",
            "updated_at"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, now(), now())
          ON CONFLICT ("question_id")
          DO UPDATE SET
            "question_content" = EXCLUDED."question_content",
            "title" = EXCLUDED."title",
            "difficulty" = EXCLUDED."difficulty",
            "language" = EXCLUDED."language",
            "question_type" = EXCLUDED."question_type",
            "solution" = EXCLUDED."solution",
            "hints" = EXCLUDED."hints",
            "course_id" = EXCLUDED."course_id",
            "topic_id" = EXCLUDED."topic_id",
            "updated_at" = now()
          RETURNING "question_id", "title", "created_at", "updated_at"`,
          [
            questionId,
            questionContent,
            title,
            difficulty,
            language,
            questionType,
            solution,
            JSON.stringify(hints),
            resolvedCourseId,
            topicId
          ]
        )
        
        console.log(`   ✅ INSERT query executed successfully`)
        console.log(`   Rows returned: ${insertResult.rows ? insertResult.rows.length : 0}`)
        console.log(`   Row count: ${insertResult.rowCount || 0}`)
        if (insertResult.rows && insertResult.rows.length > 0) {
          console.log(`   Saved question data:`, JSON.stringify(insertResult.rows[0], null, 2))
        }
        console.log(`   ✅ Saved question to temp_questions: ${questionId}`)
        
        // FORCE LOG: Log after insertion
        console.log(`   🔍 FORCE LOG: Question saved successfully`)
        console.log(`      questionId: ${questionId}`)
        console.log(`      questionContent: ${questionContent.substring(0, 50)}...`)
        console.log(`      title: ${title.substring(0, 50)}...`)
        console.log(`      course_id: ${resolvedCourseId || 'null'}`)
        console.log(`      topic_id: ${topicId || 'null'}`)
        
        results.savedQuestions.push({ question_id: questionId, title })
        
        // Verify insertion by querying the database
        console.log(`   Verifying insertion by querying database...`)
        try {
          const verifyResult = await postgres.query(
            `SELECT "question_id", "title", "question_content", "course_id", "topic_id", "created_at" 
             FROM "temp_questions" 
             WHERE "question_id" = $1`,
            [questionId]
          )
          
          console.log(`   Verification query result: ${verifyResult.rows.length} row(s) found`)
          if (verifyResult.rows.length > 0) {
            console.log(`   ✅ Verification successful - question found in database`)
            console.log(`   Verified question data:`, JSON.stringify(verifyResult.rows[0], null, 2))
          } else {
            console.error(`   ❌ Verification failed - question NOT found in database`)
            console.error(`   This indicates the INSERT did not actually save the question`)
          }
        } catch (verifyError) {
          console.error(`   ❌ Verification query failed:`, verifyError.message)
        }

        // Step 3: Save test cases to testCases table
        const testCases = question.testCases || question.test_cases || []
        if (testCases.length > 0) {
          console.log(`\n   Saving ${testCases.length} test case(s) for question ${questionId}`)
          
          for (let j = 0; j < testCases.length; j++) {
            const testCase = testCases[j]
            try {
              const testCaseId = randomUUID()
              const input = testCase.input || testCase.test_input || null
              const expectedOutput = testCase.expectedOutput || testCase.expected_output || testCase.output || testCase.expected || ''
              const explanation = testCase.explanation || testCase.description || null
              
              // Note: testCases table has question_id as UUID foreign key to questions table
              // Since we're using temp_questions with string question_id, we need to either:
              // 1. Store test cases with a reference to temp_questions (if we modify testCases table)
              // 2. Store test cases in a separate temp_test_cases table
              // 3. Store test cases in temp_questions.test_cases JSONB column
              
              // For now, we'll store test cases in a JSONB column in temp_questions
              // and also try to save to testCases table if question_id can be converted to UUID
              
              console.log(`     Test case ${j + 1}: input=${input ? input.substring(0, 30) + '...' : 'null'}, expected=${expectedOutput.substring(0, 30)}...`)
              
              // Try to save to testCases table if question_id looks like a UUID
              // Otherwise, we'll store in temp_questions.test_cases JSONB
              const isQuestionIdUuid = questionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
              
              if (isQuestionIdUuid) {
                // Save to testCases table
                await postgres.query(
                  `INSERT INTO "testCases" (
                    "testCase_id",
                    "question_id",
                    "input",
                    "expected_output",
                    "explanation",
                    "created_at",
                    "updated_at"
                  )
                  VALUES ($1, $2::uuid, $3, $4, $5, now(), now())
                  ON CONFLICT ("testCase_id")
                  DO UPDATE SET
                    "input" = EXCLUDED."input",
                    "expected_output" = EXCLUDED."expected_output",
                    "explanation" = EXCLUDED."explanation",
                    "updated_at" = now()`,
                  [
                    testCaseId,
                    questionId,
                    input,
                    expectedOutput,
                    explanation
                  ]
                )
                console.log(`     ✅ Saved test case to testCases table: ${testCaseId}`)
                results.savedTestCases.push({ test_case_id: testCaseId, question_id: questionId })
              } else {
                // Store in temp_questions.test_cases JSONB column
                // Get existing test cases
                const existingTestCases = await postgres.query(
                  `SELECT "test_cases" FROM "temp_questions" WHERE "question_id" = $1`,
                  [questionId]
                )
                
                let currentTestCases = []
                if (existingTestCases.rows.length > 0 && existingTestCases.rows[0].test_cases) {
                  currentTestCases = Array.isArray(existingTestCases.rows[0].test_cases) 
                    ? existingTestCases.rows[0].test_cases 
                    : []
                }
                
                // Add new test case
                const newTestCase = {
                  test_case_id: testCaseId,
                  input,
                  expected_output: expectedOutput,
                  explanation
                }
                
                currentTestCases.push(newTestCase)
                
                // Update temp_questions with test cases
                await postgres.query(
                  `UPDATE "temp_questions" 
                   SET "test_cases" = $1::jsonb,
                       "updated_at" = now()
                   WHERE "question_id" = $2`,
                  [JSON.stringify(currentTestCases), questionId]
                )
                
                console.log(`     ✅ Saved test case to temp_questions.test_cases: ${testCaseId}`)
                results.savedTestCases.push({ test_case_id: testCaseId, question_id: questionId, stored_in: 'temp_questions' })
              }
            } catch (testCaseError) {
              console.error(`     ❌ Error saving test case ${j + 1}:`)
              console.error(`        Error: ${testCaseError.message}`)
              console.error(`        Code: ${testCaseError.code || 'N/A'}`)
              results.errors.push({
                step: 'test_case_save',
                question_id: questionId,
                test_case_index: j,
                error: testCaseError.message,
                code: testCaseError.code
              })
            }
          }
        } else {
          console.log(`   No test cases for question ${questionId}`)
        }
      } catch (questionError) {
        console.error(`   ❌ Error saving question ${i + 1}:`)
        console.error(`      Error: ${questionError.message}`)
        console.error(`      Code: ${questionError.code || 'N/A'}`)
        console.error(`      Detail: ${questionError.detail || 'N/A'}`)
        results.errors.push({
          step: 'question_save',
          question_index: i,
          error: questionError.message,
          code: questionError.code
        })
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ [tempQuestionStorage] saveGeminiQuestionsToSupabase completed')
    console.log('='.repeat(80))
    console.log(`   Saved questions: ${results.savedQuestions.length}`)
    console.log(`   Saved topics: ${results.savedTopics.length}`)
    console.log(`   Saved test cases: ${results.savedTestCases.length}`)
    console.log(`   Errors: ${results.errors.length}`)
    console.log('='.repeat(80) + '\n')

    return results
  } catch (error) {
    console.error('\n❌ [tempQuestionStorage] Fatal error in saveGeminiQuestionsToSupabase:')
    console.error(`   Error: ${error.message}`)
    console.error(`   Code: ${error.code || 'N/A'}`)
    console.error(`   Stack: ${error.stack || 'N/A'}`)
    
    // Initialize results if not already defined
    const errorResults = {
      success: false,
      error: error.message,
      code: error.code,
      savedQuestions: [],
      savedTopics: [],
      savedTestCases: [],
      errors: [{ step: 'fatal', error: error.message, code: error.code }]
    }
    
    return errorResults
  }
}

