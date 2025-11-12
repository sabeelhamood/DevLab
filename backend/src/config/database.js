import { MongoClient } from 'mongodb'
import { Pool } from 'pg'

let connectionString = process.env.SUPABASE_URL

if (!connectionString) {
  throw new Error(
    'Supabase connection string missing. Ensure SUPABASE_URL is set in Railway (postgresql://<user>:<password>@<host>:<port>/<database>).'
  )
}

// Remove sslmode from connection string if present, we'll handle SSL in Pool config
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000 // Return an error after 10 seconds if connection cannot be established
})

pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL error:', error)
})

const quoteIdentifier = (identifier = '') => `"${identifier.replace(/"/g, '""')}"`

/**
 * Enhanced postgres query wrapper with comprehensive logging
 * Logs all Supabase queries, connection status, and errors
 */
const queryWithLogging = async (text, params) => {
  const queryId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  try {
    // Only log non-connection-test queries to avoid spam
    const isConnectionTest = text.trim().toUpperCase() === 'SELECT 1' || text.trim().toUpperCase().startsWith('SELECT NOW()')
    
    if (!isConnectionTest) {
      console.log(`\n📊 [supabase-query-${queryId}] Executing query`)
      console.log(`   Query text: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`)
      if (params && params.length > 0) {
        console.log(`   Parameters: ${JSON.stringify(params)}`)
      }
      console.log(`   Timestamp: ${new Date().toISOString()}`)
    }
    
    // Execute query directly using pool.query (not postgres.query to avoid recursion)
    const result = await pool.query(text, params)
    const duration = Date.now() - startTime
    
    if (!isConnectionTest) {
      console.log(`   ✅ Query executed successfully in ${duration}ms`)
      console.log(`   Rows returned: ${result.rows ? result.rows.length : 0}`)
      console.log(`   Row count: ${result.rowCount || 0}`)
      
      if (result.rows && result.rows.length > 0 && result.rows.length <= 5) {
        console.log(`   Sample data: ${JSON.stringify(result.rows, null, 2)}`)
      } else if (result.rows && result.rows.length > 5) {
        console.log(`   Sample data (first row): ${JSON.stringify(result.rows[0], null, 2)}`)
        console.log(`   ... and ${result.rows.length - 1} more rows`)
      }
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error(`\n❌ [supabase-query-${queryId}] Query failed after ${duration}ms`)
    console.error(`   Query text: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`)
    if (params && params.length > 0) {
      console.error(`   Parameters: ${JSON.stringify(params)}`)
    }
    console.error(`   Error message: ${error.message}`)
    console.error(`   Error code: ${error.code || 'N/A'}`)
    console.error(`   Error detail: ${error.detail || 'N/A'}`)
    console.error(`   Error hint: ${error.hint || 'N/A'}`)
    if (error.stack) {
      console.error(`   Error stack: ${error.stack}`)
    }
    
    // Log specific error types
    if (error.code === '23505') {
      console.error(`   ⚠️ Error type: Unique constraint violation (duplicate key)`)
      console.error(`   This usually means the record already exists`)
    } else if (error.code === '42P01') {
      console.error(`   ⚠️ Error type: Table does not exist`)
      console.error(`   Check if migrations have been run`)
    } else if (error.code === '23503') {
      console.error(`   ⚠️ Error type: Foreign key constraint violation`)
      console.error(`   Check if referenced records exist`)
    } else if (error.code === '42501') {
      console.error(`   ⚠️ Error type: Permission denied`)
      console.error(`   Check database user permissions`)
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`   ⚠️ Error type: Connection refused`)
      console.error(`   Check SUPABASE_URL configuration`)
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`   ⚠️ Error type: Connection timeout`)
      console.error(`   Check network/Supabase status`)
    } else if (error.code === 'ENOTFOUND') {
      console.error(`   ⚠️ Error type: DNS resolution failed`)
      console.error(`   Check SUPABASE_URL hostname`)
    }
    
    throw error
  }
}

export const postgres = {
  pool,
  query: queryWithLogging,
  getClient: () => pool.connect(),
  quoteIdentifier
}

// MongoDB Atlas Configuration
const mongoUri = process.env.MONGO_URL
if (!mongoUri) {
  throw new Error('MongoDB environment variable missing. Ensure MONGO_URL is set in Railway.')
}

const mongoClient = new MongoClient(mongoUri)
const mongoDbName = process.env.MONGO_DB_NAME || 'devlab'

let mongoDb = null

export const connectMongoDB = async () => {
  try {
    await mongoClient.connect()
    mongoDb = mongoClient.db(mongoDbName)
    console.log('✅ Connected to MongoDB Atlas')
    return mongoDb
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}

export const getMongoDB = () => {
  if (!mongoDb) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.')
  }
  return mongoDb
}

// Database collections
export const getCollections = () => {
  const db = getMongoDB()
  return {
    logs: db.collection('logs'),
    errors: db.collection('errors'),
    analytics: db.collection('analytics'),
    sessions: db.collection('sessions'),
    submissions: db.collection('submissions')
  }
}

// PostgreSQL tables (Supabase)
export const getSupabaseTables = () => {
  return {
    userProfiles: 'userProfiles',
    competitions: 'competitions',
    courses: 'courses',
    topics: 'topics',
    questions: 'questions',
    testCases: 'testCases',
    practices: 'practices',
    courseCompletions: 'course_completions',
    learnerScores: 'learner_scores'
  }
}

