import { QuestionModel } from '../models/Question.js'
import { geminiService } from '../services/gemini.js'
import { fetchAssessmentTheoreticalQuestions } from '../services/assessmentClient.js'

export const questionController = {

  // Get personalized questions using Gemini AI
  async getPersonalizedQuestions(req, res) {
    try {
      const { courseId, topicId, type, difficulty = 'beginner', language = 'javascript' } = req.query
      
      // First try to get existing questions from database
      let questions = await QuestionModel.find({ courseId, topicId, type })

      // If no questions exist, generate new ones using Gemini AI
      if (!questions || questions.length === 0) {
        try {
          const topicName = `Course ${courseId} - Topic ${topicId}`
          const nanoSkills = [] // Can be populated from course/topic data
          const macroSkills = [] // Can be populated from course/topic data

          if (type === 'code') {
            const generated = await geminiService.generateCodingQuestion(
              topicName,
              [...nanoSkills, ...macroSkills],
              1,
              language,
              {
                humanLanguage: 'en',
                topic_id: topicId
              }
            )
            const question = Array.isArray(generated) ? generated[0] || {} : generated || {}
            questions = [{
              id: `gemini-${Date.now()}`,
              title: question.title || 'AI Generated Coding Question',
              description: question.description || question.question,
              type: 'code',
              courseId,
              topicId,
              difficulty: question.difficulty || difficulty,
              language: question.language || language,
              testCases: question.testCases || [],
              hints: question.hints || [],
              solution: question.solution,
              createdBy: 'gemini',
              isAIGenerated: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }]
          } else {
            const theoreticalQuestions = await fetchAssessmentTheoreticalQuestions({
              topic_id: topicId,
              topic_name: topicName,
              amount: 1,
              difficulty,
              humanLanguage: 'en',
              nanoSkills,
              microSkills: macroSkills
            })
            const question = theoreticalQuestions?.[0] || {}
            questions = [{
              id: `gemini-${Date.now()}`,
              title: question.title || 'AI Generated Theoretical Question',
              description: question.description || question.question,
              type: 'theoretical',
              courseId,
              topicId,
              difficulty: question.difficulty || difficulty,
              options: question.options || {},
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              hints: question.hints || [],
              createdBy: 'gemini',
              isAIGenerated: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }]
          }
        } catch (geminiError) {
          console.error('Error generating questions with Gemini:', geminiError)
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to generate questions with Gemini AI' 
          })
        }
      }

      // Remove deprecated fields from all questions
      const cleanedQuestions = questions.map(q => {
        const cleaned = { ...q }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        delete cleaned.courseName // Remove courseName - no longer used
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        return cleaned
      })

      res.json({ success: true, data: cleanedQuestions })
    } catch (error) {
      console.error('Error fetching personalized questions:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  // Generate hint using Gemini AI
  async requestHint(req, res) {
    try {
      const { id } = req.params
      const { hintNumber = 1, userAttempt = '' } = req.body
      const userId = req.user?.id
      
      const question = await QuestionModel.findById(id)
      if (!question) return res.status(404).json({ success: false, error: 'Question not found' })

      // If question already has hints, return existing ones
      if (question.hints && question.hints.length >= hintNumber) {
        return res.json({
          success: true,
          data: {
            hint: question.hints[hintNumber - 1],
            hintsRemaining: question.hints.length - hintNumber,
            hintLevel: hintNumber,
          },
        })
      }

      // Generate new hint using Gemini AI
      try {
        const allHints = question.hints || []
        const hint = await geminiService.generateHints(
          question.description || question.question_content,
          userAttempt,
          hintNumber - 1,
          allHints
        )

        // Save the new hint to the question
        if (!question.hints) question.hints = []
        question.hints.push(hint.hint || hint)
        await question.save()

        res.json({
          success: true,
          data: {
            hint: hint.hint || hint,
            hintsRemaining: 3 - hintNumber, // Maximum 3 hints
            hintLevel: hintNumber,
            encouragement: hint.encouragement || 'Keep going!',
            nextSteps: hint.nextSteps || [],
          },
        })
      } catch (geminiError) {
        console.error('Error generating hint with Gemini:', geminiError)
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to generate hint with Gemini AI' 
        })
      }
    } catch (error) {
      console.error('Error generating hint:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  // Get solution using Gemini AI
  async getSolution(req, res) {
    try {
      const { id } = req.params
      const question = await QuestionModel.findById(id)
      if (!question) return res.status(404).json({ success: false, error: 'Question not found' })

      // If question already has a solution, return it
      if (question.solution) {
        return res.json({ 
          success: true, 
          data: { 
            solution: question.solution, 
            explanation: question.explanation,
            language: question.language || 'javascript'
          } 
        })
      }

      // Generate solution using Gemini AI
      try {
        let solution, explanation
        
        if (question.type === 'code') {
          // Generate coding solution
          const solutionCandidates = await geminiService.generateCodingQuestion(
            question.description || question.question_content,
            [],
            1,
            question.language || 'javascript',
            {
              humanLanguage: 'en',
              topic_id: question.topicId || question.topic_id || null
            }
          )
          const solutionData = Array.isArray(solutionCandidates)
            ? solutionCandidates[0] || {}
            : solutionCandidates || {}
          solution = solutionData.solution
          explanation = solutionData.explanation
        } else {
          // Generate theoretical solution
          const theoreticalQuestions = await fetchAssessmentTheoreticalQuestions({
            topic_id: question.topicId || question.topic_id || null,
            topic_name: question.topicName || question.topic_name || question.description || question.question_content,
            amount: 1,
            difficulty: question.difficulty || 'beginner',
            humanLanguage: 'en',
            nanoSkills: [],
            microSkills: []
          })
          const solutionData = theoreticalQuestions?.[0] || {}
          solution = solutionData.correctAnswer || solutionData.correct_answer || null
          explanation = solutionData.explanation
        }

        // Save the solution to the question
        question.solution = solution
        question.explanation = explanation
        await question.save()

        res.json({ 
          success: true, 
          data: { 
            solution, 
            explanation,
            language: question.language || 'javascript'
          } 
        })
      } catch (geminiError) {
        console.error('Error generating solution with Gemini:', geminiError)
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to generate solution with Gemini AI' 
        })
      }
    } catch (error) {
      console.error('Error generating solution:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  // Submit answer and evaluate using Gemini AI
  async submitAnswer(req, res) {
    try {
      const { id } = req.params
      const { answer, language = 'javascript', timeSpent = 0 } = req.body
      const userId = req.user?.id
      
      const question = await QuestionModel.findById(id)
      if (!question) return res.status(404).json({ success: false, error: 'Question not found' })

      // Evaluate the answer using Gemini AI
      try {
        // First check for potential cheating
        const cheatingDetection = await geminiService.detectCheating(
          answer,
          question.description || question.question_content
        )

        // Evaluate the answer
        const evaluation = await geminiService.evaluateCodeSubmission(
          answer,
          question.description || question.question_content,
          language,
          question.testCases || []
        )

        // Save the submission to database
        const submission = {
          userId,
          answer,
          language,
          timeSpent,
          evaluation,
          cheatingDetection,
          submittedAt: new Date().toISOString()
        }

        // Update question with submission
        if (!question.submissions) question.submissions = []
        question.submissions.push(submission)
        await question.save()

        res.json({ 
          success: true, 
          data: {
            submission,
            evaluation,
            cheatingDetection,
            score: evaluation.score || 0,
            feedback: evaluation.feedback || 'No feedback available',
            suggestions: evaluation.suggestions || []
          }
        })
      } catch (geminiError) {
        console.error('Error evaluating answer with Gemini:', geminiError)
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to evaluate answer with Gemini AI' 
        })
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async getFeedback(req, res) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      
      const question = await QuestionModel.findById(id)
      if (!question) return res.status(404).json({ success: false, error: 'Question not found' })

      // Find user's submission
      const userSubmission = question.submissions?.find(sub => sub.userId === userId)
      if (!userSubmission) {
        return res.status(404).json({ success: false, error: 'No submission found for this user' })
      }

      // Generate enhanced feedback using Gemini AI
      try {
        const feedback = await geminiService.generateLearningRecommendations(
          {
            userId,
            questionType: question.type,
            difficulty: question.difficulty,
            language: question.language
          },
          {
            submission: userSubmission,
            evaluation: userSubmission.evaluation,
            question: question
          }
        )

        res.json({ 
          success: true, 
          data: {
            feedback,
            evaluation: userSubmission.evaluation,
            score: userSubmission.evaluation?.score || 0,
            cheatingDetection: userSubmission.cheatingDetection,
            submittedAt: userSubmission.submittedAt
          }
        })
      } catch (geminiError) {
        console.error('Error generating feedback with Gemini:', geminiError)
        // Fallback to stored evaluation
        res.json({ 
          success: true, 
          data: {
            feedback: userSubmission.evaluation?.feedback || 'Feedback not available',
            evaluation: userSubmission.evaluation,
            score: userSubmission.evaluation?.score || 0,
            cheatingDetection: userSubmission.cheatingDetection,
            submittedAt: userSubmission.submittedAt
          }
        })
      }
    } catch (error) {
      console.error('Error getting feedback:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },


  async getQuestion(req, res) {
    try {
      const { id } = req.params
      const question = await QuestionModel.findById(id)
      
      // Remove deprecated fields from question
      if (question) {
        const cleaned = { ...question.toObject ? question.toObject() : question }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        delete cleaned.courseName // Remove courseName - no longer used
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        res.json({ success: true, data: cleaned })
      } else {
        res.json({ success: true, data: question })
      }
    } catch (error) {
      console.error('Error getting question:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async createQuestion(req, res) {
    try {
      const questionData = req.body
      const question = await QuestionModel.create(questionData)
      
      // Remove deprecated fields from question
      if (question) {
        const cleaned = { ...(question.toObject ? question.toObject() : question) }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        res.json({ success: true, data: cleaned })
      } else {
        res.json({ success: true, data: question })
      }
    } catch (error) {
      console.error('Error creating question:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async updateQuestion(req, res) {
    try {
      const { id } = req.params
      const updateData = req.body
      const question = await QuestionModel.update(id, updateData)
      
      // Remove deprecated fields from question
      if (question) {
        const cleaned = { ...(question.toObject ? question.toObject() : question) }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        res.json({ success: true, data: cleaned })
      } else {
        res.json({ success: true, data: question })
      }
    } catch (error) {
      console.error('Error updating question:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async deleteQuestion(req, res) {
    try {
      const { id } = req.params
      await QuestionModel.delete(id)
      res.json({ success: true, message: 'Question deleted successfully' })
    } catch (error) {
      console.error('Error deleting question:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async getQuestionsByCourse(req, res) {
    try {
      const { courseId } = req.params
      const questions = await QuestionModel.findByCourse(courseId)
      
      // Remove deprecated fields from all questions
      const cleanedQuestions = questions.map(q => {
        const cleaned = { ...(q.toObject ? q.toObject() : q) }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        return cleaned
      })
      
      res.json({ success: true, data: cleanedQuestions })
    } catch (error) {
      console.error('Error getting questions by course:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async validateQuestion(req, res) {
    try {
      const { id } = req.params
      const validation = await QuestionModel.validate(id)
      res.json({ success: true, data: validation })
    } catch (error) {
      console.error('Error validating question:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
