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

  // Find eligible learners for competition (completed same course)
  static async findEligibleLearners(courseId, excludeLearnerId) {
    // This would integrate with your course completion system
    // For now, return mock data
    const { data, error } = await supabase
      .from('course_completions') // Assuming this table exists
      .select('learner_id, completed_at')
      .eq('course_id', courseId)
      .neq('learner_id', excludeLearnerId)
      .order('completed_at', { ascending: false })
      .limit(10)
    
    if (error) {
      // If table doesn't exist, return mock data
      return [
        { id: 'learner-1', completedAt: new Date().toISOString() },
        { id: 'learner-2', completedAt: new Date().toISOString() },
        { id: 'learner-3', completedAt: new Date().toISOString() }
      ]
    }
    
    return data.map(item => ({
      id: item.learner_id,
      completedAt: item.completed_at
    }))
  }

  // Update answer for a specific learner and question
  static async updateAnswer(competitionId, learnerId, questionId, answerData) {
    const { data, error } = await supabase
      .from(competitions)
      .update({
        [`learner${learnerId === 'learner1_id' ? '1' : '2'}_answers`]: answerData
      })
      .eq('competition_id', competitionId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Check if both players submitted answers for current question
  static async checkBothAnswersSubmitted(competitionId, questionId) {
    const { data, error } = await supabase
      .from(competitions)
      .select('learner1_answers, learner2_answers')
      .eq('competition_id', competitionId)
      .single()
    
    if (error) throw error
    
    // Check if both learners have submitted answers for the current question
    const learner1Submitted = data.learner1_answers?.some(answer => answer.questionId === questionId)
    const learner2Submitted = data.learner2_answers?.some(answer => answer.questionId === questionId)
    
    return learner1Submitted && learner2Submitted
  }

  // Update current question number
  static async updateCurrentQuestion(competitionId, questionNumber) {
    const { data, error } = await supabase
      .from(competitions)
      .update({ current_question: questionNumber })
      .eq('competition_id', competitionId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Determine winner based on scores
  static async determineWinner(competitionId) {
    const { data, error } = await supabase
      .from(competitions)
      .select('learner1_id, learner2_id, learner1_answers, learner2_answers')
      .eq('competition_id', competitionId)
      .single()
    
    if (error) throw error
    
    // Calculate scores
    const learner1Score = data.learner1_answers?.reduce((total, answer) => total + (answer.score || 0), 0) || 0
    const learner2Score = data.learner2_answers?.reduce((total, answer) => total + (answer.score || 0), 0) || 0
    
    const winner = learner1Score > learner2Score ? 'Player A' : 
                   learner2Score > learner1Score ? 'Player B' : 'Tie'
    
    return {
      winner,
      player1Score: learner1Score,
      player2Score: learner2Score,
      player1Rank: learner1Score > learner2Score ? 1 : 2,
      player2Rank: learner2Score > learner1Score ? 1 : 2,
      player1Time: data.learner1_answers?.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0,
      player2Time: data.learner2_answers?.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0
    }
  }
}

