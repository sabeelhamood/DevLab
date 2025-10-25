// frontend/src/components/CompetitionResults.jsx
import React from 'react';
import { 
  Trophy, 
  Award, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle,
  Star,
  TrendingUp,
  Zap,
  Crown
} from 'lucide-react';

const CompetitionResults = ({ results, onPlayAgain, onViewLeaderboard }) => {
  const isWinner = results.winner.user_id === 1; // Assuming current user is ID 1
  const currentUserResult = results.results.learner1;
  const opponentResult = results.results.learner2;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border-2 border-yellow-200">
      {/* Header */}
      <div className={`p-8 rounded-t-xl ${
        isWinner 
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
          : 'bg-gradient-to-r from-gray-400 to-gray-600'
      } text-white`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {isWinner ? (
              <Crown className="h-16 w-16 text-yellow-200" />
            ) : (
              <Trophy className="h-16 w-16 text-gray-300" />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {isWinner ? '🎉 Congratulations!' : 'Better luck next time!'}
          </h1>
          <p className="text-xl opacity-90">
            {isWinner ? 'You won the competition!' : 'You put up a great fight!'}
          </p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Your Results */}
          <div className={`p-6 rounded-xl border-2 ${
            isWinner 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isWinner ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                <span className="text-white font-bold text-lg">You</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Performance</h3>
                <p className="text-gray-600">Your competition results</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Final Score</span>
                <span className="text-2xl font-bold text-gray-900">{currentUserResult.score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questions Correct</span>
                <span className="text-lg font-semibold text-gray-900">
                  {currentUserResult.questions_correct}/3
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time Taken</span>
                <span className="text-lg font-semibold text-gray-900">
                  {Math.floor(currentUserResult.time_taken / 60)}:{(currentUserResult.time_taken % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Opponent Results */}
          <div className="p-6 rounded-xl bg-gray-50 border-2 border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">OP</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Opponent</h3>
                <p className="text-gray-600">{opponentResult.name}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Final Score</span>
                <span className="text-2xl font-bold text-gray-900">{opponentResult.score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questions Correct</span>
                <span className="text-lg font-semibold text-gray-900">
                  {opponentResult.questions_correct}/3
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time Taken</span>
                <span className="text-lg font-semibold text-gray-900">
                  {Math.floor(opponentResult.time_taken / 60)}:{(opponentResult.time_taken % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Announcement */}
        <div className={`p-6 rounded-xl mb-8 ${
          isWinner 
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300' 
            : 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300'
        }`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {isWinner ? (
                <Trophy className="h-12 w-12 text-yellow-600" />
              ) : (
                <Award className="h-12 w-12 text-gray-500" />
              )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              isWinner ? 'text-yellow-800' : 'text-gray-700'
            }`}>
              {isWinner ? '🏆 You are the winner!' : `🏆 ${results.winner.name} wins!`}
            </h2>
            <p className={`text-lg ${
              isWinner ? 'text-yellow-700' : 'text-gray-600'
            }`}>
              {isWinner 
                ? 'Outstanding performance! You dominated this competition.' 
                : `Great effort! ${results.winner.name} scored ${results.winner.score} points.`
              }
            </p>
          </div>
        </div>

        {/* Gemini Evaluation Info */}
        {results.gemini_evaluation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">AI Evaluation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Evaluation Time:</span>
                <span className="ml-2 font-semibold text-blue-900">{results.gemini_evaluation.evaluation_time}</span>
              </div>
              <div>
                <span className="text-blue-700">Confidence Score:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {Math.round(results.gemini_evaluation.confidence_score * 100)}%
                </span>
              </div>
              <div>
                <span className="text-blue-700">AI Used:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {results.gemini_evaluation.used ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            <Target className="h-5 w-5" />
            <span>Play Again</span>
          </button>
          
          <button
            onClick={onViewLeaderboard}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <TrendingUp className="h-5 w-5" />
            <span>View Leaderboard</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.max(currentUserResult.score, opponentResult.score)}
            </div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.min(currentUserResult.time_taken, opponentResult.time_taken)}
            </div>
            <div className="text-sm text-gray-600">Fastest Time (seconds)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {currentUserResult.questions_correct + opponentResult.questions_correct}
            </div>
            <div className="text-sm text-gray-600">Total Questions Solved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionResults;

