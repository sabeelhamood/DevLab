/**
 * Gemini API Client
 * Client for interacting with Google Gemini API
 */

import axios from 'axios';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';
import { mockCodingQuestions } from './microserviceMocks.js';

class GeminiClient {
  constructor() {
    // API key is automatically loaded from Railway Service Variables (GEMINI_API_KEY env var)
    // For local development: Set GEMINI_API_KEY in .env file
    this.apiKey = config.externalApis.gemini.apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Debug: Log raw environment variable check
    const rawEnvKey = process.env.GEMINI_API_KEY;
    logger.info('Gemini API key initialization', {
      hasConfigKey: !!this.apiKey,
      hasEnvKey: !!rawEnvKey,
      configKeyLength: this.apiKey?.length || 0,
      envKeyLength: rawEnvKey?.length || 0,
      envKeyPrefix: rawEnvKey ? rawEnvKey.substring(0, 10) + '...' : 'N/A',
      isPlaceholder: rawEnvKey?.includes('your-gemini') || rawEnvKey?.length < 20 || false
    });
    
    // Validate API key is present and not a placeholder
    if (!this.apiKey) {
      logger.error('GEMINI_API_KEY not found in environment variables. Will fallback to mock data.');
      logger.error('Debug: process.env.GEMINI_API_KEY =', rawEnvKey || 'undefined');
    } else if (this.apiKey.includes('your-gemini') || this.apiKey.length < 20) {
      logger.error('GEMINI_API_KEY appears to be a placeholder value. Please set a real API key in Railway Service Variables.', {
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 15) + '...',
        isPlaceholder: true
      });
    } else {
      logger.info('Gemini API key loaded successfully', {
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 10) + '...',
        isValidFormat: this.apiKey.startsWith('AIzaSy') || this.apiKey.length >= 20
      });
    }
  }

  /**
   * Generate questions using Gemini
   * @param {Object} params - Question generation parameters
   * @returns {Promise<Object>} Generated questions
   */
  async generateQuestions(params) {
    try {
      const {
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        programming_language,
        quantity = 4,
        language = 'english' // Human language for question generation
      } = params;

      const prompt = this.buildQuestionPrompt({
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        programming_language,
        quantity,
        language
      });

      // Validate API key before making request
      if (!this.apiKey || this.apiKey.includes('your-gemini') || this.apiKey.length < 20) {
        throw new Error(`Invalid Gemini API key: ${this.apiKey ? 'placeholder detected' : 'missing'}`);
      }

      logger.info('Sending request to Gemini API', {
        endpoint: `${this.baseURL}/models/gemini-pro:generateContent`,
        quantity,
        programming_language,
        lesson_id
      });

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // Increased to 30 seconds for better reliability
        }
      );

      // Debug: Log raw response structure
      logger.info('Gemini API response received', {
        hasCandidates: !!response.data?.candidates,
        candidatesCount: response.data?.candidates?.length || 0,
        hasContent: !!response.data?.candidates?.[0]?.content,
        hasParts: !!response.data?.candidates?.[0]?.content?.parts,
        responseKeys: Object.keys(response.data || {}),
        rawTextPreview: response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 200) || 'No text'
      });

      // Log full response data for debugging (truncated for large responses)
      const responsePreview = JSON.stringify(response.data).substring(0, 1000);
      logger.debug('Gemini API raw response (first 1000 chars):', { responsePreview });

      const questions = this.parseQuestionResponse(response.data, quantity);
      
      logger.info('Questions generated successfully', {
        quantity: questions.length,
        programming_language
      });

      return questions;
    } catch (error) {
      // Extract safe error information for logging
      const errorInfo = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
      
      if (error.response) {
        errorInfo.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      
      logger.error('Gemini API error:', errorInfo);
      
      // Check if we should fallback to mock data
      const isNetworkError = error.code === 'ECONNREFUSED' || 
                            error.code === 'ETIMEDOUT' || 
                            error.code === 'ENOTFOUND' ||
                            error.message?.includes('timeout');
      const isHttpError = error.response && (error.response.status < 200 || error.response.status >= 300);
      const isInvalidKey = error.response?.status === 400 && 
                          error.response?.data?.error?.message?.includes('API key');
      
      // Log detailed error information
      logger.error('Gemini API request failed', {
        errorType: isNetworkError ? 'network' : isHttpError ? 'http' : 'unknown',
        statusCode: error.response?.status,
        errorMessage: error.message,
        errorCode: error.code,
        lesson_id: params.lesson_id,
        programming_language: params.programming_language,
        isInvalidKey,
        apiKeyLength: this.apiKey?.length || 0,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'N/A'
      });
      
      if (isNetworkError || isHttpError || isInvalidKey) {
        logger.warn('Gemini API unavailable, using mock coding questions', {
          error: error.message,
          lesson_id: params.lesson_id,
          quantity: params.quantity,
          programming_language: params.programming_language,
          reason: isInvalidKey ? 'Invalid API key' : isNetworkError ? 'Network error' : 'HTTP error'
        });
        return mockCodingQuestions({
          quantity: params.quantity,
          lesson_id: params.lesson_id,
          course_name: params.course_name,
          lesson_name: params.lesson_name,
          nano_skills: params.nano_skills,
          micro_skills: params.micro_skills,
          programming_language: params.programming_language
        });
      }
      
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Build prompt for question generation
   */
  buildQuestionPrompt(params) {
    const { course_name, lesson_name, nano_skills, micro_skills, programming_language, quantity, language = 'english' } = params;
    
    // Map language names to proper language identifiers
    const languageMap = {
      'hebrew': 'Hebrew',
      'english': 'English',
      'arabic': 'Arabic',
      'russian': 'Russian',
      'spanish': 'Spanish',
      'french': 'French',
      'german': 'German',
      'chinese': 'Chinese',
      'japanese': 'Japanese',
      'korean': 'Korean'
    };
    
    const targetLanguage = languageMap[language?.toLowerCase()] || language || 'English';
    
    return `Generate ${quantity} coding practice questions for the following context. IMPORTANT: All questions, instructions, and explanations must be written in ${targetLanguage}:


Course: ${course_name}
Lesson: ${lesson_name}
Programming Language: ${programming_language}
Nano Skills: ${nano_skills.join(', ')}
Micro Skills: ${micro_skills.join(', ')}

Requirements:
1. All text (questions, instructions, explanations) MUST be in ${targetLanguage}
2. Distribute difficulty levels from low to high across all questions
3. Each question must include:
   - Clear problem statement in ${targetLanguage}
   - At least 3 test cases (2 public, 1 hidden)
   - Expected outputs for each test case
4. Questions should progressively increase in difficulty
5. Questions must be relevant to the specified skills
6. Return response in JSON format with array of questions
7. Code examples and variable names can be in English, but all explanations must be in ${targetLanguage}

Return format:
{
  "questions": [
    {
      "question_text": "...",
      "difficulty": "easy|medium|hard",
      "test_cases": [
        {
          "input": "...",
          "expected_output": "...",
          "is_hidden": false
        }
      ],
      "tags": ["..."],
      "estimated_time": 15
    }
  ]
}`;
  }

  /**
   * Parse Gemini response into question format
   */
  parseQuestionResponse(data, quantity) {
    try {
      // Extract text from Gemini response
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      if (!text) {
        logger.error('Gemini response has no text content', {
          dataStructure: Object.keys(data),
          candidates: data.candidates?.map(c => ({
            hasContent: !!c.content,
            hasParts: !!c.content?.parts,
            finishReason: c.finishReason
          }))
        });
        throw new Error('Gemini API returned empty response');
      }
      
      logger.debug('Parsing Gemini response text', {
        textLength: text.length,
        textPreview: text.substring(0, 500)
      });
      
      // Try multiple parsing strategies
      let parsed = null;
      
      // Strategy 1: Extract JSON from code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1]);
          logger.debug('Successfully parsed JSON from code block');
        } catch (e) {
          logger.warn('Failed to parse JSON from code block, trying other methods');
        }
      }
      
      // Strategy 2: Extract JSON object directly
      if (!parsed) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            logger.debug('Successfully parsed JSON from text match');
          } catch (e) {
            logger.warn('Failed to parse JSON from text match', { error: e.message });
          }
        }
      }
      
      // Strategy 3: Try parsing entire text as JSON
      if (!parsed) {
        try {
          parsed = JSON.parse(text.trim());
          logger.debug('Successfully parsed entire text as JSON');
        } catch (e) {
          logger.warn('Failed to parse entire text as JSON', { error: e.message });
        }
      }
      
      if (!parsed) {
        logger.error('Failed to parse Gemini response as JSON', {
          textPreview: text.substring(0, 1000),
          textLength: text.length
        });
        throw new Error('Could not extract valid JSON from Gemini response');
      }
      
      // Validate parsed structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        logger.error('Parsed JSON does not contain questions array', {
          parsedKeys: Object.keys(parsed),
          parsedType: typeof parsed,
          parsedPreview: JSON.stringify(parsed).substring(0, 500)
        });
        throw new Error('Invalid question format: response must contain "questions" array');
      }
      
      logger.info('Successfully parsed questions from Gemini', {
        questionsCount: parsed.questions.length,
        requestedQuantity: quantity
      });
      
      return parsed.questions.slice(0, quantity).map(q => ({
        ...q,
        source: 'gemini' // Mark as real Gemini questions
      }));
    } catch (error) {
      logger.error('Error parsing Gemini response:', {
        message: error.message,
        stack: error.stack,
        dataPreview: JSON.stringify(data).substring(0, 500)
      });
      throw new Error(`Failed to parse question response: ${error.message}`);
    }
  }

  /**
   * Generate feedback for solution
   */
  async generateFeedback(params) {
    try {
      const { code, question_context, execution_results, is_correct } = params;

      const prompt = this.buildFeedbackPrompt({
        code,
        question_context,
        execution_results,
        is_correct
      });

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Parse JSON from response (handles triple backticks)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      let parsed;
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
        parsed = JSON.parse(jsonString);
      } else {
        // Fallback: try to parse entire text as JSON
        parsed = JSON.parse(text);
      }
      
      return {
        feedback: parsed.feedback || parsed.evaluation || text,
        is_correct: parsed.is_correct !== undefined ? parsed.is_correct : is_correct,
        suggestions: parsed.suggestions || this.extractSuggestions(parsed.feedback || text),
        improvements: parsed.improvements || this.extractImprovements(parsed.feedback || text),
        code_quality: parsed.code_quality,
        specific_issues: parsed.specific_issues || [],
        optimized_version: parsed.optimized_version
      };
    } catch (error) {
      logger.error('Gemini feedback generation error:', error);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }

  /**
   * Build feedback prompt (unified for correct and incorrect solutions)
   */
  buildFeedbackPrompt(params) {
    const { code, question_context, execution_results, is_correct } = params;
    
    // Extract test cases from execution results
    const testCases = execution_results?.test_case_results || execution_results?.test_cases || [];
    const language = question_context.programming_language || 'code';
    
    return `You are an expert code reviewer. Evaluate this ${language} code submission for correctness and quality.

Question: ${question_context.question_text}
Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases: ${JSON.stringify(testCases)}

Execution Results: ${JSON.stringify(execution_results)}

Provide a comprehensive evaluation that:
1. Tests the code against the provided test cases
2. Evaluates code quality, readability, and efficiency
3. Checks for best practices and potential improvements
4. Provides constructive feedback
5. Suggests specific improvements

EVALUATION REQUIREMENTS:
- If code is WRONG: Highlight the SPECIFIC mistake line or logic error
- If code is CORRECT: Analyze efficiency and provide improvement tips
- For correct code: Optionally suggest a more optimized version
- Be specific about what's wrong and how to fix it
- Provide actionable feedback
- Do NOT reveal the complete solution for incorrect code - guide the learner instead

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- All JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

Return format:
\`\`\`json
{
  "is_correct": true,
  "feedback": "Comprehensive feedback text...",
  "code_quality": "good|fair|poor",
  "specific_issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "optimized_version": "optional optimized code if applicable"
}
\`\`\``;
  }

  /**
   * Generate all 3 hints for a question (single API call)
   */
  async generateHints(questionId, questionContext) {
    try {
      const prompt = `Generate 3 progressive hints for the following coding question. Each hint should be progressively more helpful but never reveal the final solution.

Question: ${questionContext.question_text}
Programming Language: ${questionContext.programming_language}

Requirements:
1. Hint 1: Very general direction, minimal information
2. Hint 2: More specific guidance, points to relevant concepts
3. Hint 3: Direct guidance toward solution approach (but not the answer itself)
4. All hints must be short (1-2 sentences max)
5. Return in JSON format

Return format:
{
  "hints": [
    "Hint 1 text...",
    "Hint 2 text...",
    "Hint 3 text..."
  ]
}`;

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid hints response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.hints || !Array.isArray(parsed.hints) || parsed.hints.length !== 3) {
        throw new Error('Invalid hints format - must have exactly 3 hints');
      }

      logger.info('Hints generated successfully', { questionId });

      return parsed.hints;
    } catch (error) {
      logger.error('Gemini hints generation error:', error);
      throw new Error(`Failed to generate hints: ${error.message}`);
    }
  }

  /**
   * Detect AI fraud in code submission
   */
  async detectFraud(code, questionContext) {
    try {
      const prompt = `Analyze the following code submission and determine if it was likely generated by AI or written by a human.

Question Context: ${questionContext.question_text}
Programming Language: ${questionContext.programming_language}

Code:
\`\`\`
${code}
\`\`\`

Analyze for:
1. Code structure patterns (AI models often have characteristic patterns)
2. Comment style and placement
3. Variable naming conventions
4. Error handling patterns
5. Code completeness and consistency

Return a fraud score from 0-100% where:
- 0-30%: Likely human-written
- 31-60%: Suspicious
- 61-90%: Likely AI-generated
- 91-100%: Confirmed AI-generated

Return format:
{
  "fraud_score": 25,
  "fraud_level": "low|medium|high|very_high",
  "detection_details": {
    "code_patterns": "...",
    "comment_analysis": "...",
    "naming_analysis": "...",
    "consistency_analysis": "..."
  },
  "message": "Human-written code detected"
}`;

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 3000
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid fraud detection response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        fraud_score: parsed.fraud_score || 0,
        fraud_level: parsed.fraud_level || 'low',
        detection_details: parsed.detection_details || {},
        message: parsed.message || 'Analysis complete'
      };
    } catch (error) {
      logger.error('Gemini fraud detection error:', error);
      throw new Error(`Failed to detect fraud: ${error.message}`);
    }
  }

  /**
   * Extract suggestions from feedback text
   */
  extractSuggestions(feedback) {
    // Simple extraction - can be enhanced with NLP
    const suggestions = [];
    const lines = feedback.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.slice(0, 5); // Max 5 suggestions
  }

  /**
   * Extract improvements from feedback text
   */
  extractImprovements(feedback) {
    // Simple extraction - can be enhanced with NLP
    const improvements = [];
    const lines = feedback.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('better')) {
        improvements.push(line.trim());
      }
    }
    
    return improvements.slice(0, 5); // Max 5 improvements
  }
}

export default new GeminiClient();



