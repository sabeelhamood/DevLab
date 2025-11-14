-- Migration: Initial Supabase Schema
-- This file creates all tables, indexes, and constraints for the DevLab application
-- Run this in your Supabase SQL Editor to set up the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: userProfiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS "userProfiles" (
  "learner_id" uuid PRIMARY KEY,
  "learner_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS userprofiles_learner_name_idx ON "userProfiles" ("learner_name");

-- ============================================================================
-- Table: course_completions
-- ============================================================================
CREATE TABLE IF NOT EXISTS "course_completions" (
  "learner_id" uuid NOT NULL,
  "course_id" bigint NOT NULL,
  "course_name" text,
  "completed_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("learner_id", "course_id", "completed_at")
);

CREATE INDEX IF NOT EXISTS course_completions_course_id_idx ON "course_completions" ("course_id");
CREATE INDEX IF NOT EXISTS course_completions_completed_at_idx ON "course_completions" ("completed_at");

-- Foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_completions_learner_id_fkey'
  ) THEN
    ALTER TABLE "course_completions"
    ADD CONSTRAINT "course_completions_learner_id_fkey"
    FOREIGN KEY ("learner_id")
    REFERENCES "userProfiles" ("learner_id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Table: competitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS "competitions" (
  "competition_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_name" text,
  "course_id" bigint,
  "learner1_id" uuid NOT NULL,
  "learner2_id" uuid,
  "winner_id" uuid,
  "learner1_score" numeric,
  "learner2_score" numeric,
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
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS competitions_course_id_idx ON "competitions" ("course_id");
CREATE INDEX IF NOT EXISTS competitions_learner1_id_idx ON "competitions" ("learner1_id");
CREATE INDEX IF NOT EXISTS competitions_learner2_id_idx ON "competitions" ("learner2_id");
CREATE INDEX IF NOT EXISTS competitions_winner_id_idx ON "competitions" ("winner_id");

-- Foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'competitions_learner1_id_fkey'
  ) THEN
    ALTER TABLE "competitions"
    ADD CONSTRAINT "competitions_learner1_id_fkey"
    FOREIGN KEY ("learner1_id")
    REFERENCES "userProfiles" ("learner_id")
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'competitions_learner2_id_fkey'
  ) THEN
    ALTER TABLE "competitions"
    ADD CONSTRAINT "competitions_learner2_id_fkey"
    FOREIGN KEY ("learner2_id")
    REFERENCES "userProfiles" ("learner_id")
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'competitions_winner_id_fkey'
  ) THEN
    ALTER TABLE "competitions"
    ADD CONSTRAINT "competitions_winner_id_fkey"
    FOREIGN KEY ("winner_id")
    REFERENCES "userProfiles" ("learner_id")
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Table: topics
-- ============================================================================
CREATE TABLE IF NOT EXISTS "topics" (
  "topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" uuid NOT NULL,
  "topic_name" text NOT NULL,
"skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS topics_course_id_idx ON "topics" ("course_id");
CREATE INDEX IF NOT EXISTS topics_topic_name_idx ON "topics" ("topic_name");

-- ============================================================================
-- Table: questions
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS questions_topic_id_idx ON "questions" ("topic_id");
CREATE INDEX IF NOT EXISTS questions_course_id_idx ON "questions" ("course_id");
CREATE INDEX IF NOT EXISTS questions_practice_id_idx ON "questions" ("practice_id");
CREATE INDEX IF NOT EXISTS questions_question_type_idx ON "questions" ("question_type");
CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON "questions" ("difficulty");

-- Foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_topic_id_fkey'
  ) THEN
    ALTER TABLE "questions"
    ADD CONSTRAINT "questions_topic_id_fkey"
    FOREIGN KEY ("topic_id")
    REFERENCES "topics" ("topic_id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Table: testCases
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS testcases_question_id_idx ON "testCases" ("question_id");

-- Foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'testcases_question_id_fkey'
  ) THEN
    ALTER TABLE "testCases"
    ADD CONSTRAINT "testcases_question_id_fkey"
    FOREIGN KEY ("question_id")
    REFERENCES "questions" ("question_id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Table: temp_questions
-- ============================================================================
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

CREATE UNIQUE INDEX IF NOT EXISTS temp_questions_request_id_idx ON "temp_questions" ("request_id");

-- ============================================================================
-- Seed Data: Default User Profiles
-- ============================================================================
INSERT INTO "userProfiles" ("learner_id", "learner_name")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sabeel'),
  ('00000000-0000-0000-0000-000000000002', 'Dan')
ON CONFLICT ("learner_id") DO UPDATE
SET "learner_name" = EXCLUDED."learner_name",
    "updated_at" = now();

