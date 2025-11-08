import { getCollections } from '../config/database.js'

export class LogModel {
  // Create a new log entry
  static async create(logData) {
    const { logs } = getCollections()
    
    const logEntry = {
      ...logData,
      timestamp: new Date(),
      created_at: new Date()
    }
    
    const result = await logs.insertOne(logEntry)
    return { id: result.insertedId, ...logEntry }
  }

  // Get logs with pagination and filters
  static async findAll(page = 1, limit = 50, filters = {}) {
    const { logs } = getCollections()
    
    const skip = (page - 1) * limit
    const query = {}
    
    // Apply filters
    if (filters.level) {
      query.level = filters.level
    }
    if (filters.service) {
      query.service = filters.service
    }
    if (filters.user_id) {
      query.user_id = filters.user_id
    }
    if (filters.start_date && filters.end_date) {
      query.timestamp = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      }
    }
    
    const [data, count] = await Promise.all([
      logs.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      logs.countDocuments(query)
    ])
    
    return { data, count }
  }

  // Get logs by user
  static async findByUser(userId, limit = 100) {
    const { logs } = getCollections()
    
    const data = await logs
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
    
    return data
  }

  // Get logs by service
  static async findByService(service, limit = 100) {
    const { logs } = getCollections()
    
    const data = await logs
      .find({ service })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
    
    return data
  }

  // Delete old logs (cleanup)
  static async deleteOld(daysOld = 30) {
    const { logs } = getCollections()
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const result = await logs.deleteMany({
      timestamp: { $lt: cutoffDate }
    })
    
    return result.deletedCount
  }
}


