import { randomUUID } from 'crypto'
import { supabase } from '../config/database.js'

export const createRequestId = () => randomUUID()

const extractHints = (questions = []) =>
  questions.flatMap((question) => {
    if (!question) return []
    if (Array.isArray(question.hints)) return question.hints
    if (Array.isArray(question.clues)) return question.clues
    return []
  })

const extractTestCases = (questions = []) =>
  questions.flatMap((question) => {
    if (!question) return []
    if (Array.isArray(question.test_cases)) return question.test_cases
    if (Array.isArray(question.testCases)) return question.testCases
    return []
  })

export const saveTempQuestions = async ({
  requestId,
  requesterService,
  action,
  questions = [],
  metadata = {}
}) => {
  const record = {
    id: randomUUID(),
    request_id: requestId,
    question: {
      requester_service: requesterService,
      action,
      questions,
      metadata
    },
    hints: extractHints(questions),
    test_cases: extractTestCases(questions),
    status: 'pending',
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('temp_questions')
    .upsert(record, { onConflict: 'request_id' })

  if (error) {
    throw error
  }
}

export const confirmTempQuestions = async ({ requestId }) => {
  const timestamp = new Date().toISOString()
  const { data, error } = await supabase
    .from('temp_questions')
    .update({ status: 'confirmed', updated_at: timestamp })
    .eq('request_id', requestId)
    .select('id')

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return false
  }

  const { error: deleteError } = await supabase
    .from('temp_questions')
    .delete()
    .eq('request_id', requestId)

  if (deleteError) {
    throw deleteError
  }

  return true
}

export const getTempQuestionById = async (requestId) => {
  const { data, error } = await supabase
    .from('temp_questions')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

