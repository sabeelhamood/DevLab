// This file contains type definitions as JSDoc comments for JavaScript files
// Since we're using JavaScript, we'll use JSDoc for type hints

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'learner'|'trainer'|'admin'} role
 * @property {string} organizationId
 * @property {UserProfile} [profile]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} UserProfile
 * @property {'beginner'|'intermediate'|'advanced'} skillLevel
 * @property {Object} preferences
 * @property {string} preferences.language
 * @property {string} preferences.difficulty
 * @property {boolean} preferences.notifications
 * @property {Object} statistics
 * @property {number} statistics.totalQuestions
 * @property {number} statistics.correctAnswers
 * @property {number} statistics.averageScore
 * @property {number} statistics.timeSpent
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'code'|'theoretical'} type
 * @property {'beginner'|'intermediate'|'advanced'} difficulty
 * @property {string} [language]
 * @property {TestCase[]} [testCases]
 * @property {string[]} hints
 * @property {string} [solution]
 * @property {string} [explanation]
 * @property {string[]} skills
 * @property {string} courseId
 * @property {string} topicId
 * @property {string} createdBy
 * @property {boolean} isAIGenerated
 * @property {'pending'|'approved'|'rejected'} validationStatus
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} TestCase
 * @property {string} input
 * @property {string} expectedOutput
 * @property {string} [description]
 */

/**
 * @typedef {Object} QuestionSubmission
 * @property {string} questionId
 * @property {string} solution
 * @property {string} [language]
 * @property {number} timeSpent
 * @property {number} hintsUsed
 */

/**
 * @typedef {Object} PracticeSession
 * @property {string} id
 * @property {string} learnerId
 * @property {string} courseId
 * @property {'practice'|'ai_competition'} sessionType
 * @property {'active'|'completed'|'paused'} status
 * @property {string} startedAt
 * @property {string} [completedAt]
 * @property {number} totalQuestions
 * @property {number} correctAnswers
 * @property {number} score
 * @property {SessionQuestion[]} questions
 */

/**
 * @typedef {Object} SessionQuestion
 * @property {string} id
 * @property {string} sessionId
 * @property {string} questionId
 * @property {number} questionOrder
 * @property {string} [learnerAnswer]
 * @property {boolean} [isCorrect]
 * @property {number} hintsUsed
 * @property {number} timeSpent
 * @property {string} [aiFeedback]
 * @property {string} [submittedAt]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {*[]} data
 * @property {Object} pagination
 * @property {number} pagination.page
 * @property {number} pagination.limit
 * @property {number} pagination.total
 * @property {number} pagination.totalPages
 */

/**
 * @typedef {Object} AIFeedback
 * @property {boolean} isCorrect
 * @property {number} score
 * @property {string} feedback
 * @property {string[]} suggestions
 * @property {TestResult[]} testResults
 */

/**
 * @typedef {Object} TestResult
 * @property {TestCase} testCase
 * @property {boolean} passed
 * @property {string} [actualOutput]
 * @property {string} [error]
 */

// Export empty object to make this a valid module
export {}

