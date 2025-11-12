import 'dotenv/config'
import { Pool } from 'pg'

// Get SUPABASE_URL from command line argument, environment variable, or .env file
let connectionString = process.argv[2] || process.env.SUPABASE_URL

if (!connectionString) {
  console.error('❌ SUPABASE_URL is not configured.')
  console.error('Usage: node addCourseCompletionsForAllUsers.js [SUPABASE_URL] [course_id] [course_name]')
  console.error('Or set SUPABASE_URL as environment variable')
  process.exit(1)
}

// Remove sslmode from connection string if present, we'll handle SSL in Pool config
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

// Create a direct database connection for this script
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL error:', error)
})

const postgres = {
  pool,
  query: (text, params) => pool.query(text, params)
}

// Default course details (can be overridden via environment variables or command line)
// Command line args: [SUPABASE_URL] [course_id] [course_name]
// If SUPABASE_URL is in env, then: [course_id] [course_name]
const getCourseArgs = () => {
  // If first arg is SUPABASE_URL (starts with postgresql://), then course_id is 2nd arg
  if (process.argv[2] && process.argv[2].startsWith('postgresql://')) {
    return {
      courseId: process.argv[3] ? parseInt(process.argv[3], 10) : (process.env.DEFAULT_COURSE_ID || 1),
      courseName: process.argv[4] || process.env.DEFAULT_COURSE_NAME || 'Introduction to Programming'
    }
  } else {
    // SUPABASE_URL is in env, so course_id is 1st arg
    return {
      courseId: process.argv[2] ? parseInt(process.argv[2], 10) : (process.env.DEFAULT_COURSE_ID || 1),
      courseName: process.argv[3] || process.env.DEFAULT_COURSE_NAME || 'Introduction to Programming'
    }
  }
}

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
    const { courseId, courseName } = getCourseArgs()

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
  .finally(() => {
    // Close the database connection
    pool.end()
  })

