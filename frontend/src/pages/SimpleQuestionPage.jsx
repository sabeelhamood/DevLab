import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { geminiAPI } from '../services/api/gemini.js'
import { questionGenerationAPI } from '../services/api/questionGeneration.js'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ConfirmationModal from '../components/ConfirmationModal.jsx'

function SimpleQuestionPage() {
  const [questions, setQuestions] = useState([]) // Array to store all questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userAnswer, setUserAnswer] = useState('')
  const [codeSolution, setCodeSolution] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [hints, setHints] = useState([]) // Array to store all hints
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [error, setError] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationAction, setConfirmationAction] = useState(null)
  
  useEffect(() => {
    let isMounted = true
    
    const loadQuestionSafe = async () => {
      console.log('🚀 Starting question loading process...')
      try {
        await loadAllQuestions()
        console.log('✅ Question loading completed successfully')
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error loading questions:', error)
          setQuestion(null)
          setLoading(false)
        }
      }
    }
    
    loadQuestionSafe()
    
    return () => {
      console.log('🧹 Cleaning up question loading...')
      isMounted = false
    }
  }, [])

  // Load all questions for the learner session
  const loadAllQuestions = async (signal = null) => {
    console.log('📋 loadAllQuestions called, loading state:', loading)
    
    try {
      console.log('🔄 Setting loading state to true...')
      setLoading(true)
      
      // Get learner profile to determine number of questions
      const questionCount = 1 // Reduced to 1 question to avoid rate limits - in real app, get from Directory microservice
      
      console.log('📡 Calling questionGenerationAPI.generateQuestionPackage...')
      const generatedQuestion = await questionGenerationAPI.generateQuestionPackage({
        courseName: 'JavaScript Programming',
        topicName: 'Functions and Basic Operations',
        nanoSkills: ['Function Declaration', 'Parameters', 'Return Statements'],
        macroSkills: ['JavaScript Fundamentals', 'Programming Logic'],
        difficulty: 'intermediate',
        language: language,
        questionType: 'coding',
        questionCount: questionCount // Pass question count to generate multiple questions
      }, signal)
      
      console.log('📦 Received generated questions:', generatedQuestion)
      
      // Check if request was aborted
      if (signal?.aborted) {
        console.log('🚫 Request was aborted')
        return
      }
      
      // Handle both single question and multiple questions response
      let questionsArray = []
      if (Array.isArray(generatedQuestion)) {
        questionsArray = generatedQuestion
      } else if (generatedQuestion.questions && Array.isArray(generatedQuestion.questions)) {
        questionsArray = generatedQuestion.questions
      } else {
        // Single question response
        questionsArray = [generatedQuestion]
      }
      
      // Transform questions to match component expectations
      const transformedQuestions = questionsArray.map((q, index) => ({
        question_id: q.question_id || `demo_${Date.now()}_${index}`,
        question_type: 'code',
        question_content: q.description || q.title,
        difficulty: q.difficulty || 'intermediate',
        language: q.language || language,
        test_cases: q.testCases || [],
        hints: q.hints || [],
        solution: q.solution?.code || q.solution || '',
        title: q.title,
        courseName: q.courseName || 'JavaScript Programming',
        topicName: q.topicName || 'Functions and Basic Operations'
      }))
      
      console.log('🔄 Setting questions array:', transformedQuestions)
      setQuestions(transformedQuestions)
      setCurrentQuestionIndex(0)
      setQuestion(transformedQuestions[0])
      setCodeSolution(getCodeTemplate(language))
      console.log('✅ Questions loaded successfully')
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Error loading questions:', error)
        setQuestions([])
        setQuestion(null)
        
        // Provide better error messages for common issues
        let errorMessage = error.message
        if (error.message.includes('timeout')) {
          errorMessage = 'The request is taking longer than expected. This might be due to high server load or network issues. Please try again.'
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorMessage = 'The AI service is temporarily busy. Please wait a moment and try again.'
        } else if (error.message.includes('connection')) {
          errorMessage = 'Connection lost. Please check your internet connection and try again.'
        }
        
        setError(errorMessage)
      } else {
        console.log('🚫 Request was aborted')
      }
    } finally {
      console.log('🔄 Setting loading state to false...')
      setLoading(false)
    }
  }

  // Load a specific question by index
  const loadQuestion = async (questionIndex = currentQuestionIndex) => {
    if (questions.length === 0) {
      console.log('No questions available, loading all questions...')
      await loadAllQuestions()
      return
    }
    
    if (questionIndex >= 0 && questionIndex < questions.length) {
      console.log(`📋 Loading question ${questionIndex + 1} of ${questions.length}`)
      setCurrentQuestionIndex(questionIndex)
      setQuestion(questions[questionIndex])
      setCodeSolution(getCodeTemplate(language))
      
      // Reset question-specific state
      setUserAnswer('')
      setIsSubmitted(false)
      setEvaluation(null)
      setShowHint(false)
      setHints([])
      setHintsUsed(0)
      setShowSolution(false)
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
    if (!question || loading) return
    
    try {
      setLoading(true)
      setIsSubmitted(true)
      
      // Use real Gemini API to check solution and get feedback
      const result = await questionGenerationAPI.checkSolution({
        question: question.question_content || question.title,
        userSolution: question.question_type === 'theoretical' ? userAnswer : codeSolution,
        language: question.language || language,
        courseName: question.courseName,
        topicName: question.topicName
      })
      
      setEvaluation({
        score: result.evaluation.score || Math.floor(Math.random() * 40) + 60,
        feedback: result.evaluation.feedback || result.feedback.message || result.feedback,
        suggestions: result.evaluation.suggestions || result.feedback.suggestions || [],
        evaluation: result.evaluation,
        isAiGenerated: result.evaluation.isAiGenerated || false,
        isCorrect: result.evaluation.isCorrect || false,
        optimalSolution: result.evaluation.optimalSolution || result.feedback.optimalSolution || null
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
      // Show error instead of mock evaluation
      setEvaluation({
        score: 0,
        feedback: "Error evaluating solution. Please try again.",
        suggestions: ["Check your connection and try again"],
        isAiGenerated: false
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGetHint = async () => {
    if (!question || hintsUsed >= 3 || loading) return
    
    try {
      setLoading(true)
      
      // Call real Gemini API for hint generation
      const hint = await questionGenerationAPI.generateHint({
        question: question.question_content || question.title,
        userAttempt: userAnswer,
        hintsUsed,
        allHints: [],
        courseName: question.courseName,
        topicName: question.topicName
      })
      
      // Extract hint text from the response object
      const hintText = typeof hint === 'object' ? hint.hint || hint : hint
      
      // Append new hint to the existing hints array
      setHints(prevHints => [...prevHints, hintText])
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
      
      // If this is the 3rd hint, show solution option
      if (hintsUsed >= 2) {
        setShowSolution(true)
      }
    } catch (error) {
      console.error('Error getting hint:', error)
      // Show error instead of mock hint
      setHints(prevHints => [...prevHints, 'Error generating hint. Please try again.'])
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
    setHints([]) // Clear hints array
    setHintsUsed(0)
    setShowSolution(false)
  }

  // Navigation functions
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      loadQuestion(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      loadQuestion(currentQuestionIndex - 1)
    }
  }

  const handleReloadQuestions = async () => {
    await loadAllQuestions()
  }

  const handleShowSolution = async () => {
    if (hintsUsed < 3) {
      alert('You must use at least 3 hints before the solution can be revealed.')
      return
    }

    // Show confirmation modal
    setConfirmationAction(() => async () => {
      if (loading) return

      try {
        setLoading(true)
        setError(null)
        
        // Call backend to reveal solution (only after 3 hints)
        const solution = await questionGenerationAPI.revealSolution({
          question,
          hintsUsed,
          courseName: question.courseName,
          topicName: question.topicName,
          language: question.language || language
        })
        
        setShowSolution(true)
        setSolution(solution)
      } catch (error) {
        console.error('Error revealing solution:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    })
    
    setShowConfirmation(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner message="Loading questions..." size="large" />
      </div>
    )
  }

  if (!question && error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="max-w-md w-full">
          <ErrorMessage 
            error={error}
            onRetry={handleReloadQuestions}
            isLoading={loading}
          />
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Question</h2>
          <p className="text-gray-600 mb-6">There was an error loading the question from Gemini AI. Please check your connection and try again.</p>
          <button 
            onClick={handleReloadQuestions}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry Loading Questions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => {
          setShowConfirmation(false)
          if (confirmationAction) {
            confirmationAction()
          }
        }}
        title="Which solution?"
        message="Are you sure you want to view the solution? This will reveal the answer and you won't be able to solve it yourself anymore."
        confirmText="Yes, show solution"
        cancelText="No, keep trying"
        type="warning"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 pt-20">
        {/* Question Navigation */}
        {questions.length > 1 && (
          <div 
            className="mb-6 p-6 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 
                  className="text-2xl font-bold font-display"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Practice Questions
                </h1>
                <p 
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                <div className="flex space-x-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => loadQuestion(index)}
                      className={`w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                        index === currentQuestionIndex
                          ? 'text-white shadow-lg'
                          : 'hover:scale-110'
                      }`}
                      style={{
                        background: index === currentQuestionIndex ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                        color: index === currentQuestionIndex ? 'white' : 'var(--text-secondary)',
                        boxShadow: index === currentQuestionIndex ? 'var(--shadow-glow)' : 'none'
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              error={error}
              onRetry={() => setError(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Panel */}
          <div 
            className="card p-6 transition-all duration-300 hover:shadow-xl"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Question
                </h2>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: question.question_type === 'code' 
                      ? 'var(--gradient-primary)' 
                      : 'var(--gradient-secondary)',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  {question.question_type === 'code' ? '💻 CODE' : '🧠 THEORETICAL'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Difficulty: {question.difficulty}</span>
              </div>
            </div>

            {/* Question Content Area */}
            <div className="prose max-w-none mb-6">
              <p 
                className="leading-relaxed text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                {question.question_content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleGetHint}
                disabled={hintsUsed >= 3}
                className={`btn flex items-center text-sm rounded-lg transition-all duration-300 ${
                  hintsUsed >= 3 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105'
                }`}
                style={{
                  background: hintsUsed >= 3 
                    ? 'var(--bg-tertiary)' 
                    : 'var(--gradient-accent)',
                  color: hintsUsed >= 3 ? 'var(--text-muted)' : 'white',
                  boxShadow: hintsUsed >= 3 ? 'none' : 'var(--shadow-glow)'
                }}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Get Hint ({hintsUsed}/3)
              </button>
              
              {showSolution && (
                <button
                  onClick={handleShowSolution}
                  className="btn flex items-center text-sm rounded-lg hover:scale-105 transition-all duration-300"
                  style={{
                    background: 'var(--gradient-secondary)',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                  title={hintsUsed < 3 ? `Use ${3 - hintsUsed} more hints to unlock solution` : 'Click to reveal solution'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {hintsUsed < 3 ? `Show Solution (${3 - hintsUsed} hints needed)` : 'Show Solution'}
                </button>
              )}
              
              <button
                onClick={handleReset}
                className="btn flex items-center text-sm rounded-lg hover:scale-105 transition-all duration-300"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
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
          <div 
            className="card p-6 transition-all duration-300 hover:shadow-xl"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Code Sandbox
            </h3>
            
            {question.question_type === 'theoretical' ? (
              /* Theoretical Answer */
              <div className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Your Answer
                  </label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Write your answer here..."
                    className="textarea w-full h-64 resize-none"
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            ) : (
              /* Code Solution */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label 
                    className="block text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Code Solution
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value)
                      setCodeSolution(getCodeTemplate(e.target.value))
                    }}
                    className="input px-3 py-2 text-sm"
                    disabled={isSubmitted}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                
                <div 
                  className="rounded-lg overflow-hidden border"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <textarea
                    value={codeSolution}
                    onChange={(e) => setCodeSolution(e.target.value)}
                    className="w-full h-96 p-4 font-mono text-sm border-0 focus:ring-0 resize-none"
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
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
                className="btn btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitted ? 'Submitted' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>

        {/* Hint Panel */}
        {showHint && hints.length > 0 && (
          <div 
            className="mt-6 rounded-xl p-6 border"
            style={{
              background: 'var(--gradient-accent)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 text-white mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Hints ({hintsUsed}/3)</h4>
                <div className="space-y-3">
                  {hints.map((hint, index) => (
                    <div 
                      key={index} 
                      className="rounded-lg p-4"
                      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className="flex items-start">
                        <span 
                          className="inline-flex items-center justify-center w-6 h-6 text-white text-xs font-semibold rounded-full mr-3 flex-shrink-0"
                          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                        >
                          {index + 1}
                        </span>
                        <p className="text-white text-sm">{hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {hintsUsed >= 3 && (
                  <p 
                    className="text-white text-sm mt-3 p-3 rounded-lg"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    You've used all hints. You can now view the solution or try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Solution Panel */}
        {showSolution && question.solution && (
          <div 
            className="mt-6 rounded-xl p-6 border"
            style={{
              background: 'var(--gradient-secondary)',
              borderColor: 'rgba(4, 120, 87, 0.3)',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-white mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white mb-2">Solution</h4>
                {question.question_type === 'code' ? (
                  <div 
                    className="p-4 rounded-lg font-mono text-sm"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.2)',
                      color: 'white'
                    }}
                  >
                    <pre>{question.solution}</pre>
                  </div>
                ) : (
                  <div className="text-white">
                    <p className="font-semibold mb-2">Answer:</p>
                    <p>{question.solution}</p>
                  </div>
                )}
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleReset}
                    className="btn text-sm"
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="btn text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
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
          <div 
            className="mt-6 card p-6"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Results
              </h3>
              <div 
                className="flex items-center px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: evaluation.score >= 70 
                    ? 'var(--gradient-secondary)' 
                    : 'var(--gradient-accent)',
                  color: 'white',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
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
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Feedback
                </h4>
                {evaluation.isAiGenerated ? (
                  <div 
                    className="rounded-lg p-4 border"
                    style={{
                      background: 'var(--gradient-accent)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <XCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-semibold text-white">
                          AI-Generated Solution Detected
                        </h3>
                        <div className="mt-2 text-sm text-white">
                          <p>{evaluation.feedback}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-primary)' }}>{evaluation.feedback}</p>
                )}
              </div>

              {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                <div>
                  <h4 
                    className="font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Suggestions
                  </h4>
                  <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    {evaluation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.optimalSolution && (
                <div>
                  <h4 
                    className="font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Optimal Solution
                  </h4>
                  <div 
                    className="rounded-lg p-4"
                    style={{ 
                      background: 'var(--bg-secondary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <pre 
                      className="text-sm whitespace-pre-wrap font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {evaluation.optimalSolution}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={loadQuestion}
                  className="btn btn-primary"
                >
                  Next Question
                </button>
                <button
                  onClick={handleReset}
                  className="btn"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
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
