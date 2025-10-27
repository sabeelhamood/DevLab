import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trophy, 
  Clock, 
  Target, 
  Zap, 
  Star, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  CheckCircle,
  AlertCircle,
  Crown,
  Award,
  Timer,
  Rocket
} from 'lucide-react';
import soundManager from '../utils/soundManager';

const MockCompetitionGameplay = () => {
  const navigate = useNavigate();
  const { competitionId, questionId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(3);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const timerRef = useRef(null);

  // Mock questions data
  const mockQuestions = [
    {
      id: 1,
      title: "Array Sum Challenge",
      description: "Write a function that returns the sum of all elements in an array.",
      difficulty: "Easy",
      points: 100,
      timeLimit: 600,
      starterCode: "function arraySum(arr) {\n  // Your code here\n  return 0;\n}",
      testCases: [
        { input: "[1, 2, 3, 4]", expected: "10" },
        { input: "[-1, 0, 1]", expected: "0" },
        { input: "[5, 10, 15]", expected: "30" }
      ]
    },
    {
      id: 2,
      title: "Palindrome Checker",
      description: "Create a function that checks if a string is a palindrome (reads the same forwards and backwards).",
      difficulty: "Medium",
      points: 150,
      timeLimit: 600,
      starterCode: "function isPalindrome(str) {\n  // Your code here\n  return false;\n}",
      testCases: [
        { input: "\"racecar\"", expected: "true" },
        { input: "\"hello\"", expected: "false" },
        { input: "\"A man a plan a canal Panama\"", expected: "true" }
      ]
    },
    {
      id: 3,
      title: "Binary Search",
      description: "Implement binary search to find the index of a target value in a sorted array.",
      difficulty: "Hard",
      points: 200,
      timeLimit: 600,
      starterCode: "function binarySearch(arr, target) {\n  // Your code here\n  return -1;\n}",
      testCases: [
        { input: "[1, 3, 5, 7, 9], 5", expected: "2" },
        { input: "[2, 4, 6, 8], 3", expected: "-1" },
        { input: "[1, 2, 3, 4, 5], 1", expected: "0" }
      ]
    }
  ];

  const currentQuestionData = mockQuestions[currentQuestion - 1];

  // Initialize sound and start background music when component mounts
  useEffect(() => {
    setIsClient(true);
    // Start background music when entering competition
    soundManager.playBackgroundMusic();
    
    return () => {
      // Stop background music when leaving
      soundManager.stopBackgroundMusic();
    };
  }, []);

  // Sound effects using sound manager
  const playSound = (soundType) => {
    if (!soundEnabled) return;
    
    switch (soundType) {
      case 'start':
        soundManager.playSound('start') || soundManager.playFallbackStart();
        break;
      case 'pause':
        soundManager.playSound('pause');
        break;
      case 'complete':
        soundManager.playSound('complete') || soundManager.playFallbackComplete();
        break;
      case 'correct':
        soundManager.playSound('correct') || soundManager.playFallbackCorrect();
        break;
      case 'wrong':
        soundManager.playSound('wrong') || soundManager.playFallbackWrong();
        break;
      case 'timer':
        soundManager.playSound('timer') || soundManager.playFallbackTimer();
        break;
      case 'join':
        soundManager.playSound('join') || soundManager.playFallbackJoin();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playSound('complete');
            handleAutoSubmit();
            return 0;
          }
          
          // Play warning sound when 60 seconds left
          if (prev === 61) {
            playSound('timer');
          }
          
          // Play countdown sound for last 10 seconds
          if (prev <= 10 && prev > 0) {
            playSound('timer');
          }
          
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    setAnswer(currentQuestionData?.starterCode || '');
  }, [currentQuestion]);

  const handleStart = () => {
    setIsRunning(true);
    setHasStarted(true);
    playSound('start');
  };

  const handlePause = () => {
    setIsRunning(false);
    playSound('pause');
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setHasStarted(false);
    setTimeLeft(currentQuestionData?.timeLimit || 600);
    setAnswer(currentQuestionData?.starterCode || '');
  };

  const handleAutoSubmit = async () => {
    setLoading(true);
    playSound('complete');
    
    // Simulate API call
    setTimeout(() => {
      const isCorrect = Math.random() > 0.3; // 70% chance of being correct
      const questionScore = isCorrect ? currentQuestionData.points : 0;
      
      setResult({
        correct: isCorrect,
        score: questionScore,
        timeSpent: (currentQuestionData?.timeLimit || 600) - timeLeft,
        message: isCorrect ? "🎉 Excellent! Correct answer!" : "❌ Try again next time!"
      });
      
      if (isCorrect) {
        setScore(prev => prev + questionScore);
        setStreak(prev => prev + 1);
        setXp(prev => prev + (questionScore / 10));
        playSound('correct');
      } else {
        setStreak(0);
        playSound('wrong');
      }
      
      setShowResult(true);
      setLoading(false);
    }, 1500);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(600);
      setIsRunning(false);
      setIsCompleted(false);
      setHasStarted(false);
      setShowResult(false);
      setResult(null);
    } else {
      // Competition finished
      navigate(`/competition/${competitionId}/results`);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-500';
    if (timeLeft <= 180) return 'text-yellow-500';
    return 'text-green-500';
  };

  const progress = ((currentQuestionData?.timeLimit || 600) - timeLeft) / (currentQuestionData?.timeLimit || 600) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Animated Background */}
        <div className="bg-animation"></div>
        
        {/* Loading Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="loading-particle"
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                background: `rgba(${Math.random() > 0.5 ? '6, 95, 70' : '217, 119, 6'}, 0.4)`,
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
          className="w-40 h-40 rounded-2xl flex items-center justify-center relative z-10"
          style={{ 
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-white border-t-transparent"></div>
        </div>
        
        <style jsx>{`
          @keyframes loadingPulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.4;
            }
            50% { 
              transform: scale(2);
              opacity: 0.9;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="bg-animation"></div>
      
      {/* Enhanced Floating Game Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Trophy Icons */}
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '8%',
          left: '8%',
          fontSize: '48px',
          color: 'rgba(6, 95, 70, 0.4)',
          animation: 'floatUpDown 4s ease-in-out infinite',
          animationDelay: '0s'
        }}>🏆</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '25%',
          right: '12%',
          fontSize: '40px',
          color: 'rgba(217, 119, 6, 0.4)',
          animation: 'floatUpDown 5s ease-in-out infinite',
          animationDelay: '2s'
        }}>🚀</div>
        
        {/* Lightning and Energy Icons */}
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '45%',
          left: '5%',
          fontSize: '36px',
          color: 'rgba(15, 118, 110, 0.4)',
          animation: 'floatUpDown 6s ease-in-out infinite',
          animationDelay: '4s'
        }}>⚡</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          bottom: '20%',
          right: '8%',
          fontSize: '44px',
          color: 'rgba(4, 120, 87, 0.4)',
          animation: 'floatUpDown 4.5s ease-in-out infinite',
          animationDelay: '1s'
        }}>💡</div>
        
        {/* Target and Achievement Icons */}
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '60%',
          right: '20%',
          fontSize: '32px',
          color: 'rgba(6, 95, 70, 0.4)',
          animation: 'floatUpDown 5.5s ease-in-out infinite',
          animationDelay: '3s'
        }}>🎯</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          bottom: '35%',
          left: '15%',
          fontSize: '38px',
          color: 'rgba(217, 119, 6, 0.4)',
          animation: 'floatUpDown 4.8s ease-in-out infinite',
          animationDelay: '2.5s'
        }}>⭐</div>
        
        {/* Additional Gaming Icons */}
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          fontSize: '34px',
          color: 'rgba(15, 118, 110, 0.4)',
          animation: 'floatUpDown 5.2s ease-in-out infinite',
          animationDelay: '1.5s'
        }}>🎮</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          bottom: '15%',
          left: '8%',
          fontSize: '42px',
          color: 'rgba(4, 120, 87, 0.4)',
          animation: 'floatUpDown 4.2s ease-in-out infinite',
          animationDelay: '3.5s'
        }}>🔥</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          top: '70%',
          right: '5%',
          fontSize: '30px',
          color: 'rgba(6, 95, 70, 0.4)',
          animation: 'floatUpDown 6.2s ease-in-out infinite',
          animationDelay: '2.8s'
        }}>💎</div>
        
        <div className="floating-icon" style={{
          position: 'absolute',
          bottom: '50%',
          right: '25%',
          fontSize: '35px',
          color: 'rgba(217, 119, 6, 0.4)',
          animation: 'floatUpDown 4.7s ease-in-out infinite',
          animationDelay: '1.8s'
        }}>🎪</div>
        
        {/* Floating Particles - Only render on client side */}
        {isClient && [...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              position: 'absolute',
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: `rgba(${Math.random() > 0.5 ? '6, 95, 70' : '217, 119, 6'}, ${Math.random() * 0.3 + 0.2})`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particleFloat ${Math.random() * 8 + 12}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes floatUpDown {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.4;
          }
          25% { 
            transform: translateY(-30px) rotate(8deg) scale(1.1);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-15px) rotate(-5deg) scale(0.9);
            opacity: 0.5;
          }
          75% { 
            transform: translateY(-35px) rotate(3deg) scale(1.05);
            opacity: 0.7;
          }
        }
        
        @keyframes particleFloat {
          0% { 
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% { 
            opacity: 0.6;
          }
          90% { 
            opacity: 0.6;
          }
          100% { 
            transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(6, 95, 70, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(6, 95, 70, 0.6);
            transform: scale(1.05);
          }
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(6, 95, 70, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(6, 95, 70, 0.8);
          }
        }
        
        .bounce-in {
          animation: bounceIn 0.6s ease-out;
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .floating-icon {
            font-size: 24px !important;
            animation-duration: 6s !important;
          }
          .particle {
            animation-duration: 18s !important;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .floating-icon,
          .particle {
            animation: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header with Gamification */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(`/competition/${competitionId}`)}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center space-x-3"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '2px solid rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <RotateCcw className="w-5 h-5" />
              <span>Back to Competition</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const newSoundEnabled = soundManager.toggleSound();
                  setSoundEnabled(newSoundEnabled);
                }}
                className="p-3 rounded-xl transition-all duration-300 hover:scale-105"
                style={{
                  background: 'var(--gradient-card)',
                  border: '2px solid rgba(6, 95, 70, 0.2)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} /> : <VolumeX className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />}
              </button>
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div 
              className="rounded-2xl p-6 border-2 text-center"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {score}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Score
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 border-2 text-center"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: 'var(--gradient-accent)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {streak}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Streak
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 border-2 text-center"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: 'var(--gradient-secondary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <Star className="w-6 h-6 text-white" />
              </div>
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {xp}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                XP Points
              </div>
            </div>
            
            <div 
              className="rounded-2xl p-6 border-2 text-center"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: 'var(--gradient-primary)',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Level {level}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Current Level
              </div>
            </div>
          </div>

          {/* Question Progress */}
          <div 
            className="rounded-2xl p-8 border-2"
            style={{ 
              background: 'var(--gradient-card)',
              borderColor: 'rgba(6, 95, 70, 0.2)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Question {currentQuestion} of {totalQuestions}
              </h1>
              <div className="flex items-center space-x-4">
                <div 
                  className={`text-4xl font-bold ${getTimeColor()}`}
                  style={{ 
                    textShadow: '0 0 20px currentColor',
                    animation: timeLeft <= 60 ? 'pulseGlow 1s ease-in-out infinite' : 'none'
                  }}
                >
                  {formatTime(timeLeft)}
                </div>
                <div className="flex space-x-3">
                  {!isRunning && !isCompleted && (
                    <button
                      onClick={handleStart}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2 bounce-in glow"
                      style={{
                        background: 'var(--gradient-primary)',
                        boxShadow: 'var(--shadow-glow)'
                      }}
                    >
                      <Play className="w-5 h-5" />
                      <span>Start</span>
                    </button>
                  )}
                  {isRunning && (
                    <button
                      onClick={handlePause}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        boxShadow: 'var(--shadow-glow)'
                      }}
                    >
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '2px solid rgba(6, 95, 70, 0.2)',
                      boxShadow: 'var(--shadow-card)'
                    }}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full rounded-full h-4" style={{ background: 'rgba(6, 95, 70, 0.1)' }}>
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  progress > 80 ? 'bg-red-500' : 
                  progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${progress}%`,
                  boxShadow: progress > 80 ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Question Panel */}
          <div className="space-y-6">
            <div 
              className="rounded-2xl p-8 border-2"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentQuestionData?.title}
                </h2>
                <span 
                  className="px-4 py-2 text-sm rounded-xl font-semibold"
                  style={{
                    background: currentQuestionData?.difficulty === 'Easy' 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : currentQuestionData?.difficulty === 'Medium'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    color: currentQuestionData?.difficulty === 'Easy' 
                      ? 'var(--accent-green)' 
                      : currentQuestionData?.difficulty === 'Medium'
                      ? 'var(--accent-gold)'
                      : '#ef4444',
                    border: `1px solid ${
                      currentQuestionData?.difficulty === 'Easy' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : currentQuestionData?.difficulty === 'Medium'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)'
                    }`
                  }}
                >
                  {currentQuestionData?.difficulty}
                </span>
                <span 
                  className="px-4 py-2 text-sm rounded-xl font-semibold"
                  style={{
                    background: 'rgba(6, 95, 70, 0.1)',
                    color: 'var(--primary-green)',
                    border: '1px solid rgba(6, 95, 70, 0.2)'
                  }}
                >
                  {currentQuestionData?.points} pts
                </span>
              </div>
              
              <div className="prose max-w-none">
                <p 
                  className="text-lg mb-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {currentQuestionData?.description}
                </p>
                
                <h3 
                  className="text-xl font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Test Cases:
                </h3>
                <div className="space-y-3">
                  {currentQuestionData?.testCases.map((testCase, index) => (
                    <div 
                      key={index} 
                      className="p-4 rounded-xl"
                      style={{ background: 'rgba(6, 95, 70, 0.05)' }}
                    >
                      <div className="text-sm mb-2">
                        <span 
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Input:
                        </span> 
                        <span 
                          className="ml-2 font-mono"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {testCase.input}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span 
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Expected:
                        </span> 
                        <span 
                          className="ml-2 font-mono"
                          style={{ color: 'var(--accent-green)' }}
                        >
                          {testCase.expected}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor Panel */}
          <div className="space-y-6">
            <div 
              className="rounded-2xl p-8 border-2"
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Code Editor
                </h3>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Time spent: {formatTime((currentQuestionData?.timeLimit || 600) - timeLeft)}
                  </span>
                </div>
              </div>
              
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-96 p-6 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid rgba(6, 95, 70, 0.2)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-card)'
                }}
                placeholder="Write your solution here..."
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAutoSubmit}
                  disabled={loading || isCompleted}
                  className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 bounce-in"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Rocket className="w-5 h-5" />
                  <span>Submit Answer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Result Modal */}
        {showResult && result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className={`rounded-2xl p-8 max-w-md w-full mx-4 border-2 ${result.correct ? 'bounce-in' : 'shake'}`}
              style={{ 
                background: 'var(--gradient-card)',
                borderColor: 'rgba(6, 95, 70, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div className="text-center">
                <div 
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${result.correct ? 'glow' : ''}`}
                  style={{ 
                    background: result.correct ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  {result.correct ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-white" />
                  )}
                </div>
                
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {result.message}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Score:</span>
                    <span 
                      className="font-bold"
                      style={{ color: 'var(--primary-green)' }}
                    >
                      +{result.score}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Time Spent:</span>
                    <span 
                      className="font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatTime(result.timeSpent)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleNextQuestion}
                  className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Rocket className="w-5 h-5" />
                  <span>
                    {currentQuestion < totalQuestions ? 'Next Question' : 'View Results'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockCompetitionGameplay;
