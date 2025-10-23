import { supabase, getSupabaseTables } from '../config/database.js'

const { competitions } = getSupabaseTables()

export class CompetitionModel {
  // Create a new competition
  static async create(competitionData) {
    const { data, error } = await supabase
      .from(competitions)
      .insert([competitionData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get competition by ID
  static async findById(competitionId) {
    const { data, error } = await supabase
      .from(competitions)
      .select(`
        *,
        course:courses(*),
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `)
      .eq('competition_id', competitionId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get all competitions with pagination
  static async findAll(page = 1, limit = 10) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from(competitions)
      .select(`
        *,
        course:courses(*),
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `, { count: 'exact' })
      .range(from, to)
    
    if (error) throw error
    return { data, count }
  }

  // Get competitions by course
  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from(competitions)
      .select(`
        *,
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `)
      .eq('course_id', courseId)
    
    if (error) throw error
    return data
  }

  // Get competitions by learner
  static async findByLearner(learnerId) {
    const { data, error } = await supabase
      .from(competitions)
      .select(`
        *,
        course:courses(*),
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `)
      .or(`learner1_id.eq.${learnerId},learner2_id.eq.${learnerId}`)
    
    if (error) throw error
    return data
  }

  // Update competition result
  static async updateResult(competitionId, result) {
    const { data, error } = await supabase
      .from(competitions)
      .update({ result })
      .eq('competition_id', competitionId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete competition
  static async delete(competitionId) {
    const { error } = await supabase
      .from(competitions)
      .delete()
      .eq('competition_id', competitionId)
    
    if (error) throw error
    return true
  }

  // Get active competitions (no result yet)
  static async getActive() {
    const { data, error } = await supabase
      .from(competitions)
      .select(`
        *,
        course:courses(*),
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `)
      .is('result', null)
    
    if (error) throw error
    return data
  }

  // Get completed competitions
  static async getCompleted() {
    const { data, error } = await supabase
      .from(competitions)
      .select(`
        *,
        course:courses(*),
        learner1:userProfiles!competitions_learner1_id_fkey(*),
        learner2:userProfiles!competitions_learner2_id_fkey(*)
      `)
      .not('result', 'is', null)
    
    if (error) throw error
    return data
  }
}

