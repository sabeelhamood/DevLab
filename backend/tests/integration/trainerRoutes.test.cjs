const request = require('supertest')

let app

const SERVICE_KEY = 'test-service-key'

beforeAll(async () => {
  process.env.SERVICE_API_KEYS = SERVICE_KEY
  process.env.NODE_ENV = 'test'
  ;({ default: app } = await import('../../src/app.js'))
})

const serviceHeaders = {
  'x-api-key': SERVICE_KEY,
  'x-service-id': 'content-studio'
}

describe('Trainer Routes', () => {
  it('validates a trainer question', async () => {
    const response = await request(app)
      .post('/api/content/questions/validate')
      .set(serviceHeaders)
      .send({
        question: 'Explain what a closure is in JavaScript.',
        topicId: 'topic-123',
        topicName: 'JavaScript Fundamentals',
        skills: ['closures'],
        questionType: 'theoretical',
        humanLanguage: 'en'
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('valid')
  })

  it('generates a question via Gemini', async () => {
    const response = await request(app)
      .post('/api/content/questions/generate')
      .set(serviceHeaders)
      .send({
        topicId: 'topic-456',
        topicName: 'Array Manipulation',
        skills: ['iteration', 'complexity'],
        questionType: 'code',
        programmingLanguage: 'javascript',
        humanLanguage: 'en'
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('stagedId')
    expect(response.body.data.question).toHaveProperty('hints')

    const stagedId = response.body.data.stagedId

    const deleteResponse = await request(app)
      .delete(`/api/content/questions/${stagedId}`)
      .set(serviceHeaders)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.success).toBe(true)
  })
})

