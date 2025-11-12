/**
 * Test script to add a user to userProfiles table with learner_name = "bian"
 * This script uses the same connection method as migrations to test Supabase connection
 * 
 * Usage:
 *   SUPABASE_URL=postgresql://... node scripts/test_add_user_bian.js
 *   Or: node scripts/test_add_user_bian.js <SUPABASE_URL>
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

// Load environment variables from .env.local if it exists
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Get SUPABASE_URL from environment variable or command-line argument
let connectionString = process.env.SUPABASE_URL || process.argv[2]

if (!connectionString) {
  console.error('❌ SUPABASE_URL is required')
  console.error('   Usage: SUPABASE_URL=postgresql://... node scripts/test_add_user_bian.js')
  console.error('   Or: node scripts/test_add_user_bian.js <SUPABASE_URL>')
  process.exit(1)
}

// Remove sslmode from connection string if present, we'll handle SSL in Pool config
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

// Create connection pool (same as database.js)
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

// Use the same postgres object structure as database.js
const postgres = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
}

const testAddUserBian = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('📋 Attempting to add user with learner_name = "bian"')
    
    // Test connection first
    const connectionTest = await postgres.query('SELECT 1 as test')
    console.log('✅ Supabase connection test successful:', connectionTest.rows[0])
    
    // Generate UUID for learner_id
    const learnerId = randomUUID()
    console.log(`🔑 Generated learner_id: ${learnerId}`)
    
    // Check if user with name "bian" already exists
    const existingUser = await postgres.query(
      `SELECT "learner_id", "learner_name" FROM "userProfiles" WHERE "learner_name" = $1::text LIMIT 1`,
      ['bian']
    )
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User with learner_name = "bian" already exists:')
      console.log(`   learner_id: ${existingUser.rows[0].learner_id}`)
      console.log(`   learner_name: ${existingUser.rows[0].learner_name}`)
      console.log('✅ Test completed - user already exists')
      return {
        success: true,
        message: 'User already exists',
        learner_id: existingUser.rows[0].learner_id,
        learner_name: existingUser.rows[0].learner_name,
        existing: true
      }
    }
    
    // Insert new user with learner_name = "bian"
    console.log('📝 Inserting new user...')
    const insertResult = await postgres.query(
      `INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
       VALUES ($1::uuid, $2::text, now(), now())
       RETURNING "learner_id", "learner_name", "created_at", "updated_at"`,
      [learnerId, 'bian']
    )
    
    if (insertResult.rows.length > 0) {
      const newUser = insertResult.rows[0]
      console.log('✅ User successfully added to userProfiles:')
      console.log(`   learner_id: ${newUser.learner_id}`)
      console.log(`   learner_name: ${newUser.learner_name}`)
      console.log(`   created_at: ${newUser.created_at}`)
      console.log(`   updated_at: ${newUser.updated_at}`)
      
      // Verify the insertion
      const verifyResult = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_id" = $1::uuid`,
        [learnerId]
      )
      
      if (verifyResult.rows.length > 0) {
        console.log('✅ Verification successful - user found in database')
        console.log('📊 User details:')
        console.log(JSON.stringify(verifyResult.rows[0], null, 2))
      }
      
      return {
        success: true,
        message: 'User successfully added',
        learner_id: newUser.learner_id,
        learner_name: newUser.learner_name,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
        existing: false
      }
    } else {
      throw new Error('Failed to insert user - no rows returned')
    }
    
  } catch (error) {
    console.error('❌ Error adding user to userProfiles:')
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    
    // Check if it's a duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      console.error('   ⚠️ Duplicate key error - user might already exist')
    }
    
    // Check if it's a connection error
    if (error.message && (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.error('   ⚠️ Connection error - check SUPABASE_URL in Railway')
    }
    
    throw error
  } finally {
    // Close the connection pool
    await postgres.pool.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the test
testAddUserBian()
  .then((result) => {
    console.log('\n✅ Test completed successfully')
    console.log('📊 Result:', JSON.stringify(result, null, 2))
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed')
    console.error('Error:', error.message)
    process.exit(1)
  })
