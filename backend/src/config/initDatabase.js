import { connectMongoDB, postgres, getMongoDB } from './database.js'

const ensureExtension = async (client) => {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
}

const foreignKeyStatement = (constraintName, table, column, referencedTable, referencedColumn, onDelete = 'NO ACTION') => `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = '${constraintName}'
  ) THEN
    ALTER TABLE ${table}
    ADD CONSTRAINT ${constraintName}
    FOREIGN KEY (${column})
    REFERENCES ${referencedTable} (${referencedColumn})
    ON DELETE ${onDelete};
  END IF;
END $$;
`

const tableStatements = [
  {
    create: `
      CREATE TABLE IF NOT EXISTS "userProfiles" (
        "learner_id" uuid PRIMARY KEY,
        "learner_name" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS userprofiles_learner_name_idx ON "userProfiles" ("learner_name");`
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "course_completions" (
        "learner_id" uuid NOT NULL,
        "course_id" text NOT NULL,
        "completed_at" timestamptz NOT NULL DEFAULT now(),
        "recorded_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("learner_id", "course_id")
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS course_completions_course_id_idx ON "course_completions" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS course_completions_completed_at_idx ON "course_completions" ("completed_at");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'course_completions_learner_id_fkey',
        '"course_completions"',
        '"learner_id"',
        '"userProfiles"',
        '"learner_id"',
        'CASCADE'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "competition_participation" (
        "competition_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_name" text,
        "course_id" text,
        "learner1_id" uuid NOT NULL,
        "learner2_id" uuid,
        "winner_id" uuid,
        "learner1_score" numeric,
        "learner2_score" numeric,
        "learner1_timer" integer,
        "learner2_timer" integer,
        "status" text NOT NULL DEFAULT 'pending',
        "timer" text,
        "result" jsonb,
        "performance_learner1" jsonb,
        "performance_learner2" jsonb,
        "score" integer,
        "questions_answered" integer,
        "question_count" integer,
        "time_limit" integer,
        "questions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "learner1_answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "learner2_answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "current_question" integer,
        "analytics_snapshot" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS competition_participation_course_id_idx ON "competition_participation" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS competition_participation_learner1_idx ON "competition_participation" ("learner1_id");`,
      `CREATE INDEX IF NOT EXISTS competition_participation_learner2_idx ON "competition_participation" ("learner2_id");`,
      `CREATE INDEX IF NOT EXISTS competition_participation_winner_idx ON "competition_participation" ("winner_id");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'competition_participation_learner1_id_fkey',
        '"competition_participation"',
        '"learner1_id"',
        '"userProfiles"',
        '"learner_id"',
        'CASCADE'
      ),
      foreignKeyStatement(
        'competition_participation_learner2_id_fkey',
        '"competition_participation"',
        '"learner2_id"',
        '"userProfiles"',
        '"learner_id"',
        'SET NULL'
      ),
      foreignKeyStatement(
        'competition_participation_winner_id_fkey',
        '"competition_participation"',
        '"winner_id"',
        '"userProfiles"',
        '"learner_id"',
        'SET NULL'
      )
    ]
  }
]

const tempQuestionsStatements = [
  `
  CREATE TABLE IF NOT EXISTS "temp_questions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" text UNIQUE NOT NULL,
    "question" jsonb NOT NULL,
    "hints" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "test_cases" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS temp_questions_request_id_idx ON "temp_questions" ("request_id");`
]

const ensureSupabaseCoreTables = async () => {
  const client = await postgres.getClient()

  try {
    await client.query('BEGIN')
    await ensureExtension(client)
    await client.query('DROP TABLE IF EXISTS "courses" CASCADE;')

    for (const table of tableStatements) {
      await client.query(table.create)

      if (table.indexes) {
        for (const index of table.indexes) {
          await client.query(index)
        }
      }

      if (table.foreignKeys) {
        for (const fk of table.foreignKeys) {
          await client.query(fk)
        }
      }
    }

    for (const statement of tempQuestionsStatements) {
      await client.query(statement)
    }

    await client.query('COMMIT')
    console.log('✅ Supabase tables verified')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Failed to ensure Supabase tables:', error)
    throw error
  } finally {
    client.release()
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

const createMongoIndexes = async () => {
  try {
    const { getCollections } = await import('./database.js')
    const { logs, analytics, errors, sessions } = getCollections()

    await logs.createIndex({ timestamp: -1 })
    await logs.createIndex({ user_id: 1, timestamp: -1 })
    await logs.createIndex({ service: 1, timestamp: -1 })
    await logs.createIndex({ level: 1, timestamp: -1 })

    await analytics.createIndex({ timestamp: -1 })
    await analytics.createIndex({ user_id: 1, timestamp: -1 })
    await analytics.createIndex({ course_id: 1, timestamp: -1 })
    await analytics.createIndex({ event_type: 1, timestamp: -1 })

    await errors.createIndex({ timestamp: -1 })
    await errors.createIndex({ user_id: 1, timestamp: -1 })
    await errors.createIndex({ error_type: 1, timestamp: -1 })

    await sessions.createIndex({ user_id: 1, timestamp: -1 })
    await sessions.createIndex({ session_id: 1 })
    await sessions.createIndex({ status: 1, timestamp: -1 })

    console.log('✅ MongoDB indexes created')
  } catch (error) {
    console.error('❌ Failed to create MongoDB indexes:', error)
    throw error
  }
}

export const initializeDatabases = async () => {
  try {
    await connectMongoDB()
    console.log('✅ MongoDB Atlas connected')

    try {
      await postgres.query('SELECT 1')
      console.log('✅ PostgreSQL connected')
    } catch (error) {
      console.error('⚠️  PostgreSQL connection test failed:', error.message)
      throw error
    }

    await createMongoIndexes()

    await Promise.all([
      ensureMongoCollections().catch((error) =>
        console.warn('⚠️  Unable to verify MongoDB collections:', error.message)
      ),
      ensureSupabaseCoreTables()
    ])

    console.log('✅ Database initialization complete')
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export const createSupabaseTables = async () => {
  try {
    await ensureSupabaseCoreTables()
    console.log('✅ Supabase tables ready')
    return true
  } catch (error) {
    console.error('❌ Failed to configure Supabase tables:', error)
    throw error
  }
}


