-- Migration: Create assessment_codeQuestions table
-- This table stores coding questions generated for assessments
-- Run this in your Supabase SQL Editor to add the new table

-- ============================================================================
-- Table: assessment_codeQuestions
-- ============================================================================
CREATE TABLE IF NOT EXISTS "assessment_codeQuestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_id" text NOT NULL,
  "question" text NOT NULL,
  "testCases" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_code_questions_assessment_id_idx ON "assessment_codeQuestions" ("assessment_id");
CREATE INDEX IF NOT EXISTS assessment_code_questions_created_at_idx ON "assessment_codeQuestions" ("createdAt");

