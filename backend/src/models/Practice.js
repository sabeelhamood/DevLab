import { supabase, getSupabaseTables } from '../config/database.js'

const { practices } = getSupabaseTables()

export class PracticeModel {
  // Create a new practice session
  static async create(practiceData) {
    const { data, error } = await supabase
      .from(practices)
      .insert([practiceData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get practice by ID
  static async findById(practiceId) {
    const { data, error } = await supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*),
        topic:topics(*),
        questions:questions(*)
      `)
      .eq('practice_id', practiceId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get all practices with pagination
  static async findAll(page = 1, limit = 10, filters = {}) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*),
        topic:topics(*)
      `, { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters.learner_id) {
      query = query.eq('learner_id', filters.learner_id)
    }
    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters.topic_id) {
      query = query.eq('topic_id', filters.topic_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    return { data, count }
  }

  // Get practices by learner
  static async findByLearner(learnerId, limit = 20) {
    const { data, error } = await supabase
      .from(practices)
      .select(`
        *,
        course:courses(*),
        topic:topics(*)
      `)
      .eq('learner_id', learnerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get practices by course
  static async findByCourse(courseId, limit = 20) {
    const { data, error } = await supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        topic:topics(*)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get practices by topic
  static async findByTopic(topicId, limit = 20) {
    const { data, error } = await supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*)
      `)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get active practices (in progress)
  static async getActive(learnerId = null) {
    let query = supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*),
        topic:topics(*)
      `)
      .eq('status', 'in_progress')

    if (learnerId) {
      query = query.eq('learner_id', learnerId)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  // Get completed practices
  static async getCompleted(learnerId = null) {
    let query = supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*),
        topic:topics(*)
      `)
      .eq('status', 'completed')

    if (learnerId) {
      query = query.eq('learner_id', learnerId)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  // Update practice
  static async update(practiceId, updateData) {
    const { data, error } = await supabase
      .from(practices)
      .update(updateData)
      .eq('practice_id', practiceId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Update practice status
  static async updateStatus(practiceId, status) {
    const { data, error } = await supabase
      .from(practices)
      .update({ status })
      .eq('practice_id', practiceId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Update practice score
  static async updateScore(practiceId, score) {
    const { data, error } = await supabase
      .from(practices)
      .update({ score })
      .eq('practice_id', practiceId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Update practice content
  static async updateContent(practiceId, content) {
    const { data, error } = await supabase
      .from(practices)
      .update({ content })
      .eq('practice_id', practiceId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete practice
  static async delete(practiceId) {
    const { error } = await supabase
      .from(practices)
      .delete()
      .eq('practice_id', practiceId)
    
    if (error) throw error
    return true
  }

  // Get practice statistics for a learner
  static async getLearnerStats(learnerId) {
    const { data, error } = await supabase
      .from(practices)
      .select('*')
      .eq('learner_id', learnerId)
    
    if (error) throw error
    
    const stats = {
      total_practices: data.length,
      completed_practices: data.filter(p => p.status === 'completed').length,
      in_progress_practices: data.filter(p => p.status === 'in_progress').length,
      average_score: data.reduce((sum, p) => sum + (p.score || 0), 0) / data.length || 0,
      total_time_spent: data.reduce((sum, p) => sum + (p.time_spent || 0), 0)
    }
    
    return stats
  }

  // Get practice statistics for a topic
  static async getTopicStats(topicId) {
    const { data, error } = await supabase
      .from(practices)
      .select('*')
      .eq('topic_id', topicId)
    
    if (error) throw error
    
    const stats = {
      total_practices: data.length,
      completed_practices: data.filter(p => p.status === 'completed').length,
      average_score: data.reduce((sum, p) => sum + (p.score || 0), 0) / data.length || 0,
      unique_learners: new Set(data.map(p => p.learner_id)).size
    }
    
    return stats
  }

  // Get recent practices
  static async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from(practices)
      .select(`
        *,
        learner:userProfiles!practices_learner_id_fkey(*),
        course:courses(*),
        topic:topics(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

