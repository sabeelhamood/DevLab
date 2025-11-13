import { randomUUID } from 'crypto'
import { postgres } from '../config/database.js'

/**
 * Complete Question Saving Service
 * 
 * This service handles saving questions and test cases to PostgreSQL using transactions.
 * 
 * Table Structure:
 * - temp_questions:
 *   - question_id (text, PRIMARY KEY) - from Gemini response
 *   - question_content (text) - question description/content
 *   - title (text) - question title
 *   - difficulty (text) - difficulty level
 *   - language (text) - programming language
 *   - question_type (text) - 'coding' or 'theoretical'
 *   - solution (text) - solution code/explanation
 *   - hints (jsonb) - array of hints
 *   - test_cases (jsonb) - array of test cases (stored as JSON)
 *   - course_id (uuid) - foreign key to courses
 *   - topic_id (uuid) - foreign key to topics
 *   - created_at (timestamptz) - creation timestamp
 *   - updated_at (timestamptz) - update timestamp
 * 
 * - testCases:
 *   - testCase_id (uuid, PRIMARY KEY) - generated UUID
 *   - question_id (uuid, FOREIGN KEY) - references questions.question_id (if UUID) or temp_questions.question_id
 *   - input (text) - test case input
 *   - expected_output (text) - expected output
 *   - explanation (text) - explanation of test case
 *   - metadata (jsonb) - additional metadata
 *   - created_at (timestamptz) - creation timestamp
 *   - updated_at (timestamptz) - update timestamp
 * 
 * Usage:
 * ```javascript
 * const questions = [
 *   {
 *     question_id: 'demo_123',
 *     title: 'Question Title',
 *     description: 'Question content',
 *     difficulty: 'intermediate',
 *     language: 'javascript',
 *     question_type: 'coding',
 *     solution: 'function solution() { ... }',
 *     hints: ['hint1', 'hint2'],
 *     testCases: [
 *       { input: '1, 2', expectedOutput: '3', explanation: 'Simple addition' },
 *       { input: '5, 10', expectedOutput: '15', explanation: 'Another addition' }
 *     ]
 *   }
 * ]
 * 
 * const result = await saveQuestionsWithTestCases(questions, {
 *   course_id: 'uuid-here',
 *   topic_id: 'uuid-here'
 * })
 * ```
 */

/**
 * Save questions and test cases to PostgreSQL using transactions
 * 
 * @param {Array} questions - Array of question objects from question generation endpoint
 * @param {Object} options - Additional options (course_id, topic_id, etc.)
 * @returns {Promise<Object>} Result object with saved questions, test cases, and errors
 */
export const saveQuestionsWithTestCases = async (questions = [], options = {}) => {
  console.log('\n' + '='.repeat(80))
  console.log('📋 [questionSaveService] saveQuestionsWithTestCases called')
  console.log('='.repeat(80))
  console.log(`   Questions count: ${questions.length}`)
  console.log(`   Options:`, JSON.stringify(options, null, 2))
  
  // Validate input
  if (!Array.isArray(questions) || questions.length === 0) {
    console.warn('⚠️ No questions provided')
    return {
      success: false,
      error: 'No questions provided',
      savedQuestions: [],
      savedTestCases: [],
      errors: []
    }
  }
  
  // Extract options
  const {
    course_id: courseId,
    topic_id: topicId,
    courseName,
    topicName
  } = options
  
  // Results object to track what was saved
  const results = {
    success: true,
    savedQuestions: [],
    savedTestCases: [],
    errors: [],
    transactionId: randomUUID()
  }
  
  // Get a database client for transaction
  const client = await postgres.getClient()
  
  try {
    // Start transaction
    console.log(`\n📋 Starting database transaction`)
    console.log(`   Transaction ID: ${results.transactionId}`)
    await client.query('BEGIN')
    console.log('✅ Transaction started')
    
    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      console.log(`\n   Processing question ${i + 1} of ${questions.length}`)
      
      try {
        // ========================================================================
        // STEP 1: Extract question data
        // ========================================================================
        console.log(`   📋 STEP 1: Extracting question data`)
        
        // Extract question_id (required)
        const questionId = question.question_id || question.id || `question_${Date.now()}_${i}`
        
        // Extract question content (required)
        const questionContent = question.description || 
                                question.question_content || 
                                question.question || 
                                question.content || 
                                question.title || 
                                ''
        
        if (!questionContent || questionContent.trim() === '') {
          throw new Error(`Question ${i + 1} has no content (description, question_content, question, content, or title)`)
        }
        
        // Extract other fields
        const title = question.title || questionContent.substring(0, 100) || 'Untitled Question'
        const difficulty = question.difficulty || options.difficulty || 'intermediate'
        const language = question.language || options.language || 'javascript'
        const questionType = question.question_type || 
                            question.questionType || 
                            options.questionType || 
                            'coding'
        const solution = question.solution ? 
          (typeof question.solution === 'string' ? question.solution : JSON.stringify(question.solution)) : 
          null
        
        // Extract hints (array)
        let hints = []
        if (Array.isArray(question.hints)) {
          hints = question.hints
        } else if (question.hints) {
          hints = [question.hints]
        } else if (question.clues && Array.isArray(question.clues)) {
          hints = question.clues
        }
        
        // Extract test cases (array)
        const testCases = question.testCases || 
                         question.test_cases || 
                         question.testCases || 
                         []
        
        console.log(`      Question ID: ${questionId}`)
        console.log(`      Title: ${title.substring(0, 50)}...`)
        console.log(`      Content length: ${questionContent.length} characters`)
        console.log(`      Difficulty: ${difficulty}`)
        console.log(`      Language: ${language}`)
        console.log(`      Question Type: ${questionType}`)
        console.log(`      Hints: ${hints.length}`)
        console.log(`      Test Cases: ${testCases.length}`)
        console.log(`      Course ID: ${courseId || 'null'}`)
        console.log(`      Topic ID: ${topicId || 'null'}`)
        
        // ========================================================================
        // STEP 2: Ensure temp_questions table structure
        // ========================================================================
        console.log(`   📋 STEP 2: Ensuring temp_questions table structure`)
        
        // Check if table exists and has required columns
        const tableCheck = await client.query(`
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
        const hasTestCasesColumn = tableCheck.rows.some(col => col.column_name === 'test_cases')
        const hasCourseIdColumn = tableCheck.rows.some(col => col.column_name === 'course_id')
        const hasTopicIdColumn = tableCheck.rows.some(col => col.column_name === 'topic_id')
        
        // Create table if it doesn't exist, or alter if columns are missing
        if (tableCheck.rows.length === 0) {
          // Table doesn't exist - create it
          console.log(`      Creating temp_questions table`)
          await client.query(`
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
          
          // Create indexes
          if (courseId) {
            await client.query(`
              CREATE INDEX IF NOT EXISTS temp_questions_course_id_idx 
              ON "temp_questions" ("course_id");
            `)
          }
          
          if (topicId) {
            await client.query(`
              CREATE INDEX IF NOT EXISTS temp_questions_topic_id_idx 
              ON "temp_questions" ("topic_id");
            `)
          }
          
          console.log(`      ✅ Created temp_questions table`)
        } else {
          // Table exists - add missing columns
          console.log(`      Table exists, checking for missing columns`)
          
          if (!hasQuestionIdColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "question_id" text;`)
            console.log(`      ✅ Added question_id column`)
          }
          if (!hasQuestionContentColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "question_content" text;`)
            console.log(`      ✅ Added question_content column`)
          }
          if (!hasTitleColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "title" text;`)
            console.log(`      ✅ Added title column`)
          }
          if (!hasDifficultyColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "difficulty" text;`)
            console.log(`      ✅ Added difficulty column`)
          }
          if (!hasLanguageColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "language" text;`)
            console.log(`      ✅ Added language column`)
          }
          if (!hasQuestionTypeColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "question_type" text;`)
            console.log(`      ✅ Added question_type column`)
          }
          if (!hasSolutionColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "solution" text;`)
            console.log(`      ✅ Added solution column`)
          }
          if (!hasHintsColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "hints" jsonb DEFAULT '[]'::jsonb;`)
            console.log(`      ✅ Added hints column`)
          }
          if (!hasTestCasesColumn) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "test_cases" jsonb DEFAULT '[]'::jsonb;`)
            console.log(`      ✅ Added test_cases column`)
          }
          if (!hasCourseIdColumn && courseId) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "course_id" uuid;`)
            console.log(`      ✅ Added course_id column`)
          }
          if (!hasTopicIdColumn && topicId) {
            await client.query(`ALTER TABLE "temp_questions" ADD COLUMN IF NOT EXISTS "topic_id" uuid;`)
            console.log(`      ✅ Added topic_id column`)
          }
          
          // Create unique index on question_id if it doesn't exist
          try {
            await client.query(`
              CREATE UNIQUE INDEX IF NOT EXISTS temp_questions_question_id_idx 
              ON "temp_questions" ("question_id");
            `)
          } catch (idxError) {
            // Index might already exist, ignore
            console.log(`      Index on question_id already exists or cannot be created`)
          }
        }
        
        // ========================================================================
        // STEP 3: Insert question into temp_questions table
        // ========================================================================
        console.log(`   📋 STEP 3: Inserting question into temp_questions table`)
        console.log(`      Question ID: ${questionId}`)
        console.log(`      Question Content: ${questionContent.substring(0, 50)}...`)
        
        // Prepare test cases as JSON for storing in temp_questions.test_cases
        const testCasesJson = testCases.map(tc => ({
          input: tc.input || tc.test_input || null,
          expected_output: tc.expectedOutput || tc.expected_output || tc.output || tc.expected || null,
          explanation: tc.explanation || tc.description || null
        }))
        
        // Insert question into temp_questions
        const insertQuestionResult = await client.query(
          `INSERT INTO "temp_questions" (
            "question_id",
            "question_content",
            "title",
            "difficulty",
            "language",
            "question_type",
            "solution",
            "hints",
            "test_cases",
            "course_id",
            "topic_id",
            "created_at",
            "updated_at"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, now(), now())
          ON CONFLICT ("question_id")
          DO UPDATE SET
            "question_content" = EXCLUDED."question_content",
            "title" = EXCLUDED."title",
            "difficulty" = EXCLUDED."difficulty",
            "language" = EXCLUDED."language",
            "question_type" = EXCLUDED."question_type",
            "solution" = EXCLUDED."solution",
            "hints" = EXCLUDED."hints",
            "test_cases" = EXCLUDED."test_cases",
            "course_id" = EXCLUDED."course_id",
            "topic_id" = EXCLUDED."topic_id",
            "updated_at" = now()
          RETURNING "question_id", "title", "created_at"`,
          [
            questionId,           // $1: question_id (text)
            questionContent,      // $2: question_content (text)
            title,                // $3: title (text)
            difficulty,           // $4: difficulty (text)
            language,             // $5: language (text)
            questionType,         // $6: question_type (text)
            solution,             // $7: solution (text)
            JSON.stringify(hints), // $8: hints (jsonb)
            JSON.stringify(testCasesJson), // $9: test_cases (jsonb)
            courseId,             // $10: course_id (uuid)
            topicId               // $11: topic_id (uuid)
          ]
        )
        
        console.log(`      ✅ Question inserted successfully`)
        console.log(`      Rows returned: ${insertQuestionResult.rows.length}`)
        console.log(`      Row count: ${insertQuestionResult.rowCount}`)
        
        if (insertQuestionResult.rows.length > 0) {
          console.log(`      Inserted question data:`, JSON.stringify(insertQuestionResult.rows[0], null, 2))
        }
        
        results.savedQuestions.push({
          question_id: questionId,
          title,
          created_at: insertQuestionResult.rows[0]?.created_at
        })
        
        // ========================================================================
        // STEP 4: Insert test cases into testCases table
        // ========================================================================
        console.log(`   📋 STEP 4: Inserting test cases into testCases table`)
        console.log(`      Test cases count: ${testCases.length}`)
        
        // Check if question_id is UUID format (for foreign key constraint)
        const isQuestionIdUuid = questionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        
        if (isQuestionIdUuid && testCases.length > 0) {
          // Question ID is UUID - can use testCases table with foreign key
          console.log(`      Question ID is UUID format - using testCases table`)
          
          for (let j = 0; j < testCases.length; j++) {
            const testCase = testCases[j]
            try {
              // Generate UUID for test case
              const testCaseId = randomUUID()
              
              // Extract test case data
              const input = testCase.input || testCase.test_input || null
              const expectedOutput = testCase.expectedOutput || 
                                    testCase.expected_output || 
                                    testCase.output || 
                                    testCase.expected || 
                                    ''
              const explanation = testCase.explanation || testCase.description || null
              
              console.log(`         Test case ${j + 1}:`)
              console.log(`            Test case ID: ${testCaseId}`)
              console.log(`            Input: ${input ? input.substring(0, 30) + '...' : 'null'}`)
              console.log(`            Expected output: ${expectedOutput.substring(0, 30)}...`)
              console.log(`            Explanation: ${explanation ? explanation.substring(0, 30) + '...' : 'null'}`)
              
              // Insert test case into testCases table
              const insertTestCaseResult = await client.query(
                `INSERT INTO "testCases" (
                  "testCase_id",
                  "question_id",
                  "input",
                  "expected_output",
                  "explanation",
                  "metadata",
                  "created_at",
                  "updated_at"
                )
                VALUES ($1, $2::uuid, $3, $4, $5, $6::jsonb, now(), now())
                ON CONFLICT ("testCase_id")
                DO UPDATE SET
                  "input" = EXCLUDED."input",
                  "expected_output" = EXCLUDED."expected_output",
                  "explanation" = EXCLUDED."explanation",
                  "metadata" = EXCLUDED."metadata",
                  "updated_at" = now()
                RETURNING "testCase_id", "question_id", "created_at"`,
                [
                  testCaseId,        // $1: testCase_id (uuid)
                  questionId,        // $2: question_id (uuid) - foreign key
                  input,             // $3: input (text)
                  expectedOutput,    // $4: expected_output (text)
                  explanation,       // $5: explanation (text)
                  JSON.stringify({   // $6: metadata (jsonb)
                    source: 'question-generation',
                    test_case_index: j,
                    stored_in: 'testCases_table'
                  })
                ]
              )
              
              console.log(`            ✅ Test case inserted successfully`)
              console.log(`            Rows returned: ${insertTestCaseResult.rows.length}`)
              
              results.savedTestCases.push({
                test_case_id: testCaseId,
                question_id: questionId,
                input,
                expected_output: expectedOutput,
                stored_in: 'testCases_table'
              })
            } catch (testCaseError) {
              console.error(`            ❌ Error inserting test case ${j + 1}:`)
              console.error(`               Error: ${testCaseError.message}`)
              console.error(`               Code: ${testCaseError.code || 'N/A'}`)
              console.error(`               Detail: ${testCaseError.detail || 'N/A'}`)
              
              results.errors.push({
                step: 'test_case_insert',
                question_id: questionId,
                test_case_index: j,
                error: testCaseError.message,
                code: testCaseError.code,
                detail: testCaseError.detail
              })
            }
          }
        } else {
          // Question ID is not UUID - test cases are already stored in temp_questions.test_cases JSONB
          console.log(`      Question ID is not UUID format - test cases stored in temp_questions.test_cases JSONB`)
          console.log(`      Test cases are already saved in temp_questions.test_cases column`)
          
          // Log test cases that were stored in JSONB
          testCases.forEach((tc, idx) => {
            results.savedTestCases.push({
              test_case_id: `jsonb_${questionId}_${idx}`,
              question_id: questionId,
              input: tc.input || tc.test_input || null,
              expected_output: tc.expectedOutput || tc.expected_output || tc.output || tc.expected || null,
              stored_in: 'temp_questions.test_cases_jsonb'
            })
          })
        }
        
        console.log(`   ✅ Question ${i + 1} processed successfully`)
        
      } catch (questionError) {
        console.error(`   ❌ Error processing question ${i + 1}:`)
        console.error(`      Error: ${questionError.message}`)
        console.error(`      Code: ${questionError.code || 'N/A'}`)
        console.error(`      Detail: ${questionError.detail || 'N/A'}`)
        console.error(`      Stack: ${questionError.stack || 'N/A'}`)
        
        results.errors.push({
          step: 'question_insert',
          question_index: i,
          question_id: question.question_id || question.id || `question_${i}`,
          error: questionError.message,
          code: questionError.code,
          detail: questionError.detail
        })
        
        // Continue with next question instead of failing entire transaction
        // If you want to fail entire transaction on any error, uncomment the next line:
        // throw questionError
      }
    }
    
    // ========================================================================
    // STEP 5: Commit transaction
    // ========================================================================
    console.log(`\n📋 Committing transaction`)
    console.log(`   Transaction ID: ${results.transactionId}`)
    console.log(`   Saved questions: ${results.savedQuestions.length}`)
    console.log(`   Saved test cases: ${results.savedTestCases.length}`)
    console.log(`   Errors: ${results.errors.length}`)
    
    await client.query('COMMIT')
    console.log('✅ Transaction committed successfully')
    
    results.success = results.savedQuestions.length > 0
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ [questionSaveService] saveQuestionsWithTestCases completed')
    console.log('='.repeat(80))
    console.log(`   Success: ${results.success}`)
    console.log(`   Saved questions: ${results.savedQuestions.length}`)
    console.log(`   Saved test cases: ${results.savedTestCases.length}`)
    console.log(`   Errors: ${results.errors.length}`)
    console.log('='.repeat(80) + '\n')
    
    return results
    
  } catch (error) {
    // ========================================================================
    // STEP 6: Rollback transaction on error
    // ========================================================================
    console.error('\n' + '='.repeat(80))
    console.error('❌ [questionSaveService] Transaction failed - rolling back')
    console.error('='.repeat(80))
    console.error(`   Error: ${error.message}`)
    console.error(`   Code: ${error.code || 'N/A'}`)
    console.error(`   Detail: ${error.detail || 'N/A'}`)
    console.error(`   Stack: ${error.stack || 'N/A'}`)
    console.error('='.repeat(80))
    
    try {
      await client.query('ROLLBACK')
      console.log('✅ Transaction rolled back successfully')
    } catch (rollbackError) {
      console.error('❌ Error rolling back transaction:', rollbackError.message)
    }
    
    results.success = false
    results.errors.push({
      step: 'transaction',
      error: error.message,
      code: error.code,
      detail: error.detail
    })
    
    return results
    
  } finally {
    // ========================================================================
    // STEP 7: Release database client
    // ========================================================================
    console.log(`\n📋 Releasing database client`)
    client.release()
    console.log('✅ Database client released')
  }
}

/**
 * Example endpoint handler that uses saveQuestionsWithTestCases
 * 
 * This shows how to call the service from an Express route handler
 */
export const saveQuestionsEndpoint = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('📥 [endpoint] Received request to save questions')
    console.log('='.repeat(80))
    console.log('   Request body:', JSON.stringify(req.body, null, 2))
    
    // Extract questions from request body
    // Request body can be:
    // 1. { questions: [...] } - array of questions
    // 2. { question: {...} } - single question
    // 3. [...] - array directly
    const questions = req.body.questions || 
                     (req.body.question ? [req.body.question] : []) || 
                     (Array.isArray(req.body) ? req.body : [])
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No questions provided',
        message: 'Request body must contain a "questions" array or a "question" object'
      })
    }
    
    console.log(`   Questions count: ${questions.length}`)
    
    // Extract options from request body
    const options = {
      course_id: req.body.course_id || req.body.courseId || null,
      topic_id: req.body.topic_id || req.body.topicId || null,
      courseName: req.body.courseName || null,
      topicName: req.body.topicName || null,
      difficulty: req.body.difficulty || null,
      language: req.body.language || null,
      questionType: req.body.questionType || req.body.question_type || null
    }
    
    console.log(`   Options:`, JSON.stringify(options, null, 2))
    
    // Save questions using transaction
    const result = await saveQuestionsWithTestCases(questions, options)
    
    // Return response
    if (result.success && result.savedQuestions.length > 0) {
      return res.json({
        success: true,
        message: `Successfully saved ${result.savedQuestions.length} question(s) and ${result.savedTestCases.length} test case(s)`,
        data: {
          savedQuestions: result.savedQuestions,
          savedTestCases: result.savedTestCases,
          errors: result.errors,
          transactionId: result.transactionId
        }
      })
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to save questions',
        message: result.errors.length > 0 ? result.errors[0].error : 'Unknown error',
        data: {
          savedQuestions: result.savedQuestions,
          savedTestCases: result.savedTestCases,
          errors: result.errors,
          transactionId: result.transactionId
        }
      })
    }
    
  } catch (error) {
    console.error('\n❌ [endpoint] Error in saveQuestionsEndpoint:')
    console.error(`   Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}


