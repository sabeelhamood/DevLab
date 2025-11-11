import { randomUUID } from 'node:crypto'
import { postgres } from '../src/config/database.js'
import { UserProfileModel } from '../src/models/User.js'
import { CompetitionModel } from '../src/models/Competition.js'

const learners = [
  {
    id: '3e3526c7-b8ae-4425-9128-5aa6897a895d',
    name: 'Sabeel'
  },
  {
    id: '0d220f97-4bc1-4198-9db7-fa6a9b4de8cd',
    name: 'Dan'
  }
]

const sampleQuestions = [
  {
    id: 'q1',
    title: 'Array Manipulation Challenge',
    description:
      'Write a function that finds the longest increasing subsequence in an array. Return the length of the subsequence.',
    difficulty: 'medium',
    timeLimit: 600,
    points: 100,
    starterCode: `function longestIncreasingSubsequence(arr) {
  // TODO: implement dynamic programming solution
  return 0;
}`,
    testCases: [
      { input: '[1, 3, 2, 4, 5]', expected: 4 },
      { input: '[5, 4, 3, 2, 1]', expected: 1 },
      { input: '[1, 2, 3, 4, 5]', expected: 5 }
    ]
  },
  {
    id: 'q2',
    title: 'String Processing',
    description:
      'Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.',
    difficulty: 'easy',
    timeLimit: 420,
    points: 80,
    starterCode: `function isPalindrome(s) {
  // TODO: normalize the string and check for palindrome
  return false;
}`,
    testCases: [
      { input: '"A man a plan a canal Panama"', expected: true },
      { input: '"race a car"', expected: false },
      { input: '"Madam"', expected: true }
    ]
  },
  {
    id: 'q3',
    title: 'Dynamic Programming',
    description:
      'Solve the classic "House Robber" problem. Return the maximum amount you can rob without alerting the police.',
    difficulty: 'hard',
    timeLimit: 540,
    points: 150,
    starterCode: `function rob(nums) {
  // TODO: use memoization or tabulation
  return 0;
}`,
    testCases: [
      { input: '[2, 7, 9, 3, 1]', expected: 12 },
      { input: '[1, 2, 3, 1]', expected: 4 },
      { input: '[2, 1, 1, 2]', expected: 4 }
    ]
  }
]

const competitionPayload = {
  competition_id: randomUUID(),
  course_name: 'JavaScript Fundamentals Showdown',
  course_id: 'course-js-fundamentals',
  learner1_id: learners[0].id,
  learner2_id: learners[1].id,
  status: 'active',
  question_count: sampleQuestions.length,
  time_limit: 1800,
  questions: sampleQuestions,
  learner1_answers: [],
  learner2_answers: [],
  learner1_score: 0,
  learner2_score: 0,
  timer: 0,
  questions_answered: 0,
  score: 0
}

const ensureLearners = async () => {
  for (const learner of learners) {
    const exists = await UserProfileModel.findById(learner.id)
    if (!exists) {
      await UserProfileModel.create({
        learner_id: learner.id,
        learner_name: learner.name
      })
    } else if (exists.learner_name !== learner.name) {
      await UserProfileModel.update(learner.id, { learner_name: learner.name })
    }
  }
}

const run = async () => {
  try {
    await ensureLearners()
    const competition = await CompetitionModel.create(competitionPayload)
    console.log('✅ Competition created successfully:')
    console.table([
      {
        competition_id: competition.competition_id,
        course_name: competition.course_name,
        learner1_id: competition.learner1_id,
        learner2_id: competition.learner2_id,
        question_count: competition.question_count
      }
    ])
  } catch (error) {
    console.error('❌ Failed to seed competition:', error)
    process.exitCode = 1
  } finally {
    await postgres.pool.end()
  }
}

run()

