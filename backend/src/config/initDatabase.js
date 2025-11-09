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

const getTableMeta = async (name, schema = 'public') => {
  const tables = await fetchPgMeta(
    `pg_meta/tables?name=eq.${encodeURIComponent(name)}&schema=eq.${encodeURIComponent(schema)}`
  )
  return tables?.[0] || null
}

const ensureColumnExists = async (tableId, column) => {
  const existing = await fetchPgMeta(
    `pg_meta/columns?table_id=eq.${tableId}&name=eq.${encodeURIComponent(column.name)}`
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

const ensurePrimaryKey = async (tableId, primaryKey) => {
  if (!primaryKey?.columns?.length) {
    return
  }

  const existing = await fetchPgMeta(`pg_meta/primary_keys?table_id=eq.${tableId}`)
  if (existing.length > 0) {
    return
  }

  await fetchPgMeta('pg_meta/primary_keys', {
    method: 'POST',
    body: JSON.stringify({
      table_id: tableId,
      columns: primaryKey.columns,
      ...(primaryKey.name ? { name: primaryKey.name } : {})
    })
  })
}

const ensureIndex = async (tableId, index) => {
  if (!index?.columns?.length || !index.name) {
    return
  }

  const existing = await fetchPgMeta(
    `pg_meta/indexes?table_id=eq.${tableId}&name=eq.${encodeURIComponent(index.name)}`
  )

  if (existing.length > 0) {
    return
  }

  await fetchPgMeta('pg_meta/indexes', {
    method: 'POST',
    body: JSON.stringify({
      table_id: tableId,
      name: index.name,
      columns: index.columns,
      is_unique: Boolean(index.is_unique)
    })
  })
}

const ensureForeignKeys = async (tableId, foreignKeys = [], tableCache = {}) => {
  if (!foreignKeys.length) {
    return
  }

  const existing = await fetchPgMeta(`pg_meta/foreign_keys?table_id=eq.${tableId}`)

  for (const fk of foreignKeys) {
    if (!fk?.columns?.length || !fk?.references?.table || !fk?.references?.columns?.length) {
      continue
    }

    if (existing.some((item) => item.name === fk.name)) {
      continue
    }

    const referencedTable =
      tableCache[fk.references.table] || (await getTableMeta(fk.references.table, fk.references.schema))

    if (!referencedTable?.id) {
      console.warn(`⚠️  Referenced table ${fk.references.table} not found for FK ${fk.name}`)
      continue
    }

    await fetchPgMeta('pg_meta/foreign_keys', {
      method: 'POST',
      body: JSON.stringify({
        name: fk.name,
        table_id: tableId,
        columns: fk.columns,
        referenced_table_id: referencedTable.id,
        referenced_columns: fk.references.columns,
        on_delete: fk.onDelete || 'NO ACTION',
        on_update: fk.onUpdate || 'NO ACTION'
      })
    })
  }
}

const supabaseTableDefinitions = [
  {
    name: 'userProfiles',
    comment: 'Stores user profile metadata for DEVLAB learners and trainers',
    columns: [
      { name: 'user_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'name', type: 'text', is_nullable: false },
      { name: 'email', type: 'text', is_nullable: false },
      { name: 'role', type: 'text', default_value: "'learner'", is_nullable: false },
      { name: 'organizationId', type: 'uuid', is_nullable: true },
      { name: 'completed_courses', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'active_courses', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['user_id'], name: 'userprofiles_pkey' },
    indexes: [
      { name: 'userprofiles_email_key', columns: ['email'], is_unique: true },
      { name: 'userprofiles_role_idx', columns: ['role'] },
      { name: 'userprofiles_organization_idx', columns: ['organizationId'] }
    ]
  },
  {
    name: 'courses',
    comment: 'Stores course catalog information',
    columns: [
      { name: 'course_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'trainer_id', type: 'uuid', is_nullable: true },
      { name: 'title', type: 'text', is_nullable: false },
      { name: 'description', type: 'text', is_nullable: true },
      { name: 'level', type: 'text', default_value: "'beginner'", is_nullable: false },
      { name: 'ai_feedback', type: 'jsonb', is_nullable: true },
      { name: 'metadata', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['course_id'], name: 'courses_pkey' },
    indexes: [
      { name: 'courses_trainer_id_idx', columns: ['trainer_id'] },
      { name: 'courses_level_idx', columns: ['level'] }
    ],
    foreignKeys: [
      {
        name: 'courses_trainer_id_fkey',
        columns: ['trainer_id'],
        references: { table: 'userProfiles', columns: ['user_id'] },
        onDelete: 'SET NULL'
      }
    ]
  },
  {
    name: 'topics',
    comment: 'Stores topic definitions and associated skills',
    columns: [
      { name: 'topic_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'course_id', type: 'uuid', is_nullable: false },
      { name: 'topic_name', type: 'text', is_nullable: false },
      { name: 'nano_skills', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'macro_skills', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'summary', type: 'text', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['topic_id'], name: 'topics_pkey' },
    indexes: [
      { name: 'topics_course_id_idx', columns: ['course_id'] },
      { name: 'topics_topic_name_idx', columns: ['topic_name'] }
    ],
    foreignKeys: [
      {
        name: 'topics_course_id_fkey',
        columns: ['course_id'],
        references: { table: 'courses', columns: ['course_id'] },
        onDelete: 'CASCADE'
      }
    ]
  },
  {
    name: 'practices',
    comment: 'Tracks learner practice sessions and outcomes',
    columns: [
      { name: 'practice_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'learner_id', type: 'uuid', is_nullable: false },
      { name: 'course_id', type: 'uuid', is_nullable: true },
      { name: 'topic_id', type: 'uuid', is_nullable: true },
      { name: 'status', type: 'text', default_value: "'in_progress'", is_nullable: false },
      { name: 'score', type: 'numeric', is_nullable: true },
      { name: 'content', type: 'jsonb', default_value: "'{}'::jsonb", is_nullable: false },
      { name: 'time_spent', type: 'integer', default_value: '0', is_nullable: false },
      { name: 'metadata', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['practice_id'], name: 'practices_pkey' },
    indexes: [
      { name: 'practices_learner_id_idx', columns: ['learner_id'] },
      { name: 'practices_course_id_idx', columns: ['course_id'] },
      { name: 'practices_topic_id_idx', columns: ['topic_id'] },
      { name: 'practices_status_idx', columns: ['status'] }
    ],
    foreignKeys: [
      {
        name: 'practices_learner_id_fkey',
        columns: ['learner_id'],
        references: { table: 'userProfiles', columns: ['user_id'] },
        onDelete: 'CASCADE'
      },
      {
        name: 'practices_course_id_fkey',
        columns: ['course_id'],
        references: { table: 'courses', columns: ['course_id'] },
        onDelete: 'SET NULL'
      },
      {
        name: 'practices_topic_id_fkey',
        columns: ['topic_id'],
        references: { table: 'topics', columns: ['topic_id'] },
        onDelete: 'SET NULL'
      }
    ]
  },
  {
    name: 'questions',
    comment: 'Stores assessment and practice questions',
    columns: [
      { name: 'question_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'topic_id', type: 'uuid', is_nullable: false },
      { name: 'course_id', type: 'uuid', is_nullable: true },
      { name: 'practice_id', type: 'uuid', is_nullable: true },
      { name: 'title', type: 'text', is_nullable: true },
      { name: 'question_type', type: 'text', default_value: "'theoretical'", is_nullable: false },
      { name: 'question_content', type: 'text', is_nullable: false },
      { name: 'difficulty', type: 'text', default_value: "'intermediate'", is_nullable: false },
      { name: 'language', type: 'text', is_nullable: true },
      { name: 'tags', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'metadata', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['question_id'], name: 'questions_pkey' },
    indexes: [
      { name: 'questions_topic_id_idx', columns: ['topic_id'] },
      { name: 'questions_course_id_idx', columns: ['course_id'] },
      { name: 'questions_practice_id_idx', columns: ['practice_id'] },
      { name: 'questions_question_type_idx', columns: ['question_type'] },
      { name: 'questions_difficulty_idx', columns: ['difficulty'] }
    ],
    foreignKeys: [
      {
        name: 'questions_topic_id_fkey',
        columns: ['topic_id'],
        references: { table: 'topics', columns: ['topic_id'] },
        onDelete: 'CASCADE'
      },
      {
        name: 'questions_course_id_fkey',
        columns: ['course_id'],
        references: { table: 'courses', columns: ['course_id'] },
        onDelete: 'SET NULL'
      },
      {
        name: 'questions_practice_id_fkey',
        columns: ['practice_id'],
        references: { table: 'practices', columns: ['practice_id'] },
        onDelete: 'SET NULL'
      }
    ]
  },
  {
    name: 'testCases',
    comment: 'Stores test cases associated with code questions',
    columns: [
      { name: 'testCase_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'question_id', type: 'uuid', is_nullable: false },
      { name: 'input', type: 'text', is_nullable: true },
      { name: 'expected_output', type: 'text', is_nullable: false },
      { name: 'explanation', type: 'text', is_nullable: true },
      { name: 'metadata', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['testCase_id'], name: 'testcases_pkey' },
    indexes: [
      { name: 'testcases_question_id_idx', columns: ['question_id'] }
    ],
    foreignKeys: [
      {
        name: 'testCases_question_id_fkey',
        columns: ['question_id'],
        references: { table: 'questions', columns: ['question_id'] },
        onDelete: 'CASCADE'
      }
    ]
  },
  {
    name: 'competitions',
    comment: 'Stores competition sessions and results',
    columns: [
      { name: 'competition_id', type: 'uuid', default_value: 'gen_random_uuid()', is_nullable: false },
      { name: 'course_id', type: 'uuid', is_nullable: true },
      { name: 'learner1_id', type: 'uuid', is_nullable: true },
      { name: 'learner2_id', type: 'uuid', is_nullable: true },
      { name: 'status', type: 'text', default_value: "'pending'", is_nullable: false },
      { name: 'timer', type: 'text', is_nullable: true },
      { name: 'result', type: 'jsonb', is_nullable: true },
      { name: 'performance_learner1', type: 'jsonb', is_nullable: true },
      { name: 'performance_learner2', type: 'jsonb', is_nullable: true },
      { name: 'score', type: 'integer', is_nullable: true },
      { name: 'questions_answered', type: 'integer', is_nullable: true },
      { name: 'learner1_answers', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'learner2_answers', type: 'jsonb', default_value: "'[]'::jsonb", is_nullable: false },
      { name: 'current_question', type: 'integer', is_nullable: true },
      { name: 'analytics_snapshot', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', default_value: 'now()', is_nullable: false },
      { name: 'updated_at', type: 'timestamptz', default_value: 'now()', is_nullable: false }
    ],
    primaryKey: { columns: ['competition_id'], name: 'competitions_pkey' },
    indexes: [
      { name: 'competitions_course_id_idx', columns: ['course_id'] },
      { name: 'competitions_learner1_id_idx', columns: ['learner1_id'] },
      { name: 'competitions_learner2_id_idx', columns: ['learner2_id'] },
      { name: 'competitions_status_idx', columns: ['status'] }
    ],
    foreignKeys: [
      {
        name: 'competitions_course_id_fkey',
        columns: ['course_id'],
        references: { table: 'courses', columns: ['course_id'] },
        onDelete: 'SET NULL'
      },
      {
        name: 'competitions_learner1_id_fkey',
        columns: ['learner1_id'],
        references: { table: 'userProfiles', columns: ['user_id'] },
        onDelete: 'SET NULL'
      },
      {
        name: 'competitions_learner2_id_fkey',
        columns: ['learner2_id'],
        references: { table: 'userProfiles', columns: ['user_id'] },
        onDelete: 'SET NULL'
      }
    ]
  }
]

const ensureSupabaseCoreTables = async () => {
  if (!supabaseConfig?.url) {
    return
  }

  await ensureExtension('pgcrypto')

  const tableCache = {}

  for (const definition of supabaseTableDefinitions) {
    const { name, comment, columns = [], primaryKey, indexes = [] } = definition

    let table = await getTableMeta(name)
    if (!table) {
      const created = await fetchPgMeta('pg_meta/tables', {
        method: 'POST',
        body: JSON.stringify({
          schema: 'public',
          name,
          ...(comment ? { comment } : {})
        })
      })

      table = created?.id ? created : await getTableMeta(name)
    }

    if (!table?.id) {
      throw new Error(`Unable to create or retrieve table metadata for ${name}`)
    }

    const tableId = table.id

    for (const column of columns) {
      await ensureColumnExists(tableId, column)
    }

    await ensurePrimaryKey(tableId, primaryKey)

    for (const index of indexes) {
      await ensureIndex(tableId, index)
    }

    tableCache[name] = await getTableMeta(name)
  }

  for (const definition of supabaseTableDefinitions) {
    const table = tableCache[definition.name] || (await getTableMeta(definition.name))
    if (table?.id) {
      await ensureForeignKeys(table.id, definition.foreignKeys, tableCache)
    }
  }

  console.log('✅ Supabase core tables verified')
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
      ensureSupabaseCoreTables().catch((error) =>
        console.warn('⚠️  Unable to verify Supabase tables automatically:', error.message)
      )
    ])

    await ensureCompetitionColumns().catch((error) =>
      console.warn('⚠️  Unable to verify competitions table structure:', error.message)
    )
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
    await ensureSupabaseCoreTables()

    const tables = getSupabaseTables()
    console.log('📋 Verified Supabase tables:')
    console.log(`   - ${tables.userProfiles}`)
    console.log(`   - ${tables.competitions}`)
    console.log(`   - ${tables.courses}`)
    console.log(`   - ${tables.topics}`)
    console.log(`   - ${tables.questions}`)
    console.log(`   - ${tables.testCases}`)
    console.log(`   - ${tables.practices}`)
    
    console.log('✅ Supabase tables ready')
    return true
  } catch (error) {
    console.error('❌ Failed to configure Supabase tables:', error)
    throw error
  }
}

