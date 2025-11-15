// Mock Microservices Data for Frontend
// This file simulates data from various microservices in the DEVLAB ecosystem

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://devlab-backend-production-0bcb.up.railway.app/api'
    : 'http://localhost:3001/api')

const DIFFICULTY_SEQUENCE = [
  'basic',
  'basic-plus',
  'intermediate',
  'upper-intermediate',
  'advanced',
  'advanced-plus',
  'expert'
]

const buildDifficultyLadder = (count) => {
  if (!count || count <= 0) return []
  return Array.from({ length: count }, (_, index) =>
    DIFFICULTY_SEQUENCE[Math.min(index, DIFFICULTY_SEQUENCE.length - 1)]
  )
}

const contentStudio = {
  getCourses: () => [
    {
      course_id: 1,
      name: "JavaScript Fundamentals",
      description: "Learn the basics of JavaScript programming",
      trainer_id: 2,
      topics: [101, 102, 103]
    },
    {
      course_id: 2,
      name: "Advanced JavaScript Functions",
      description: "Master advanced JavaScript function concepts",
      trainer_id: 2,
      topics: [201, 202, 203]
    },
    {
      course_id: 3,
      name: "Data Structures & Algorithms",
      description: "Comprehensive guide to data structures and algorithms",
      trainer_id: 2,
      topics: [301, 302, 303]
    }
  ],

  getTopics: (courseId) => {
    const topics = {
      201: [
        {
          topic_id: 301,
          topic_name: "JavaScript Fundamentals",
          skills: ["Variable Declaration", "Data Type Identification", "Type Conversion", "Function Basics"],
        },
        {
          topic_id: 302,
          topic_name: "Functions and Scope",
          skills: ["Function Declaration", "Scope Understanding", "Closures", "Hoisting"]
        }
      ],
      203: [
        {
          topic_id: 401,
          topic_name: "Asynchronous JavaScript",
          skills: ["Promises", "Async/Await", "Event Loop", "Error Handling"]
        },
        {
          topic_id: 402,
          topic_name: "Modern JavaScript Features",
          skills: ["ES6+ Syntax", "Destructuring", "Spread Operator", "Template Literals"]
        }
      ],
      204: [
        {
          topic_id: 501,
          topic_name: "Algorithm Analysis",
          skills: ["Time Complexity", "Space Complexity", "Big O Notation", "Algorithm Efficiency"]
        },
        {
          topic_id: 502,
          topic_name: "Sorting Algorithms",
          skills: ["Bubble Sort", "Quick Sort", "Merge Sort", "Heap Sort"]
        },
        {
          topic_id: 503,
          topic_name: "Dynamic Programming",
          skills: ["Memoization", "Tabulation", "Optimal Substructure", "Overlapping Subproblems"]
        }
      ]
    }
    return topics[courseId] || []
  },

  getQuestions: (topicId, amount = 4) => {
    const topicsByCourse = [
      ...contentStudio.getTopics(201),
      ...contentStudio.getTopics(203),
      ...contentStudio.getTopics(204)
    ]

    const topic = topicsByCourse.find(t => t.topic_id === topicId)
    const skills = topic ? topic.skills : []

    return Array.from({ length: amount }, (_, i) => ({
      question_id: `${topicId}_${i + 1}`,
      topic_id: topicId,
      topic_name: topic ? topic.topic_name : "Unknown Topic",
      skills: skills,
      question_type: i % 2 === 0 ? "code" : "theoretical",
      programming_language: "javascript",
      humanLanguage: "en"
    }))
  }
}

export const mockMicroservices = {
  // Content Studio Service - Courses, topics, skills
  contentStudio,

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
      const { user_id, course_id, topic_id, difficulty, amount } = contentStudioRequest;

      const questionCount = Number(amount) > 0 ? Number(amount) : 4;
      const ladder = buildDifficultyLadder(questionCount);
      
      // Step 2: Generate questions using Gemini (simulated)
      const questions = Array.from({ length: questionCount }, (_, i) => ({
        question_id: `q_${topic_id}_${i + 1}`,
        course_id: course_id,
        topic_id: topic_id,
        title: `Practice Question ${i + 1}`,
        description: `Create a JavaScript function for topic ${topic_id}`,
        difficulty: ladder[i] || difficulty || "intermediate",
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
        generated_at: new Date().toISOString(),
        content_studio_request: contentStudioRequest
      }
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
    generateQuestion: async (topic, difficulty, language, type, skills = []) => {
      try {
        const normalizedSkills = Array.isArray(skills) ? skills : skills ? [skills] : []
        console.log('Calling Gemini API with:', { topic, difficulty, language, type, skills: normalizedSkills })

        const response = await fetch(`${API_BASE_URL}/gemini/generate-question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic, difficulty, language, type, skills: normalizedSkills })
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