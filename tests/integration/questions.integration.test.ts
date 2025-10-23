import request from 'supertest'
import { app } from '../../backend/src/app'

describe('Questions Integration Tests', () => {
  let authToken: string

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })

    authToken = loginResponse.body.data.token
  })

  describe('GET /api/questions/personalized', () => {
    it('should return personalized questions', async () => {
      const response = await request(app)
        .get('/api/questions/personalized?courseId=1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter questions by type', async () => {
      const response = await request(app)
        .get('/api/questions/personalized?courseId=1&type=code')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.every((q: any) => q.type === 'code')).toBe(true)
    })

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/questions/personalized?courseId=1')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/questions/:id', () => {
    it('should return question by id', async () => {
      const response = await request(app)
        .get('/api/questions/1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id', '1')
      expect(response.body.data).toHaveProperty('title')
      expect(response.body.data).toHaveProperty('description')
    })

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/questions/non-existent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/questions/:id/submit', () => {
    it('should submit answer successfully', async () => {
      const response = await request(app)
        .post('/api/questions/1/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          solution: 'print("Hello, World!")',
          language: 'python',
          timeSpent: 120
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('isCorrect')
      expect(response.body.data).toHaveProperty('score')
      expect(response.body.data).toHaveProperty('feedback')
    })

    it('should return 400 for missing solution', async () => {
      const response = await request(app)
        .post('/api/questions/1/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'python',
          timeSpent: 120
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/questions/:id/hint', () => {
    it('should return hint successfully', async () => {
      const response = await request(app)
        .post('/api/questions/1/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hintNumber: 1 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('hint')
      expect(response.body.data).toHaveProperty('hintsRemaining')
    })

    it('should return 400 for invalid hint number', async () => {
      const response = await request(app)
        .post('/api/questions/1/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hintNumber: 5 })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})




