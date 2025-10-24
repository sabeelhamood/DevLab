export const competitionController = {
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

      // Mock answer evaluation
      const isCorrect = Math.random() > 0.3
      const rank = isCorrect ? 1 : 2

      res.json({
        success: true,
        data: {
          isCorrect,
          rank
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

      const results = {
        winner: 'Anonymous Player 1',
        participants: [
          {
            learnerId: 'user-123',
            score: 100,
            rank: 1,
            timeSpent: 1200,
            isAnonymous: true
          },
          {
            learnerId: 'user-456',
            score: 80,
            rank: 2,
            timeSpent: 1500,
            isAnonymous: true
          }
        ],
        leaderboard: [
          {
            rank: 1,
            learnerId: 'user-123',
            score: 100,
            timeSpent: 1200,
            isAnonymous: true
          },
          {
            rank: 2,
            learnerId: 'user-456',
            score: 80,
            timeSpent: 1500,
            isAnonymous: true
          }
        ]
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

