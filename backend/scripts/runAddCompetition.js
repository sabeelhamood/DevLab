import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Try loading .env.local first, then .env
const envLocalPath = path.join(__dirname, '../.env.local')
const envPath = path.join(__dirname, '../.env')

try {
  dotenv.config({ path: envLocalPath })
} catch (e) {
  try {
    dotenv.config({ path: envPath })
  } catch (e2) {
    // Try loading from current directory
    dotenv.config()
  }
}

import { postgres } from '../src/config/database.js'

const runSQLScript = async () => {
  try {
    console.log('📋 Reading SQL script...')
    const sqlFilePath = path.join(__dirname, 'add_competition.sql')
    const sqlScript = readFileSync(sqlFilePath, 'utf8')
    
    console.log('🔌 Connecting to database...')
    
    // Split the script by semicolons to handle DO blocks and multiple statements
    // For PostgreSQL, we can execute the entire script as one query
    console.log('⚙️  Executing SQL script...')
    
    const result = await postgres.query(sqlScript)
    
    if (result.rows && result.rows.length > 0) {
      console.log('\n✅ Competition created successfully!')
      console.log('Result:', JSON.stringify(result.rows, null, 2))
    } else {
      console.log('\n✅ Script executed successfully!')
      console.log('Note: No rows returned (this is normal for DO blocks)')
    }
    
    // Verify the competition was created
    console.log('\n🔍 Verifying competition was created...')
    const { rows: competitions } = await postgres.query(
      'SELECT "competition_id", "course_name", "course_id", "learner1_id", "learner2_id", "status" FROM "competitions" ORDER BY "created_at" DESC LIMIT 1'
    )
    
    if (competitions.length > 0) {
      console.log('✅ Latest competition:')
      console.log(JSON.stringify(competitions[0], null, 2))
    } else {
      console.log('⚠️  No competitions found in the table')
    }
    
    // Verify course completions were added
    console.log('\n🔍 Verifying course completions...')
    const { rows: completions } = await postgres.query(
      `SELECT cc."learner_id", up."learner_name", cc."course_id", cc."course_name", cc."completed_at"
       FROM "course_completions" cc
       INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
       ORDER BY cc."completed_at" DESC
       LIMIT 5`
    )
    
    if (completions.length > 0) {
      console.log('✅ Recent course completions:')
      completions.forEach(completion => {
        console.log(`  - ${completion.learner_name} completed "${completion.course_name}" (course_id: ${completion.course_id})`)
      })
    } else {
      console.log('⚠️  No course completions found')
    }
    
  } catch (error) {
    console.error('❌ Error executing SQL script:', error.message)
    if (error.detail) {
      console.error('Details:', error.detail)
    }
    if (error.hint) {
      console.error('Hint:', error.hint)
    }
    throw error
  } finally {
    await postgres.pool.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the script
runSQLScript()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

