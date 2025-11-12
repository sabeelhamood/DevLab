import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { postgres } from '../src/config/database.js'

// Get existing users from userProfiles
const getExistingUsers = async () => {
  const { rows } = await postgres.query(
    'SELECT "learner_id", "learner_name" FROM "userProfiles" ORDER BY "created_at" LIMIT 10'
  )
  return rows
}

// Create a competition using existing users
const addCompetition = async () => {
  try {
    console.log('📋 Fetching existing users from userProfiles...')
    const users = await getExistingUsers()
    
    if (users.length < 2) {
      console.error('❌ Need at least 2 users in userProfiles to create a competition')
      console.log('Available users:', users)
      process.exit(1)
    }

    console.log('✅ Found users:')
    users.forEach(user => {
      console.log(`  - ${user.learner_name} (${user.learner_id})`)
    })

    const learner1 = users[0]
    const learner2 = users[1]

    // Create competition data
    const competitionData = {
      course_name: 'JavaScript Fundamentals Showdown',
      course_id: 123,
      learner1_id: learner1.learner_id,
      learner2_id: learner2.learner_id,
      status: 'active',
      question_count: 3,
      time_limit: 1800, // 30 minutes
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

    console.log('\n📝 Creating competition...')
    console.log(`  Course: ${competitionData.course_name}`)
    console.log(`  Learner 1: ${learner1.learner_name} (${learner1.learner_id})`)
    console.log(`  Learner 2: ${learner2.learner_name} (${learner2.learner_id})`)

    // Insert competition
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
      RETURNING "competition_id", "course_name", "learner1_id", "learner2_id", "status"
    `

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
    console.log(`  Course: ${competition.course_name}`)

    return competition
  } catch (error) {
    console.error('❌ Error creating competition:', error)
    throw error
  }
}

// Run the script
addCompetition()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

