/* eslint-disable no-console */
import { connectMongoDB, supabase, getSupabaseTables } from './database.js';

export const initializeDatabases = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB Atlas connected');

    // Test Supabase connection
    const { error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.log('⚠️  Supabase connection test failed:', error.message);
      console.log(
        '   Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
      );
    } else {
      console.log('✅ Supabase PostgreSQL connected');
    }

    // Create MongoDB indexes for better performance
    await createMongoIndexes();

    console.log('✅ Database initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const createMongoIndexes = async () => {
  try {
    const { getCollections } = await import('./database.js');
    const { logs, analytics, errors, sessions } = getCollections();

    // Create indexes for logs collection
    await logs.createIndex({ timestamp: -1 });
    await logs.createIndex({ user_id: 1, timestamp: -1 });
    await logs.createIndex({ service: 1, timestamp: -1 });
    await logs.createIndex({ level: 1, timestamp: -1 });

    // Create indexes for analytics collection
    await analytics.createIndex({ timestamp: -1 });
    await analytics.createIndex({ user_id: 1, timestamp: -1 });
    await analytics.createIndex({ course_id: 1, timestamp: -1 });
    await analytics.createIndex({ event_type: 1, timestamp: -1 });

    // Create indexes for errors collection
    await errors.createIndex({ timestamp: -1 });
    await errors.createIndex({ user_id: 1, timestamp: -1 });
    await errors.createIndex({ error_type: 1, timestamp: -1 });

    // Create indexes for sessions collection
    await sessions.createIndex({ user_id: 1, timestamp: -1 });
    await sessions.createIndex({ session_id: 1 });
    await sessions.createIndex({ status: 1, timestamp: -1 });

    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.error('❌ Failed to create MongoDB indexes:', error);
    throw error;
  }
};

// Create Supabase tables if they don't exist
export const createSupabaseTables = async () => {
  try {
    const tables = getSupabaseTables();

    // Note: In a real application, you would use Supabase migrations
    // For now, we'll just log the table names that should exist
    console.log('📋 Required Supabase tables:');
    console.log(
      `   - ${tables.userProfiles} (user_id, name, email, role, organizationId, completed_courses, active_courses)`
    );
    console.log(
      `   - ${tables.competitions} (competition_id, course_id, learner1_id, learner2_id, result)`
    );
    console.log(
      `   - ${tables.courses} (course_id, trainer_id, level, ai_feedback)`
    );
    console.log(
      `   - ${tables.topics} (topic_id, course_id, topic_name, nano_skills, macro_skills)`
    );
    console.log(
      `   - ${tables.questions} (question_id, practice_id, course_id, question_type, question_content, tags)`
    );
    console.log(
      `   - ${tables.testCases} (testCase_id, question_id, input, expected_output)`
    );
    console.log(
      `   - ${tables.practices} (practice_id, learner_id, course_id, topic_id, content, score, status)`
    );

    console.log('✅ Supabase tables configuration logged');
    return true;
  } catch (error) {
    console.error('❌ Failed to configure Supabase tables:', error);
    throw error;
  }
};
