import { createClient } from '@supabase/supabase-js'
import { MongoClient } from 'mongodb'

// PostgreSQL (Supabase) Configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY
}

const supabaseUrl = supabaseConfig.url
const supabaseKey = supabaseConfig.key

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase environment variables missing. Ensure SUPABASE_URL and SUPABASE_KEY are set in Railway.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
    practices: 'practices'
  }
}

