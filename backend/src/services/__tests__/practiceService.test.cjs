const createRepository = () => {
  const sessions = new Map()

  return {
    async saveSession(session) {
      sessions.set(session.id, JSON.parse(JSON.stringify(session)))
      return sessions.get(session.id)
    },
    async getSession(sessionId) {
      const session = sessions.get(sessionId)
      return session ? JSON.parse(JSON.stringify(session)) : null
    },
    async updateQuestion(sessionId, questionId, updater) {
      const session = sessions.get(sessionId)
      if (!session) return null
      const question = session.questions.find((q) => q.id === questionId)
      if (!question) return null
      const updated = updater(question)
      Object.assign(question, updated)
      return JSON.parse(JSON.stringify(question))
    },
    async recordSubmission(sessionId, questionId, submission) {
      const session = sessions.get(sessionId)
      if (!session) return null
      const question = session.questions.find((q) => q.id === questionId)
      if (!question) return null
      question.submissions = question.submissions || []
      question.submissions.push({ ...submission })
      return JSON.parse(JSON.stringify(question))
    }
  }
}

let createPracticeService

beforeAll(async () => {
  ;({ createPracticeService } = await import('../practiceService.js'))
})

describe('practiceService', () => {
  const baseSession = {
    id: 'session-1',
    learnerId: 'learner-123',
    courseId: 'course-789',
    questions: [
      {
        id: 'q1',
        stem: 'Write a function to add two numbers.',
        language: 'javascript',
        hintsUsed: 0,
        hints: [],
        tests: [
          { input: [1, 2], output: 3 },
          { input: [0, 5], output: 5 }
        ]
      }
    ]
  }

  let repository
  let geminiClient
  let judge0Client
  let logger
  let service

  beforeEach(async () => {
    repository = createRepository()
    geminiClient = {
      generateHint: jest.fn().mockResolvedValue({
        hint: 'Think about using the + operator.',
        reasoning: 'Addition in JavaScript uses +.',
        id: 'hint-1'
      }),
      evaluateSolution: jest.fn().mockResolvedValue({
        correct: true,
        aiSuspected: false,
        feedback: 'Great job! Consider handling negative numbers.',
        diagnostics: { coverage: 'all tests passed' }
      })
    }
    judge0Client = {
      execute: jest.fn().mockResolvedValue({
        stdout: '3',
        stderr: '',
        status: { id: 3, description: 'Accepted' },
        time: '0.2'
      })
    }
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    service = createPracticeService({ repository, geminiClient, judge0Client, logger })
    await service.initializeSession(baseSession)
  })

  it('initializes a practice session with zeroed hint counters', async () => {
    const session = await service.getSession({ sessionId: 'session-1', learnerId: 'learner-123' })

    expect(session).toBeDefined()
    expect(session.questions[0].hintsUsed).toBe(0)
    expect(session.questions[0].hints).toEqual([])
  })

  it('returns Gemini hints up to the limit and then blocks further requests', async () => {
    const context = { sessionId: 'session-1', questionId: 'q1', learnerId: 'learner-123' }

    const firstHint = await service.requestHint(context)
    const secondHint = await service.requestHint(context)
    const thirdHint = await service.requestHint(context)

    expect(firstHint.remainingHints).toBe(2)
    expect(secondHint.remainingHints).toBe(1)
    expect(thirdHint.remainingHints).toBe(0)
    expect(geminiClient.generateHint).toHaveBeenCalledTimes(3)

    await expect(service.requestHint(context)).rejects.toThrow('HINT_LIMIT_REACHED')
  })

  it('executes code via Judge0 and returns normalized results', async () => {
    const response = await service.runCode({
      sessionId: 'session-1',
      questionId: 'q1',
      learnerId: 'learner-123',
      submission: {
        language: 'javascript',
        code: 'function add(a,b){return a+b;}',
        stdin: '',
        expectedOutput: '3'
      }
    })

    expect(judge0Client.execute).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'javascript' })
    )
    expect(response.status).toBe('Accepted')
    expect(response.stdout).toBe('3')
  })

  it('evaluates solutions with Gemini and records fraud detection flags', async () => {
    geminiClient.evaluateSolution.mockResolvedValueOnce({
      correct: true,
      aiSuspected: true,
      feedback: 'Solution appears AI-generated. Please retry yourself.',
      diagnostics: { coverage: 'all tests passed' }
    })

    const result = await service.submitSolution({
      sessionId: 'session-1',
      questionId: 'q1',
      learnerId: 'learner-123',
      language: 'javascript',
      code: 'function add(a,b){return a+b;}'
    })

    expect(result.aiSuspected).toBe(true)
    expect(result.feedback).toContain('AI-generated')

    const session = await service.getSession({ sessionId: 'session-1', learnerId: 'learner-123' })
    expect(session.questions[0].submissions).toHaveLength(1)
    expect(session.questions[0].submissions[0].evaluation.aiSuspected).toBe(true)
  })
})

