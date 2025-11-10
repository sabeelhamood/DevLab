import { CompetitionModel } from '../models/Competition.js'
import { generateQuestions } from '../services/geminiQuestionGeneration.js'

// Helper function to evaluate answers with Gemini
async function evaluateAnswerWithGemini({ question, answer, testCases }) {
  try {
    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
      // Mock evaluation for local testing
      console.log('🔧 Using mock evaluation for local testing')
      const evaluation = {
        isCorrect: Math.random() > 0.3, // 70% success rate for testing
        feedback: "Mock evaluation: Your solution looks good! Consider optimizing for better performance.",
        score: Math.random() > 0.3 ? 100 : 0
      }
      return evaluation
    }
    
    // Real Gemini evaluation would go here
    // This would integrate with your existing Gemini service
    const evaluation = {
      isCorrect: Math.random() > 0.3, // Mock for now
      feedback: "Good attempt! Consider optimizing your algorithm for better performance.",
      score: Math.random() > 0.3 ? 100 : 0
    }
    
    return evaluation
  } catch (error) {
    console.error('Error evaluating answer with Gemini:', error)
    return {
      isCorrect: false,
      feedback: "Unable to evaluate answer at this time.",
      score: 0
    }
  }
}

export const competitionController = {
  // Create invitation for learners who finished the same course
  async createInvitation(req, res) {
    try {
      const { courseId, learnerId } = req.body
      
      // Check if learner completed the course
      // This would integrate with your course completion system
      const isCourseCompleted = true // Mock for now
      
      if (!isCourseCompleted) {
        return res.status(400).json({
          success: false,
          error: 'Course must be completed to participate in competitions'
        })
      }

      // Find other learners who completed the same course
      const eligibleLearners = await CompetitionModel.findEligibleLearners(courseId, learnerId)
      
      if (eligibleLearners.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No eligible competitors found for this course'
        })
      }

      // Create competition invitation
      const invitation = {
        id: `inv-${Date.now()}`,
        courseId,
        learnerId,
        eligibleLearners: eligibleLearners.map(learner => ({
          id: learner.id,
          isAnonymous: true,
          completedAt: learner.completedAt
        })),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      res.status(201).json({
        success: true,
        data: invitation
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  // Accept/Decline competition invitation
  async respondToInvitation(req, res) {
    try {
      const { invitationId } = req.params
      const { action, competitorId } = req.body // 'accept' or 'decline'
      const learnerId = req.user?.id

      if (action === 'accept') {
        // Create competition with 2 players
        const competitionData = {
          course_id: req.body.courseId,
          learner1_id: learnerId,
          learner2_id: competitorId,
          status: 'active',
          question_count: 3,
          time_limit: 1800, // 30 minutes total
          questions: [],
          created_at: new Date().toISOString()
        }

        // Generate 3 questions using Gemini or mock data
        let questions
        try {
          questions = await generateQuestions({
            courseName: req.body.courseName,
            topicName: 'Competition Questions',
            difficulty: 'medium',
            questionCount: 3,
            questionType: 'coding'
          })
        } catch (error) {
          console.log('🔧 Using mock questions for local testing')
          // Mock questions for local testing
          questions = [
            {
              title: 'Array Manipulation Challenge',
              description: 'Write a function that finds the longest increasing subsequence in an array. The function should return the length of the subsequence.',
              difficulty: 'medium',
              testCases: [
                { input: '[1,3,2,4,5]', expected: 4 },
                { input: '[5,4,3,2,1]', expected: 1 },
                { input: '[1,2,3,4,5]', expected: 5 }
              ]
            },
            {
              title: 'String Processing',
              description: 'Implement a function that checks if a string is a palindrome, ignoring case and non-alphanumeric characters.',
              difficulty: 'easy',
              testCases: [
                { input: '"A man a plan a canal Panama"', expected: true },
                { input: '"race a car"', expected: false },
                { input: '"Madam"', expected: true }
              ]
            },
            {
              title: 'Dynamic Programming',
              description: 'Solve the classic "House Robber" problem. You are a robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected, so you cannot rob two adjacent houses.',
              difficulty: 'hard',
              testCases: [
                { input: '[2,7,9,3,1]', expected: 12 },
                { input: '[1,2,3,1]', expected: 4 },
                { input: '[2,1,1,2]', expected: 4 }
              ]
            }
          ]
        }

        competitionData.questions = questions.map((q, index) => ({
          id: `q-${index + 1}`,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          timeLimit: 600, // 10 minutes per question
          points: 100,
          testCases: q.testCases || []
        }))

        const competition = await CompetitionModel.create(competitionData)

        res.status(201).json({
          success: true,
          data: {
            competition,
            message: 'Competition started! Both players are anonymous.'
          }
        })
      } else {
        res.json({
          success: true,
          message: 'Invitation declined'
        })
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async joinCompetition(req, res) {
    try {
      const { courseId } = req.body
      const learnerId = req.user?.id

      const competition = {
        id: `comp-${Date.now()}`,
        courseId,
        name: 'Weekly Python Challenge',
        description: 'Test your Python skills against other learners',
        maxParticipants: 2,
        questionCount: 3,
        timeLimit: 1800, // 30 minutes
        status: 'waiting',
        participants: [
          {
            id: `part-${Date.now()}`,
            competitionId: `comp-${Date.now()}`,
            learnerId,
            score: 0,
            joinedAt: new Date().toISOString()
          }
        ],
        questions: [],
        leaderboard: [],
        createdAt: new Date().toISOString()
      }

      res.status(201).json({
        success: true,
        data: competition
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getCompetition(req, res) {
    try {
      const { id } = req.params

      const competition = {
        id,
        courseId: '1',
        name: 'Weekly Python Challenge',
        description: 'Test your Python skills against other learners',
        maxParticipants: 2,
        questionCount: 3,
        timeLimit: 1800,
        status: 'active',
        startedAt: new Date().toISOString(),
        participants: [
          {
            id: 'part-1',
            competitionId: id,
            learnerId: 'user-123',
            score: 0,
            rank: null,
            joinedAt: new Date().toISOString()
          }
        ],
        questions: [
          {
            id: 'q-1',
            title: 'Python Hello World',
            description: 'Write a Python program that prints "Hello, World!"',
            type: 'code',
            difficulty: 'beginner',
            language: 'python'
          }
        ],
        leaderboard: [],
        createdAt: new Date().toISOString()
      }

      res.json({
        success: true,
        data: competition
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async submitAnswer(req, res) {
    try {
      const { id } = req.params
      const { questionId, answer, timeSpent } = req.body
      const learnerId = req.user?.id

      // Get competition details
      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      // Check if time limit exceeded
      const question = competition.questions.find(q => q.id === questionId)
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      if (timeSpent > question.timeLimit) {
        return res.status(400).json({
          success: false,
          error: 'Time limit exceeded for this question'
        })
      }

      // Evaluate answer using Gemini
      const evaluation = await evaluateAnswerWithGemini({
        question: question.description,
        answer: answer,
        testCases: question.testCases
      })

      // Update competition with answer
      const updatedCompetition = await CompetitionModel.updateAnswer(id, learnerId, questionId, {
        answer,
        timeSpent,
        isCorrect: evaluation.isCorrect,
        score: evaluation.isCorrect ? question.points : 0,
        submittedAt: new Date().toISOString()
      })

      // Check if both players submitted answers for current question
      const bothSubmitted = await CompetitionModel.checkBothAnswersSubmitted(id, questionId)
      const answeredCount = Math.max(
        updatedCompetition?.learner1_answers?.length ?? 0,
        updatedCompetition?.learner2_answers?.length ?? 0
      )
      const totalQuestions =
        updatedCompetition?.question_count ??
        updatedCompetition?.questions?.length ??
        answeredCount
      
      if (bothSubmitted) {
        // Move to next question or finish competition
        if (totalQuestions > 0 && answeredCount >= totalQuestions) {
          // Competition finished - evaluate winner
          const winner = await CompetitionModel.determineWinner(id)
          await CompetitionModel.updateResult(id, winner)
        }
      }

      res.json({
        success: true,
        data: {
          isCorrect: evaluation.isCorrect,
          score: evaluation.isCorrect ? question.points : 0,
          feedback: evaluation.feedback,
          timeSpent,
          nextQuestion:
            totalQuestions > 0 && answeredCount >= totalQuestions
              ? null
              : answeredCount + 1,
          competitionFinished: totalQuestions > 0 && answeredCount >= totalQuestions
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getResults(req, res) {
    try {
      const { id } = req.params
      const learnerId = req.user?.id

      const competition = await CompetitionModel.findById(id)
      if (!competition) {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        })
      }

      // Get results with anonymous player names
      const results = {
        competitionId: id,
        status: competition.status,
        winner: competition.result?.winner || null,
        participants: [
          {
            playerId: 'Player A',
            isYou: competition.learner1_id === learnerId,
            score: competition.result?.player1Score || 0,
            rank: competition.result?.player1Rank || null,
            timeSpent: competition.result?.player1Time || 0,
            isAnonymous: true
          },
          {
            playerId: 'Player B', 
            isYou: competition.learner2_id === learnerId,
            score: competition.result?.player2Score || 0,
            rank: competition.result?.player2Rank || null,
            timeSpent: competition.result?.player2Time || 0,
            isAnonymous: true
          }
        ],
        leaderboard: [
          {
            rank: 1,
            playerId: competition.result?.player1Score > competition.result?.player2Score ? 'Player A' : 'Player B',
            score: Math.max(competition.result?.player1Score || 0, competition.result?.player2Score || 0),
            timeSpent: competition.result?.player1Score > competition.result?.player2Score ? 
              competition.result?.player1Time || 0 : competition.result?.player2Time || 0,
            isAnonymous: true
          },
          {
            rank: 2,
            playerId: competition.result?.player1Score <= competition.result?.player2Score ? 'Player A' : 'Player B',
            score: Math.min(competition.result?.player1Score || 0, competition.result?.player2Score || 0),
            timeSpent: competition.result?.player1Score <= competition.result?.player2Score ? 
              competition.result?.player1Time || 0 : competition.result?.player2Time || 0,
            isAnonymous: true
          }
        ],
        questions: competition.questions.map(q => ({
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          points: q.points
        }))
      }

      res.json({
        success: true,
        data: results
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { courseId } = req.params

      const leaderboard = [
        {
          rank: 1,
          learnerId: 'user-123',
          score: 95,
          timeSpent: 1100,
          isAnonymous: true
        },
        {
          rank: 2,
          learnerId: 'user-456',
          score: 90,
          timeSpent: 1200,
          isAnonymous: true
        },
        {
          rank: 3,
          learnerId: 'user-789',
          score: 85,
          timeSpent: 1300,
          isAnonymous: true
        }
      ]

      res.json({
        success: true,
        data: leaderboard
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

