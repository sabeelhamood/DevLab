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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="bg-animation"></div>
      
      {/* Floating Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Circles */}
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.1), rgba(4, 120, 87, 0.1))',
          borderRadius: '50%',
          animation: 'floatUpDown 8s ease-in-out infinite',
          animationDelay: '0s'
        }}></div>
        
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '20%',
          right: '8%',
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(245, 158, 11, 0.1))',
          borderRadius: '50%',
          animation: 'floatUpDown 6s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
        
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '60%',
          left: '3%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(6, 95, 70, 0.1))',
          borderRadius: '50%',
          animation: 'floatUpDown 10s ease-in-out infinite',
          animationDelay: '4s'
        }}></div>
        
        <div className="floating-shape" style={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.1), rgba(15, 118, 110, 0.1))',
          borderRadius: '50%',
          animation: 'floatUpDown 7s ease-in-out infinite',
          animationDelay: '1s'
        }}></div>
        
        {/* Floating Squares */}
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '30%',
          left: '15%',
          width: '30px',
          height: '30px',
          background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.08), rgba(217, 119, 6, 0.08))',
          borderRadius: '8px',
          animation: 'floatRotate 12s linear infinite',
          animationDelay: '0s'
        }}></div>
        
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '70%',
          right: '12%',
          width: '25px',
          height: '25px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(4, 120, 87, 0.08))',
          borderRadius: '6px',
          animation: 'floatRotate 9s linear infinite',
          animationDelay: '3s'
        }}></div>
        
        {/* Floating Triangles */}
        <div className="floating-shape" style={{
          position: 'absolute',
          top: '40%',
          right: '20%',
          width: '0',
          height: '0',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '25px solid rgba(6, 95, 70, 0.1)',
          animation: 'floatUpDown 11s ease-in-out infinite',
          animationDelay: '5s'
        }}></div>
        
        <div className="floating-shape" style={{
          position: 'absolute',
          bottom: '25%',
          left: '10%',
          width: '0',
          height: '0',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderBottom: '20px solid rgba(217, 119, 6, 0.1)',
          animation: 'floatUpDown 8s ease-in-out infinite',
          animationDelay: '2.5s'
        }}></div>
      </div>
      
      {/* Moving Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="gradient-orb" style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(6, 95, 70, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'moveOrb 20s ease-in-out infinite',
          animationDelay: '0s'
        }}></div>
        
        <div className="gradient-orb" style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'moveOrb 25s ease-in-out infinite reverse',
          animationDelay: '5s'
        }}></div>
        
        <div className="gradient-orb" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(15, 118, 110, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'moveOrb 18s ease-in-out infinite',
          animationDelay: '10s'
        }}></div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
          75% { transform: translateY(-25px) rotate(2deg); }
        }
        
        @keyframes floatRotate {
          0% { transform: rotate(0deg) translateY(0px); }
          25% { transform: rotate(90deg) translateY(-15px); }
          50% { transform: rotate(180deg) translateY(-5px); }
          75% { transform: rotate(270deg) translateY(-20px); }
          100% { transform: rotate(360deg) translateY(0px); }
        }
        
        @keyframes moveOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.1); }
          50% { transform: translate(-20px, -40px) scale(0.9); }
          75% { transform: translate(-30px, 20px) scale(1.05); }
        }
        
        @media (max-width: 768px) {
          .floating-shape {
            animation-duration: 12s !important;
          }
          .gradient-orb {
            animation-duration: 30s !important;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .floating-shape,
          .gradient-orb {
            animation: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-8 shadow-2xl border-2 mb-6"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(6, 95, 70, 0.2)',
              boxShadow: '0 20px 60px rgba(6, 95, 70, 0.3)'
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ 
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h1 
                  className="text-4xl font-bold font-display"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Competitions
                </h1>
                <p 
                  className="text-lg mt-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Challenge yourself and compete with other learners in coding competitions!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div 
          className="flex gap-3 mb-8 p-2 rounded-2xl"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(6, 95, 70, 0.1)'
          }}
        >
          {[
            { id: 'invitations', label: 'Invitations', icon: Users },
            { id: 'active', label: 'Active', icon: Play },
            { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white shadow-lg transform scale-105'
                  : 'hover:scale-105'
              }`}
              style={{
                background: activeTab === tab.id 
                  ? 'var(--gradient-primary)' 
                  : 'transparent',
                color: activeTab === tab.id 
                  ? 'white' 
                  : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id 
                  ? 'var(--shadow-glow)' 
                  : 'none'
              }}
            >
              <tab.icon className="w-5 h-5" />
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
                  <h2 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Competition Invitations
                  </h2>
                  <button
                    onClick={handleCreateCompetition}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'var(--gradient-accent)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    Create Competition
                  </button>
                </div>
                
                <div className="grid gap-6">
                  {competitions.map(competition => (
                    <div
                      key={competition.id}
                      className="rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 cursor-pointer"
                      style={{ 
                        background: 'var(--gradient-card)',
                        borderColor: 'rgba(6, 95, 70, 0.2)',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 
                            className="text-2xl font-bold mb-3"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {competition.title}
                          </h3>
                          <div className="flex items-center gap-6 text-sm">
                            <span 
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ 
                                background: 'rgba(6, 95, 70, 0.1)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <Users className="w-4 h-4" />
                              {competition.participants} participants
                            </span>
                            <span 
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ 
                                background: 'rgba(6, 95, 70, 0.1)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <Target className="w-4 h-4" />
                              {competition.difficulty}
                            </span>
                            <span 
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ 
                                background: 'rgba(6, 95, 70, 0.1)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <Timer className="w-4 h-4" />
                              {competition.timeLimit} min
                            </span>
                          </div>
                        </div>
                        <span 
                          className="px-4 py-2 rounded-xl text-sm font-semibold"
                          style={{
                            background: competition.status === 'active' 
                              ? 'var(--gradient-secondary)' 
                              : 'var(--gradient-accent)',
                            color: 'white',
                            boxShadow: 'var(--shadow-glow)'
                          }}
                        >
                          {competition.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <p 
                            className="mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            🏆 Prize: {competition.prize}
                          </p>
                          <p 
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            📝 {competition.questions} questions
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinCompetition(competition.id)}
                          className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                          style={{
                            background: 'var(--gradient-primary)',
                            boxShadow: 'var(--shadow-glow)'
                          }}
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
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Leaderboard
                </h2>
                
                <div 
                  className="rounded-2xl overflow-hidden border-2"
                  style={{ 
                    background: 'var(--gradient-card)',
                    borderColor: 'rgba(6, 95, 70, 0.2)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div 
                    className="grid grid-cols-4 gap-4 p-6 font-semibold"
                    style={{ 
                      background: 'var(--gradient-primary)',
                      color: 'white'
                    }}
                  >
                    <div>Rank</div>
                    <div>Player</div>
                    <div>Score</div>
                    <div>Wins</div>
                  </div>
                  
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.rank}
                      className={`grid grid-cols-4 gap-4 p-6 border-b transition-all duration-300 hover:scale-105 ${
                        index < 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      style={{ 
                        borderColor: 'rgba(6, 95, 70, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background: index === 0 
                                ? 'var(--gradient-accent)' 
                                : index === 1 
                                ? 'linear-gradient(135deg, #64748b, #475569)'
                                : 'linear-gradient(135deg, #d97706, #f59e0b)',
                              boxShadow: 'var(--shadow-glow)'
                            }}
                          >
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span 
                          className="font-bold text-lg"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          #{player.rank}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{player.avatar}</span>
                        <span 
                          className="font-semibold text-lg"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {player.name}
                        </span>
                      </div>
                      <div 
                        className="font-bold text-xl"
                        style={{ color: 'var(--primary-green)' }}
                      >
                        {player.score}
                      </div>
                      <div 
                        className="font-semibold text-lg"
                        style={{ color: 'var(--accent-green)' }}
                      >
                        {player.wins}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-6">
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Active Competitions
                </h2>
                <div 
                  className="text-center py-16 rounded-2xl border-2"
                  style={{ 
                    background: 'var(--gradient-card)',
                    borderColor: 'rgba(6, 95, 70, 0.2)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ 
                      background: 'var(--gradient-primary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <p 
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    No active competitions at the moment
                  </p>
                  <p 
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Join a competition to start competing!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Competition History
                </h2>
                <div 
                  className="text-center py-16 rounded-2xl border-2"
                  style={{ 
                    background: 'var(--gradient-card)',
                    borderColor: 'rgba(6, 95, 70, 0.2)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ 
                      background: 'var(--gradient-primary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <p 
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    No competition history yet
                  </p>
                  <p 
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Participate in competitions to build your history!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div 
              className="rounded-2xl p-8 border-2"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <h3 
                className="text-xl font-bold mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Competitions Won</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: 'var(--accent-green)' }}
                  >
                    5
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Score</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: 'var(--primary-green)' }}
                  >
                    1,250
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rank</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    #12
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Win Rate</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: 'var(--primary-purple)' }}
                  >
                    75%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div 
              className="rounded-2xl p-8 border-2"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <h3 
                className="text-xl font-bold mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                Recent Achievements
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: 'var(--gradient-accent)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <span 
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    First Win!
                  </span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: 'var(--gradient-primary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <span 
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Perfect Score
                  </span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: 'var(--gradient-secondary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span 
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Speed Master
                  </span>
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