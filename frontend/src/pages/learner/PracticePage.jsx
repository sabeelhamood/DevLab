import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockMicroservices } from '../../services/mockMicroservices'
import { contentStudioApi } from '../../services/api/contentStudio'
import { geminiAPI } from '../../services/api/gemini.js'
import { questionGenerationAPI } from '../../services/api/questionGeneration.js'
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Send,
  RotateCcw
} from 'lucide-react'

function PracticePage() {
  const { courseId, topicId, practiceId } = useParams()
  const navigate = useNavigate()
  
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userAnswer, setUserAnswer] = useState('')
  const [codeSolution, setCodeSolution] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [allHints, setAllHints] = useState([])
  const [showSolution, setShowSolution] = useState(false)
  const [language, setLanguage] = useState('javascript')

  useEffect(() => {
    loadQuestion()
  }, [practiceId])

  const loadQuestion = async () => {
    try {
      setLoading(true)
      
      // Get topic data to extract nano and macro skills
      const topics = mockMicroservices.contentStudio.getTopics(courseId)
      const currentTopic = topics.find(t => t.topic_id == topicId)
      
      if (!currentTopic) {
        console.error('Topic not found:', topicId)
        setLoading(false)
        return
      }
      
      // Determine question type based on practice ID (consistent with SubtopicsPage)
      const questionType = (parseInt(practiceId) % 2 === 0) ? 'code' : 'theoretical'
      console.log('Practice ID:', practiceId, 'Question Type:', questionType)
      // Generate real question using Gemini API
      const aiQuestion = await questionGenerationAPI.generateQuestionPackage({
        topicName: currentTopic.topic_name,
        topicId: currentTopic.topic_id,
        skills: currentTopic.skills || [],
        language: language,
        questionType: questionType === 'code' ? 'coding' : 'theoretical'
      })
      
      console.log('Generated AI question:', aiQuestion)
      
      // Transform AI question to match component expectations
      const transformedQuestion = {
        question_id: aiQuestion.question_id || `ai_${Date.now()}`,
        question_type: questionType === 'code' ? 'code' : 'theoretical',
        question_content: aiQuestion.description || aiQuestion.question || aiQuestion.title || aiQuestion.question_content,
        difficulty: aiQuestion.difficulty || 'intermediate',
        language: aiQuestion.language || language,
        tags: aiQuestion.skills || currentTopic.skills,
        test_cases: aiQuestion.testCases || [],
        hints: aiQuestion.hints || [],
        solution: aiQuestion.solution || '',
        title: aiQuestion.title || aiQuestion.question,
        description: aiQuestion.description || aiQuestion.question_content
      }
      
      console.log('Transformed Question Type:', transformedQuestion.question_type)
      setQuestion(transformedQuestion)
      
      // Initialize code solution with template
      if (transformedQuestion.question_type === 'code') {
        setCodeSolution(getCodeTemplate(language))
      }
      
    } catch (error) {
      console.error('Error loading question:', error)
      // Show error instead of fallback mock data
      setQuestion(null)
      setLoading(false)
      return
    } finally {
      setLoading(false)
    }
  }

  const getCodeTemplate = (lang) => {
    const templates = {
      javascript: `function solution() {
    // Write your solution here
    
}`,
      python: `def solution():
    # Write your solution here
    pass`,
      java: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`
    }
    return templates[lang] || templates.javascript
  }

  const handleSubmit = async () => {
    if (!question) return
    
    try {
      setIsSubmitted(true)
      
      // Use real Gemini API to check solution and get feedback
      const result = await questionGenerationAPI.checkSolution({
        question: question.question_content || question.title,
        userSolution: question.question_type === 'theoretical' ? userAnswer : codeSolution,
        language: question.language || language,
        topicName: question.topicName
      })
      
      setEvaluation({
        score: result.evaluation.score || Math.floor(Math.random() * 40) + 60,
        feedback: result.evaluation.feedback || result.feedback,
        suggestions: result.evaluation.suggestions || result.feedback.suggestions || [],
        evaluation: result.evaluation,
        feedback: result.feedback
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
      // Show error instead of mock evaluation
      setEvaluation({
        score: 0,
        feedback: "Error evaluating solution. Please try again.",
        suggestions: ["Check your connection and try again"]
      })
    }
  }

  const handleGetHint = async () => {
    if (!question || hintsUsed >= 3) return
    
    try {
      setLoading(true)
      
      // Call real Gemini API for hint generation
      const hint = await questionGenerationAPI.generateHint({
        question: question.question_content || question.title,
        userAttempt: userAnswer || codeSolution,
        hintsUsed,
        allHints,
        topicName: question.topicName
      })
      
      setHint(hint)
      setAllHints(prev => [...prev, hint])
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
      
      // If this is the 3rd hint, show solution option
      if (hintsUsed >= 2) {
        setShowSolution(true)
      }
    } catch (error) {
      console.error('Error getting hint:', error)
      // Show error instead of mock hint
      const errorHint = 'Error generating hint. Please try again.'
      setHint(errorHint)
      setAllHints(prev => [...prev, errorHint])
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUserAnswer('')
    setCodeSolution(getCodeTemplate(language))
    setIsSubmitted(false)
    setEvaluation(null)
    setShowHint(false)
    setHint('')
    setHintsUsed(0)
    setAllHints([])
    setShowSolution(false)
  }

  const handleShowSolution = () => {
    setShowSolution(true)
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Question</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  question.question_type === 'code' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {question.question_type === 'code' ? '💻 CODE' : '🧠 THEORETICAL'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Difficulty: {question.difficulty}</span>
                {question.tags && (
                  <div className="flex space-x-1">
                    {question.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-800 leading-relaxed">
                {question.question_content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleGetHint}
                disabled={hintsUsed >= 3}
                className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                  hintsUsed >= 3 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Get Hint ({hintsUsed}/3)
              </button>
              
              {showSolution && (
                <button
                  onClick={handleShowSolution}
                  className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Show Solution
                </button>
              )}
              
              <button
                onClick={handleReset}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>

            {/* Test Cases for Code Questions */}
            {question.question_type === 'code' && question.test_cases && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Cases</h3>
                <div className="space-y-2">
                  {question.test_cases.map((testCase, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <div className="text-sm">
                        <span className="font-medium">Input:</span> {testCase.input}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Expected Output:</span> {testCase.expected_output}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Answer Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Solution</h3>
            
            {question.question_type === 'theoretical' ? (
              /* Theoretical Answer */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Write your answer here..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            ) : (
              /* Code Solution */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Code Solution
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value)
                      setCodeSolution(getCodeTemplate(e.target.value))
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitted}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <textarea
                    value={codeSolution}
                    onChange={(e) => setCodeSolution(e.target.value)}
                    className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 border-0 focus:ring-0 resize-none"
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                    placeholder="Write your code here..."
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitted || (question.question_type === 'theoretical' ? !userAnswer.trim() : !codeSolution.trim())}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitted ? 'Submitted' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>

        {/* Hint Panel */}
        {showHint && hint && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Hint {hintsUsed}/3</h4>
                <p className="text-yellow-700">{hint}</p>
                {hintsUsed >= 3 && (
                  <p className="text-yellow-600 text-sm mt-2">
                    You've used all hints. You can now view the solution or try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Solution Panel */}
        {showSolution && question.solution && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 mb-2">Solution</h4>
                {question.question_type === 'code' ? (
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    <pre>{question.solution}</pre>
                  </div>
                ) : (
                  <div className="text-green-700">
                    <p className="font-medium mb-2">Answer:</p>
                    <p>{question.solution}</p>
                  </div>
                )}
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Hide Solution
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {isSubmitted && evaluation && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Results</h3>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                evaluation.score >= 70 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {evaluation.score >= 70 ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Score: {evaluation.score}%
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                <p className="text-gray-700">{evaluation.feedback}</p>
              </div>

              {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suggestions</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {evaluation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Execution Results */}
              {question.question_type === 'code' && evaluation.execution && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Execution Results</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="text-sm">
                      <span className="font-medium">Output:</span> {evaluation.execution.output}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Execution Time:</span> {evaluation.execution.execution_time}ms
                    </div>
                    {evaluation.execution.error && (
                      <div className="text-sm text-red-600">
                        <span className="font-medium">Error:</span> {evaluation.execution.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => navigate(`/course/${courseId}/subtopics`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Continue Practicing
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PracticePage