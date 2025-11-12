import 'dotenv/config'

import { postgres } from '../src/config/database.js'

// Check if SUPABASE_URL is configured
if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not configured. Please set it in Railway or your environment.')
  process.exit(1)
}

// Default course details (can be overridden via environment variables or command line)
const DEFAULT_COURSE_ID = process.env.DEFAULT_COURSE_ID || 1
const DEFAULT_COURSE_NAME = process.env.DEFAULT_COURSE_NAME || 'Introduction to Programming'

/**
 * Get all users from userProfiles table
 */
const getAllUsers = async () => {
  const { rows } = await postgres.query(
    'SELECT "learner_id", "learner_name" FROM "userProfiles" ORDER BY "created_at"'
  )
  return rows
}

/**
 * Check if a user already has a completion record for the given course
 */
const hasCourseCompletion = async (learnerId, courseId) => {
  const { rows } = await postgres.query(
    'SELECT 1 FROM "course_completions" WHERE "learner_id" = $1 AND "course_id" = $2 LIMIT 1',
    [learnerId, courseId]
  )
  return rows.length > 0
}

/**
 * Add course completion for a single user
 */
const addCourseCompletion = async (learnerId, courseId, courseName) => {
  const insertQuery = `
    INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
    VALUES ($1, $2, $3, now())
    RETURNING "learner_id", "course_id", "course_name", "completed_at"
  `
  
  const { rows } = await postgres.query(insertQuery, [learnerId, courseId, courseName])
  return rows[0]
}

/**
 * Main function to add course completions for all users
 */
const addCourseCompletionsForAllUsers = async () => {
  try {
    // Get course details from command line arguments or use defaults
    const courseId = process.argv[2] ? parseInt(process.argv[2], 10) : DEFAULT_COURSE_ID
    const courseName = process.argv[3] || DEFAULT_COURSE_NAME

    console.log('📋 Fetching all users from userProfiles...')
    const users = await getAllUsers()
    
    if (users.length === 0) {
      console.error('❌ No users found in userProfiles table')
      process.exit(1)
    }

    console.log(`✅ Found ${users.length} user(s):`)
    users.forEach(user => {
      console.log(`  - ${user.learner_name || 'Unnamed'} (${user.learner_id})`)
    })

    console.log(`\n📝 Adding course completion for course:`)
    console.log(`  Course ID: ${courseId}`)
    console.log(`  Course Name: ${courseName}`)

    let addedCount = 0
    let skippedCount = 0
    const results = []

    for (const user of users) {
      // Check if user already has this course completion
      const alreadyHasCompletion = await hasCourseCompletion(user.learner_id, courseId)
      
      if (alreadyHasCompletion) {
        console.log(`⏭️  Skipping ${user.learner_name || 'Unnamed'} - already has completion for course ${courseId}`)
        skippedCount++
        continue
      }

      try {
        const completion = await addCourseCompletion(
          user.learner_id,
          courseId,
          courseName
        )
        console.log(`✅ Added completion for ${user.learner_name || 'Unnamed'} (${user.learner_id})`)
        results.push(completion)
        addedCount++
      } catch (error) {
        console.error(`❌ Error adding completion for ${user.learner_name || 'Unnamed'}:`, error.message)
      }
    }

    console.log('\n📊 Summary:')
    console.log(`  ✅ Added: ${addedCount} course completion(s)`)
    console.log(`  ⏭️  Skipped: ${skippedCount} (already exist)`)
    console.log(`  📝 Total users processed: ${users.length}`)

    if (results.length > 0) {
      console.log('\n✅ Course completions added successfully!')
      console.log('\n📋 Added completions:')
      results.forEach((completion, index) => {
        console.log(`  ${index + 1}. Learner: ${completion.learner_id}, Course: ${completion.course_name} (ID: ${completion.course_id}), Completed: ${completion.completed_at}`)
      })
    }

    return results
  } catch (error) {
    console.error('❌ Error adding course completions:', error)
    throw error
  }
}

// Run the script
addCourseCompletionsForAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

