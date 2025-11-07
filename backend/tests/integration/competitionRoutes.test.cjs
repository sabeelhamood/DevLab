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

const createLearnerToken = (sub = 'learner-1') => {
  return jwt.sign({ sub, role: 'learner', org_id: 'org-1' }, JWT_SECRET, { expiresIn: '1h' })
}

describe('Competition Routes', () => {
  const serviceHeaders = {
    'x-api-key': SERVICE_KEY,
    'x-service-id': 'course-builder'
  }

  const inviteLearner = (learnerId = 'learner-1') =>
    request(app)
      .post('/api/competitions/invitations')
      .set(serviceHeaders)
      .send({
        learnerId,
        courseId: 'course-123',
        courseName: 'Advanced Algorithms'
      })

  it('queues and lists competition invitations', async () => {
    const inviteResponse = await inviteLearner('learner-2')
    expect(inviteResponse.status).toBe(202)

    const token = createLearnerToken('learner-2')

    const listResponse = await request(app)
      .get('/api/competitions/invitations')
      .set('Authorization', `Bearer ${token}`)

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.data.length).toBeGreaterThan(0)
  })

  it('accepts an invitation with learner token', async () => {
    const inviteResponse = await inviteLearner('learner-3')
    const invitationId = inviteResponse.body.data.id

    const token = createLearnerToken('learner-3')

    const acceptResponse = await request(app)
      .post(`/api/competitions/invitations/${invitationId}/accept`)
      .set('Authorization', `Bearer ${token}`)

    expect(acceptResponse.status).toBe(200)
    expect(acceptResponse.body.data.status).toBe('accepted')
  })

  it('declines invitation', async () => {
    const inviteResponse = await inviteLearner('learner-4')
    const invitationId = inviteResponse.body.data.id
    const token = createLearnerToken('learner-4')

    const declineResponse = await request(app)
      .post(`/api/competitions/invitations/${invitationId}/decline`)
      .set('Authorization', `Bearer ${token}`)

    expect(declineResponse.status).toBe(200)
    expect(declineResponse.body.data.status).toBe('declined')
  })

  it('creates and fetches a competition match', async () => {
    const matchResponse = await request(app)
      .post('/api/competitions')
      .set(serviceHeaders)
      .send({
        courseId: 'course-123',
        courseName: 'Advanced Algorithms',
        participants: [
          { id: 'learner-1', pseudonym: 'Phoenix' },
          { id: 'learner-2', pseudonym: 'Nova' }
        ],
        questions: [
          { id: 'q1', stem: 'Solve a coding challenge', language: 'javascript' }
        ],
        timer: '00:30:00'
      })

    expect(matchResponse.status).toBe(201)
    const matchId = matchResponse.body.data.id

    const token = createLearnerToken('learner-1')

    const fetchResponse = await request(app)
      .get(`/api/competitions/${matchId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.data.id).toBe(matchId)
  })

  it('submits match round and handles completion', async () => {
    const matchResponse = await request(app)
      .post('/api/competitions')
      .set(serviceHeaders)
      .send({
        courseId: 'course-456',
        courseName: 'Competition Testing',
        participants: [
          { id: 'learner-1', pseudonym: 'Phoenix' },
          { id: 'learner-2', pseudonym: 'Nova' }
        ],
        questions: [
          { id: 'q1', stem: 'Write a function to sum numbers.', language: 'javascript' }
        ],
        timer: '00:10:00'
      })

    const matchId = matchResponse.body.data.id
    const token = createLearnerToken('learner-1')

    const submitResponse = await request(app)
      .post(`/api/competitions/${matchId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionIndex: 0,
        language: 'javascript',
        code: 'function sum(a,b){return a+b;}'
      })

    expect(submitResponse.status).toBe(200)

    const completionResponse = await request(app)
      .post(`/api/competitions/${matchId}/complete`)
      .set(serviceHeaders)

    expect(completionResponse.status).toBe(200)
    expect(completionResponse.body.data.status).toBe('completed')
  })
})

