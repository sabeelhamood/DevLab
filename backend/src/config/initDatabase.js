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
        PRIMARY KEY ("learner_id", "course_id", "completed_at")
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
      CREATE TABLE IF NOT EXISTS "competitions" (
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
        "timer" integer,
        "status" text NOT NULL DEFAULT 'pending',
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
      `CREATE INDEX IF NOT EXISTS competitions_course_id_idx ON "competitions" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS competitions_learner1_id_idx ON "competitions" ("learner1_id");`,
      `CREATE INDEX IF NOT EXISTS competitions_learner2_id_idx ON "competitions" ("learner2_id");`,
      `CREATE INDEX IF NOT EXISTS competitions_winner_id_idx ON "competitions" ("winner_id");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'competitions_learner1_id_fkey',
        '"competitions"',
        '"learner1_id"',
        '"userProfiles"',
        '"learner_id"',
        'CASCADE'
      ),
      foreignKeyStatement(
        'competitions_learner2_id_fkey',
        '"competitions"',
        '"learner2_id"',
        '"userProfiles"',
        '"learner_id"',
        'SET NULL'
      ),
      foreignKeyStatement(
        'competitions_winner_id_fkey',
        '"competitions"',
        '"winner_id"',
        '"userProfiles"',
        '"learner_id"',
        'SET NULL'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "courses" (
        "course_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "trainer_id" uuid,
        "title" text NOT NULL,
        "description" text,
        "level" text NOT NULL DEFAULT 'beginner',
        "ai_feedback" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS courses_trainer_id_idx ON "courses" ("trainer_id");`,
      `CREATE INDEX IF NOT EXISTS courses_level_idx ON "courses" ("level");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'courses_trainer_id_fkey',
        '"courses"',
        '"trainer_id"',
        '"userProfiles"',
        '"learner_id"',
        'SET NULL'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "topics" (
        "topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" uuid NOT NULL,
        "topic_name" text NOT NULL,
        "nano_skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "macro_skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "summary" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS topics_course_id_idx ON "topics" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS topics_topic_name_idx ON "topics" ("topic_name");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'topics_course_id_fkey',
        '"topics"',
        '"course_id"',
        '"courses"',
        '"course_id"',
        'CASCADE'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "practices" (
        "practice_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "learner_id" uuid NOT NULL,
        "course_id" uuid,
        "topic_id" uuid,
        "status" text NOT NULL DEFAULT 'in_progress',
        "score" numeric,
        "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "time_spent" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS practices_learner_id_idx ON "practices" ("learner_id");`,
      `CREATE INDEX IF NOT EXISTS practices_course_id_idx ON "practices" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS practices_topic_id_idx ON "practices" ("topic_id");`,
      `CREATE INDEX IF NOT EXISTS practices_status_idx ON "practices" ("status");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'practices_learner_id_fkey',
        '"practices"',
        '"learner_id"',
        '"userProfiles"',
        '"learner_id"',
        'CASCADE'
      ),
      foreignKeyStatement(
        'practices_course_id_fkey',
        '"practices"',
        '"course_id"',
        '"courses"',
        '"course_id"',
        'SET NULL'
      ),
      foreignKeyStatement(
        'practices_topic_id_fkey',
        '"practices"',
        '"topic_id"',
        '"topics"',
        '"topic_id"',
        'SET NULL'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "questions" (
        "question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "topic_id" uuid NOT NULL,
        "course_id" uuid,
        "practice_id" uuid,
        "title" text,
        "question_type" text NOT NULL DEFAULT 'theoretical',
        "question_content" text NOT NULL,
        "difficulty" text NOT NULL DEFAULT 'intermediate',
        "language" text,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS questions_topic_id_idx ON "questions" ("topic_id");`,
      `CREATE INDEX IF NOT EXISTS questions_course_id_idx ON "questions" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS questions_practice_id_idx ON "questions" ("practice_id");`,
      `CREATE INDEX IF NOT EXISTS questions_question_type_idx ON "questions" ("question_type");`,
      `CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON "questions" ("difficulty");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'questions_topic_id_fkey',
        '"questions"',
        '"topic_id"',
        '"topics"',
        '"topic_id"',
        'CASCADE'
      ),
      foreignKeyStatement(
        'questions_course_id_fkey',
        '"questions"',
        '"course_id"',
        '"courses"',
        '"course_id"',
        'SET NULL'
      ),
      foreignKeyStatement(
        'questions_practice_id_fkey',
        '"questions"',
        '"practice_id"',
        '"practices"',
        '"practice_id"',
        'SET NULL'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "testCases" (
        "testCase_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question_id" uuid NOT NULL,
        "input" text,
        "expected_output" text NOT NULL,
        "explanation" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS testcases_question_id_idx ON "testCases" ("question_id");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'testcases_question_id_fkey',
        '"testCases"',
        '"question_id"',
        '"questions"',
        '"question_id"',
        'CASCADE'
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
    await client.query('DROP TABLE IF EXISTS "competition_participation" CASCADE;')

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


