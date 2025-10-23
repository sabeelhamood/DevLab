import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config/environment.js'

// Initialize Gemini AI with API key from environment
const apiKey = config.ai.gemini.apiKey || process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment variables')
  console.log('Please set GEMINI_API_KEY in your environment')
  throw new Error('Gemini API key is required')
}

const genAI = new GoogleGenerativeAI(apiKey)

export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  // Generate coding questions dynamically
  async generateCodingQuestion(topic, difficulty, language = 'javascript', nanoSkills = [], macroSkills = []) {
    try {
      const prompt = `
        You are an expert programming instructor. Generate a coding question for a ${difficulty} level ${language} developer.
        
        Course Context:
        - Topic: ${topic}
        - Nano Skills: ${nanoSkills.join(', ')}
        - Macro Skills: ${macroSkills.join(', ')}
        - Difficulty Level: ${difficulty}
        - Programming Language: ${language}
        
        Create a practical coding question that:
        1. Tests the specific nano skills: ${nanoSkills.join(', ')}
        2. Relates to the macro skills: ${macroSkills.join(', ')}
        3. Is appropriate for ${difficulty} level
        4. Is practical and real-world relevant
        5. Has clear problem statement
        6. Includes 2-3 test cases with inputs and expected outputs
        7. Provides 3 progressive hints (don't give away the solution)
        8. Includes the complete solution
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "title": "Clear, descriptive title",
          "description": "Detailed problem description with examples",
          "testCases": [
            {"input": "example input", "output": "expected output", "explanation": "why this test case matters"}
          ],
          "hints": [
            "First hint - general approach",
            "Second hint - more specific guidance", 
            "Third hint - almost there"
          ],
          "solution": "Complete working solution with comments",
          "difficulty": "${difficulty}",
          "language": "${language}",
          "nanoSkills": ${JSON.stringify(nanoSkills)},
          "macroSkills": ${JSON.stringify(macroSkills)},
          "estimatedTime": "5-15 minutes"
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini response:', text)
      
      // Try to parse JSON, fallback to structured text
      try {
        const parsed = JSON.parse(text)
        return parsed
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error generating coding question:', error)
      throw new Error('Failed to generate coding question')
    }
  }

  // Generate theoretical questions
  async generateTheoreticalQuestion(topic, difficulty, nanoSkills = [], macroSkills = []) {
    try {
      const prompt = `
        You are an expert programming instructor. Generate a theoretical question about ${topic} for ${difficulty} level.
        
        Course Context:
        - Topic: ${topic}
        - Nano Skills: ${nanoSkills.join(', ')}
        - Macro Skills: ${macroSkills.join(', ')}
        - Difficulty Level: ${difficulty}
        
        Create a theoretical question that:
        1. Tests understanding of nano skills: ${nanoSkills.join(', ')}
        2. Relates to macro skills: ${macroSkills.join(', ')}
        3. Is appropriate for ${difficulty} level
        4. Is educational and thought-provoking
        5. Has 4 multiple choice options (A, B, C, D)
        6. Includes detailed explanation
        7. Provides 3 progressive hints
        8. Includes the complete answer
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "title": "Clear, descriptive title",
          "question": "The question text with context",
          "options": {
            "A": "Option A",
            "B": "Option B", 
            "C": "Option C",
            "D": "Option D"
          },
          "correctAnswer": "A",
          "explanation": "Detailed explanation of why this is correct",
          "hints": [
            "First hint - general concept",
            "Second hint - more specific guidance",
            "Third hint - almost there"
          ],
          "solution": "Complete answer with reasoning",
          "difficulty": "${difficulty}",
          "topic": "${topic}",
          "nanoSkills": ${JSON.stringify(nanoSkills)},
          "macroSkills": ${JSON.stringify(macroSkills)}
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini theoretical response:', text)
      
      try {
        return JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error generating theoretical question:', error)
      throw new Error('Failed to generate theoretical question')
    }
  }

  // Evaluate code submission
  async evaluateCodeSubmission(code, question, language = 'javascript', testCases = []) {
    try {
      const prompt = `
        You are an expert code reviewer. Evaluate this ${language} code submission for correctness and quality.
        
        Question: ${question}
        Code: ${code}
        Test Cases: ${JSON.stringify(testCases)}
        
        Provide a comprehensive evaluation that:
        1. Tests the code against the provided test cases
        2. Evaluates code quality, readability, and efficiency
        3. Checks for best practices and potential improvements
        4. Provides constructive feedback
        5. Suggests specific improvements
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "isCorrect": true/false,
          "score": 0-100,
          "feedback": "Detailed feedback about the solution",
          "suggestions": ["specific improvement 1", "specific improvement 2"],
          "testResults": [
            {"testCase": "test case 1", "passed": true, "actualOutput": "actual output", "expectedOutput": "expected output", "explanation": "why it passed/failed"}
          ],
          "codeQuality": {
            "readability": "excellent/good/fair/poor",
            "efficiency": "excellent/good/fair/poor", 
            "bestPractices": "excellent/good/fair/poor",
            "comments": "specific feedback about each aspect"
          },
          "strengths": ["what the student did well"],
          "improvements": ["specific areas for improvement"],
          "encouragement": "motivational message"
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini evaluation response:', text)
      
      try {
        return JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error evaluating code:', error)
      throw new Error('Failed to evaluate code submission')
    }
  }

  // Generate hints for a question
  async generateHints(question, userAttempt, hintsUsed = 0, allHints = []) {
    try {
      const prompt = `
        You are an expert programming tutor. Generate a progressive hint for this coding question.
        
        Question: ${question}
        User's current attempt: ${userAttempt}
        Hints already used: ${hintsUsed}/3
        Previous hints: ${allHints.join(' | ')}
        
        Generate a hint that:
        1. Is appropriate for hint level ${hintsUsed + 1} (1=general, 2=specific, 3=almost solution)
        2. Doesn't give away the complete solution
        3. Builds on previous hints if any
        4. Guides the user in the right direction
        5. Is encouraging and educational
        6. If this is the 3rd hint, provide the solution option
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "hint": "The hint text appropriate for level ${hintsUsed + 1}",
          "hintLevel": ${hintsUsed + 1},
          "encouragement": "Motivational message",
          "showSolution": ${hintsUsed >= 2},
          "solution": ${hintsUsed >= 2 ? '"Complete solution will be shown"' : 'null'},
          "nextSteps": ["what the user should try next"],
          "concept": "the key concept being tested"
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini hint response:', text)
      
      try {
        return JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error generating hint:', error)
      throw new Error('Failed to generate hint')
    }
  }

  // Detect potential cheating or plagiarism
  async detectCheating(code, question) {
    try {
      const prompt = `
        Analyze this code submission for potential cheating or plagiarism:
        
        Question: ${question}
        Code: ${code}
        
        Check for:
        - Suspiciously perfect code without learning progression
        - Code that doesn't match the user's skill level
        - Potential copy-paste from external sources
        - Unusual coding patterns for the difficulty level
        
        Return JSON format:
        {
          "suspicious": true/false,
          "confidence": 0-100,
          "reasons": ["reason 1", "reason 2"],
          "recommendations": ["recommendation 1", "recommendation 2"]
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error detecting cheating:', error)
      throw new Error('Failed to detect cheating')
    }
  }

  // Generate personalized learning recommendations
  async generateLearningRecommendations(userProfile, performanceData) {
    try {
      const prompt = `
        Generate personalized learning recommendations based on user profile and performance:
        
        User Profile: ${JSON.stringify(userProfile)}
        Performance Data: ${JSON.stringify(performanceData)}
        
        Provide recommendations in JSON format:
        {
          "strengths": ["strength 1", "strength 2"],
          "weaknesses": ["weakness 1", "weakness 2"],
          "recommendations": [
            {
              "type": "practice",
              "topic": "topic name",
              "difficulty": "beginner/intermediate/advanced",
              "reason": "why this recommendation"
            }
          ],
          "nextSteps": ["step 1", "step 2"],
          "encouragement": "motivational message"
        }
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return this.parseStructuredResponse(text)
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw new Error('Failed to generate learning recommendations')
    }
  }

  // Parse structured response when JSON parsing fails
  parseStructuredResponse(text) {
    // Fallback parsing logic for when JSON parsing fails
    return {
      title: "AI Generated Question",
      description: text,
      difficulty: "medium",
      language: "javascript",
      error: "Response parsing failed, using raw text"
    }
  }
}

export const geminiService = new GeminiService()
