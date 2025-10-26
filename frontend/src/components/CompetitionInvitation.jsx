import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Clock, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Star,
  Target,
  Zap,
  Crown,
  AlertCircle
} from 'lucide-react'

function CompetitionInvitation() {
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [])

  const loadInvitation = async () => {
    try {
      // Mock invitation data - replace with actual API call
      const mockInvitation = {
        id: 'inv-123',
        courseId: 'course-1',
        courseName: 'JavaScript Fundamentals',
        learnerId: 'learner-123',
        eligibleLearners: [
          {
            id: 'learner-456',
            isAnonymous: true,
            completedAt: '2024-01-15T10:30:00Z',
            skillLevel: 'intermediate'
          },
          {
            id: 'learner-789',
            isAnonymous: true,
            completedAt: '2024-01-15T09:15:00Z',
            skillLevel: 'advanced'
          },
          {
            id: 'learner-101',
            isAnonymous: true,
            completedAt: '2024-01-14T16:45:00Z',
            skillLevel: 'intermediate'
          }
        ],
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

      setInvitation(mockInvitation)
      setLoading(false)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (competitorId) => {
    setResponding(true)
    try {
      const response = await fetch(`/api/competitions/invitation/${invitation.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'accept',
          competitorId,
          courseId: invitation.courseId,
          courseName: invitation.courseName
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Navigate to competition
        navigate(`/competition/${result.data.competition.id}`)
      } else {
        alert('Failed to start competition. Please try again.')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  const handleDeclineInvitation = async () => {
    setResponding(true)
    try {
      await fetch(`/api/competitions/invitation/${invitation.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'decline'
        })
      })

      navigate('/competition')
    } catch (error) {
      console.error('Error declining invitation:', error)
    } finally {
      setResponding(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just completed'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Animated Background */}
        <div className="bg-animation"></div>
        
        {/* Loading Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="loading-particle"
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                background: `rgba(${Math.random() > 0.5 ? '6, 95, 70' : '217, 119, 6'}, 0.3)`,
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `loadingPulse ${Math.random() * 2 + 1}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div 
          className="w-32 h-32 rounded-2xl flex items-center justify-center relative z-10"
          style={{ 
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
        </div>
        
        <style jsx>{`
          @keyframes loadingPulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.3;
            }
            50% { 
              transform: scale(1.5);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div 
          className="text-center rounded-2xl p-12 border-2"
          style={{ 
            background: 'var(--gradient-card)',
            borderColor: 'rgba(6, 95, 70, 0.2)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            No Invitation Found
          </h2>
          <p 
            className="text-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            You don't have any pending competition invitations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="bg-animation"></div>
      
      {/* Particle System */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              position: 'absolute',
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: `rgba(${Math.random() > 0.5 ? '6, 95, 70' : '217, 119, 6'}, ${Math.random() * 0.3 + 0.1})`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particleFloat ${Math.random() * 10 + 15}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* Floating Code Symbols */}
        <div className="code-symbol" style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          fontSize: '24px',
          color: 'rgba(6, 95, 70, 0.1)',
          animation: 'symbolFloat 12s ease-in-out infinite',
          animationDelay: '0s'
        }}>{'{'}</div>
        
        <div className="code-symbol" style={{
          position: 'absolute',
          top: '25%',
          right: '12%',
          fontSize: '20px',
          color: 'rgba(217, 119, 6, 0.1)',
          animation: 'symbolFloat 10s ease-in-out infinite',
          animationDelay: '2s'
        }}>{'}'}</div>
        
        <div className="code-symbol" style={{
          position: 'absolute',
          top: '60%',
          left: '5%',
          fontSize: '18px',
          color: 'rgba(15, 118, 110, 0.1)',
          animation: 'symbolFloat 14s ease-in-out infinite',
          animationDelay: '4s'
        }}>{'<'}</div>
        
        <div className="code-symbol" style={{
          position: 'absolute',
          bottom: '20%',
          right: '8%',
          fontSize: '22px',
          color: 'rgba(4, 120, 87, 0.1)',
          animation: 'symbolFloat 11s ease-in-out infinite',
          animationDelay: '1s'
        }}>{'>'}</div>
        
        <div className="code-symbol" style={{
          position: 'absolute',
          top: '45%',
          left: '15%',
          fontSize: '16px',
          color: 'rgba(6, 95, 70, 0.1)',
          animation: 'symbolFloat 13s ease-in-out infinite',
          animationDelay: '3s'
        }}>{'['}</div>
        
        <div className="code-symbol" style={{
          position: 'absolute',
          top: '70%',
          right: '15%',
          fontSize: '16px',
          color: 'rgba(217, 119, 6, 0.1)',
          animation: 'symbolFloat 9s ease-in-out infinite',
          animationDelay: '5s'
        }}>{']'}</div>
      </div>
      
      {/* Moving Gradient Waves */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="gradient-wave" style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, transparent 30%, rgba(6, 95, 70, 0.02) 50%, transparent 70%)',
          animation: 'waveMove 20s ease-in-out infinite',
          animationDelay: '0s'
        }}></div>
        
        <div className="gradient-wave" style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(-45deg, transparent 30%, rgba(217, 119, 6, 0.02) 50%, transparent 70%)',
          animation: 'waveMove 25s ease-in-out infinite reverse',
          animationDelay: '5s'
        }}></div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes particleFloat {
          0% { 
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% { 
            opacity: 1;
          }
          90% { 
            opacity: 1;
          }
          100% { 
            transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes symbolFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.1;
          }
          25% { 
            transform: translateY(-15px) rotate(5deg) scale(1.1);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-8px) rotate(-3deg) scale(0.9);
            opacity: 0.15;
          }
          75% { 
            transform: translateY(-20px) rotate(2deg) scale(1.05);
            opacity: 0.25;
          }
        }
        
        @keyframes waveMove {
          0%, 100% { 
            transform: translateX(-100%) translateY(0px);
            opacity: 0.02;
          }
          25% { 
            transform: translateX(-50%) translateY(-20px);
            opacity: 0.05;
          }
          50% { 
            transform: translateX(0%) translateY(-10px);
            opacity: 0.03;
          }
          75% { 
            transform: translateX(50%) translateY(-30px);
            opacity: 0.04;
          }
        }
        
        @media (max-width: 768px) {
          .particle {
            animation-duration: 20s !important;
          }
          .code-symbol {
            font-size: 14px !important;
            animation-duration: 15s !important;
          }
          .gradient-wave {
            animation-duration: 30s !important;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .particle,
          .code-symbol,
          .gradient-wave {
            animation: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-8 shadow-2xl border-2"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(6, 95, 70, 0.2)',
              boxShadow: '0 20px 60px rgba(6, 95, 70, 0.3)'
            }}
          >
            <div className="flex items-center space-x-4 mb-4">
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
                  Competition Invitation
                </h1>
                <p 
                  className="text-lg mt-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  You've been invited to compete in a 2-player anonymous coding challenge!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Details */}
        <div 
          className="rounded-2xl p-8 border-2 mb-8"
          style={{ 
            background: 'var(--gradient-card)',
            borderColor: 'rgba(6, 95, 70, 0.2)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <h2 
            className="text-3xl font-bold mb-8 flex items-center"
            style={{ color: 'var(--text-primary)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4"
              style={{ 
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Target className="w-5 h-5 text-white" />
            </div>
            Competition Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-accent)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Course
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {invitation.courseName}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Players
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    2 players (anonymous)
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-secondary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Questions
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    3 coding challenges
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Duration
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    30 minutes total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-accent)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Difficulty
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Medium level
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-accent)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div 
                    className="font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Prize
                  </div>
                  <div 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Bragging rights & XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Competitors */}
        <div 
          className="rounded-2xl p-8 border-2 mb-8"
          style={{ 
            background: 'var(--gradient-card)',
            borderColor: 'rgba(6, 95, 70, 0.2)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center"
            style={{ color: 'var(--text-primary)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4"
              style={{ 
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            Choose Your Opponent
          </h3>
          <p 
            className="text-lg mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Select one of the learners who completed the same course to compete against. 
            Both players will remain anonymous during the competition.
          </p>
          
          <div className="space-y-6">
            {invitation.eligibleLearners.map((learner, index) => (
              <div 
                key={learner.id} 
                className="border-2 rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ 
                  background: 'var(--gradient-card)',
                  borderColor: 'rgba(6, 95, 70, 0.2)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ 
                        background: 'var(--gradient-primary)',
                        boxShadow: 'var(--shadow-glow)'
                      }}
                    >
                      Player {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <div 
                        className="font-bold text-xl mb-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Anonymous Player {String.fromCharCode(65 + index)}
                      </div>
                      <div 
                        className="text-lg mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Completed course {formatTimeAgo(learner.completedAt)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-4 py-2 text-sm rounded-xl font-semibold"
                          style={{
                            background: learner.skillLevel === 'beginner' 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : learner.skillLevel === 'intermediate'
                              ? 'rgba(245, 158, 11, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                            color: learner.skillLevel === 'beginner' 
                              ? 'var(--accent-green)' 
                              : learner.skillLevel === 'intermediate'
                              ? 'var(--accent-gold)'
                              : '#ef4444',
                            border: `1px solid ${
                              learner.skillLevel === 'beginner' 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : learner.skillLevel === 'intermediate'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'
                            }`
                          }}
                        >
                          {learner.skillLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAcceptInvitation(learner.id)}
                    disabled={responding}
                    className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                    style={{
                      background: 'var(--gradient-primary)',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Challenge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div 
          className="rounded-2xl p-8 border-2 mb-8"
          style={{ 
            background: 'var(--gradient-card)',
            borderColor: 'rgba(6, 95, 70, 0.2)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center"
            style={{ color: 'var(--text-primary)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4"
              style={{ 
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            Competition Rules
          </h3>
          
          <ul className="space-y-4">
            <li className="flex items-start space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Both players remain anonymous throughout the competition
              </span>
            </li>
            <li className="flex items-start space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                3 coding questions with 10 minutes each
              </span>
            </li>
            <li className="flex items-start space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Timer automatically submits your answer when time runs out
              </span>
            </li>
            <li className="flex items-start space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Winner determined by correct answers and completion time
              </span>
            </li>
            <li className="flex items-start space-x-4 p-4 rounded-xl" style={{ background: 'rgba(6, 95, 70, 0.05)' }}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                No external help or collaboration allowed
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6">
          <button
            onClick={handleDeclineInvitation}
            disabled={responding}
            className="px-10 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '2px solid rgba(6, 95, 70, 0.2)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <XCircle className="w-5 h-5" />
            <span>Decline Invitation</span>
          </button>
        </div>

        {/* Expiration Notice */}
        <div className="mt-8 text-center">
          <p 
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            This invitation expires in 24 hours. Choose your opponent soon!
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompetitionInvitation
