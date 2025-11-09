import {
  connectMongoDB,
  supabase,
  getSupabaseTables,
  supabaseConfig,
  getMongoDB
} from './database.js'
import { LogModel } from '../models/Log.js'
import { AnalyticsModel } from '../models/Analytics.js'

const pgMetaHeaders = {
  apikey: supabaseConfig.url ? supabaseConfig.key : '',
  Authorization: supabaseConfig.url ? `Bearer ${supabaseConfig.key}` : '',
  'Content-Type': 'application/json'
}

const fetchPgMeta = async (path, options = {}) => {
  const url = `${supabaseConfig.url}/rest/v1/${path}`
  const response = await fetch(url, {
    method: 'GET',
    ...options,
    headers: {
      ...pgMetaHeaders,
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`pg_meta request failed [${response.status}]: ${text}`)
  }

  return response.json()
}

const ensureExtension = async (name) => {
  const response = await fetchPgMeta(`pg_meta/extensions?name=eq.${name}`)
  if (response.length > 0) {
    return
}

  await fetchPgMeta(`pg_meta/extensions`, {
    method: 'POST',
    body: JSON.stringify({ name })
  })
}

const ensureTempQuestionsTable = async () => {
  if (!supabaseConfig?.url) {
    return
  }

  const tables = await fetchPgMeta(
    `pg_meta/tables?name=eq.temp_questions&schema=eq.public`
  )

  if (tables.length > 0) {
    return
  }

  await ensureExtension('pgcrypto')

  const table = await fetchPgMeta('pg_meta/tables', {
    method: 'POST',
    body: JSON.stringify({
      schema: 'public',
      name: 'temp_questions',
      comment: 'Temporary question storage awaiting confirmation from microservices'
    })
  })

  const tableId = table?.id
  if (!tableId) {
    throw new Error('Unable to create temp_questions table')
  }

  const columns = [
    {
      name: 'id',
      type: 'uuid',
      default_value: 'gen_random_uuid()',
      is_nullable: false
    },
    {
      name: 'request_id',
      type: 'text',
      is_nullable: false
    },
    {
      name: 'question',
      type: 'jsonb',
      is_nullable: false
    },
    {
      name: 'hints',
      type: 'jsonb',
      is_nullable: true
    },
    {
      name: 'test_cases',
      type: 'jsonb',
      is_nullable: true
    },
    {
      name: 'status',
      type: 'text',
      default_value: "'pending'",
      is_nullable: false
    },
    {
      name: 'created_at',
      type: 'timestamptz',
      default_value: 'now()',
      is_nullable: false
    },
    {
      name: 'updated_at',
      type: 'timestamptz',
      default_value: 'now()',
      is_nullable: false
    }
  ]

  await Promise.all(
    columns.map((column) =>
      fetchPgMeta('pg_meta/columns', {
        method: 'POST',
        body: JSON.stringify({
          table_id: tableId,
          position: 'last',
          ...column
        })
      })
    )
  )

  await fetchPgMeta('pg_meta/primary_keys', {
    method: 'POST',
    body: JSON.stringify({
      table_id: tableId,
      columns: ['id']
    })
  })

  await fetchPgMeta('pg_meta/indexes', {
    method: 'POST',
    body: JSON.stringify({
      table_id: tableId,
      name: 'temp_questions_request_id_idx',
      columns: ['request_id'],
      is_unique: false
    })
  })
}

const ensureCompetitionColumns = async () => {
  if (!supabaseConfig?.url) {
    return
  }

  const tables = await fetchPgMeta(
    `pg_meta/tables?name=eq.competitions&schema=eq.public`
  )

  if (tables.length === 0) {
    return
  }

  const tableId = tables[0].id

  const ensureColumn = async (column) => {
    const existing = await fetchPgMeta(
      `pg_meta/columns?table_id=eq.${tableId}&name=eq.${column.name}`
    )

    if (existing.length > 0) {
      return
    }

    await fetchPgMeta('pg_meta/columns', {
      method: 'POST',
      body: JSON.stringify({
        table_id: tableId,
        position: 'last',
        ...column
      })
    })
  }

  const columns = [
    { name: 'status', type: 'text', default_value: "'pending'", is_nullable: false },
    { name: 'timer', type: 'text', is_nullable: true },
    { name: 'performance_learner1', type: 'jsonb', is_nullable: true },
    { name: 'performance_learner2', type: 'jsonb', is_nullable: true },
    { name: 'score', type: 'integer', is_nullable: true },
    { name: 'questions_answered', type: 'integer', is_nullable: true },
    { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
  ]

  for (const column of columns) {
    await ensureColumn(column)
  }
}

const ensureMongoCollections = async () => {
  const db = getMongoDB()
  const existing = await db.listCollections().toArray()
  const existingNames = new Set(existing.map((collection) => collection.name))

  const requiredCollections = ['logs', 'errors', 'analytics', 'sessions', 'submissions']

  await Promise.all(
    requiredCollections.map(async (collectionName) => {
      if (!existingNames.has(collectionName)) {
        await db.createCollection(collectionName)
      }
    })
  )
}

export const initializeDatabases = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB()
    console.log('✅ MongoDB Atlas connected')

    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('⚠️  Supabase connection test failed:', error.message)
      console.log('   Make sure to set SUPABASE_URL and SUPABASE_KEY environment variables')
    } else {
      console.log('✅ Supabase PostgreSQL connected')
    }

    // Create MongoDB indexes for better performance
    await createMongoIndexes()
    
    await Promise.all([
      ensureMongoCollections().catch((error) =>
        console.warn('⚠️  Unable to verify MongoDB collections:', error.message)
      ),
      ensureTempQuestionsTable().catch((error) =>
        console.warn('⚠️  Unable to create temp_questions table automatically:', error.message)
      ),
      ensureCompetitionColumns().catch((error) =>
        console.warn('⚠️  Unable to verify competitions table structure:', error.message)
      )
    ])
    console.log('✅ Database initialization complete')
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

const createMongoIndexes = async () => {
  try {
    const { getCollections } = await import('./database.js')
    const { logs, analytics, errors, sessions } = getCollections()

    // Create indexes for logs collection
    await logs.createIndex({ timestamp: -1 })
    await logs.createIndex({ user_id: 1, timestamp: -1 })
    await logs.createIndex({ service: 1, timestamp: -1 })
    await logs.createIndex({ level: 1, timestamp: -1 })

    // Create indexes for analytics collection
    await analytics.createIndex({ timestamp: -1 })
    await analytics.createIndex({ user_id: 1, timestamp: -1 })
    await analytics.createIndex({ course_id: 1, timestamp: -1 })
    await analytics.createIndex({ event_type: 1, timestamp: -1 })

    // Create indexes for errors collection
    await errors.createIndex({ timestamp: -1 })
    await errors.createIndex({ user_id: 1, timestamp: -1 })
    await errors.createIndex({ error_type: 1, timestamp: -1 })

    // Create indexes for sessions collection
    await sessions.createIndex({ user_id: 1, timestamp: -1 })
    await sessions.createIndex({ session_id: 1 })
    await sessions.createIndex({ status: 1, timestamp: -1 })

    console.log('✅ MongoDB indexes created')
  } catch (error) {
    console.error('❌ Failed to create MongoDB indexes:', error)
    throw error
  }
}

// Create Supabase tables if they don't exist
export const createSupabaseTables = async () => {
  try {
    const tables = getSupabaseTables()
    
    // Note: In a real application, you would use Supabase migrations
    // For now, we'll just log the table names that should exist
    console.log('📋 Required Supabase tables:')
    console.log(`   - ${tables.userProfiles} (user_id, name, email, role, organizationId, completed_courses, active_courses)`)
    console.log(`   - ${tables.competitions} (competition_id, course_id, learner1_id, learner2_id, result)`)
    console.log(`   - ${tables.courses} (course_id, trainer_id, level, ai_feedback)`)
    console.log(`   - ${tables.topics} (topic_id, course_id, topic_name, nano_skills, macro_skills)`)
    console.log(`   - ${tables.questions} (question_id, practice_id, course_id, question_type, question_content, tags)`)
    console.log(`   - ${tables.testCases} (testCase_id, question_id, input, expected_output)`)
    console.log(`   - ${tables.practices} (practice_id, learner_id, course_id, topic_id, content, score, status)`)
    
    console.log('✅ Supabase tables configuration logged')
    return true
  } catch (error) {
    console.error('❌ Failed to configure Supabase tables:', error)
    throw error
  }
}

