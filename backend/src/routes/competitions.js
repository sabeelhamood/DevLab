// backend/src/routes/competitions.js
import express from 'express';
import mockMicroservices from '../services/mockMicroservices.js';
import { geminiService } from '../services/gemini.js';


const router = express.Router();

// Create competition invitation
router.post('/create-invitation', async (req, res) => {
  try {
    const { courseId, topicId, difficulty } = req.body;
    
    if (!courseId || !topicId) {
      return res.status(400).json({
        error: 'Course ID and Topic ID are required'
      });
    }

    const invitation = mockMicroservices.competitionService.createCompetitionInvitation(
      courseId, 
      topicId, 
      difficulty
    );

    // Get eligible learners for this course
    const eligibleLearners = mockMicroservices.competitionService.getEligibleLearners(courseId);
    invitation.eligible_learners = eligibleLearners;

    res.json({
      success: true,
      invitation,
      eligible_learners: eligibleLearners
    });

  } catch (error) {
    console.error('Error creating competition invitation:', error);
    res.status(500).json({
      error: 'Failed to create competition invitation',
      message: error.message
    });
  }
});

// Accept competition invitation
router.post('/accept-invitation', async (req, res) => {
  try {
    const { invitationId, userId } = req.body;
    
    if (!invitationId || !userId) {
      return res.status(400).json({
        error: 'Invitation ID and User ID are required'
      });
    }

    const result = mockMicroservices.competitionService.acceptInvitation(invitationId, userId);

    res.json(result);

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      error: 'Failed to accept invitation',
      message: error.message
    });
  }
});

// Create competition between two learners
router.post('/create-competition', async (req, res) => {
  try {
    const { invitationId, learner1Id, learner2Id } = req.body;
    
    if (!invitationId || !learner1Id || !learner2Id) {
      return res.status(400).json({
        error: 'Invitation ID and both learner IDs are required'
      });
    }

    const competition = mockMicroservices.competitionService.createCompetition(
      invitationId, 
      learner1Id, 
      learner2Id
    );

    // Generate questions for the competition
    const questions = mockMicroservices.competitionService.generateCompetitionQuestions(
      competition.course_id || 1,
      competition.topic_id || 'functions',
      competition.difficulty || 'intermediate'
    );
    
    competition.questions = questions;

    res.json({
      success: true,
      competition
    });

  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({
      error: 'Failed to create competition',
      message: error.message
    });
  }
});

// Submit answer for a competition question
router.post('/submit-answer', async (req, res) => {
  try {
    const { competitionId, userId, questionId, answer } = req.body;
    
    if (!competitionId || !userId || !questionId || !answer) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    const result = mockMicroservices.competitionService.submitAnswer(
      competitionId, 
      userId, 
      questionId, 
      answer
    );

    res.json(result);

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      error: 'Failed to submit answer',
      message: error.message
    });
  }
});

// End competition and get results
router.post('/end-competition', async (req, res) => {
  try {
    const { competitionId, userAnswers } = req.body;
    
    if (!competitionId) {
      return res.status(400).json({
        error: 'Competition ID is required'
      });
    }

    // Get competition data
    const competition = mockMicroservices.competitionService.createCompetition('inv_123', 1, 2);
    
    // Use Gemini to evaluate answers if provided
    let geminiEvaluation = null;
    if (userAnswers && userAnswers.length > 0) {
      try {
        console.log('🤖 Using Gemini to evaluate competition answers...');
        
        // Evaluate each answer with Gemini
        const evaluations = [];
        for (const answer of userAnswers) {
          const question = competition.questions.find(q => q.question_id === answer.questionId);
          if (question) {
            const evaluation = await geminiService.evaluateCodeSubmission(
              answer.answer,
              {
                question_content: question.description,
                test_cases: question.test_cases,
                difficulty: question.difficulty
              },
              'javascript'
            );
            evaluations.push({
              questionId: answer.questionId,
              score: evaluation.score,
              feedback: evaluation.feedback,
              isCorrect: evaluation.isCorrect
            });
          }
        }
        
        geminiEvaluation = {
          used: true,
          evaluations: evaluations,
          totalScore: evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0),
          averageScore: evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length,
          evaluation_time: "2.3s",
          confidence_score: 0.95
        };
        
        console.log('✅ Gemini evaluation completed:', geminiEvaluation);
      } catch (error) {
        console.warn('⚠️ Gemini evaluation failed, using fallback:', error.message);
        geminiEvaluation = {
          used: false,
          error: error.message,
          fallback: true
        };
      }
    }

    // Calculate final results with or without Gemini
    const learner1Score = geminiEvaluation ? 
      Math.floor(geminiEvaluation.totalScore) : 
      Math.floor(Math.random() * 300) + 200;
    
    const learner2Score = Math.floor(Math.random() * 300) + 200;
    
    const winner = learner1Score > learner2Score ? 1 : 2;
    
    const results = {
      competition_id: competitionId,
      ended_at: new Date().toISOString(),
      results: {
        learner1: {
          user_id: 1,
          name: "You",
          score: learner1Score,
          questions_correct: Math.floor(learner1Score / 100),
          time_taken: Math.floor(Math.random() * 900) + 300
        },
        learner2: {
          user_id: 2, 
          name: "Jane Smith",
          score: learner2Score,
          questions_correct: Math.floor(learner2Score / 100),
          time_taken: Math.floor(Math.random() * 900) + 300
        }
      },
      winner: {
        user_id: winner,
        name: winner === 1 ? "You" : "Jane Smith",
        score: winner === 1 ? learner1Score : learner2Score
      },
      gemini_evaluation: geminiEvaluation
    };

    // Save results for analytics
    try {
      const analyticsData = mockMicroservices.competitionService.saveCompetitionResults(competitionId, results);
      console.log('📊 Competition results saved for analytics:', analyticsData);
      
      // Track user win if applicable
      if (results.winner.user_id === 1) {
        const winTracking = mockMicroservices.analyticsService.trackUserWin(
          results.winner.user_id,
          competitionId,
          results.winner.score
        );
        console.log('🏆 User win tracked:', winTracking);
      }
    } catch (analyticsError) {
      console.warn('⚠️ Analytics tracking failed:', analyticsError.message);
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error ending competition:', error);
    res.status(500).json({
      error: 'Failed to end competition',
      message: error.message
    });
  }
});

// Get user's competition history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const history = mockMicroservices.competitionService.getUserCompetitionHistory(userId);

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Error getting competition history:', error);
    res.status(500).json({
      error: 'Failed to get competition history',
      message: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { courseId, timeRange } = req.query;
    
    const leaderboard = mockMicroservices.competitionService.getLeaderboard(courseId, timeRange);

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

// Get active competitions for a user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock active competitions
    const activeCompetitions = [
      {
        competition_id: "comp_active_1",
        opponent: "Jane Smith",
        status: "active",
        current_question: 2,
        total_questions: 3,
        time_remaining: 180,
        your_score: 150,
        opponent_score: 120
      }
    ];

    res.json({
      success: true,
      active_competitions: activeCompetitions
    });

  } catch (error) {
    console.error('Error getting active competitions:', error);
    res.status(500).json({
      error: 'Failed to get active competitions',
      message: error.message
    });
  }
});

// Get competition analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange, courseId } = req.query;
    
    const analytics = mockMicroservices.analyticsService.getCompetitionAnalytics(timeRange, courseId);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error getting competition analytics:', error);
    res.status(500).json({
      error: 'Failed to get competition analytics',
      message: error.message
    });
  }
});

export default router;
