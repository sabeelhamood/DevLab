// backend/src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/environment.js";

let genAIClient = null;

/**
 * Initialize the Gemini client safely.
 * Prefer config.ai.gemini.apiKey -> process.env.GEMINI_API_KEY
 * If not present, we stay in mock mode.
 */
const apiKey = (config && config.ai && config.ai.gemini && config.ai.gemini.apiKey) 
  ? config.ai.gemini.apiKey 
  : process.env.GEMINI_API_KEY || 'AIzaSyBJSbRei0fxnTRN1yb3V0NlJ623pBqKWcw';

// Always initialize Gemini with real API - no mock mode
console.log("🔍 API Key found:", !!apiKey, "Length:", apiKey ? apiKey.length : 0);

try {
  genAIClient = new GoogleGenerativeAI(apiKey);
  console.log("✅ Gemini client initialized with real API key");
} catch (err) {
  console.error("❌ Failed to initialize Gemini client:", err?.message || err);
  throw new Error("Gemini API initialization failed");
}

export class GeminiService {
  constructor() {
    this.isMockMode = false; // Always use real Gemini API
    // Always create model handle
    if (genAIClient) {
      // Use gemini-2.5-flash as the available model
      this.modelName = "gemini-2.5-flash";
      this.model = genAIClient.getGenerativeModel({ model: this.modelName });
      console.log(`✅ Gemini model initialized: ${this.modelName}`);
    } else {
      throw new Error("Gemini client not initialized");
    }
  }

  _checkAvailability() {
    if (!this.model) {
      throw new Error("Gemini service is not available.");
    }
  }

  async _callModel(prompt, opts = {}) {
    // Low-level wrapper: calls the model and returns text
    this._checkAvailability();

    try {
      const result = await this.model.generateContent(prompt, opts);
      // result.response may be a Sync/Promise-like object depending on SDK; handle safely
      if (result && result.response) {
        // If response has text() method (streamed or not)
        if (typeof result.response.text === "function") {
          const text = await result.response.text();
          return text;
        } else if (typeof result.response === "string") {
          return result.response;
        } else {
          // try to stringify
          return JSON.stringify(result.response);
        }
      }
      // fallback
      return JSON.stringify(result);
    } catch (err) {
      console.error("Error calling Gemini model:", err?.message || err);
      throw err;
    }
  }

  // Helper function to clean JSON response from markdown code blocks
  _cleanJsonResponse(text) {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleanText;
  }

  _extractRetryDelay(errorMessage) {
    // Extract retry delay from error message
    const retryMatch = errorMessage.match(/Please retry in ([\d.]+)s/)
    if (retryMatch) {
      return parseFloat(retryMatch[1]) * 1000 // Convert to milliseconds
    }
    return null
  }

  // fallback parser (keeps your previous behavior)
  parseStructuredResponse(text) {
    return {
      title: "AI Generated Question",
      description: text,
      difficulty: "medium",
      language: "javascript",
      error: "Response parsing failed, using raw text"
    };
  }

  // Mock responses (used only when no API key)
  _getMockResponse(type, ctx = {}) {
    switch (type) {
      case "theoreticalQuestion":
        return {
          title: `Mock theoretical: ${ctx.topic}`,
          question: `Explain ${ctx.topic} (mock)`,
          options: { A: "A", B: "B", C: "C", D: "D" },
          correctAnswer: "A",
          explanation: "Mock explanation",
          hints: ["Think about basics", "Consider examples", "Almost there"]
        };
      case "codingQuestion":
      case "question":
        return {
          title: `Mock coding: ${ctx.topic}`,
          description: `Write a function that returns the sum of two numbers (mock)`,
          testCases: [{ input: "2,3", output: "5", explanation: "2+3=5" }],
          hints: ["Add two numbers", "Return the value", "Edge case: negative numbers"],
          solution: "function sum(a,b){return a+b;}",
          difficulty: ctx.difficulty || "medium",
          language: ctx.language || "javascript"
        };
      case "evaluation":
        return {
          isCorrect: true,
          score: 90,
          feedback: "Mock evaluation: good job",
          suggestions: ["Mock suggestion 1"],
          testResults: []
        };
      case "hint":
        return {
          hint: "Mock hint: try breaking the problem down",
          hintLevel: ctx.hintsUsed ? ctx.hintsUsed + 1 : 1,
          encouragement: "You can do it!",
          showSolution: false,
          solution: null,
          nextSteps: ["Try writing a pseudo-code"],
          concept: "Mock concept"
        };
      case "cheating":
        return {
          suspicious: false,
          confidence: 10,
          reasons: ["Mock data"],
          recommendations: []
        };
      default:
        return { message: "Mock response" };
    }
  }

  // Generate coding question
  async generateCodingQuestion(topic, difficulty, language = "javascript", nanoSkills = [], macroSkills = []) {
    this._checkAvailability();

    const prompt = `
You are an expert programming instructor. Generate a coding question for a ${difficulty} level ${language} developer.

Course Context:
- Topic: ${topic}
- Nano Skills: ${nanoSkills.join(", ")}
- Macro Skills: ${macroSkills.join(", ")}
- Difficulty Level: ${difficulty}
- Programming Language: ${language}

Create a practical coding question that:
1. Tests the specific nano skills: ${nanoSkills.join(", ")}
2. Relates to the macro skills: ${macroSkills.join(", ")}
3. Is appropriate for ${difficulty} level
4. Is practical and real-world relevant
5. Has clear problem statement
6. Includes 2-3 test cases with inputs and expected outputs
7. Provides 2-3 progressive hints (don't give away the solution)
8. Includes the complete solution

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Question title",
  "description": "Clear problem statement",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "testCases": [
    {"input": "example input", "expectedOutput": "expected output", "explanation": "why this test case"}
  ],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "solution": "complete code solution",
  "explanation": "explanation of the solution"
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      // try parse
      try {
        const parsed = JSON.parse(this._cleanJsonResponse(text));
        return parsed;
      } catch (parseErr) {
        console.warn("Gemini returned non-JSON; returning structured fallback object");
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("generateCodingQuestion error:", err?.message || err);
      
      // Handle rate limiting specifically
      if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Too Many Requests')) {
        console.log('Rate limit hit, implementing retry logic...')
        // Wait for the suggested retry delay or default to 60 seconds
        const retryDelay = this._extractRetryDelay(err.message) || 60000
        console.log(`Waiting ${retryDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        
        // Retry once
        try {
          const text = await this._callModel(prompt);
          try {
            const parsed = JSON.parse(this._cleanJsonResponse(text));
            return parsed;
          } catch (parseErr) {
            console.warn("Gemini returned non-JSON on retry; returning structured fallback object");
            return this.parseStructuredResponse(text);
          }
        } catch (retryErr) {
          console.error("Retry failed:", retryErr?.message || retryErr);
          throw new Error(`Failed to generate coding question after retry: ${retryErr?.message || retryErr}`);
        }
      }
      
      throw new Error(`Failed to generate coding question: ${err?.message || err}`);
    }
  }

  // Generate theoretical question
  async generateTheoreticalQuestion(topic, difficulty, nanoSkills = [], macroSkills = []) {
    this._checkAvailability();

    const prompt = `
You are an expert programming instructor. Generate a theoretical question about ${topic} for ${difficulty} level.

Course Context:
- Topic: ${topic}
- Nano Skills: ${nanoSkills.join(", ")}
- Macro Skills: ${macroSkills.join(", ")}
- Difficulty Level: ${difficulty}

Create a theoretical question that:
1. Tests understanding of nano skills: ${nanoSkills.join(", ")}
2. Relates to macro skills: ${macroSkills.join(", ")}
3. Is appropriate for ${difficulty} level
4. Is educational and thought-provoking
5. Has 4 multiple choice options (A, B, C, D)
6. Includes detailed explanation
7. Provides 2-3 progressive hints
8. Includes the complete answer

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Question title",
  "description": "The question text",
  "difficulty": "${difficulty}",
  "options": {
    "A": "option A text",
    "B": "option B text", 
    "C": "option C text",
    "D": "option D text"
  },
  "correctAnswer": "A",
  "explanation": "detailed explanation of why this answer is correct",
  "hints": ["hint 1", "hint 2", "hint 3"]
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("generateTheoreticalQuestion error:", err?.message || err);
      throw new Error(`Failed to generate theoretical question: ${err?.message || err}`);
    }
  }

  // Evaluate code submission
  async evaluateCodeSubmission(code, question, language = "javascript", testCases = []) {
    this._checkAvailability();

    const prompt = `
You are an expert code reviewer. Evaluate this ${language} code submission for correctness and quality.

Question: ${question}
Code:
${code}

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
  "score": 85,
  "feedback": "constructive feedback message",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "testResults": [
    {"testCase": "test 1", "passed": true, "actual": "actual output", "expected": "expected output"}
  ],
  "codeQuality": {
    "readability": "good",
    "efficiency": "excellent", 
    "bestPractices": "mostly good"
  }
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("evaluateCodeSubmission error:", err?.message || err);
      throw new Error(`Failed to evaluate code submission: ${err?.message || err}`);
    }
  }

  // Generate hints
  async generateHints(question, userAttempt, hintsUsed = 0, allHints = []) {
    this._checkAvailability();

    const prompt = `
You are an expert programming tutor. Generate a progressive hint for this coding question.

Question: ${question}
User's current attempt: ${userAttempt}
Hints already used: ${hintsUsed}/3
Previous hints: ${allHints.join(" | ")}

Generate a hint that:
1. Is appropriate for hint level ${hintsUsed + 1} (1=general, 2=specific, 3=almost solution)
2. Doesn't give away the complete solution
3. Builds on previous hints if any
4. Guides the user in the right direction
5. Is encouraging and educational

Return ONLY a valid JSON object with this exact structure:
{
  "hint": "the actual hint text",
  "hintLevel": ${hintsUsed + 1},
  "encouragement": "encouraging message",
  "showSolution": false,
  "solution": null,
  "nextSteps": ["step 1", "step 2"],
  "concept": "key concept being tested"
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("generateHints error:", err?.message || err);
      throw new Error(`Failed to generate hints: ${err?.message || err}`);
    }
  }

  // Detect cheating
  async detectCheating(code, question) {
    this._checkAvailability();

    const prompt = `
Analyze this code submission for potential cheating or plagiarism.

Question: ${question}
Code:
${code}

Check for suspicious patterns that might indicate:
1. AI-generated code (overly perfect, generic patterns)
2. Copied code from external sources
3. Code that doesn't match the student's apparent skill level
4. Unusual coding patterns or style

Return ONLY a valid JSON object with this exact structure:
{
  "suspicious": true/false,
  "confidence": 85,
  "reasons": ["reason 1", "reason 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "analysis": "brief analysis of the code patterns"
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("detectCheating error:", err?.message || err);
      throw new Error(`Failed to detect cheating: ${err?.message || err}`);
    }
  }

  // Personalized learning recommendations
  async generateLearningRecommendations(userProfile, performanceData) {
    this._checkAvailability();

    const prompt = `
Generate personalized learning recommendations based on user profile and performance data.

User Profile: ${JSON.stringify(userProfile)}
Performance Data: ${JSON.stringify(performanceData)}

Analyze the user's performance and provide:
1. Strengths and areas of improvement
2. Personalized learning recommendations
3. Next steps for skill development
4. Encouraging feedback
5. Suggested resources or topics

Return ONLY a valid JSON object with this exact structure:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "nextSteps": ["next step 1", "next step 2"],
  "encouragement": "encouraging message",
  "suggestedResources": ["resource 1", "resource 2"],
  "learningPath": "suggested learning path"
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("generateLearningRecommendations error:", err?.message || err);
      throw new Error(`Failed to generate learning recommendations: ${err?.message || err}`);
    }
  }
}

export const geminiService = new GeminiService();
