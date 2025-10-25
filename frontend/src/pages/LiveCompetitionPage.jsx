// frontend/src/pages/LiveCompetitionPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import CompetitionQuestion from '../components/CompetitionQuestion.jsx';
import CompetitionResults from '../components/CompetitionResults.jsx';
import { competitionsAPI } from '../services/api/competitions.js';

const LiveCompetitionPage = ({ competitionId, onCompetitionEnd }) => {
  const [competition, setCompetition] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [competitionStatus, setCompetitionStatus] = useState('active'); // active, ended, results
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetition();
  }, [competitionId]);

  const loadCompetition = async () => {
    try {
      // Mock competition data - in real app, this would come from API
      const mockCompetition = {
        competition_id: competitionId,
        learner1: {
          user_id: 1,
          name: "You",
          score: 0,
          answers: []
        },
        learner2: {
          user_id: 2,
          name: "Jane Smith",
          score: 0,
          answers: []
        },
        status: "active",
        questions: [
          {
            question_id: "comp_q1",
            title: "Array Sum Challenge",
            description: "Write a function that returns the sum of all numbers in an array.\n\nExample:\nsumArray([1, 2, 3]) should return 6\nsumArray([-1, 2, 3]) should return 4\nsumArray([]) should return 0",
            difficulty: "intermediate",
            language: "javascript",
            time_limit: 300, // 5 minutes
            test_cases: [
              { input: [1, 2, 3], expected_output: 6 },
              { input: [-1, 2, 3], expected_output: 4 },
              { input: [], expected_output: 0 }
            ],
            points: 100
          },
          {
            question_id: "comp_q2",
            title: "String Reversal",
            description: "Write a function that reverses a string.\n\nExample:\nreverseString('hello') should return 'olleh'\nreverseString('world') should return 'dlrow'\nreverseString('') should return ''",
            difficulty: "intermediate",
            language: "javascript",
            time_limit: 240, // 4 minutes
            test_cases: [
              { input: "hello", expected_output: "olleh" },
              { input: "world", expected_output: "dlrow" },
              { input: "", expected_output: "" }
            ],
            points: 100
          },
          {
            question_id: "comp_q3",
            title: "Find Maximum",
            description: "Write a function that finds the maximum number in an array.\n\nExample:\nfindMax([1, 5, 3, 9, 2]) should return 9\nfindMax([-1, -5, -3]) should return -1\nfindMax([42]) should return 42",
            difficulty: "intermediate",
            language: "javascript",
            time_limit: 180, // 3 minutes
            test_cases: [
              { input: [1, 5, 3, 9, 2], expected_output: 9 },
              { input: [-1, -5, -3], expected_output: -1 },
              { input: [42], expected_output: 42 }
            ],
            points: 100
          }
        ],
        started_at: new Date().toISOString(),
        ended_at: null,
        winner: null
      };

      setCompetition(mockCompetition);
    } catch (error) {
      console.error('Error loading competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (answerData) => {
    try {
      // Submit answer to backend
      const result = await competitionsAPI.submitAnswer(
        competitionId,
        1, // current user ID
        answerData.questionId,
        answerData.answer
      );

      if (result.success) {
        // Add answer to user's answers
        const newAnswer = {
          questionId: answerData.questionId,
          answer: answerData.answer,
          timeTaken: answerData.timeTaken,
          testResults: answerData.testResults,
          submittedAt: new Date().toISOString()
        };

        setUserAnswers(prev => [...prev, newAnswer]);

        // Move to next question or end competition
        if (currentQuestionIndex < competition.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          await endCompetition();
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleTimeUp = async () => {
    // Auto-submit empty answer when time runs out
    const currentQuestion = competition.questions[currentQuestionIndex];
    await handleAnswerSubmit({
      questionId: currentQuestion.question_id,
      answer: '', // Empty answer due to time up
      timeTaken: currentQuestion.time_limit,
      testResults: []
    });
  };

  const endCompetition = async () => {
    try {
      setCompetitionStatus('ended');
      
      // Get results from backend with user answers for Gemini evaluation
      const result = await competitionsAPI.endCompetition(competitionId, userAnswers);
      
      if (result.success) {
        setResults(result.results);
        setCompetitionStatus('results');
      }
    } catch (error) {
      console.error('Error ending competition:', error);
    }
  };

  const handlePlayAgain = () => {
    // Reset competition state
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCompetitionStatus('active');
    setResults(null);
  };

  const handleViewLeaderboard = () => {
    // Navigate to leaderboard
    window.location.href = '/competitions?tab=leaderboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competition...</p>
        </div>
      </div>
    );
  }

  if (competitionStatus === 'results' && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <CompetitionResults 
          results={results}
          onPlayAgain={handlePlayAgain}
          onViewLeaderboard={handleViewLeaderboard}
        />
      </div>
    );
  }

  const currentQuestion = competition.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / competition.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Competition Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Competition</h1>
                <p className="text-gray-600">vs {competition.learner2.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Competition ID</div>
              <div className="font-mono text-lg font-bold text-blue-600">{competitionId}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {competition.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Competition Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Your Score</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {userAnswers.reduce((sum, answer) => sum + (answer.testResults?.filter(r => r.passed).length || 0) * 100, 0)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Opponent Score</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {Math.floor(Math.random() * 200) + 100}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Questions Completed</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {userAnswers.length}/{competition.questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <CompetitionQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={competition.questions.length}
          onAnswerSubmit={handleAnswerSubmit}
          onTimeUp={handleTimeUp}
          isActive={competitionStatus === 'active'}
        />

        {/* Competition Status */}
        {competitionStatus === 'ended' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-semibold">
                Competition ended! Calculating results...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCompetitionPage;
