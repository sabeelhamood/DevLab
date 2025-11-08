// frontend/src/components/CompetitionQuestion.jsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Code,
  TestTube
} from 'lucide-react';
import { judge0API } from '../services/api/judge0.js';

const CompetitionQuestion = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  onAnswerSubmit, 
  onTimeUp,
  isActive = false 
}) => {
  const [timeLeft, setTimeLeft] = useState(question.time_limit);
  const [userCode, setUserCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isActive, timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunTests = async () => {
    if (!userCode.trim()) return;

    setIsRunning(true);
    try {
      const results = await judge0API.executeTestCases(
        userCode,
        'javascript',
        question.test_cases
      );
      setTestResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userCode.trim()) return;

    setIsSubmitting(true);
    try {
      await onAnswerSubmit({
        questionId: question.question_id,
        answer: userCode,
        timeTaken: question.time_limit - timeLeft,
        testResults: testResults
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeColor = () => {
    if (timeLeft > question.time_limit * 0.5) return 'text-green-600';
    if (timeLeft > question.time_limit * 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeBgColor = () => {
    if (timeLeft > question.time_limit * 0.5) return 'bg-green-100';
    if (timeLeft > question.time_limit * 0.25) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border-2 border-blue-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">{questionNumber}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{question.title}</h2>
              <p className="text-blue-100">Question {questionNumber} of {totalQuestions}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-blue-100 text-sm">Time Remaining</div>
          </div>
        </div>
      </div>

      {/* Question Description */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          <Code className="h-6 w-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {question.description}
            </p>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Solution (JavaScript)
          </label>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            placeholder="Write your solution here..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={!isActive || timeLeft === 0}
          />
        </div>

        {/* Test Cases */}
        {question.test_cases && question.test_cases.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <TestTube className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">Test Cases</h4>
            </div>
            <div className="grid gap-4">
              {question.test_cases.map((testCase, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">Input</div>
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {JSON.stringify(testCase.input)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">Expected Output</div>
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {JSON.stringify(testCase.expected_output)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        {showResults && testResults.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h4>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  result.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      result.passed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Test Case {index + 1}: {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Your Output:</span>
                      <div className="font-mono text-xs mt-1 p-2 bg-white rounded border">
                        {JSON.stringify(result.result)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expected:</span>
                      <div className="font-mono text-xs mt-1 p-2 bg-white rounded border">
                        {JSON.stringify(result.expected)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleRunTests}
            disabled={!userCode.trim() || isRunning || !isActive || timeLeft === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
          </button>

          <button
            onClick={handleSubmitAnswer}
            disabled={!userCode.trim() || isSubmitting || !isActive || timeLeft === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Answer'}</span>
          </button>
        </div>

        {/* Time Warning */}
        {timeLeft <= question.time_limit * 0.25 && timeLeft > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-semibold">
                Time is running out! Submit your answer soon.
              </span>
            </div>
          </div>
        )}

        {/* Time's Up */}
        {timeLeft === 0 && (
          <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-semibold">
                Time's up! Your answer has been automatically submitted.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionQuestion;

