-- Add a competition row using existing users from userProfiles
-- This script will:
-- 1. Get the first two users from userProfiles
-- 2. Create a competition between them

-- First, let's see what users we have
SELECT "learner_id", "learner_name" FROM "userProfiles" ORDER BY "created_at" LIMIT 10;

-- Insert a competition using the first two users
-- Replace the learner IDs below with actual IDs from the query above if needed
INSERT INTO "competitions" (
  "course_name",
  "course_id",
  "learner1_id",
  "learner2_id",
  "status",
  "question_count",
  "time_limit",
  "questions",
  "learner1_answers",
  "learner2_answers",
  "learner1_score",
  "learner2_score"
)
SELECT 
  'JavaScript Fundamentals Showdown' as "course_name",
  123 as "course_id",
  (SELECT "learner_id" FROM "userProfiles" ORDER BY "created_at" LIMIT 1 OFFSET 0) as "learner1_id",
  (SELECT "learner_id" FROM "userProfiles" ORDER BY "created_at" LIMIT 1 OFFSET 1) as "learner2_id",
  'active' as "status",
  3 as "question_count",
  1800 as "time_limit",
  '[
    {
      "id": "q1",
      "title": "Array Manipulation Challenge",
      "points": 100,
      "testCases": [
        {"input": "[1, 3, 2, 4, 5]", "expected": 4},
        {"input": "[5, 4, 3, 2, 1]", "expected": 1},
        {"input": "[1, 2, 3, 4, 5]", "expected": 5}
      ],
      "timeLimit": 600,
      "difficulty": "medium",
      "description": "Write a function that finds the longest increasing subsequence in an array. Return the length of the subsequence.",
      "starterCode": "function longestIncreasingSubsequence(arr) {\n  // TODO: implement dynamic programming solution\n  return 0;\n}"
    },
    {
      "id": "q2",
      "title": "String Processing",
      "points": 80,
      "testCases": [
        {"input": "\"A man a plan a canal Panama\"", "expected": true},
        {"input": "\"race a car\"", "expected": false},
        {"input": "\"Madam\"", "expected": true}
      ],
      "timeLimit": 420,
      "difficulty": "easy",
      "description": "Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.",
      "starterCode": "function isPalindrome(s) {\n  // TODO: normalize the string and check for palindrome\n  return false;\n}"
    },
    {
      "id": "q3",
      "title": "Dynamic Programming",
      "points": 150,
      "testCases": [
        {"input": "[2, 7, 9, 3, 1]", "expected": 12},
        {"input": "[1, 2, 3, 1]", "expected": 4},
        {"input": "[2, 1, 1, 2]", "expected": 4}
      ],
      "timeLimit": 540,
      "difficulty": "hard",
      "description": "Solve the classic \"House Robber\" problem. Return the maximum amount you can rob without alerting the police.",
      "starterCode": "function rob(nums) {\n  // TODO: use memoization or tabulation\n  return 0;\n}"
    }
  ]'::jsonb as "questions",
  '[]'::jsonb as "learner1_answers",
  '[]'::jsonb as "learner2_answers",
  0 as "learner1_score",
  0 as "learner2_score"
WHERE EXISTS (
  SELECT 1 FROM "userProfiles" 
  HAVING COUNT(*) >= 2
)
RETURNING "competition_id", "course_name", "learner1_id", "learner2_id", "status";

