import { getSupabaseTables, postgres } from '../../config/database.js'
import { CompetitionModel } from '../../models/Competition.js'
import { QuestionModel } from '../../models/Question.js'
import { UserProfileModel } from '../../models/User.js'
import { CourseModel } from '../../models/Course.js'

const tables = getSupabaseTables()
const competitionsTable = postgres.quoteIdentifier(tables.competitions)
const questionsTable = postgres.quoteIdentifier(tables.questions)
const userProfilesTable = postgres.quoteIdentifier(tables.userProfiles)
const coursesTable = postgres.quoteIdentifier(tables.courses)
const topicsTable = postgres.quoteIdentifier(tables.topics)
const practicesTable = postgres.quoteIdentifier(tables.practices)
const testCasesTable = postgres.quoteIdentifier(tables.testCases)
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions)

/**
 * Process RPC Handler
 * Handles both Real-time queries and Batch sync requests
 */
class ProcessHandler {
  /**
   * Handle Process RPC call
   * @param {Object} call - GRPC call object
   * @param {Function} callback - Response callback
   */
  async handle(call, callback) {
    const startTime = Date.now()
    let envelope

    try {
      // 1. Parse envelope from request
      const envelopeJson = call.request.envelope_json
      envelope = JSON.parse(envelopeJson)

      const {
        request_id,
        tenant_id,
        user_id,
        target_service,
        payload,
        metadata
      } = envelope

      console.log('📥 [GRPC Process] Request received', {
        service: process.env.SERVICE_NAME || 'devlab-backend',
        request_id,
        tenant_id,
        user_id,
        target_service,
        has_payload: !!payload,
        sync_type: payload?.sync_type
      })

      // 2. Detect mode: Real-time or Batch Sync
      const isBatchSync = payload?.sync_type === 'batch'

      let result

      if (isBatchSync) {
        // ═══════════════════════════════════════
        // MODE 1: BATCH SYNC
        // ═══════════════════════════════════════
        console.log('📦 [GRPC Process - BATCH SYNC] Processing batch request', {
          service: process.env.SERVICE_NAME || 'devlab-backend',
          request_id,
          page: payload.page,
          limit: payload.limit,
          since: payload.since
        })

        result = await this.handleBatchSync(envelope)

      } else {
        // ═══════════════════════════════════════
        // MODE 2: REAL-TIME QUERY
        // ═══════════════════════════════════════
        console.log('⚡ [GRPC Process - REAL-TIME] Processing query', {
          service: process.env.SERVICE_NAME || 'devlab-backend',
          request_id,
          query: payload?.query,
          context: payload?.context
        })

        result = await this.handleRealtimeQuery(envelope)
      }

      // 3. Build response envelope
      const responseEnvelope = {
        request_id,
        success: true,
        data: result.data,  // ⚠️ CRITICAL: Must be array or {items: []}
        metadata: {
          ...(result.metadata || {}),
          processed_at: new Date().toISOString(),
          service: process.env.SERVICE_NAME || 'devlab-backend',
          duration_ms: Date.now() - startTime,
          mode: isBatchSync ? 'batch' : 'realtime'
        }
      }

      console.log('✅ [GRPC Process] Request completed', {
        service: process.env.SERVICE_NAME || 'devlab-backend',
        request_id,
        duration_ms: Date.now() - startTime,
        mode: isBatchSync ? 'batch' : 'realtime',
        success: true
      })

      // 4. Return ProcessResponse
      callback(null, {
        success: true,
        envelope_json: JSON.stringify(responseEnvelope),
        error: ''
      })

    } catch (error) {
      console.error('❌ [GRPC Process] Request failed', {
        service: process.env.SERVICE_NAME || 'devlab-backend',
        request_id: envelope?.request_id,
        error: error.message,
        stack: error.stack,
        duration_ms: Date.now() - startTime
      })

      // Return error response
      callback(null, {
        success: false,
        envelope_json: JSON.stringify({
          request_id: envelope?.request_id,
          success: false,
          error: error.message,
          metadata: {
            processed_at: new Date().toISOString(),
            service: process.env.SERVICE_NAME || 'devlab-backend'
          }
        }),
        error: error.message
      })
    }
  }

  /**
   * Handle Batch Sync request
   * @param {Object} envelope - Request envelope
   * @returns {Promise<Object>} Result with data
   */
  async handleBatchSync(envelope) {
    const {
      tenant_id,
      payload
    } = envelope

    const {
      page = 1,
      limit = 1000,
      since
    } = payload

    console.log('📦 [Batch Sync] Fetching data', {
      service: process.env.SERVICE_NAME || 'devlab-backend',
      tenant_id,
      page,
      limit,
      since
    })

    // Query all main tables with pagination
    const offset = (page - 1) * limit
    
    // Fetch competitions
    const competitions = await this.queryCompetitions({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch questions
    const questions = await this.queryQuestions({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch user profiles
    const userProfiles = await this.queryUserProfiles({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch courses
    const courses = await this.queryCourses({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch topics
    const topics = await this.queryTopics({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch practices
    const practices = await this.queryPractices({
      tenant_id,
      limit,
      offset,
      since
    })

    // Fetch course completions
    const courseCompletions = await this.queryCourseCompletions({
      tenant_id,
      limit,
      offset,
      since
    })

    // Combine all data
    const allData = [
      ...competitions.map(item => ({ ...item, _type: 'competition' })),
      ...questions.map(item => ({ ...item, _type: 'question' })),
      ...userProfiles.map(item => ({ ...item, _type: 'user_profile' })),
      ...courses.map(item => ({ ...item, _type: 'course' })),
      ...topics.map(item => ({ ...item, _type: 'topic' })),
      ...practices.map(item => ({ ...item, _type: 'practice' })),
      ...courseCompletions.map(item => ({ ...item, _type: 'course_completion' }))
    ]

    // Get total counts
    const totalCounts = await Promise.all([
      this.getTotalCount(competitionsTable, tenant_id, since),
      this.getTotalCount(questionsTable, tenant_id, since),
      this.getTotalCount(userProfilesTable, tenant_id, since),
      this.getTotalCount(coursesTable, tenant_id, since),
      this.getTotalCount(topicsTable, tenant_id, since),
      this.getTotalCount(practicesTable, tenant_id, since),
      this.getTotalCount(courseCompletionsTable, tenant_id, since)
    ])

    const totalCount = totalCounts.reduce((sum, count) => sum + count, 0)
    const hasMore = (page * limit) < totalCount

    console.log('📦 [Batch Sync] Data fetched', {
      service: process.env.SERVICE_NAME || 'devlab-backend',
      tenant_id,
      page,
      records: allData.length,
      total: totalCount,
      has_more: hasMore
    })

    // ⚠️ CRITICAL: Return format MUST be { items: [...] }
    return {
      data: {
        items: allData,        // ⭐ Your actual data array
        page,
        limit,
        total: totalCount
      },
      metadata: {
        has_more: hasMore,
        page,
        total_pages: Math.ceil(totalCount / limit)
      }
    }
  }

  /**
   * Handle Real-time Query
   * @param {Object} envelope - Request envelope
   * @returns {Promise<Object>} Result with data
   */
  async handleRealtimeQuery(envelope) {
    const {
      tenant_id,
      user_id,
      payload
    } = envelope

    const query = payload?.query || ''
    const context = payload?.context || {}

    console.log('⚡ [Real-time Query] Processing', {
      service: process.env.SERVICE_NAME || 'devlab-backend',
      tenant_id,
      user_id,
      query
    })

    let data = []

    // Parse query and execute appropriate action
    const queryLower = query.toLowerCase()

    if (queryLower.includes('competition') || queryLower.includes('competitions')) {
      if (queryLower.includes('recent') || queryLower.includes('latest')) {
        data = await this.getRecentCompetitions(tenant_id, user_id)
      } else if (queryLower.includes('id') || queryLower.match(/\d+/)) {
        const id = this.extractId(query)
        const competition = await CompetitionModel.findById(id)
        data = competition ? [competition] : []
      } else {
        data = await this.getRecentCompetitions(tenant_id, user_id, 10)
      }

    } else if (queryLower.includes('question') || queryLower.includes('questions')) {
      if (queryLower.includes('recent') || queryLower.includes('latest')) {
        data = await this.getRecentQuestions(tenant_id, user_id)
      } else if (queryLower.includes('id') || queryLower.match(/\d+/)) {
        const id = this.extractId(query)
        const question = await QuestionModel.findById(id)
        data = question ? [question] : []
      } else {
        data = await this.getRecentQuestions(tenant_id, user_id, 10)
      }

    } else if (queryLower.includes('user') || queryLower.includes('profile') || queryLower.includes('learner')) {
      if (queryLower.includes('id') || queryLower.match(/\d+/)) {
        const id = this.extractId(query) || user_id
        const user = await UserProfileModel.findById(id)
        data = user ? [user] : []
      } else {
        data = await this.getRecentUsers(tenant_id, 10)
      }

    } else if (queryLower.includes('course') || queryLower.includes('courses')) {
      if (queryLower.includes('recent') || queryLower.includes('latest')) {
        data = await this.getRecentCourses(tenant_id, 10)
      } else if (queryLower.includes('id') || queryLower.match(/\d+/)) {
        const id = this.extractId(query)
        const course = await CourseModel.findById(id)
        data = course ? [course] : []
      } else {
        data = await this.getRecentCourses(tenant_id, 10)
      }

    } else {
      // Default: return recent competitions and questions
      const [competitions, questions] = await Promise.all([
        this.getRecentCompetitions(tenant_id, user_id, 5),
        this.getRecentQuestions(tenant_id, user_id, 5)
      ])
      data = [...competitions, ...questions]
    }

    console.log('⚡ [Real-time Query] Data fetched', {
      service: process.env.SERVICE_NAME || 'devlab-backend',
      tenant_id,
      user_id,
      records: data.length
    })

    // ⚠️ CRITICAL: Return data as direct array (not wrapped!)
    return {
      data: data,  // ⭐ Direct array of items
      metadata: {
        query_type: this.detectQueryType(query)
      }
    }
  }

  /**
   * Query competitions with pagination (for Batch Sync)
   */
  async queryCompetitions({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${competitionsTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query questions with pagination (for Batch Sync)
   */
  async queryQuestions({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${questionsTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query user profiles with pagination (for Batch Sync)
   */
  async queryUserProfiles({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${userProfilesTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query courses with pagination (for Batch Sync)
   */
  async queryCourses({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${coursesTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query topics with pagination (for Batch Sync)
   */
  async queryTopics({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${topicsTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query practices with pagination (for Batch Sync)
   */
  async queryPractices({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${practicesTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"created_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "created_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Query course completions with pagination (for Batch Sync)
   */
  async queryCourseCompletions({ tenant_id, limit, offset, since }) {
    let query = `SELECT * FROM ${courseCompletionsTable}`
    const params = []
    const conditions = []

    if (since) {
      conditions.push(`"completed_at" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY "completed_at" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const { rows } = await postgres.query(query, params)
    return rows
  }

  /**
   * Get total count (for Batch Sync pagination)
   */
  async getTotalCount(tableName, tenant_id, since) {
    let query = `SELECT COUNT(*) as count FROM ${tableName}`
    const params = []
    const conditions = []

    if (since) {
      const dateColumn = tableName.includes('course_completions') ? 'completed_at' : 'created_at'
      conditions.push(`"${dateColumn}" >= $${params.length + 1}`)
      params.push(new Date(since))
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    const { rows } = await postgres.query(query, params)
    return parseInt(rows[0]?.count || 0, 10)
  }

  /**
   * Get recent competitions (for Real-time queries)
   */
  async getRecentCompetitions(tenant_id, user_id, limit = 10) {
    try {
      if (user_id) {
        const competitions = await CompetitionModel.findByLearner(user_id)
        return competitions.slice(0, limit)
      } else {
        const result = await CompetitionModel.findAll(1, limit)
        return result.data || []
      }
    } catch (error) {
      console.error('Error fetching recent competitions:', error)
      return []
    }
  }

  /**
   * Get recent questions (for Real-time queries)
   */
  async getRecentQuestions(tenant_id, user_id, limit = 10) {
    try {
      const { rows } = await postgres.query(
        `SELECT * FROM ${questionsTable} ORDER BY "created_at" DESC LIMIT $1`,
        [limit]
      )
      return rows
    } catch (error) {
      console.error('Error fetching recent questions:', error)
      return []
    }
  }

  /**
   * Get recent users (for Real-time queries)
   */
  async getRecentUsers(tenant_id, limit = 10) {
    try {
      const result = await UserProfileModel.findAll(1, limit)
      return result.data || []
    } catch (error) {
      console.error('Error fetching recent users:', error)
      return []
    }
  }

  /**
   * Get recent courses (for Real-time queries)
   */
  async getRecentCourses(tenant_id, limit = 10) {
    try {
      const { rows } = await postgres.query(
        `SELECT * FROM ${coursesTable} ORDER BY "created_at" DESC LIMIT $1`,
        [limit]
      )
      return rows
    } catch (error) {
      console.error('Error fetching recent courses:', error)
      return []
    }
  }

  /**
   * Extract ID from query text
   */
  extractId(query) {
    // Try UUID format first
    const uuidMatch = query.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    if (uuidMatch) return uuidMatch[0]
    
    // Try numeric ID
    const numericMatch = query.match(/\d+/)
    return numericMatch ? numericMatch[0] : null
  }

  /**
   * Detect query type
   */
  detectQueryType(query) {
    const queryLower = query.toLowerCase()
    if (queryLower.includes('competition')) return 'competition'
    if (queryLower.includes('question')) return 'question'
    if (queryLower.includes('user') || queryLower.includes('profile')) return 'user'
    if (queryLower.includes('course')) return 'course'
    if (queryLower.includes('recent')) return 'recent'
    if (queryLower.includes('id')) return 'by_id'
    return 'default'
  }
}

export default new ProcessHandler()

