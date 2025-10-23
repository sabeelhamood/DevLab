import { supabase, getSupabaseTables } from '../config/database.js'

const { topics } = getSupabaseTables()

export class TopicModel {
  // Create a new topic
  static async create(topicData) {
    const { data, error } = await supabase
      .from(topics)
      .insert([topicData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get topic by ID
  static async findById(topicId) {
    const { data, error } = await supabase
      .from(topics)
      .select(`
        *,
        course:courses(*),
        questions:questions(*),
        practices:practices(*)
      `)
      .eq('topic_id', topicId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get all topics with pagination
  static async findAll(page = 1, limit = 10, filters = {}) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from(topics)
      .select(`
        *,
        course:courses(*)
      `, { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    return { data, count }
  }

  // Get topics by course
  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from(topics)
      .select(`
        *,
        questions:questions(*),
        practices:practices(*)
      `)
      .eq('course_id', courseId)
      .order('topic_id')
    
    if (error) throw error
    return data
  }

  // Update topic
  static async update(topicId, updateData) {
    const { data, error } = await supabase
      .from(topics)
      .update(updateData)
      .eq('topic_id', topicId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete topic
  static async delete(topicId) {
    const { error } = await supabase
      .from(topics)
      .delete()
      .eq('topic_id', topicId)
    
    if (error) throw error
    return true
  }

  // Get topics with specific nano skills
  static async findByNanoSkills(nanoSkills) {
    const { data, error } = await supabase
      .from(topics)
      .select(`
        *,
        course:courses(*)
      `)
      .contains('nano_skills', nanoSkills)
    
    if (error) throw error
    return data
  }

  // Get topics with specific macro skills
  static async findByMacroSkills(macroSkills) {
    const { data, error } = await supabase
      .from(topics)
      .select(`
        *,
        course:courses(*)
      `)
      .contains('macro_skills', macroSkills)
    
    if (error) throw error
    return data
  }

  // Update nano skills for a topic
  static async updateNanoSkills(topicId, nanoSkills) {
    const { data, error } = await supabase
      .from(topics)
      .update({ nano_skills: nanoSkills })
      .eq('topic_id', topicId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Update macro skills for a topic
  static async updateMacroSkills(topicId, macroSkills) {
    const { data, error } = await supabase
      .from(topics)
      .update({ macro_skills: macroSkills })
      .eq('topic_id', topicId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get topic statistics
  static async getTopicStats(topicId) {
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .eq('topic_id', topicId)
    
    if (error) throw error
    
    const stats = {
      total_practices: data.length,
      completed_practices: data.filter(p => p.status === 'completed').length,
      average_score: data.reduce((sum, p) => sum + (p.score || 0), 0) / data.length || 0
    }
    
    return stats
  }
}

