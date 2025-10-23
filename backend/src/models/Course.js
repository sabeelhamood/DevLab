import { supabase, getSupabaseTables } from '../config/database.js'

const { courses } = getSupabaseTables()

export class CourseModel {
  // Create a new course
  static async create(courseData) {
    const { data, error } = await supabase
      .from(courses)
      .insert([courseData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get course by ID
  static async findById(courseId) {
    const { data, error } = await supabase
      .from(courses)
      .select(`
        *,
        trainer:userProfiles!courses_trainer_id_fkey(*),
        topics:topics(*)
      `)
      .eq('course_id', courseId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get all courses with pagination
  static async findAll(page = 1, limit = 10, filters = {}) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from(courses)
      .select(`
        *,
        trainer:userProfiles!courses_trainer_id_fkey(*),
        topics:topics(*)
      `, { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters.level) {
      query = query.eq('level', filters.level)
    }
    if (filters.trainer_id) {
      query = query.eq('trainer_id', filters.trainer_id)
    }

    const { data, error, count } = await query
    
    if (error) throw error
    return { data, count }
  }

  // Update course
  static async update(courseId, updateData) {
    const { data, error } = await supabase
      .from(courses)
      .update(updateData)
      .eq('course_id', courseId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete course
  static async delete(courseId) {
    const { error } = await supabase
      .from(courses)
      .delete()
      .eq('course_id', courseId)
    
    if (error) throw error
    return true
  }

  // Get courses by trainer
  static async findByTrainer(trainerId) {
    const { data, error } = await supabase
      .from(courses)
      .select(`
        *,
        topics:topics(*)
      `)
      .eq('trainer_id', trainerId)
    
    if (error) throw error
    return data
  }

  // Get courses by level
  static async findByLevel(level) {
    const { data, error } = await supabase
      .from(courses)
      .select(`
        *,
        trainer:userProfiles!courses_trainer_id_fkey(*),
        topics:topics(*)
      `)
      .eq('level', level)
    
    if (error) throw error
    return data
  }

  // Update AI feedback for course
  static async updateAIFeedback(courseId, aiFeedback) {
    const { data, error } = await supabase
      .from(courses)
      .update({ ai_feedback: aiFeedback })
      .eq('course_id', courseId)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

