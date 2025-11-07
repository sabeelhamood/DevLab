/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';

// PostgreSQL (Supabase) Configuration
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// MongoDB Atlas Configuration
const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://username:password@cluster.mongodb.net/devlab';
const mongoClient = new MongoClient(mongoUri);

let mongoDb = null;

export const connectMongoDB = async () => {
  try {
    await mongoClient.connect();
    mongoDb = mongoClient.db('devlab');
    console.log('✅ Connected to MongoDB Atlas');
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const getMongoDB = () => {
  if (!mongoDb) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return mongoDb;
};

// Database collections
export const getCollections = () => {
  const db = getMongoDB();
  return {
    logs: db.collection('logs'),
    errors: db.collection('errors'),
    analytics: db.collection('analytics'),
    sessions: db.collection('sessions'),
    submissions: db.collection('submissions'),
  };
};

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
  };
};
