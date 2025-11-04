/**
 * Microservice Mock Data
 * Fallback mock responses for when microservices are unavailable
 * This ensures the application remains functional even if microservices fail
 */

/**
 * Mock coding questions for when Gemini API fails
 * Used when Content Studio requests coding questions but Gemini is unavailable
 */
export const mockCodingQuestions = (params) => {
  const { 
    quantity = 4, 
    lesson_id, 
    course_name, 
    lesson_name, 
    nano_skills = [], 
    micro_skills = [], 
    programming_language = 'python' 
  } = params;
  
  const questions = [];
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (let i = 0; i < quantity; i++) {
    const difficulty = difficulties[i % 3];
    const skill = nano_skills[i % nano_skills.length] || 'programming';
    
    questions.push({
      question_text: `[Mock] ${course_name || 'Programming'} Question ${i + 1}: Write a function that demonstrates ${skill} concepts in ${programming_language}.`,
      difficulty: difficulty,
      test_cases: [
        {
          input: `test_input_${i + 1}`,
          expected_output: `expected_output_${i + 1}`,
          is_hidden: false
        },
        {
          input: `hidden_test_${i + 1}`,
          expected_output: `hidden_expected_${i + 1}`,
          is_hidden: true
        }
      ],
      tags: nano_skills.length > 0 ? [nano_skills[i % nano_skills.length]] : ['programming'],
      estimated_time: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
      programming_language: programming_language,
      lesson_context: {
        lesson_id: lesson_id,
        lesson_name: lesson_name,
        course_name: course_name
      }
    });
  }

  return questions.map((q, index) => ({
    ...q,
    source: 'mock',
    mock_note: 'Generated using mock data - Gemini API unavailable'
  }));
};

/**
 * Mock theoretical questions response for Assessment microservice
 * Used when Content Studio requests theoretical questions but Assessment is unavailable
 */
export const mockAssessmentTheoreticalQuestions = (params) => {
  const { quantity = 4, topic_name, programming_language, nano_skills, micro_skills, lesson_id, course_name, lesson_name } = params;
  
  const questions = [];
  for (let i = 0; i < quantity; i++) {
    questions.push({
      question_id: `mock_q_${Date.now()}_${i}`,
      question_text: `[Mock] ${topic_name || course_name || 'Theoretical'} Question ${i + 1}: Explain the concept of ${nano_skills?.[i % (nano_skills?.length || 1)] || 'core programming'} principles.`,
      question_type: 'theoretical',
      difficulty: ['easy', 'medium', 'hard'][i % 3],
      options: [
        'Option A: Correct answer',
        'Option B: Incorrect answer',
        'Option C: Incorrect answer',
        'Option D: Incorrect answer'
      ],
      correct_answer: 'A',
      explanation: 'This is a mock theoretical question used when Assessment microservice is unavailable.',
      tags: nano_skills || [],
      estimated_time: 5,
      style: {
        tags: micro_skills || [],
        estimated_time: 5
      },
      lesson_context: {
        lesson_id: lesson_id,
        lesson_name: lesson_name,
        course_name: course_name
      }
    });
  }

  return {
    success: true,
    questions,
    source: 'mock',
    message: 'Using mock data - Assessment microservice unavailable'
  };
};

/**
 * Mock competition performance response for Learning Analytics
 */
export const mockLearningAnalyticsResponse = (data) => {
  return {
    success: true,
    message: 'Competition performance data received (mock mode)',
    competition_id: data.competition_id,
    status: 'recorded_mock',
    source: 'mock',
    note: 'Learning Analytics microservice unavailable - data logged locally'
  };
};

/**
 * Mock course completion notification payload from Course Builder
 * Used for testing/development when Course Builder is unavailable
 * This simulates what Course Builder sends to DEVLAB when a learner completes a course
 */
export const mockCourseBuilderCompletionRequest = (learnerId = 'learner_123', courseId = 'course_456') => {
  return {
    course_id: courseId,
    learner_id: learnerId,
    completed_at: new Date().toISOString(),
    course_name: 'Python Fundamentals',
    completion_status: 'passed',
    score: 85,
    source: 'mock',
    note: 'Mock data - Course Builder service unavailable'
  };
};

/**
 * Mock course completion notification response for Course Builder
 * Used when DEVLAB tries to notify Course Builder (reverse direction)
 */
export const mockCourseBuilderResponse = (data) => {
  return {
    success: true,
    message: 'Course completion notification received (mock mode)',
    course_id: data.course_id,
    learner_id: data.learner_id,
    status: 'notified_mock',
    source: 'mock',
    note: 'Course Builder microservice unavailable - notification logged locally'
  };
};

/**
 * Mock RAG chatbot response
 */
export const mockRAGResponse = (query) => {
  return {
    success: true,
    response: 'I apologize, but the RAG chatbot service is currently unavailable. Please try again later or contact support for assistance.',
    source: 'mock',
    confidence: 0,
    suggestions: [
      'Check the service status',
      'Try again in a few moments',
      'Contact customer support if the issue persists'
    ]
  };
};

/**
 * Mock Content Studio notification response
 * Used when DEVLAB successfully generates questions but Content Studio is unavailable for notification
 */
export const mockContentStudioNotificationResponse = (data) => {
  return {
    success: true,
    notification_id: `mock_notification_${Date.now()}`,
    status: 'logged_locally',
    message: 'Question generation notification logged locally - Content Studio service unavailable',
    question_ids: data.question_ids || [],
    lesson_id: data.lesson_id,
    quantity: data.quantity,
    question_type: data.question_type,
    source: 'mock',
    timestamp: new Date().toISOString(),
    note: 'Content Studio microservice unavailable - notification will be retried later'
  };
};

/**
 * Mock Content Studio validation response
 * Used when Content Studio API is unavailable
 */
export const mockContentStudioValidationResponse = (data) => {
  return {
    success: true,
    validated: true,
    validation_id: `mock_validation_${Date.now()}`,
    validation_status: 'approved',
    validation_score: 85,
    feedback: 'Content validation completed using mock data - Content Studio service unavailable',
    recommendations: [
      'Content structure appears valid',
      'Consider adding more examples',
      'Ensure all required fields are present'
    ],
    source: 'mock',
    timestamp: new Date().toISOString(),
    note: 'Content Studio microservice unavailable - using mock validation'
  };
};

/**
 * Check if response is valid (2xx status, proper structure)
 */
export const isValidResponse = (response, expectedStructure = null) => {
  if (!response) return false;
  
  // Check if response has status code (for axios responses)
  if (response.status && (response.status < 200 || response.status >= 300)) {
    return false;
  }
  
  // Check if response has expected structure
  if (expectedStructure) {
    for (const key of expectedStructure) {
      if (!(key in (response.data || response))) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Check if error should trigger fallback
 */
export const shouldFallback = (error) => {
  if (!error) return false;
  
  // Network errors, timeouts
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.message?.includes('timeout')) {
    return true;
  }
  
  // HTTP errors (non-2xx)
  if (error.response) {
    const status = error.response.status;
    if (status < 200 || status >= 300) {
      return true;
    }
  }
  
  // Malformed data errors
  if (error.message?.includes('JSON') || 
      error.message?.includes('parse') ||
      error.message?.includes('malformed')) {
    return true;
  }
  
  return false;
};

