// Mock Microservices Data
// This file simulates data from various microservices in the DEVLAB ecosystem

export const mockMicroservices = {
  // Directory Service - User profiles, organizations, quotas
  directoryService: {
    getLearnerProfile: (userId) => ({
      user_id: userId,
      name: "John Doe",
      email: "learner@devlab.com",
      role: "learner",
      organizationId: 1,
      completed_courses: [1, 2],
      active_courses: [3, 4],
      question_quotas: 4,
      learning_preferences: {
        difficulty_preference: "intermediate",
        preferred_languages: ["JavaScript", "Python"],
        learning_style: "hands-on"
      }
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
      learning_paths: ["Frontend Development", "Backend Development", "Data Science"],
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
      total_courses: 5,
      completed_courses: 2,
      in_progress_courses: 2,
      total_practice_sessions: 15,
      average_score: 78,
      learning_streak: 7,
      time_spent: "24 hours",
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

  // NOTE: Gemini AI functionality is now handled directly by the backend
  // This mock service only handles microservice communication
  // All question generation, hints, solutions, and feedback now use real Gemini AI
}

export default mockMicroservices