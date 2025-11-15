import { connectMongoDB, postgres, getMongoDB } from './database.js'

const ensureExtension = async (client) => {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
}

const foreignKeyStatement = (
  constraintName,
  table,
  column,
  referencedTable,
  referencedColumn,
  onDelete = 'NO ACTION'
) => `
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

const tableExists = async (client, tableName) => {
  const { rows } = await client.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
    `,
    [tableName]
  )

  return Boolean(rows[0]?.exists)
}

const getTableColumns = async (client, tableName) => {
  const { rows } = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `,
    [tableName]
  )

  return rows.map((row) => row.column_name)
}

const dropConstraintIfPresent = async (client, tableName, constraintName) => {
  if (!(await tableExists(client, tableName))) {
    return
  }

  await client.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`)
}

const dropTableIfExists = async (client, tableName) => {
  await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`)
}

const dropUserProfileForeignKeys = async (client) => {
  const constraints = [
    { table: 'competitions', constraint: 'competitions_learner1_id_fkey' },
    { table: 'competitions', constraint: 'competitions_learner2_id_fkey' },
    { table: 'competitions', constraint: 'competitions_winner_id_fkey' }
  ]

  for (const { table, constraint } of constraints) {
    await dropConstraintIfPresent(client, table, constraint)
  }
}

const resetCompetitionsTable = async (client) => {
  await dropTableIfExists(client, 'competitions')
  await dropTableIfExists(client, 'competition_participation')
  console.log('♻️ Dropped legacy competitions table')
}

const ensureCompetitionsVsAISchema = async (client) => {
  try {
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'competitions_vs_ai'
            AND column_name = 'course_id'
        ) THEN
          ALTER TABLE "competitions_vs_ai"
          ALTER COLUMN "course_id" TYPE text USING "course_id"::text;
        END IF;
      END $$;
    `)
  } catch (error) {
    if (error.code !== '42P01') {
      console.warn('⚠️ Unable to ensure competitions_vs_ai schema:', error.message)
    }
  }
}

const cleanupLegacyUserProfiles = async (client) => {
  if (!(await tableExists(client, 'userProfiles'))) {
    return
}

  await dropUserProfileForeignKeys(client)

  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userProfiles'
          AND column_name = 'user_id'
      ) THEN
        ALTER TABLE "userProfiles" RENAME COLUMN "user_id" TO "learner_id";
      END IF;
    END $$;
  `)

  await client.query(`ALTER TABLE "userProfiles" ADD COLUMN IF NOT EXISTS "learner_name" text;`)
  await client.query(`ALTER TABLE "userProfiles" ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();`)
  await client.query(`ALTER TABLE "userProfiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();`)
  await client.query(`ALTER TABLE "userProfiles" ALTER COLUMN "learner_id" SET NOT NULL;`)

  const legacyColumns = [
    'name',
    'email',
    'role',
    'organizationId',
    'completed_courses',
    'active_courses'
  ]

  for (const column of legacyColumns) {
    await client.query(`ALTER TABLE "userProfiles" DROP COLUMN IF EXISTS "${column}";`)
  }

  const legacyIndexes = [
    'userprofiles_email_key',
    'userprofiles_role_idx',
    'userprofiles_organization_idx'
  ]

  for (const index of legacyIndexes) {
    await client.query(`DROP INDEX IF EXISTS ${index};`)
  }

  await client.query(`ALTER TABLE "userProfiles" DROP CONSTRAINT IF EXISTS "userProfiles_pkey" CASCADE;`)
  await client.query(`ALTER TABLE "userProfiles" DROP CONSTRAINT IF EXISTS "userprofiles_pkey" CASCADE;`)
  await client.query(`ALTER TABLE "userProfiles" ADD PRIMARY KEY ("learner_id");`)
}

const cleanupCourseCompletions = async (client) => {
  if (!(await tableExists(client, 'course_completions'))) {
    return
  }

  const removableColumns = ['id', 'source', 'metadata', 'created_at', 'recorded_at']
  for (const column of removableColumns) {
    await client.query(`ALTER TABLE "course_completions" DROP COLUMN IF EXISTS "${column}";`)
  }

  await client.query(`ALTER TABLE "course_completions" ADD COLUMN IF NOT EXISTS "learner_id" uuid;`)
  
  // Change course_id from text to bigint if it exists as text
  console.log('🔄 Checking course_completions.course_id type...')
  const { rows: courseCompletionsCheck } = await client.query(`
    SELECT data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'course_completions' 
      AND column_name = 'course_id'
  `)
  
  if (courseCompletionsCheck.length > 0) {
    const currentType = courseCompletionsCheck[0].data_type
    console.log(`📊 Current course_completions.course_id type: ${currentType}`)
    
    if (currentType === 'text' || currentType === 'character varying') {
      console.log('🔄 Converting course_completions.course_id from text to bigint...')
      await client.query(`
        ALTER TABLE "course_completions" 
        ALTER COLUMN "course_id" TYPE bigint USING CASE 
          WHEN "course_id" ~ '^[0-9]+$' THEN "course_id"::bigint 
          ELSE NULL 
        END;
      `)
      console.log('✅ Converted course_completions.course_id to bigint')
    } else if (currentType === 'bigint') {
      console.log('✅ course_completions.course_id is already bigint')
    } else {
      console.log(`⚠️ course_completions.course_id is ${currentType}, not converting`)
    }
  } else {
    console.log('➕ Adding course_completions.course_id as bigint')
    await client.query(`ALTER TABLE "course_completions" ADD COLUMN "course_id" bigint;`)
  }
  await client.query(`ALTER TABLE "course_completions" ADD COLUMN IF NOT EXISTS "course_name" text;`)
  await client.query(`ALTER TABLE "course_completions" ADD COLUMN IF NOT EXISTS "completed_at" timestamptz NOT NULL DEFAULT now();`)

  await client.query(`ALTER TABLE "course_completions" ALTER COLUMN "learner_id" SET NOT NULL;`)
  await client.query(`ALTER TABLE "course_completions" ALTER COLUMN "course_id" SET NOT NULL;`)
  await client.query(`ALTER TABLE "course_completions" ALTER COLUMN "completed_at" SET NOT NULL;`)
  await client.query(`ALTER TABLE "course_completions" ALTER COLUMN "completed_at" SET DEFAULT now();`)

  await client.query(`ALTER TABLE "course_completions" DROP CONSTRAINT IF EXISTS "course_completions_pkey";`)
  await client.query(`ALTER TABLE "course_completions" ADD PRIMARY KEY ("learner_id", "course_id", "completed_at");`)
}

const cleanupTopics = async (client) => {
  if (!(await tableExists(client, 'topics'))) {
    return
  }

  await dropConstraintIfPresent(client, 'topics', 'topics_course_id_fkey')
  await client.query(`ALTER TABLE "topics" DROP COLUMN IF EXISTS "summary";`)
}

const cleanupQuestions = async (client) => {
  if (!(await tableExists(client, 'questions'))) {
    return
  }

  await dropConstraintIfPresent(client, 'questions', 'questions_course_id_fkey')
  await dropConstraintIfPresent(client, 'questions', 'questions_practice_id_fkey')
}

const dropLegacyTables = async (client) => {
  await dropTableIfExists(client, 'courses')
  await dropTableIfExists(client, 'practices')
}

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
        "course_id" bigint NOT NULL,
        "course_name" text,
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
      CREATE TABLE IF NOT EXISTS "competitions_vs_ai" (
        "competition_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "learner_id" uuid NOT NULL,
        "learner_name" text,
        "course_id" text,
        "course_name" text,
        "learner_answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "ai_answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "questions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "winner" text,
        "score" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS competitions_vs_ai_learner_id_idx ON "competitions_vs_ai" ("learner_id");`,
      `CREATE INDEX IF NOT EXISTS competitions_vs_ai_course_id_idx ON "competitions_vs_ai" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS competitions_vs_ai_created_at_idx ON "competitions_vs_ai" ("created_at");`
    ],
    foreignKeys: [
      foreignKeyStatement(
        'competitions_vs_ai_learner_id_fkey',
        '"competitions_vs_ai"',
        '"learner_id"',
        '"userProfiles"',
        '"learner_id"',
        'CASCADE'
      )
    ]
  },
  {
    create: `
      CREATE TABLE IF NOT EXISTS "topics" (
        "topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" uuid NOT NULL,
        "topic_name" text NOT NULL,
        "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS topics_course_id_idx ON "topics" ("course_id");`,
      `CREATE INDEX IF NOT EXISTS topics_topic_name_idx ON "topics" ("topic_name");`
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
    await resetCompetitionsTable(client)
    await ensureCompetitionsVsAISchema(client)
    await cleanupLegacyUserProfiles(client)
    await cleanupCourseCompletions(client)
    await cleanupTopics(client)
    await cleanupQuestions(client)
    await dropLegacyTables(client)

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

    await client.query(`
      INSERT INTO "userProfiles" ("learner_id", "learner_name")
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'Sabeel'),
        ('00000000-0000-0000-0000-000000000002', 'Dan')
      ON CONFLICT ("learner_id") DO UPDATE
      SET "learner_name" = EXCLUDED."learner_name",
          "updated_at" = now();
    `)

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


