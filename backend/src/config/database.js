import { MongoClient } from 'mongodb'
import { Pool } from 'pg'

const connectionString = process.env.SUPABASE_URL

if (!connectionString) {
  throw new Error(
    'Supabase connection string missing. Ensure SUPABASE_URL is set in Railway (postgresql://<user>:<password>@<host>:<port>/<database>).'
  )
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL error:', error)
})

const quoteIdentifier = (identifier = '') => `"${identifier.replace(/"/g, '""')}"`

export const postgres = {
  pool,
  query: (text, params) => pool.query(text, params),
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

