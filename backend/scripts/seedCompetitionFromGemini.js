import 'dotenv/config'

import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

import { geminiService } from '../src/services/gemini.js'
import { generateQuestions } from '../src/services/geminiQuestionGeneration.js'

const connectionString = process.env.SUPABASE_URL
const geminiKey = process.env.GEMINI_API_KEY

if (!connectionString) {
  console.error('❌ SUPABASE_URL is not configured. Please set it in Railway or your environment.')
  process.exit(1)
}

if (!geminiKey) {
  console.error('❌ GEMINI_API_KEY is not configured. Please set it in Railway or your environment.')
  process.exit(1)
}

const ssl =
  /localhost|127\.0\.0\.1/.test(connectionString) || connectionString.includes('sslmode=disable')
    ? undefined
    : { rejectUnauthorized: false }

const pool = new Pool({
  connectionString,
  ssl
})

const JS_COURSE = {
  id: 'javascript-advanced-course',
  name: 'JavaScript Advanced Mastery'
}

const learners = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ava Script',
    completedAt: '2024-09-18T10:00:00.000Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Liam Async',
    completedAt: '2024-09-21T15:30:00.000Z'
  }
]

const upsertLearnerProfile = async (client, learner) => {
  await client.query(
    `
    INSERT INTO "userProfiles" ("learner_id", "learner_name")
    VALUES ($1, $2)
    ON CONFLICT ("learner_id")
    DO UPDATE SET
      "learner_name" = EXCLUDED."learner_name",
      "updated_at" = now();
    `,
    [learner.id, learner.name]
  )
}

const upsertCourseCompletion = async (client, learner) => {
  await client.query(
    `
    INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
    VALUES ($1, $2, $3, $4)
    ON CONFLICT ("learner_id", "course_id", "completed_at")
    DO NOTHING;
    `,
    [learner.id, JS_COURSE.id, JS_COURSE.name, learner.completedAt]
  )
}

const seedLearners = async (client) => {
  console.log('👥 Ensuring learner profiles exist...')
  for (const learner of learners) {
    await upsertLearnerProfile(client, learner)
    await upsertCourseCompletion(client, learner)
    console.log(`   • ${learner.name} (${learner.id}) marked as course graduate`)
  }
}

const createCompetition = async (client, questions) => {
  const competitionId = randomUUID()
  const questionCount = questions.length
  const questionsJson = JSON.stringify(questions)

  await client.query(
    `
    INSERT INTO "competitions"
      ("competition_id", "course_name", "course_id", "learner1_id", "learner2_id", "status",
       "question_count", "time_limit", "questions", "created_at", "updated_at")
    VALUES
      ($1, $2, $3, $4, $5, 'active',
       $6, $7, $8::jsonb, now(), now())
    ON CONFLICT ("competition_id")
    DO NOTHING;
    `,
    [
      competitionId,
      JS_COURSE.name,
      JS_COURSE.id,
      learners[0].id,
      learners[1].id,
      questionCount,
      questionCount * 600,
      questionsJson
    ]
  )

  return {
    competitionId,
    questionCount
  }
}

const normaliseQuestionsForCompetition = (questions) => {
  return questions.map((question, index) => ({
    id: question.id || `gemini-js-${index + 1}`,
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    language: question.language,
    timeLimit: question.timeLimit ?? 600,
    points: question.points ?? 120 + index * 20,
    hints: question.hints ?? [],
    summary: question.summary ?? '',
    solution: question.solution ?? '',
    testCases: (question.testCases || []).map((testCase) => ({
      input:
        testCase.input ??
        testCase.inputs ??
        testCase.example ??
        testCase.exampleInput ??
        testCase.example_input ??
        '',
      expected:
        testCase.expected ??
        testCase.expectedOutput ??
        testCase.expected_output ??
        testCase.output ??
        testCase.result ??
        '',
      explanation: testCase.explanation ?? testCase.reason ?? ''
    }))
  }))
}

const run = async () => {
  const client = await pool.connect()

  try {
    console.log('🚀 Starting JavaScript competition seeding process...')
    await seedLearners(client)

    console.log('✨ Requesting Gemini for fresh JavaScript competition questions...')
    const rawQuestions = await generateQuestions({
      courseName: JS_COURSE.name,
      topicName: 'Modern JavaScript Challenges',
      difficulty: 'intermediate',
      questionCount: 3,
      language: 'javascript',
      nanoSkills: ['arrays', 'callback patterns', 'async control flow'],
      macroSkills: ['problem solving', 'refactoring'],
      humanLanguage: 'en'
    })

    const questions = normaliseQuestionsForCompetition(rawQuestions)
    questions.forEach((question, index) => {
      console.log(`   • Q${index + 1}: ${question.title} [${question.difficulty}]`)
    })

    const { competitionId, questionCount } = await createCompetition(client, questions)
    console.log('🏁 Competition created successfully with Gemini-generated questions!')
    console.log(`   • Competition ID: ${competitionId}`)
    console.log(`   • Total Questions: ${questionCount}`)
    console.log(`   • Learners: ${learners[0].name} vs ${learners[1].name}`)
  } catch (error) {
    console.error('❌ Failed to seed competition data:', error)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()


