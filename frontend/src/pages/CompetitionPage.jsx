// frontend/src/pages/CompetitionPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Clock, 
  Target, 
  Award, 
  Zap,
  Play,
  CheckCircle,
  XCircle,
  Timer,
  Star,
  TrendingUp
} from 'lucide-react';

const CompetitionPage = () => {
  const [activeTab, setActiveTab] = useState('invitations');
  const [competitions, setCompetitions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Mock competitions data
    setCompetitions([
      {
        id: 1,
        title: "JavaScript Fundamentals Challenge",
        participants: 2,
        status: "active",
        difficulty: "intermediate",
        timeLimit: 30,
        questions: 3,
        prize: "Certificate + 100 Points"
      },
      {
        id: 2,
        title: "Python Data Structures",
        participants: 4,
        status: "pending",
        difficulty: "advanced",
        timeLimit: 45,
        questions: 3,
        prize: "Certificate + 150 Points"
      }
    ]);

    // Mock leaderboard data
    setLeaderboard([
      { rank: 1, name: "Alex Johnson", score: 285, wins: 12, avatar: "👨‍💻" },
      { rank: 2, name: "Sarah Chen", score: 267, wins: 10, avatar: "👩‍💻" },
      { rank: 3, name: "Mike Rodriguez", score: 245, wins: 8, avatar: "👨‍🎓" },
      { rank: 4, name: "Emma Wilson", score: 223, wins: 7, avatar: "👩‍🎓" },
      { rank: 5, name: "David Kim", score: 201, wins: 6, avatar: "👨‍🔬" }
    ]);
  }, []);

  const handleJoinCompetition = (competitionId) => {
    alert(`Joining competition ${competitionId}! This would start the live competition.`);
  };

  const handleCreateCompetition = () => {
    alert("Creating new competition invitation! This would invite other learners.");
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Competitions</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Challenge yourself and compete with other learners in coding competitions!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'invitations', label: 'Invitations', icon: Users },
            { id: 'active', label: 'Active', icon: Play },
            { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'invitations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Competition Invitations</h2>
                  <button
                    onClick={handleCreateCompetition}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Competition
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {competitions.map(competition => (
                    <div
                      key={competition.id}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{competition.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {competition.participants} participants
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {competition.difficulty}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {competition.timeLimit} min
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          competition.status === 'active' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {competition.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-300">
                          <p>🏆 Prize: {competition.prize}</p>
                          <p>📝 {competition.questions} questions</p>
                        </div>
                        <button
                          onClick={() => handleJoinCompetition(competition.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Join Competition
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
                
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-700 font-medium text-gray-300">
                    <div>Rank</div>
                    <div>Player</div>
                    <div>Score</div>
                    <div>Wins</div>
                  </div>
                  
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.rank}
                      className={`grid grid-cols-4 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Trophy className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            'text-orange-600'
                          }`} />
                        )}
                        <span className="font-bold text-white">#{player.rank}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <div className="text-white font-bold">{player.score}</div>
                      <div className="text-green-400 font-medium">{player.wins}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Active Competitions</h2>
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No active competitions at the moment</p>
                  <p className="text-gray-500">Join a competition to start competing!</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Competition History</h2>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No competition history yet</p>
                  <p className="text-gray-500">Participate in competitions to build your history!</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Competitions Won</span>
                  <span className="text-green-400 font-bold">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Score</span>
                  <span className="text-blue-400 font-bold">1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Rank</span>
                  <span className="text-yellow-400 font-bold">#12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-purple-400 font-bold">75%</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-300 text-sm">First Win!</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-300 text-sm">Perfect Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-300 text-sm">Speed Master</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionPage;