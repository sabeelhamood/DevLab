import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Send,
  RotateCcw
} from 'lucide-react'

function SimpleQuestionPage() {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userAnswer, setUserAnswer] = useState('')
  const [codeSolution, setCodeSolution] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [language, setLanguage] = useState('javascript')
  
  useEffect(() => {
    loadQuestion()
  }, [])

  const loadQuestion = async () => {
    try {
      setLoading(true)
      
      // Mock question data
      const mockQuestion = {
        question_id: 'demo_1',
        question_type: 'code',
        question_content: 'Write a function that returns the sum of two numbers. The function should take two parameters and return their sum.',
        difficulty: 'intermediate',
        language: 'javascript',
        test_cases: [
          { input: '2, 3', expected_output: '5' },
          { input: '10, 20', expected_output: '30' },
          { input: '-5, 3', expected_output: '-2' }
        ],
        hints: [
          'Think about basic arithmetic operations',
          'Consider function parameters and return statements',
          'Make sure to handle the input correctly'
        ],
        solution: 'function sum(a, b) { return a + b; }'
      }
      
      setQuestion(mockQuestion)
      setCodeSolution(getCodeTemplate(language))
    } catch (error) {
      console.error('Error loading question:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCodeTemplate = (lang) => {
    const templates = {
      javascript: `function sum(a, b) {
    // Write your solution here
    
}`,
      python: `def sum(a, b):
    # Write your solution here
    pass`,
      java: `public class Solution {
    public static int sum(int a, int b) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `#include <iostream>
using namespace std;

int sum(int a, int b) {
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
      
      // Mock evaluation
      const mockEvaluation = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        feedback: "Solution evaluated successfully",
        suggestions: ["Keep practicing!", "Great work!"]
      }
      
      setEvaluation(mockEvaluation)
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const handleGetHint = async () => {
    if (!question || hintsUsed >= 3) return
    
    try {
      const mockHints = question.hints || [
        'Think about the basic concepts',
        'Consider the specific approach',
        'You\'re almost there!'
      ]
      
      setHint(mockHints[hintsUsed] || 'No more hints available')
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
      
      // If this is the 3rd hint, show solution option
      if (hintsUsed >= 2) {
        setShowSolution(true)
      }
    } catch (error) {
      console.error('Error getting hint:', error)
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Question Available</h2>
          <button 
            onClick={loadQuestion}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Load Question
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
              </div>
            </div>

            {/* Question Content Area */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-800 leading-relaxed text-lg">
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

          {/* Sandbox Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Code Sandbox</h3>
            
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

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={loadQuestion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next Question
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

export default SimpleQuestionPage
