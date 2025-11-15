import { postgres } from '../config/database.js'

const competitionsVsAiTable = postgres.quoteIdentifier('competitions_vs_ai')

export class CompetitionAIModel {
  static async create({ learnerId, learnerName, courseId, courseName, questions }) {
    const questionsPayload = Array.isArray(questions) ? questions : []
    const { rows } = await postgres.query(
      `
        INSERT INTO ${competitionsVsAiTable} (
          "competition_id",
          "learner_id",
          "learner_name",
          "course_id",
          "course_name",
          "questions",
          "learner_answers",
          "ai_answers",
          "winner",
          "score",
          "created_at",
          "updated_at"
        )
        VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2::text,
          $3::text,
          $4::text,
          $5::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          NULL,
          NULL,
          now(),
          now()
        )
        RETURNING *
      `,
      [learnerId, learnerName || null, String(courseId), courseName || null, JSON.stringify(questionsPayload)]
    )

    return rows[0] || null
  }

  static async findByLearnerAndCourse(learnerId, courseId) {
    const { rows } = await postgres.query(
      `
        SELECT *
        FROM ${competitionsVsAiTable}
        WHERE "learner_id" = $1::uuid
          AND "course_id" = $2::text
        ORDER BY "created_at" DESC
        LIMIT 1
      `,
      [learnerId, String(courseId)]
    )

    return rows[0] || null
  }

  static async getPendingCourses(learnerId) {
    const { rows } = await postgres.query(
      `
        SELECT 
          cc."course_id"::text AS course_id,
          cc."course_name",
          cc."completed_at"
        FROM "course_completions" cc
        LEFT JOIN ${competitionsVsAiTable} cva
          ON cva."learner_id" = cc."learner_id"
         AND cva."course_id" = cc."course_id"::text
        WHERE cc."learner_id" = $1::uuid
          AND cva."competition_id" IS NULL
        ORDER BY cc."completed_at" DESC
      `,
      [learnerId]
    )

    return rows || []
  }
}


