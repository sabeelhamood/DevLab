import { useState } from 'react'
import { Code2, FileCode, TestTube, AlertCircle, Send, Loader2, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { apiClient } from '../services/api/client.js'

export default function AssessmentCodeQuestions({ questions = [] }) {
  const [solutions, setSolutions] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gradingResults, setGradingResults] = useState(null)
  const [isGrading, setIsGrading] = useState(false)
  const [gradingError, setGradingError] = useState(null)

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <p>No coding questions available.</p>
        </div>
      </div>
    )
  }

  const handleSolutionChange = (questionId, value) => {
    setSolutions((prev) => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmitAll = async () => {
    // Validate all solutions are provided
    const emptySolutions = questions.filter(
      (q) => !solutions[q.id] || !solutions[q.id].trim()
    )
    
    if (emptySolutions.length > 0) {
      alert('Please provide solutions for all questions before submitting.')
      return
    }

    setIsGrading(true)
    setGradingError(null)
    setGradingResults(null)

    try {
      const solutionsArray = questions.map((q) => ({
        id: q.id,
        language: q.programming_language || q.language || 'javascript',
        solution: solutions[q.id] || ''
      }))

      const questionsArray = questions.map((q) => ({
        id: q.id,
        title: q.title || `Question ${questions.indexOf(q) + 1}`,
        description: q.description || '',
        programming_language: q.programming_language || q.language || 'javascript',
        language: q.programming_language || q.language || 'javascript',
        skills: Array.isArray(q.skills) ? q.skills : [],
        testCases: Array.isArray(q.testCases) ? q.testCases : []
      }))

      const response = await apiClient.post('/external/assessment/grade', {
        questions: questionsArray,
        solutions: solutionsArray
      })

      if (response.data?.success && response.data?.data) {
        setGradingResults(response.data.data)
        // Scroll to results
        setTimeout(() => {
          document.getElementById('grading-results')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }, 100)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Assessment grading error:', error)
      setGradingError(
        error.response?.data?.error || 
        error.message || 
        'Failed to grade assessment'
      )
    } finally {
      setIsGrading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMasteryColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'expert':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Coding Assessment Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {questions.length} question{questions.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {/* Question Navigation */}
      {questions.length > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Current Question Display */}
      <div
        key={currentQuestion.id || currentQuestionIndex}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow"
      >
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentQuestion.title || `Question ${currentQuestionIndex + 1}`}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentQuestion.programming_language || 'N/A'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    medium
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Description */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentQuestion.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Skills */}
          {currentQuestion.skills && currentQuestion.skills.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Skills:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases */}
          {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Cases ({currentQuestion.testCases.length})
                </span>
              </div>
              <div className="space-y-2">
                {currentQuestion.testCases.map((testCase, testIndex) => (
                  <div
                    key={testIndex}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Input:
                        </span>
                        <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {testCase.input || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Expected Output:
                        </span>
                        <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {testCase.expected_output || testCase.output || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Solution:
            </label>
            <textarea
              value={solutions[currentQuestion.id] || ''}
              onChange={(e) => handleSolutionChange(currentQuestion.id, e.target.value)}
              placeholder={`// Write your solution in ${currentQuestion.programming_language || 'javascript'}...`}
              className="w-full min-h-[300px] font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              spellCheck={false}
            />
          </div>
        </div>

      {/* Submit Button */}
      {currentQuestionIndex === questions.length - 1 && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmitAll}
            disabled={isGrading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGrading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                SUBMIT ALL SOLUTIONS
              </>
            )}
          </button>
        </div>
      )}

      {/* Grading Error */}
      {gradingError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error: {gradingError}</span>
          </div>
        </div>
      )}

      {/* Grading Results */}
      {gradingResults && (
        <div id="grading-results" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-6 mt-6">
          {/* Overall Score */}
          <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Assessment Results
            </h3>
            <div className="flex justify-center">
              <div
                className={`w-32 h-32 rounded-full ${getScoreBgColor(
                  gradingResults.overallScore
                )} flex items-center justify-center shadow-lg`}
              >
                <span className="text-4xl font-bold text-white">
                  {Math.round(gradingResults.overallScore)}
                </span>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">Overall Score</p>
          </div>

          {/* Summary */}
          {gradingResults.summary && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Summary
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {gradingResults.summary}
              </p>
            </div>
          )}

          {/* Per-Question Results */}
          {gradingResults.questions && gradingResults.questions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Question Results
              </h4>
              <div className="space-y-4">
                {gradingResults.questions.map((q, idx) => (
                  <div
                    key={q.questionId}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                        Question {idx + 1}: {q.questionId}
                      </h5>
                      <span className={`text-2xl font-bold ${getScoreColor(q.score)}`}>
                        {Math.round(q.score)}/100
                      </span>
                    </div>

                    {/* Criteria Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Correctness:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {Math.round(q.correctness?.score || 0)}/40
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Skill Application:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {Math.round(q.skillApplication?.score || 0)}/30
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Requirements:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {Math.round(q.requirementCompliance?.score || 0)}/30
                        </span>
                      </div>
                    </div>

                    {q.detailedFeedback && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                          Feedback:
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {q.detailedFeedback}
                        </p>
                      </div>
                    )}

                    {q.strengths && q.strengths.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400 block mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Strengths:
                        </span>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {q.strengths.map((strength, sIdx) => (
                            <li key={sIdx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {q.improvements && q.improvements.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400 block mb-1">
                          Areas for Improvement:
                        </span>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {q.improvements.map((improvement, iIdx) => (
                            <li key={iIdx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Feedback */}
          {gradingResults.skillFeedback && gradingResults.skillFeedback.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Skill Performance
              </h4>
              <div className="space-y-3">
                {gradingResults.skillFeedback.map((skill, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                        {skill.skill}
                      </h5>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getMasteryColor(
                          skill.masteryLevel
                        )}`}
                      >
                        {skill.masteryLevel || 'N/A'}
                      </span>
                    </div>
                    {skill.performance && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {skill.performance}
                      </p>
                    )}
                    {skill.recommendations && skill.recommendations.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                          Recommendations:
                        </span>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {skill.recommendations.map((rec, rIdx) => (
                            <li key={rIdx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}




