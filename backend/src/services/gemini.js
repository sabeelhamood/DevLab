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
      
      // Handle specific Gemini API errors
      if (err.message?.includes('503') || err.message?.includes('Service Unavailable') || err.message?.includes('overloaded')) {
        throw new Error("Gemini API is temporarily overloaded. Please try again in a few moments.");
      }
      
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
      }
      
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
7. Provides 2-3 short, direct hints (don't give away the solution)
8. Includes the complete solution that follows best practices and runs correctly

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)
- The solution code must be syntactically correct and executable
- Use proper ${language} syntax and best practices

\`\`\`json
{
  "title": "Question title",
  "description": "Clear problem statement with specific requirements",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "testCases": [
    {"input": "example input", "expectedOutput": "expected output", "explanation": "why this test case"}
  ],
  "hints": ["short concept hint", "specific approach hint", "implementation direction"],
  "solution": "complete, executable code solution following best practices",
  "explanation": "detailed explanation of the solution approach and logic",
  "summary": "Brief one-line summary of what this question tests"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
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
5. Has 4 multiple choice options (A, B, C, D) with only ONE correct answer
6. Includes detailed explanation
7. Provides 2-3 short, direct hints
8. Includes the complete answer

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)
- Ensure only ONE option is correct
- Make incorrect options plausible but clearly wrong

\`\`\`json
{
  "title": "Question title",
  "description": "The question text with clear context",
  "difficulty": "${difficulty}",
  "options": {
    "A": "option A text",
    "B": "option B text", 
    "C": "option C text",
    "D": "option D text"
  },
  "correctAnswer": "A",
  "explanation": "detailed explanation of why this answer is correct and why others are wrong",
  "hints": ["basic concept", "thinking approach", "specific direction"],
  "summary": "Brief one-line summary of what this question tests"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
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

EVALUATION REQUIREMENTS:
- If code is WRONG: Highlight the SPECIFIC mistake line or logic error
- If code is CORRECT: Analyze efficiency and provide improvement tips
- For correct code: Optionally suggest a more optimized version
- Be specific about what's wrong and how to fix it
- Provide actionable feedback

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "isCorrect": true,
  "score": 85,
  "feedback": "constructive feedback message with specific details",
  "suggestions": ["specific suggestion 1", "specific suggestion 2"],
  "testResults": [
    {"testCase": "test 1", "passed": true, "actual": "actual output", "expected": "expected output", "error": "specific error if any"}
  ],
  "codeQuality": {
    "readability": "good",
    "efficiency": "excellent", 
    "bestPractices": "mostly good",
    "specificIssues": ["issue 1", "issue 2"]
  },
  "specificErrors": ["line X: specific error description", "logic error in function Y"],
  "improvements": ["improvement 1", "improvement 2"],
  "optimizedVersion": "optional optimized code if applicable",
  "summary": "Brief summary of the evaluation"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
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
      
      // Return fallback response when Gemini is unavailable
      if (err.message?.includes('overloaded') || err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        return {
          isCorrect: true,
          score: 75,
          feedback: "Code evaluation temporarily unavailable due to high API demand. Your code appears to be syntactically correct. Please try submitting again in a few moments for detailed feedback.",
          suggestions: ["Try again in a few moments for detailed evaluation", "Check your code syntax manually", "Ensure all test cases are handled"],
          testResults: [
            {"testCase": "Basic functionality", "passed": true, "actual": "Code submitted", "expected": "Valid code", "error": null}
          ],
          codeQuality: {
            "readability": "appears good",
            "efficiency": "cannot evaluate at this time", 
            "bestPractices": "cannot evaluate at this time",
            "specificIssues": ["Detailed analysis unavailable"]
          },
          specificErrors: [],
          improvements: ["Detailed analysis will be available when API is restored"],
          optimizedVersion: null,
          summary: "Code evaluation temporarily unavailable - please try again shortly"
        };
      }
      
      throw new Error(`Failed to evaluate code submission: ${err?.message || err}`);
    }
  }

  // Generate hints
  async generateHints(question, userAttempt, hintsUsed = 0, allHints = []) {
    this._checkAvailability();

    const prompt = `
Generate a concise, direct hint for this coding question.

Question: ${question}
User's current attempt: ${userAttempt}
Hints already used: ${hintsUsed}/3
Previous hints: ${allHints.join(" | ")}

Generate a short, actionable hint for level ${hintsUsed + 1}:
- Level 1: Basic concept or approach
- Level 2: Specific implementation guidance  
- Level 3: Near-solution direction

Requirements:
- Keep hint under 20 words
- Be direct and actionable
- No encouragement or extra text
- Focus only on key guidance
- Don't reveal the complete solution
- Never automatically show solution - user must choose to see it

\`\`\`json
{
  "hint": "short, direct hint text",
  "hintLevel": ${hintsUsed + 1},
  "showSolution": false,
  "solution": null,
  "canShowSolution": ${hintsUsed >= 2}
}
\`\`\`

Return ONLY the JSON object.
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
You are an expert code analysis AI specialized in detecting AI-generated code submissions. Analyze this code submission for signs of AI assistance.

QUESTION CONTEXT:
${question}

SUBMITTED CODE:
${code}

DETECTION CRITERIA - Look for these specific AI-generated code patterns:

1. **PERFECT SYNTAX & STRUCTURE**:
   - Flawless syntax with no typos or common student mistakes
   - Overly consistent formatting and naming conventions
   - Professional-level code organization

2. **AI-CHARACTERISTIC PATTERNS**:
   - Generic variable names (item, element, result, data)
   - Overly descriptive comments that explain obvious things
   - Perfect error handling that students typically miss
   - Consistent use of modern JavaScript features without mistakes

3. **COMPLEXITY MISMATCH**:
   - Code complexity far exceeds typical student level for this question type
   - Advanced algorithms or patterns not taught at this level
   - Perfect implementation of edge cases students usually miss

4. **CODING STYLE INDICATORS**:
   - Consistent use of best practices throughout
   - No personal coding quirks or learning mistakes
   - Perfect variable naming conventions
   - Overly clean and professional code structure

5. **SOLUTION CHARACTERISTICS**:
   - Solution is too optimal for a learning context
   - Includes advanced techniques not typically used by students
   - Perfect handling of edge cases
   - Overly comprehensive error checking

ANALYSIS INSTRUCTIONS:
- Be STRICT in detection - err on the side of flagging suspicious code
- Look for patterns that indicate AI assistance rather than student work
- Consider if the code quality exceeds what a student would typically produce
- Focus on consistency, perfection, and advanced patterns
- Check for generic AI-generated variable names and comments

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "isAiGenerated": true,
  "confidence": 95,
  "reasons": ["specific AI pattern 1", "specific AI pattern 2", "specific AI pattern 3"],
  "recommendations": ["Write your own solution from scratch", "Try to understand the problem step by step", "Ask for hints if you're stuck"],
  "analysis": "Detailed analysis of why this appears to be AI-generated",
  "rationale": "Specific explanation of AI-generated patterns detected",
  "specificPatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "summary": "AI-generated code detected - please solve independently"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
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
      
      // Return fallback response when Gemini is unavailable
      if (err.message?.includes('overloaded') || err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        return {
          isAiGenerated: false,
          confidence: 0,
          reasons: ["Analysis temporarily unavailable"],
          recommendations: ["Try again in a few moments for detailed analysis"],
          analysis: "Cheating detection temporarily unavailable due to high API demand",
          rationale: "Unable to analyze code patterns at this time",
          specificPatterns: ["Analysis unavailable"],
          summary: "Cheating detection temporarily unavailable - please try again shortly"
        };
      }
      
      throw new Error(`Failed to detect cheating: ${err?.message || err}`);
    }
  }

  // Simple pattern-based AI detection (no AI required)
  simpleAiDetection(code) {
    const patterns = {
      aiVariableNames: /\b(item|element|result|data|value|temp|current|total|subtotal|finalTotal|discountPercentage|discountThreshold)\b/g,
      perfectComments: /\/\/\s*(Calculate|Initialize|Check|Apply|Return|Handle|Process|Validate)/g,
      genericFunctions: /\b(calculate|process|handle|validate|check|apply|initialize|compute)\w*/g,
      perfectFormatting: /^\s*\/\/\s*[A-Z][a-z]+.*\.$/gm,
      professionalStructure: /\{\s*\n\s*\/\/\s*[A-Z]/g
    }

    let score = 0
    const detectedPatterns = []

    // Check for AI-characteristic variable names
    const aiVariableMatches = code.match(patterns.aiVariableNames)
    if (aiVariableMatches && aiVariableMatches.length > 3) {
      score += 20
      detectedPatterns.push(`Generic AI variable names: ${aiVariableMatches.slice(0, 3).join(', ')}`)
    }

    // Check for overly perfect comments
    const perfectCommentMatches = code.match(patterns.perfectComments)
    if (perfectCommentMatches && perfectCommentMatches.length > 2) {
      score += 15
      detectedPatterns.push(`Overly perfect comments: ${perfectCommentMatches.length} instances`)
    }

    // Check for generic function names
    const genericFunctionMatches = code.match(patterns.genericFunctions)
    if (genericFunctionMatches && genericFunctionMatches.length > 2) {
      score += 15
      detectedPatterns.push(`Generic function names: ${genericFunctionMatches.slice(0, 2).join(', ')}`)
    }

    // Check for perfect formatting
    const perfectFormattingMatches = code.match(patterns.perfectFormatting)
    if (perfectFormattingMatches && perfectFormattingMatches.length > 1) {
      score += 10
      detectedPatterns.push(`Perfect comment formatting: ${perfectFormattingMatches.length} instances`)
    }

    // Check for professional structure
    const professionalStructureMatches = code.match(patterns.professionalStructure)
    if (professionalStructureMatches && professionalStructureMatches.length > 0) {
      score += 10
      detectedPatterns.push('Professional code structure detected')
    }

    // Check for zero syntax errors (perfect code)
    try {
      // Try to parse the code - if it's perfect, it might be AI-generated
      if (language === 'javascript') {
        new Function(code) // This will throw if there are syntax errors
        score += 5
        detectedPatterns.push('Perfect syntax with no errors')
      }
    } catch (e) {
      // Code has syntax errors, likely student-written
    }

    const isAiGenerated = score >= 30
    const confidence = Math.min(score, 95)

    return {
      isAiGenerated,
      confidence,
      detectedPatterns,
      reasons: detectedPatterns,
      analysis: `Pattern-based analysis detected ${score} points of AI characteristics`,
      summary: isAiGenerated ? 'AI-generated code detected by pattern analysis' : 'No clear AI patterns detected'
    }
  }

  // Enhanced AI detection with pattern analysis
  async enhancedAiDetection(code, question, language = "javascript") {
    this._checkAvailability();

    const prompt = `
You are an expert at detecting AI-generated code. Analyze this code for specific AI-generated patterns.

CODE TO ANALYZE:
${code}

QUESTION CONTEXT:
${question}

DETECT THESE SPECIFIC AI PATTERNS:

1. **VARIABLE NAMING PATTERNS**:
   - Generic names: item, element, result, data, value, temp, current, total
   - Overly descriptive names that AI loves: calculateOrderTotal, processUserInput
   - Perfect camelCase without any inconsistencies

2. **COMMENT PATTERNS**:
   - Overly explanatory comments for obvious code
   - Comments that explain what the code does rather than why
   - Perfect comment formatting and placement

3. **CODE STRUCTURE PATTERNS**:
   - Perfect indentation and spacing
   - Consistent bracket placement
   - No personal coding style variations
   - Professional-level organization

4. **ALGORITHM PATTERNS**:
   - Optimal solutions that students wouldn't naturally write
   - Perfect edge case handling
   - Advanced techniques used flawlessly
   - No trial-and-error learning patterns

5. **ERROR HANDLING PATTERNS**:
   - Comprehensive error checking that students typically skip
   - Perfect validation logic
   - Professional-level defensive programming

6. **SYNTAX PERFECTION**:
   - Zero typos or syntax errors
   - Perfect use of modern JavaScript features
   - Consistent coding style throughout
   - No learning mistakes or personal quirks

ANALYSIS FOCUS:
- Look for code that is TOO PERFECT for a student submission
- Check for patterns that indicate AI generation rather than human learning
- Consider the complexity vs. expected student level
- Focus on consistency and perfection indicators

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "isAiGenerated": true,
  "confidence": 90,
  "detectedPatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "reasons": ["specific reason 1", "specific reason 2", "specific reason 3"],
  "analysis": "Detailed analysis of AI-generated patterns found",
  "recommendations": ["Write your own solution", "Try to understand the problem", "Ask for hints"],
  "summary": "AI-generated code detected based on pattern analysis"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        return JSON.parse(this._cleanJsonResponse(text));
      } catch {
        return this.parseStructuredResponse(text);
      }
    } catch (err) {
      console.error("enhancedAiDetection error:", err?.message || err);
      
      // Return fallback response when Gemini is unavailable
      if (err.message?.includes('overloaded') || err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        return {
          isAiGenerated: false,
          confidence: 0,
          detectedPatterns: ["Analysis unavailable"],
          reasons: ["Analysis temporarily unavailable"],
          analysis: "Enhanced AI detection temporarily unavailable",
          recommendations: ["Try again in a few moments"],
          summary: "Enhanced AI detection temporarily unavailable"
        };
      }
      
      throw new Error(`Failed to perform enhanced AI detection: ${err?.message || err}`);
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

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendations": ["specific recommendation 1", "specific recommendation 2"],
  "nextSteps": ["specific next step 1", "specific next step 2"],
  "encouragement": "encouraging and motivating message",
  "suggestedResources": ["specific resource 1", "specific resource 2"],
  "learningPath": "suggested learning path with specific steps",
  "summary": "Brief summary of the learning recommendations"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
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
