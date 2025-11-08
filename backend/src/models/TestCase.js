import { supabase, getSupabaseTables } from '../config/database.js'

const { testCases } = getSupabaseTables()

export class TestCaseModel {
  // Create a new test case
  static async create(testCaseData) {
    const { data, error } = await supabase
      .from(testCases)
      .insert([testCaseData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Get test case by ID
  static async findById(testCaseId) {
    const { data, error } = await supabase
      .from(testCases)
      .select(`
        *,
        question:questions(*)
      `)
      .eq('testCase_id', testCaseId)
      .single()
    
    if (error) throw error
    return data
  }

  // Get all test cases with pagination
  static async findAll(page = 1, limit = 10) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from(testCases)
      .select(`
        *,
        question:questions(*)
      `, { count: 'exact' })
      .range(from, to)
    
    if (error) throw error
    return { data, count }
  }

  // Get test cases by question
  static async findByQuestion(questionId) {
    const { data, error } = await supabase
      .from(testCases)
      .select('*')
      .eq('question_id', questionId)
      .order('testCase_id')
    
    if (error) throw error
    return data
  }

  // Get test cases by course
  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from(testCases)
      .select(`
        *,
        question:questions(*)
      `)
      .eq('question.course_id', courseId)
    
    if (error) throw error
    return data
  }

  // Get test cases by topic
  static async findByTopic(topicId) {
    const { data, error } = await supabase
      .from(testCases)
      .select(`
        *,
        question:questions(*)
      `)
      .eq('question.topic_id', topicId)
    
    if (error) throw error
    return data
  }

  // Update test case
  static async update(testCaseId, updateData) {
    const { data, error } = await supabase
      .from(testCases)
      .update(updateData)
      .eq('testCase_id', testCaseId)
      .select()
    
    if (error) throw error
    return data[0]
  }

  // Delete test case
  static async delete(testCaseId) {
    const { error } = await supabase
      .from(testCases)
      .delete()
      .eq('testCase_id', testCaseId)
    
    if (error) throw error
    return true
  }

  // Delete all test cases for a question
  static async deleteByQuestion(questionId) {
    const { error } = await supabase
      .from(testCases)
      .delete()
      .eq('question_id', questionId)
    
    if (error) throw error
    return true
  }

  // Create multiple test cases for a question
  static async createMultiple(questionId, testCasesData) {
    const testCasesWithQuestionId = testCasesData.map(testCase => ({
      ...testCase,
      question_id: questionId
    }))

    const { data, error } = await supabase
      .from(testCases)
      .insert(testCasesWithQuestionId)
      .select()
    
    if (error) throw error
    return data
  }

  // Get test cases for code execution
  static async getForExecution(questionId) {
    const { data, error } = await supabase
      .from(testCases)
      .select('input, expected_output')
      .eq('question_id', questionId)
      .order('testCase_id')
    
    if (error) throw error
    return data
  }

  // Validate test case input/output
  static async validateTestCase(testCaseId, actualOutput) {
    const { data, error } = await supabase
      .from(testCases)
      .select('expected_output')
      .eq('testCase_id', testCaseId)
      .single()
    
    if (error) throw error
    
    const isCorrect = data.expected_output === actualOutput
    return {
      testCaseId,
      expected: data.expected_output,
      actual: actualOutput,
      passed: isCorrect
    }
  }

  // Get test case statistics for a question
  static async getQuestionStats(questionId) {
    const { data, error } = await supabase
      .from(testCases)
      .select('*')
      .eq('question_id', questionId)
    
    if (error) throw error
    
    return {
      total_test_cases: data.length,
      test_cases: data
    }
  }
}
