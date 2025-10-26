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
import Judge0Container from '../components/Judge0Container.jsx'

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
  const [solution, setSolution] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [error, setError] = useState(null)
  const [useSandbox, setUseSandbox] = useState(true) // Toggle between sandbox and regular editor
  const [sandboxCode, setSandboxCode] = useState('')
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
        questionType: 'coding',
        question_content: q.description || q.title,
        difficulty: q.difficulty || 'intermediate',
        language: q.language || language,
        test_cases: (() => {
          console.log('Raw testCases from backend:', q.testCases);
          return q.testCases || [];
        })(),
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
      setSandboxCode(getCodeTemplate(language))
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
      setSandboxCode(getCodeTemplate(language))
      
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
        userSolution: (question.question_type === 'theoretical' || question.questionType === 'theoretical') ? userAnswer : codeSolution,
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
      
      // Note: Solution is never automatically shown - user must choose to see it
    } catch (error) {
      console.error('Error getting hint:', error)
      // Check if it's a rate limit error and provide helpful message
      if (error.message && error.message.includes('Rate limit exceeded')) {
        setHints(prevHints => [...prevHints, 'AI service is temporarily busy. Here\'s a general hint: Try breaking down the problem into smaller steps and consider what data structures might help.'])
      } else {
        setHints(prevHints => [...prevHints, 'Error generating hint. Please try again.'])
      }
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUserAnswer('')
    setCodeSolution(getCodeTemplate(language))
    setSandboxCode(getCodeTemplate(language))
    setIsSubmitted(false)
    setEvaluation(null)
    setShowHint(false)
    setHints([]) // Clear hints array
    setHintsUsed(0)
    setShowSolution(false)
    setSolution(null) // Clear solution
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

        {/* Rate Limit Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                AI Service Notice
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                The AI service is currently experiencing high demand. Some features like hints and detailed feedback may use fallback responses. 
                You can still use the Judge0 code execution and test cases normally.
              </p>
            </div>
          </div>
        </div>

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
                    background: (question.question_type === 'code' || question.questionType === 'coding')
                      ? 'var(--gradient-primary)' 
                      : 'var(--gradient-secondary)',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  {(question.question_type === 'code' || question.questionType === 'coding') ? '💻 CODE' : '🧠 THEORETICAL'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Difficulty: {question.difficulty}</span>
              </div>
            </div>

            {/* Question Content Area */}
            <div className="mb-6">
              <div 
                className="rounded-xl p-6 border-2"
                style={{ 
                  background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
                  borderColor: 'rgba(6, 95, 70, 0.2)',
                  boxShadow: '0 4px 20px rgba(6, 95, 70, 0.1)'
                }}
              >
                <div className="flex items-start space-x-3 mb-4">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    Q
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Problem Statement
                    </h3>
                    <div 
                      className="prose prose-lg max-w-none"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="leading-relaxed text-base font-medium whitespace-pre-wrap">
                        {typeof question.question_content === 'string' 
                          ? question.question_content 
                          : JSON.stringify(question.question_content, null, 2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              
              {hintsUsed >= 3 && !showSolution && (
                <button
                  onClick={handleShowSolution}
                  className="btn flex items-center text-sm rounded-lg hover:scale-105 transition-all duration-300"
                  style={{
                    background: 'var(--gradient-secondary)',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                  title="You've used all hints. Click to reveal the solution if you want to see it."
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Show Solution (Optional)
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
            {(() => {
              console.log('Question object:', question);
              console.log('Question type check:', question.question_type === 'code' || question.questionType === 'coding');
              console.log('Test cases check:', question.test_cases && question.test_cases.length > 0);
              console.log('TestCases check:', question.testCases && question.testCases.length > 0);
              return (question.question_type === 'code' || question.questionType === 'coding') && (question.test_cases || question.testCases) && (question.test_cases || question.testCases).length > 0;
            })() && (
              <div className="mt-6">
                <div 
                  className="rounded-xl p-6 border-2 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(145deg, #f0fdfa, #ecfdf5)',
                    borderColor: 'rgba(6, 95, 70, 0.2)',
                    boxShadow: '0 8px 32px rgba(6, 95, 70, 0.15)'
                  }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #065f46, #047857)',
                        boxShadow: '0 4px 12px rgba(6, 95, 70, 0.4)'
                      }}
                    >
                      🧪
                    </div>
                    <div>
                      <h3 
                        className="text-xl font-bold"
                        style={{ color: '#065f46' }}
                      >
                        Test Cases
                      </h3>
                      <p className="text-sm font-medium" style={{ color: '#047857' }}>
                        {(question.test_cases || question.testCases).length} test case{(question.test_cases || question.testCases).length !== 1 ? 's' : ''} • Run these to verify your solution
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-6">
                    {(question.test_cases || question.testCases).map((testCase, index) => (
                      <div 
                        key={index} 
                        className="rounded-xl p-5 border-2 shadow-md transition-all duration-200 hover:shadow-lg"
                        style={{ 
                          background: 'linear-gradient(145deg, #ffffff, #f0fdfa)',
                          borderColor: 'rgba(6, 95, 70, 0.2)',
                          boxShadow: '0 4px 16px rgba(6, 95, 70, 0.1)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ 
                                background: 'linear-gradient(135deg, #065f46, #047857)'
                              }}
                            >
                              {index + 1}
                            </div>
                            <span className="font-semibold text-lg" style={{ color: '#1e293b' }}>Test Case {index + 1}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ background: '#065f46' }}
                              ></div>
                              <span 
                                className="text-sm font-semibold"
                                style={{ color: '#1e293b' }}
                              >
                                Input
                              </span>
                            </div>
                            <div 
                              className="font-mono text-sm p-4 rounded-lg border-2"
                              style={{ 
                                background: '#f8fafc',
                                borderColor: 'rgba(6, 95, 70, 0.2)',
                                color: '#1e293b'
                              }}
                            >
                              {typeof testCase.input === 'object' 
                                ? JSON.stringify(testCase.input, null, 2)
                                : testCase.input}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ background: '#047857' }}
                              ></div>
                              <span 
                                className="text-sm font-semibold"
                                style={{ color: '#1e293b' }}
                              >
                                Expected Output: {(() => {
                                  if (testCase.expected_output !== undefined) {
                                    return typeof testCase.expected_output === 'object' 
                                      ? JSON.stringify(testCase.expected_output, null, 2)
                                      : String(testCase.expected_output);
                                  } else if (testCase.expectedOutput !== undefined) {
                                    return typeof testCase.expectedOutput === 'object' 
                                      ? JSON.stringify(testCase.expectedOutput, null, 2)
                                      : String(testCase.expectedOutput);
                                  } else if (testCase.expected !== undefined) {
                                    return typeof testCase.expected === 'object' 
                                      ? JSON.stringify(testCase.expected, null, 2)
                                      : String(testCase.expected);
                                  } else if (testCase.result !== undefined) {
                                    return typeof testCase.result === 'object' 
                                      ? JSON.stringify(testCase.result, null, 2)
                                      : String(testCase.result);
                                  } else {
                                    return 'No expected output found';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="flex items-center space-x-3">
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value)
                        setCodeSolution(getCodeTemplate(e.target.value))
                        setSandboxCode(getCodeTemplate(e.target.value))
                      }}
                      className="input px-3 py-2 text-sm"
                      disabled={isSubmitted}
                    >
                      <option value="javascript">JavaScript (Live Testing)</option>
                      <option value="react">React</option>
                      <option value="vue">Vue</option>
                      <option value="svelte">Svelte</option>
                      <option value="python">Python (Edit Only)</option>
                      <option value="java">Java (Edit Only)</option>
                      <option value="cpp">C++ (Edit Only)</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={useSandbox}
                          onChange={(e) => setUseSandbox(e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          disabled={isSubmitted}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>
                          Live Sandbox
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {useSandbox ? (
                  <Judge0Container
                    question={question}
                    userCode={sandboxCode}
                    onCodeChange={(code) => {
                      setSandboxCode(code)
                      setCodeSolution(code)
                    }}
                    testCases={question?.test_cases || []}
                    language={language}
                    onReset={() => {
                      const template = getCodeTemplate(language)
                      setSandboxCode(template)
                      setCodeSolution(template)
                    }}
                  />
                ) : (
                  <div 
                    className="rounded-xl overflow-hidden border-2 shadow-lg"
                    style={{ 
                      borderColor: 'rgba(6, 95, 70, 0.2)',
                      boxShadow: '0 8px 32px rgba(6, 95, 70, 0.1)'
                    }}
                  >
                    <div 
                      className="px-4 py-3 border-b flex items-center justify-between"
                      style={{ 
                        background: 'var(--gradient-primary)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <span className="text-white text-sm font-medium ml-3">
                          {language.toUpperCase()} Editor
                        </span>
                      </div>
                      <div className="text-white text-xs">
                        {codeSolution.split('\n').length} lines
                      </div>
                    </div>
                    <textarea
                      value={codeSolution}
                      onChange={(e) => setCodeSolution(e.target.value)}
                      className="w-full h-96 p-6 font-mono text-sm border-0 focus:ring-0 resize-none focus:outline-none"
                      style={{
                        fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
                        color: 'var(--text-primary)',
                        letterSpacing: '0.025em'
                      }}
                      placeholder="// Write your code here...&#10;// Use proper indentation and formatting&#10;// Test your solution with the provided test cases"
                      disabled={isSubmitted}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitted || ((question.question_type === 'theoretical' || question.questionType === 'theoretical') ? !userAnswer.trim() : !codeSolution.trim())}
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
            className="mt-6 rounded-xl p-6 border-2 shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #fef3c7, #fde68a)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)'
            }}
          >
            <div className="flex items-start space-x-4">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: 'var(--gradient-accent)' }}
              >
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h4 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    💡 Hints & Guidance
                  </h4>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      background: 'var(--gradient-primary)',
                      color: 'white'
                    }}
                  >
                    {hintsUsed}/3 Used
                  </span>
                </div>
                <div className="space-y-4">
                  {hints.map((hint, index) => (
                    <div 
                      key={index} 
                      className="rounded-lg p-4 border-2"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: 'var(--gradient-accent)' }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {typeof hint === 'string' ? hint : (typeof hint === 'object' ? hint.hint || hint.text || JSON.stringify(hint, null, 2) : String(hint))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hintsUsed >= 3 && (
                  <div 
                    className="mt-4 p-4 rounded-lg border-2"
                    style={{ 
                      background: 'rgba(6, 95, 70, 0.1)',
                      borderColor: 'rgba(6, 95, 70, 0.3)'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" style={{ color: 'var(--primary-green)' }} />
                      <p 
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        You've used all available hints. Try to solve it with your new knowledge, or optionally view the solution if you need help.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Solution Panel */}
        {showSolution && solution && (
          <div 
            className="mt-6 rounded-xl p-6 border-2 shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #d1fae5, #a7f3d0)',
              borderColor: 'rgba(4, 120, 87, 0.4)',
              boxShadow: '0 8px 32px rgba(4, 120, 87, 0.2)'
            }}
          >
            <div className="flex items-start space-x-4">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: 'var(--gradient-secondary)' }}
              >
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h4 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ✅ Complete Solution
                  </h4>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      background: 'var(--gradient-secondary)',
                      color: 'white'
                    }}
                  >
                    Reference
                  </span>
                </div>
                {(question.question_type === 'code' || question.questionType === 'coding') ? (
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        💻 Code Solution
                      </span>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {language.toUpperCase()}
                      </span>
                    </div>
                    <div 
                      className="font-mono text-sm p-4 rounded border"
                      style={{ 
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'rgba(4, 120, 87, 0.2)'
                      }}
                    >
                      <pre className="whitespace-pre-wrap">
                        {(() => {
                          if (typeof solution === 'string') {
                            return solution;
                          } else if (typeof solution === 'object' && solution !== null) {
                            if (solution.code) return solution.code;
                            if (solution.text) return solution.text;
                            if (solution.explanation) return solution.explanation;
                            return JSON.stringify(solution, null, 2);
                          } else {
                            return String(solution || 'No solution available');
                          }
                        })()}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        📝 Answer
                      </span>
                    </div>
                    <div className="space-y-4">
                      {typeof solution === 'object' && solution.code && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            💻 Code Solution:
                          </h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            <code>{typeof solution.code === 'string' ? solution.code : (typeof solution.code === 'object' ? JSON.stringify(solution.code, null, 2) : String(solution.code || ''))}</code>
                          </pre>
                        </div>
                      )}
                      {typeof solution === 'object' && solution.explanation && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            📝 Explanation:
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                            {typeof solution.explanation === 'string' ? solution.explanation : (typeof solution.explanation === 'object' ? solution.explanation.text || solution.explanation.message || JSON.stringify(solution.explanation, null, 2) : String(solution.explanation))}
                          </p>
                        </div>
                      )}
                      {typeof solution === 'string' && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          {solution}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleReset}
                    className="btn text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="btn text-sm px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: 'var(--text-primary)',
                      border: '2px solid rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    👁️ Hide Solution
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {isSubmitted && evaluation && (
          <div 
            className="mt-6 rounded-xl p-6 border-2 shadow-lg"
            style={{ 
              background: evaluation.score >= 70 
                ? 'linear-gradient(145deg, #d1fae5, #a7f3d0)'
                : 'linear-gradient(145deg, #fef3c7, #fde68a)',
              borderColor: evaluation.score >= 70 
                ? 'rgba(4, 120, 87, 0.4)'
                : 'rgba(245, 158, 11, 0.4)',
              boxShadow: evaluation.score >= 70 
                ? '0 8px 32px rgba(4, 120, 87, 0.2)'
                : '0 8px 32px rgba(245, 158, 11, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ 
                    background: evaluation.score >= 70 
                      ? 'var(--gradient-secondary)' 
                      : 'var(--gradient-accent)'
                  }}
                >
                  {evaluation.score >= 70 ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {evaluation.score >= 70 ? '🎉 Great Job!' : '📚 Keep Learning!'}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {evaluation.score >= 70 ? 'Your solution looks good!' : 'Let\'s review and improve together.'}
                  </p>
                </div>
              </div>
              <div 
                className="flex items-center px-6 py-3 rounded-full text-lg font-bold"
                style={{
                  background: evaluation.score >= 70 
                    ? 'var(--gradient-secondary)' 
                    : 'var(--gradient-accent)',
                  color: 'white',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {evaluation.score >= 70 ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                {evaluation.score}%
              </div>
            </div>


            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <h4 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    💬 Feedback
                  </h4>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      background: evaluation.score >= 70 
                        ? 'var(--primary-green)' 
                        : 'var(--accent-orange)'
                    }}
                  ></div>
                </div>
                {evaluation.isAiGenerated ? (
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{
                      background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                      >
                        <XCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="text-sm font-semibold mb-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          🤖 AI-Generated Solution Detected
                        </h3>
                        <div 
                          className="text-sm leading-relaxed"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <p>{typeof evaluation.feedback === 'string' ? evaluation.feedback : (typeof evaluation.feedback === 'object' ? evaluation.feedback.message || evaluation.feedback.text || JSON.stringify(evaluation.feedback, null, 2) : String(evaluation.feedback))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: evaluation.score >= 70 
                        ? 'rgba(4, 120, 87, 0.3)'
                        : 'rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {typeof evaluation.feedback === 'string' ? evaluation.feedback : (typeof evaluation.feedback === 'object' ? evaluation.feedback.message || evaluation.feedback.text || JSON.stringify(evaluation.feedback, null, 2) : String(evaluation.feedback))}
                    </p>
                  </div>
                )}
              </div>

              {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <h4 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      💡 Suggestions
                    </h4>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--accent-orange)' }}
                    ></div>
                  </div>
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <div className="space-y-3">
                      {evaluation.suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="flex items-start space-x-3 p-3 rounded-lg"
                          style={{ background: 'rgba(245, 158, 11, 0.05)' }}
                        >
                          <div 
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'var(--gradient-accent)' }}
                          >
                            {index + 1}
                          </div>
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {evaluation.optimalSolution && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <h4 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ⭐ Optimal Solution
                    </h4>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--primary-green)' }}
                    ></div>
                  </div>
                  <div 
                    className="rounded-lg p-4 border-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        💻 Recommended Code
                      </span>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {language.toUpperCase()}
                      </span>
                    </div>
                    <div 
                      className="rounded-lg p-4 border"
                      style={{ 
                        background: 'var(--bg-primary)',
                        borderColor: 'rgba(4, 120, 87, 0.2)'
                      }}
                    >
                      <pre 
                        className="text-sm whitespace-pre-wrap font-mono leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {typeof evaluation.optimalSolution === 'string' ? evaluation.optimalSolution : (typeof evaluation.optimalSolution === 'object' ? evaluation.optimalSolution.code || evaluation.optimalSolution.text || JSON.stringify(evaluation.optimalSolution, null, 2) : String(evaluation.optimalSolution))}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-6 border-t-2" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <button
                  onClick={loadQuestion}
                  className="btn text-sm px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  🚀 Next Question
                </button>
                <button
                  onClick={handleReset}
                  className="btn text-sm px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--text-primary)',
                    border: '2px solid rgba(6, 95, 70, 0.3)'
                  }}
                >
                  🔄 Try Again
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
