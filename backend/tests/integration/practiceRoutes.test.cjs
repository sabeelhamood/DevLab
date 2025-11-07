const request = require('supertest')
const jwt = require('jsonwebtoken')

let app

const SERVICE_KEY = 'test-service-key'
const JWT_SECRET = 'test-jwt-secret'

beforeAll(async () => {
  process.env.SERVICE_API_KEYS = SERVICE_KEY
  process.env.SERVICE_JWT_SECRET = JWT_SECRET
  process.env.NODE_ENV = 'test'

  ;({ default: app } = await import('../../src/app.js'))
})

const createLearnerToken = (overrides = {}) => {
  const payload = {
    sub: 'learner-123',
    role: 'learner',
    org_id: 'org-1',
    ...overrides
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

const createSessionPayload = () => ({
  id: 'session-1',
  learnerId: 'learner-123',
  courseId: 'course-789',
  questions: [
    {
      id: 'q1',
      stem: 'Add two numbers',
      language: 'javascript',
      hints: [],
      hintsUsed: 0,
      tests: [{ input: [1, 2], output: 3 }]
    }
  ]
})

describe('Practice Routes', () => {
  const serviceHeaders = {
    'x-api-key': SERVICE_KEY,
    'x-service-id': 'content-studio'
  }

  it('creates and retrieves a practice session', async () => {
    const createResponse = await request(app)
      .post('/api/practice/sessions')
      .set(serviceHeaders)
      .send(createSessionPayload())

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.success).toBe(true)

    const token = createLearnerToken()

    const fetchResponse = await request(app)
      .get('/api/practice/sessions/session-1')
      .set('Authorization', `Bearer ${token}`)

    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.data.id).toBe('session-1')
    expect(fetchResponse.body.data.questions).toHaveLength(1)
  })

  it('enforces learner role for practice endpoints', async () => {
    const token = jwt.sign({ sub: 'trainer-1', role: 'trainer' }, JWT_SECRET)

    const response = await request(app)
      .get('/api/practice/sessions/session-1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })

  it('limits hints to three per question', async () => {
    const token = createLearnerToken()

    const hintContext = { questionId: 'q1', context: {} }

    const hintRequest = () =>
      request(app)
        .post('/api/practice/sessions/session-1/hints')
        .set('Authorization', `Bearer ${token}`)
        .send(hintContext)

    const first = await hintRequest()
    const second = await hintRequest()
    const third = await hintRequest()

    expect(first.body.data.remainingHints).toBe(2)
    expect(second.body.data.remainingHints).toBe(1)
    expect(third.body.data.remainingHints).toBe(0)

    const fourth = await hintRequest()
    expect(fourth.status).toBe(429)
    expect(fourth.body.error).toBe('HINT_LIMIT_REACHED')
  })

  it('runs code and returns Judge0 response', async () => {
    const token = createLearnerToken()

    const response = await request(app)
      .post('/api/practice/sessions/session-1/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: 'q1',
        submission: {
          language: 'javascript',
          code: 'function add(a,b){return a+b;}',
          stdin: '',
          expectedOutput: '3'
        }
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('status')
  })

  it('submits solutions and records AI detection flag', async () => {
    const token = createLearnerToken()

    const response = await request(app)
      .post('/api/practice/sessions/session-1/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: 'q1',
        language: 'javascript',
        code: 'function add(a,b){return a+b;}'
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('feedback')
    expect(response.body.data).toHaveProperty('aiSuspected')
  })
})

