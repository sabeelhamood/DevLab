import { supabase, getSupabaseTables } from '../config/database.js'

const { questions } = getSupabaseTables()

export class QuestionModel {
  // Create a new question
  static async create(questionData) {
    const { data, error } = await supabase
      .from(questions)
      .insert([questionData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get question by ID
  static async findById(questionId) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        topic:topics(*),
        course:courses(*),
        testCases:testCases(*)
      `)
      .eq('question_id', questionId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get questions by topic
  static async findByTopic(topicId, limit = 10) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        testCases:testCases(*)
      `)
      .eq('topic_id', topicId)
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get random questions for practice
  static async getRandomQuestions(topicId, count = 4, difficulty = null, questionType = null) {
    let query = supabase
      .from(questions)
      .select(`
        *,
        testCases:testCases(*)
      `)
      .eq('topic_id', topicId)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (questionType) {
      query = query.eq('question_type', questionType)
    }

    const { data, error } = await query.limit(count * 2) // Get more to randomize
    
    if (error) throw error
    
    // Shuffle and return requested count
    const shuffled = data.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // Update question
  static async update(questionId, updateData) {
    const { data, error } = await supabase
      .from(questions)
      .update(updateData)
      .eq('question_id', questionId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete question
  static async delete(questionId) {
    const { error } = await supabase
      .from(questions)
      .delete()
      .eq('question_id', questionId)
    
    if (error) throw error
    return true
  }

  // Get questions by practice
  static async findByPractice(practiceId) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        testCases:testCases(*)
      `)
      .eq('practice_id', practiceId)
      .order('question_id')
    
    if (error) throw error
    return data
  }

  // Get questions by type
  static async findByType(questionType, limit = 10) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        topic:topics(*),
        testCases:testCases(*)
      `)
      .eq('question_type', questionType)
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get questions by tags
  static async findByTags(tags, limit = 10) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        topic:topics(*),
        testCases:testCases(*)
      `)
      .contains('tags', tags)
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // Get questions by course
  static async findByCourse(courseId, limit = 10) {
    const { data, error } = await supabase
      .from(questions)
      .select(`
        *,
        topic:topics(*),
        testCases:testCases(*)
      `)
      .eq('course_id', courseId)
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

