// Mock Microservices Data for Frontend
// This file simulates data from various microservices in the DEVLAB ecosystem

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://devlab-backend-production-0bcb.up.railway.app/api' : 'http://localhost:3001/api')

export const mockMicroservices = {
  // Directory Service - User profiles, organizations, quotas
  directoryService: {
    getLearnerProfile: (userId) => ({
      user_id: userId,
      name: "John Doe",
      email: "learner@devlab.com",
      role: "learner",
      organizationId: 1,
      completed_courses: [
        { id: 1, name: "JavaScript Fundamentals" },
        { id: 2, name: "Advanced JavaScript Functions" }
      ],
      active_courses: [
        { id: 3, name: "Data Structures & Algorithms" },
        { id: 4, name: "React Development" }
      ],
      question_quotas: 4,
      daily_question_limit: 10,
      remaining_questions: 6
    }),

    getTrainerProfile: (userId) => ({
      user_id: userId,
      name: "Jane Smith",
      email: "trainer@devlab.com",
      role: "trainer",
      organizationId: 1,
      courses_created: [1, 2, 3, 4],
      expertise_areas: ["JavaScript", "Python", "Data Structures"],
      teaching_experience: "5 years"
    }),

    getOrganizationSettings: (orgId) => ({
      organization_id: orgId,
      name: "TechCorp Learning",
      question_quotas: 4,
      assessment_settings: {
        passing_score: 70,
        retry_limit: 3,
        time_limit: 30
      }
    })
  },

  // Content Studio Service - Courses, topics, skills
  contentStudio: {
    getCourses: () => [
      {
        course_id: 1,
        name: "JavaScript Fundamentals",
        level: "beginner",
        description: "Learn the basics of JavaScript programming",
        trainer_id: 2,
        topics: [101, 102, 103],
        ai_feedback: {
          difficulty_analysis: "Suitable for beginners",
          recommendations: ["Add more examples", "Include practical exercises"]
        }
      },
      {
        course_id: 2,
        name: "Advanced JavaScript Functions",
        level: "intermediate",
        description: "Master advanced JavaScript function concepts",
        trainer_id: 2,
        topics: [201, 202, 203],
        ai_feedback: {
          difficulty_analysis: "Intermediate level with complex concepts",
          recommendations: ["Add more real-world examples"]
        }
      },
      {
        course_id: 3,
        name: "Data Structures & Algorithms",
        level: "advanced",
        description: "Comprehensive guide to data structures and algorithms",
        trainer_id: 2,
        topics: [301, 302, 303],
        ai_feedback: {
          difficulty_analysis: "Advanced level requiring strong foundation",
          recommendations: ["Include more algorithm explanations"]
        }
      }
    ],

    getTopics: (courseId) => {
      const topics = {
        201: [
          {
            topic_id: 301,
            course_id: 201,
            topic_name: "JavaScript Fundamentals",
            nano_skills: ["Variable Declaration", "Data Type Identification", "Type Conversion", "Function Basics"],
            macro_skills: ["JavaScript Basics", "Programming Fundamentals"]
          },
          {
            topic_id: 302,
            course_id: 201,
            topic_name: "Functions and Scope",
            nano_skills: ["Function Declaration", "Scope Understanding", "Closures", "Hoisting"],
            macro_skills: ["JavaScript Functions", "Scope Management"]
          }
        ],
        203: [
          {
            topic_id: 401,
            course_id: 203,
            topic_name: "Asynchronous JavaScript",
            nano_skills: ["Promises", "Async/Await", "Event Loop", "Error Handling"],
            macro_skills: ["Asynchronous Programming", "JavaScript Concurrency"]
          },
          {
            topic_id: 402,
            course_id: 203,
            topic_name: "Modern JavaScript Features",
            nano_skills: ["ES6+ Syntax", "Destructuring", "Spread Operator", "Template Literals"],
            macro_skills: ["Modern JavaScript", "ES6+ Features"]
          }
        ],
        204: [
          {
            topic_id: 501,
            course_id: 204,
            topic_name: "Algorithm Analysis",
            nano_skills: ["Time Complexity", "Space Complexity", "Big O Notation", "Algorithm Efficiency"],
            macro_skills: ["Algorithm Analysis", "Complexity Theory"]
          },
          {
            topic_id: 502,
            course_id: 204,
            topic_name: "Sorting Algorithms",
            nano_skills: ["Bubble Sort", "Quick Sort", "Merge Sort", "Heap Sort"],
            macro_skills: ["Sorting Algorithms", "Algorithm Implementation"]
          },
          {
            topic_id: 503,
            course_id: 204,
            topic_name: "Dynamic Programming",
            nano_skills: ["Memoization", "Tabulation", "Optimal Substructure", "Overlapping Subproblems"],
            macro_skills: ["Dynamic Programming", "Optimization Techniques"]
          }
        ]
      }
      return topics[courseId] || []
    },

    getQuestions: (topicId) => [
      {
        question_id: 1001,
        topic_id: topicId,
        question_type: "code",
        question_content: "Write a function that returns the sum of two numbers",
        difficulty: "beginner",
        tags: ["functions", "arithmetic", "basics"],
        test_cases: [
          { input: "2, 3", expected_output: "5" },
          { input: "10, 20", expected_output: "30" }
        ]
      },
      {
        question_id: 1002,
        topic_id: topicId,
        question_type: "theoretical",
        question_content: "Explain the difference between let and var in JavaScript",
        difficulty: "intermediate",
        tags: ["variables", "scope", "hoisting"],
        expected_answer: "let has block scope while var has function scope..."
      }
    ]
  },

  // Assessment Service - Questions, test cases, evaluation
  assessmentService: {
    generateQuestions: (topicId, count, difficulty) => {
      return Array.from({ length: count }, (_, i) => ({
        question_id: `${topicId}_${i + 1}`,
        topic_id: topicId,
        question_type: "theoretical",
        question_content: `Generated question ${i + 1} for topic ${topicId}`,
        difficulty: difficulty || "intermediate",
        tags: ["generated", "practice"]
      }))
    },

    submitPracticeSession: (sessionData) => {
      return {
        session_id: `session_${Date.now()}`,
        status: "submitted",
        received_at: new Date().toISOString(),
        assessment_data: {
          question: sessionData.question,
          test_cases: sessionData.testCases,
          judge0_sandbox: sessionData.judge0Sandbox,
          gemini_integration: sessionData.geminiIntegration,
          user_code: sessionData.userCode,
          execution_results: sessionData.executionResults
        },
        feedback: {
          overall_score: Math.floor(Math.random() * 40) + 60, // 60-100
          code_quality: Math.floor(Math.random() * 30) + 70, // 70-100
          test_passing_rate: Math.floor(Math.random() * 30) + 70, // 70-100
          suggestions: [
            "Consider adding error handling",
            "Try to optimize your algorithm",
            "Good use of JavaScript features"
          ]
        }
      }
    },

    // Content Studio Integration - Generate questions based on user quotas
    generateQuestionsForContentStudio: async (contentStudioRequest) => {
      const { user_id, course_id, topic_id, difficulty } = contentStudioRequest;
      
      // Step 1: Get user data from Directory Service
      const userProfile = mockMicroservices.directoryService.getLearnerProfile(user_id);
      const questionCount = userProfile.question_quotas;
      
      // Step 2: Generate questions using Gemini (simulated)
      const questions = Array.from({ length: questionCount }, (_, i) => ({
        question_id: `q_${topic_id}_${i + 1}`,
        course_id: course_id,
        topic_id: topic_id,
        title: `Practice Question ${i + 1}`,
        description: `Create a JavaScript function for topic ${topic_id}`,
        difficulty: difficulty || "intermediate",
        language: "javascript",
        test_cases: [
          { input: [1, 2, 3], expected_output: 6 },
          { input: [-1, 2, 3], expected_output: 4 }
        ],
        hints: [
          "Consider using array methods",
          "Think about edge cases"
        ],
        solution: {
          code: "function solution(arr) { return arr.reduce((sum, num) => sum + num, 0); }",
          explanation: "This solution uses reduce to sum all numbers in the array"
        }
      }));

      // Step 3: Return complete question package to Content Studio
      return {
        success: true,
        user_id: user_id,
        question_count: questionCount,
        questions: questions,
        user_quotas: {
          total_quota: userProfile.question_quotas,
          daily_limit: userProfile.daily_question_limit,
          remaining: userProfile.remaining_questions
        },
        generated_at: new Date().toISOString(),
        content_studio_request: contentStudioRequest
      }
    },

    // Competition Service - Handle competitions between learners
    competitionService: {
      // Create a new competition invitation
      createCompetitionInvitation: (courseId, topicId, difficulty = "intermediate") => {
        const invitationId = `inv_${Date.now()}`;
        return {
          invitation_id: invitationId,
          course_id: courseId,
          topic_id: topicId,
          difficulty: difficulty,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          eligible_learners: [], // Will be populated with learners who completed the course
          accepted_by: [],
          competition_id: null
        }
      },

      // Get learners who completed a specific course
      getEligibleLearners: (courseId) => {
        // Mock data - in real system, this would query the database
        return [
          { user_id: 1, name: "John Doe", email: "john@devlab.com", completed_at: "2024-01-15" },
          { user_id: 2, name: "Jane Smith", email: "jane@devlab.com", completed_at: "2024-01-20" },
          { user_id: 3, name: "Bob Wilson", email: "bob@devlab.com", completed_at: "2024-01-18" }
        ];
      },

      // Accept competition invitation
      acceptInvitation: (invitationId, userId) => {
        return {
          success: true,
          invitation_id: invitationId,
          user_id: userId,
          accepted_at: new Date().toISOString(),
          message: "Successfully joined the competition!"
        }
      },

      // Create competition between two learners
      createCompetition: (invitationId, learner1Id, learner2Id) => {
        const competitionId = `comp_${Date.now()}`;
        return {
          competition_id: competitionId,
          invitation_id: invitationId,
          learner1: {
            user_id: learner1Id,
            name: "John Doe",
            score: 0,
            answers: [],
            completed_at: null
          },
          learner2: {
            user_id: learner2Id,
            name: "Jane Smith", 
            score: 0,
            answers: [],
            completed_at: null
          },
          status: "active",
          questions: [],
          started_at: new Date().toISOString(),
          ended_at: null,
          winner: null
        }
      },

      // Generate competition questions
      generateCompetitionQuestions: (courseId, topicId, difficulty) => {
        return [
          {
            question_id: "comp_q1",
            title: "Array Sum Challenge",
            description: "Write a function that returns the sum of all numbers in an array.",
            difficulty: difficulty,
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
            description: "Write a function that reverses a string.",
            difficulty: difficulty,
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
            description: "Write a function that finds the maximum number in an array.",
            difficulty: difficulty,
            language: "javascript", 
            time_limit: 180, // 3 minutes
            test_cases: [
              { input: [1, 5, 3, 9, 2], expected_output: 9 },
              { input: [-1, -5, -3], expected_output: -1 },
              { input: [42], expected_output: 42 }
            ],
            points: 100
          }
        ];
      },

      // Submit answer for a competition question
      submitAnswer: (competitionId, userId, questionId, answer) => {
        return {
          success: true,
          competition_id: competitionId,
          user_id: userId,
          question_id: questionId,
          answer: answer,
          submitted_at: new Date().toISOString(),
          time_taken: Math.floor(Math.random() * 300) // Mock time taken
        }
      },

      // End competition and calculate results
      endCompetition: async (competitionId) => {
        // Mock scoring - in real system, this would use Gemini
        const learner1Score = Math.floor(Math.random() * 300) + 200; // 200-500
        const learner2Score = Math.floor(Math.random() * 300) + 200; // 200-500
        
        const winner = learner1Score > learner2Score ? 1 : 2;
        
        return {
          competition_id: competitionId,
          ended_at: new Date().toISOString(),
          results: {
            learner1: {
              user_id: 1,
              name: "John Doe",
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
            name: winner === 1 ? "John Doe" : "Jane Smith",
            score: winner === 1 ? learner1Score : learner2Score
          },
          gemini_evaluation: {
            used: true,
            evaluation_time: "2.3s",
            confidence_score: 0.95
          }
        }
      },

      // Get user's competition history
      getUserCompetitionHistory: (userId) => {
        return [
          {
            competition_id: "comp_123",
            opponent: "Jane Smith",
            result: "won",
            score: 280,
            opponent_score: 250,
            date: "2024-01-20",
            course: "JavaScript Fundamentals"
          },
          {
            competition_id: "comp_124", 
            opponent: "Bob Wilson",
            result: "lost",
            score: 220,
            opponent_score: 300,
            date: "2024-01-18",
            course: "Data Structures"
          }
        ];
      },

      // Get leaderboard
      getLeaderboard: (courseId = null, timeRange = "all") => {
        return [
          { rank: 1, user_id: 1, name: "John Doe", wins: 5, total_score: 1250, win_rate: 0.83 },
          { rank: 2, user_id: 2, name: "Jane Smith", wins: 4, total_score: 1100, win_rate: 0.67 },
          { rank: 3, user_id: 3, name: "Bob Wilson", wins: 3, total_score: 950, win_rate: 0.60 },
          { rank: 4, user_id: 4, name: "Alice Johnson", wins: 2, total_score: 800, win_rate: 0.50 }
        ];
      }
    },

    evaluateCode: (code, testCases) => {
      const results = testCases.map(testCase => ({
        input: testCase.input,
        expected: testCase.expected_output,
        actual: "Code execution result",
        passed: Math.random() > 0.3 // 70% pass rate for demo
      }))
      
      const passedTests = results.filter(r => r.passed).length
      const score = Math.round((passedTests / results.length) * 100)
      
      return {
        score,
        results,
        feedback: score >= 70 ? "Great job!" : "Keep practicing!",
        suggestions: score < 70 ? ["Check your logic", "Review the requirements"] : []
      }
    },

    evaluateTheoretical: (answer, expectedAnswer) => {
      const similarity = Math.random() * 100 // Simulate AI evaluation
      return {
        score: Math.round(similarity),
        feedback: similarity >= 70 ? "Good understanding!" : "Consider reviewing the concepts",
        suggestions: similarity < 70 ? ["Read more about the topic", "Ask for clarification"] : []
      }
    }
  },

  // Learning Analytics Service - Progress tracking, insights
  learningAnalytics: {
    getUserProgress: (userId) => ({
      user_id: userId,
      skill_levels: {
        "JavaScript": "Intermediate",
        "Python": "Beginner",
        "Data Structures": "Advanced"
      },
      recommendations: [
        "Focus on async programming concepts",
        "Practice more algorithm problems",
        "Review closure concepts"
      ]
    }),

    getCourseAnalytics: (courseId) => ({
      course_id: courseId,
      total_enrollments: 150,
      completion_rate: 0.75,
      average_score: 82,
      common_difficulties: [
        "Understanding closures",
        "Async/await patterns",
        "Array methods"
      ],
      improvement_suggestions: [
        "Add more examples for closures",
        "Include interactive exercises",
        "Provide step-by-step solutions"
      ]
    }),

    generateInsights: (userId, timeRange) => ({
      user_id: userId,
      time_range: timeRange,
      learning_velocity: 8.5,
      skill_improvement: 15,
      engagement_score: 9.2,
      focus_areas: [
        "JavaScript Fundamentals",
        "Data Structures",
        "Algorithm Design"
      ],
      next_recommendations: [
        "Try advanced JavaScript concepts",
        "Practice coding challenges",
        "Join study groups"
      ]
    })
  },

  // HR Reporting Service - Performance tracking, reporting
  hrReporting: {
    getEmployeeProgress: (userId) => ({
      user_id: userId,
      employee_id: "EMP001",
      department: "Engineering",
      manager: "Jane Smith",
      learning_goals: [
        { goal: "Master JavaScript", progress: 75, deadline: "2024-06-01" },
        { goal: "Learn React", progress: 40, deadline: "2024-08-01" }
      ],
      performance_metrics: {
        learning_velocity: 8.5,
        skill_improvement: 15,
        engagement_score: 9.2
      }
    }),

    generateReport: (organizationId, period) => ({
      organization_id: organizationId,
      period: period,
      total_learners: 150,
      active_learners: 120,
      completed_courses: 45,
      average_completion_time: 14, // days
      top_performers: [
        { user_id: 1, name: "John Doe", score: 95 },
        { user_id: 2, name: "Jane Smith", score: 92 }
      ]
    })
  },

  // Contextual Corporate Assistant - AI-powered assistance
  contextualAssistant: {
    getPersonalizedContent: (userId, context) => ({
      user_id: userId,
      context: context,
      recommendations: [
        {
          type: "practice",
          content: "Try this JavaScript closure exercise",
          reason: "Based on your current learning path"
        },
        {
          type: "resource",
          content: "Read about async/await patterns",
          reason: "Will help with your current topic"
        }
      ],
      chatbot_suggestions: [
        "Ask me about JavaScript closures",
        "Need help with async programming?",
        "Want to practice coding challenges?"
      ]
    }),

    getLearningPath: (userId, goals) => ({
      user_id: userId,
      goals: goals,
      recommended_path: [
        { step: 1, topic: "JavaScript Basics", estimated_time: "2 weeks" },
        { step: 2, topic: "Functions and Scope", estimated_time: "1 week" },
        { step: 3, topic: "Async Programming", estimated_time: "2 weeks" }
      ],
      milestones: [
        { milestone: "Complete JavaScript Basics", reward: "Basics Badge" },
        { milestone: "Score 80% on assessment", reward: "Problem Solver Badge" }
      ]
    })
  },

  // Sandbox API - Code execution
  sandboxService: {
    executeCode: async (code, language, testCases) => {
      // Simulate code execution
      return {
        output: "Code executed successfully",
        error: null,
        execution_time: Math.random() * 1000, // ms
        memory_usage: Math.random() * 100, // MB
        test_results: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected_output,
          actual: "Simulated output",
          passed: Math.random() > 0.2
        }))
      }
    },

    validateCode: (code, requirements) => {
      return {
        syntax_valid: true,
        performance_score: Math.random() * 100,
        best_practices_score: Math.random() * 100,
        suggestions: [
          "Consider using const instead of var",
          "Add error handling for edge cases"
        ]
      }
    }
  },

  // Gemini API - AI-powered features (Real Integration via Backend)
  geminiService: {
    generateQuestion: async (topic, difficulty, language, type, nanoSkills = [], macroSkills = []) => {
      try {
        console.log('Calling Gemini API with:', { topic, difficulty, language, type, nanoSkills, macroSkills })

        const response = await fetch(`${API_BASE_URL}/gemini/generate-question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic, difficulty, language, type, nanoSkills, macroSkills })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('Gemini API response:', result)

        if (result.success && result.question) {
          return result.question
        } else {
          throw new Error('Invalid response from Gemini API')
        }
      } catch (error) {
        console.error('Gemini API error:', error)
        // No fallback - throw error to ensure real API is used
        throw new Error(`Failed to generate question with Gemini: ${error.message}`)
      }
    },

    evaluateCode: async (code, question, language = 'javascript', testCases = []) => {
      try {
        const response = await fetch(`${API_BASE_URL}/gemini/evaluate-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, question, language, testCases })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.evaluation
      } catch (error) {
        console.error('Gemini API error:', error)
        // No fallback - throw error to ensure real API is used
        throw new Error(`Failed to evaluate code with Gemini: ${error.message}`)
      }
    },

    generateHint: async (question, userAttempt, hintsUsed = 0, allHints = []) => {
      try {
        const response = await fetch(`${API_BASE_URL}/gemini/generate-hint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, userAttempt, hintsUsed, allHints })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.hint
      } catch (error) {
        console.error('Gemini API error:', error)
        // No fallback - throw error to ensure real API is used
        throw new Error(`Failed to generate hint with Gemini: ${error.message}`)
      }
    },

    detectCheating: async (code, question) => {
      try {
        const response = await fetch(`${API_BASE_URL}/gemini/detect-cheating`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, question })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.detection
      } catch (error) {
        console.error('Gemini API error:', error)
        // No fallback - throw error to ensure real API is used
        throw new Error(`Failed to detect cheating with Gemini: ${error.message}`)
      }
    }
  }
}

export default mockMicroservices