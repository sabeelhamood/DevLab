import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { postgres } from '../src/config/database.js'

// Step 1: Check existing users
const checkUsers = async () => {
  console.log('\n📋 Step 1: Checking existing users in userProfiles...')
  const { rows } = await postgres.query(
    'SELECT "learner_id", "learner_name", "created_at" FROM "userProfiles" ORDER BY "created_at" LIMIT 10'
  )
  
  if (rows.length === 0) {
    console.error('❌ No users found in userProfiles table!')
    return null
  }
  
  console.log(`✅ Found ${rows.length} user(s):`)
  rows.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.learner_name} (${user.learner_id})`)
  })
  
  if (rows.length < 2) {
    console.error('❌ Need at least 2 users to create a competition!')
    return null
  }
  
  return rows
}

// Step 2: Check existing competitions
const checkCompetitions = async () => {
  console.log('\n📋 Step 2: Checking existing competitions...')
  const { rows } = await postgres.query(
    'SELECT "competition_id", "course_name", "learner1_id", "learner2_id", "status", "created_at" FROM "competitions" ORDER BY "created_at" DESC LIMIT 5'
  )
  
  console.log(`✅ Found ${rows.length} existing competition(s):`)
  if (rows.length > 0) {
    rows.forEach((comp, index) => {
      console.log(`  ${index + 1}. ID: ${comp.competition_id}, Course: ${comp.course_name}, Status: ${comp.status}`)
    })
  } else {
    console.log('  (No competitions found)')
  }
  
  return rows.length
}

// Step 3: Add new competition
const addCompetition = async (learner1, learner2) => {
  console.log('\n📋 Step 3: Adding new competition...')
  
  const competitionData = {
    course_name: 'JavaScript Fundamentals Showdown',
    course_id: 123,
    learner1_id: learner1.learner_id,
    learner2_id: learner2.learner_id,
    status: 'active',
    question_count: 3,
    time_limit: 1800,
    questions: JSON.stringify([
      {
        id: 'q1',
        title: 'Array Manipulation Challenge',
        points: 100,
        testCases: [
          { input: '[1, 3, 2, 4, 5]', expected: 4 },
          { input: '[5, 4, 3, 2, 1]', expected: 1 },
          { input: '[1, 2, 3, 4, 5]', expected: 5 }
        ],
        timeLimit: 600,
        difficulty: 'medium',
        description: 'Write a function that finds the longest increasing subsequence in an array. Return the length of the subsequence.',
        starterCode: 'function longestIncreasingSubsequence(arr) {\n  // TODO: implement dynamic programming solution\n  return 0;\n}'
      },
      {
        id: 'q2',
        title: 'String Processing',
        points: 80,
        testCases: [
          { input: '"A man a plan a canal Panama"', expected: true },
          { input: '"race a car"', expected: false },
          { input: '"Madam"', expected: true }
        ],
        timeLimit: 420,
        difficulty: 'easy',
        description: 'Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.',
        starterCode: 'function isPalindrome(s) {\n  // TODO: normalize the string and check for palindrome\n  return false;\n}'
      },
      {
        id: 'q3',
        title: 'Dynamic Programming',
        points: 150,
        testCases: [
          { input: '[2, 7, 9, 3, 1]', expected: 12 },
          { input: '[1, 2, 3, 1]', expected: 4 },
          { input: '[2, 1, 1, 2]', expected: 4 }
        ],
        timeLimit: 540,
        difficulty: 'hard',
        description: 'Solve the classic "House Robber" problem. Return the maximum amount you can rob without alerting the police.',
        starterCode: 'function rob(nums) {\n  // TODO: use memoization or tabulation\n  return 0;\n}'
      }
    ]),
    learner1_answers: JSON.stringify([]),
    learner2_answers: JSON.stringify([]),
    learner1_score: 0,
    learner2_score: 0
  }

  console.log(`  Course: ${competitionData.course_name}`)
  console.log(`  Learner 1: ${learner1.learner_name} (${learner1.learner_id})`)
  console.log(`  Learner 2: ${learner2.learner_name} (${learner2.learner_id})`)

  const insertQuery = `
    INSERT INTO "competitions" (
      "course_name",
      "course_id",
      "learner1_id",
      "learner2_id",
      "status",
      "question_count",
      "time_limit",
      "questions",
      "learner1_answers",
      "learner2_answers",
      "learner1_score",
      "learner2_score"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12
    )
    RETURNING "competition_id", "course_name", "learner1_id", "learner2_id", "status", "created_at"
  `

  try {
    const { rows } = await postgres.query(insertQuery, [
      competitionData.course_name,
      competitionData.course_id,
      competitionData.learner1_id,
      competitionData.learner2_id,
      competitionData.status,
      competitionData.question_count,
      competitionData.time_limit,
      competitionData.questions,
      competitionData.learner1_answers,
      competitionData.learner2_answers,
      competitionData.learner1_score,
      competitionData.learner2_score
    ])

    const competition = rows[0]
    console.log('\n✅ Competition created successfully!')
    console.log(`  Competition ID: ${competition.competition_id}`)
    console.log(`  Status: ${competition.status}`)
    console.log(`  Created at: ${competition.created_at}`)
    
    return competition.competition_id
  } catch (error) {
    console.error('❌ Error inserting competition:', error.message)
    console.error('Full error:', error)
    throw error
  }
}

// Step 4: Verify the competition was added
const verifyCompetition = async (competitionId) => {
  console.log('\n📋 Step 4: Verifying competition was added...')
  
  const { rows } = await postgres.query(
    'SELECT * FROM "competitions" WHERE "competition_id" = $1',
    [competitionId]
  )
  
  if (rows.length === 0) {
    console.error(`❌ Competition ${competitionId} NOT FOUND in database!`)
    return false
  }
  
  const competition = rows[0]
  console.log('✅ Competition found in database:')
  console.log(`  ID: ${competition.competition_id}`)
  console.log(`  Course: ${competition.course_name}`)
  console.log(`  Course ID: ${competition.course_id}`)
  console.log(`  Learner 1: ${competition.learner1_id}`)
  console.log(`  Learner 2: ${competition.learner2_id}`)
  console.log(`  Status: ${competition.status}`)
  console.log(`  Questions: ${Array.isArray(competition.questions) ? competition.questions.length : 'N/A'}`)
  console.log(`  Created: ${competition.created_at}`)
  
  return true
}

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting competition addition and verification...\n')
    
    // Step 1: Check users
    const users = await checkUsers()
    if (!users || users.length < 2) {
      process.exit(1)
    }
    
    // Step 2: Check existing competitions
    const existingCount = await checkCompetitions()
    
    // Step 3: Add competition
    const competitionId = await addCompetition(users[0], users[1])
    
    // Step 4: Verify
    const verified = await verifyCompetition(competitionId)
    
    if (verified) {
      console.log('\n✅ SUCCESS: Competition was added and verified!')
      console.log(`\n📊 Summary:`)
      console.log(`  - Existing competitions before: ${existingCount}`)
      console.log(`  - New competition ID: ${competitionId}`)
      console.log(`  - Check Supabase dashboard to see the new row`)
    } else {
      console.log('\n❌ FAILED: Competition was not found after insertion!')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  } finally {
    // Close the database connection pool
    try {
      await postgres.pool.end()
      console.log('\n🔌 Database connection closed')
    } catch (err) {
      // Ignore errors when closing
    }
    process.exit(0)
  }
}

main()

