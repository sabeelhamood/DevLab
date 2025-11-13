// backend/src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/environment.js";

let genAIClient = null;

const DIFFICULTY_LADDER = [
  "basic",
  "basic-plus",
  "intermediate",
  "upper-intermediate",
  "advanced",
  "advanced-plus",
  "expert",
  "master"
];

const buildDifficultyLadder = (count) => {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) =>
    DIFFICULTY_LADDER[Math.min(index, DIFFICULTY_LADDER.length - 1)]
  );
};

/**
 * Initialize the Gemini client safely.
 * Prefer config.ai.gemini.apiKey -> process.env.GEMINI_API_KEY
 * If not present, we stay in mock mode.
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set. Please configure it in Railway environment variables.');
}

// Always initialize Gemini with real API - no mock mode
console.log("🔍 API Key found:", !!GEMINI_API_KEY, "Length:", GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

try {
  genAIClient = new GoogleGenerativeAI(GEMINI_API_KEY);
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

  // Unified fallback question generator (used when Gemini API unavailable)
  generateFallbackCodingQuestions(ctx = {}) {
    console.warn('⚠️ GENERATING FALLBACK QUESTIONS - Gemini API unavailable');
    const {
      topic_name = 'General Programming',
      topic_id = 'mock-topic-id',
      skills = ['logic', 'basics'],
      programming_language = 'javascript',
      humanLanguage = 'English',
      amount = 4
    } = ctx;

    const fallbackTemplates = {
      javascript: [
        {
          title: 'Basic Function Creation',
          description: `Write a JavaScript function called 'sum' that takes two numbers and returns their sum.`,
          testCases: [
            { input: '2,3', expectedOutput: '5' },
            { input: '-1,5', expectedOutput: '4' }
          ],
          hints: ['Use the + operator', 'Return the result directly']
        },
        {
          title: 'String Reversal',
          description: `Write a JavaScript function that takes a string and returns it reversed.`,
          testCases: [
            { input: 'hello', expectedOutput: 'olleh' },
            { input: 'abc', expectedOutput: 'cba' }
          ],
          hints: ['Use split, reverse, and join']
        },
        {
          title: 'Find Maximum',
          description: `Write a function that receives an array of numbers and returns the maximum value.`,
          testCases: [
            { input: '[1,5,3,9]', expectedOutput: '9' },
            { input: '[-2,-5,-1]', expectedOutput: '-1' }
          ],
          hints: ['Use Math.max and the spread operator']
        },
        {
          title: 'Count Vowels',
          description: `Write a function that counts how many vowels (a, e, i, o, u) appear in a string.`,
          testCases: [
            { input: 'hello', expectedOutput: '2' },
            { input: 'programming', expectedOutput: '3' }
          ],
          hints: ['Convert to lowercase', 'Filter for vowels']
        }
      ],
      python: [
        {
          title: 'Sum of Two Numbers',
          description: `Write a Python function that returns the sum of two numbers.`,
          testCases: [
            { input: '2,3', expectedOutput: '5' },
            { input: '-2,5', expectedOutput: '3' }
          ],
          hints: ['Use the + operator', 'Return the result']
        },
        {
          title: 'Reverse String',
          description: `Write a Python function that takes a string and returns it reversed.`,
          testCases: [
            { input: "'hello'", expectedOutput: "'olleh'" }
          ],
          hints: ['Use slicing with [::-1]']
        }
      ]
    };

    const languageSet = fallbackTemplates[programming_language.toLowerCase()] || fallbackTemplates.javascript;
    const selected = languageSet.slice(0, amount);
    const difficultyLevels = Array.from({ length: amount }, (_, i) => i + 1);

    const result = {
      questions: selected.map((q, i) => ({
        question: {
          title: q.title,
          description: q.description,
          difficultyLevel: difficultyLevels[i] || 1
        },
        testCases: q.testCases,
        hints: q.hints
      }))
    };

    return result;
  }

  async generateCodingQuestion(
    topic,
    skills = [],
    amount = 4,
    language = "javascript",
    options = {}
  ) {
    console.log('\n' + '='.repeat(80))
    console.log('🔍 [GEMINI-SERVICE] generateCodingQuestion called')
    console.log('='.repeat(80))
    console.log('   Parameter 1 (topic):', topic, '(type:', typeof topic, ', valid:', !!topic, ')')
    console.log('   Parameter 2 (skills):', JSON.stringify(skills), '(type:', typeof skills, ', isArray:', Array.isArray(skills), ', length:', Array.isArray(skills) ? skills.length : 'N/A', ')')
    console.log('   Parameter 3 (amount):', amount, '(type:', typeof amount, ', valid:', amount > 0, ')')
    console.log('   Parameter 4 (language):', language, '(type:', typeof language, ', valid:', !!language, ')')
    console.log('   Parameter 5 (options):', JSON.stringify(options), '(type:', typeof options, ')')
    console.log('='.repeat(80) + '\n')
    
    this._checkAvailability();

    const { humanLanguage = 'en', seedQuestion = null, topic_id = null } = options;
    
    console.log('🔍 [GEMINI-SERVICE] Extracted options:')
    console.log('   - humanLanguage:', humanLanguage)
    console.log('   - seedQuestion:', seedQuestion ? 'provided' : 'null')
    console.log('   - topic_id:', topic_id || 'null')

    const prompt = `
You are an expert programming instructor. Generate a set of ${amount} practical coding questions for a developer.

Course Context:
- Topic: ${topic}
- Skills: ${skills.join(", ")}
- Programming Language: ${language}
- Natural Language Output: ${humanLanguage}
- Trainer Provided Question Context (optional): ${seedQuestion ? seedQuestion : 'N/A'}

Requirements:
1. Generate exactly ${amount} questions in a JSON array.
2. The questions should increase in difficulty gradually; the last question should be the hardest.
3. All questions must be coding questions (no theoretical questions).
4. Each question must include:
   - title
   - description (clear problem statement with requirements)
   - testCases: 2-3 test cases with input, expectedOutput, and explanation
   - hints: 2-3 concise hints
   - topic_id: use the provided topic_id if any
   - question_type: "code"
5. DO NOT include "solution" or "summary".
6. The questions must be practical, real-world relevant, fully executable if implemented.
7. Use proper ${language} syntax and best practices.
8. All natural language text must be in ${humanLanguage}.
9. Return ONLY a valid JSON array of questions wrapped in triple backticks with "json" language identifier.
10. NO extra text, explanations, or comments outside the JSON.

\`\`\`json
[
  {
    "title": "Question title",
    "description": "Clear problem statement with specific requirements",
    "language": "${language}",
    "topic_id": "${topic_id || ''}",
    "question_type": "code",
    "testCases": [
      {"input": "example input", "expectedOutput": "expected output", "explanation": "why this test case"}
    ],
    "hints": ["short concept hint", "specific approach hint", "implementation direction"]
  }
]
\`\`\`
`;

    try {
      const text = await this._callModel(prompt);

      try {
        const parsedArray = JSON.parse(this._cleanJsonResponse(text));
        const questionsArray = Array.isArray(parsedArray) ? parsedArray : [parsedArray];
        const questions = questionsArray.map((q, index) => ({
          ...q,
          _source: 'gemini',
          _isFallback: false,
          _rawGeminiResponse: text,
          _difficultyIndex: index + 1,
          topic_id: topic_id || q.topic_id || null,
          question_type: "code"
        }));
        console.log(`✅ Successfully generated ${questions.length} questions from Gemini AI.`);
        return questions;
      } catch (parseErr) {
        console.warn("⚠️ Gemini returned non-JSON; attempting to parse as structured response");
        const fallback = this.parseStructuredResponse(text);
        const fallbackArray = Array.isArray(fallback) ? fallback : [fallback];
        const questions = fallbackArray.map((q, index) => ({
          ...q,
          _source: 'gemini',
          _isFallback: false,
          _rawGeminiResponse: text,
          _difficultyIndex: index + 1,
          topic_id: topic_id || q.topic_id || null,
          question_type: "code"
        }));
        console.log(`✅ Parsed ${questions.length} question(s) from Gemini AI response.`);
        return questions;
      }
    } catch (err) {
      console.error("❌ generateCodingQuestion error:", err?.message || err);
      console.error("   Error stack:", err.stack);

      // fallback logic for rate limits, overloads, timeouts
      const fallbackResult = this.generateFallbackCodingQuestions({
        topic_name: topic,
        topic_id,
        skills,
        programming_language: language,
        humanLanguage,
        amount
      });
      const fallbackQuestions = Array.isArray(fallbackResult.questions) ? fallbackResult.questions : [];
      return fallbackQuestions.map((entry, index) => ({
        ...entry.question,
        language,
        testCases: entry.testCases || [],
        hints: entry.hints || [],
        _source: 'fallback',
        _isFallback: true,
        _rawGeminiResponse: null,
        _difficultyIndex: index + 1,
        topic_id: topic_id || entry.question?.topic_id || null,
        question_type: "code"
      }));
    }
  }

  // Generate theoretical question
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
      
      // Handle rate limiting and API unavailability
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests') || err.message?.includes('Rate limit exceeded') || err.message?.includes('overloaded') || err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        console.log('🔄 Gemini API unavailable, using fallback evaluation...');
        return {
          isCorrect: true,
          score: 75,
          feedback: "Code evaluation temporarily unavailable due to API rate limits. Your code appears to be syntactically correct. Please try submitting again in a few moments for detailed feedback.",
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
          summary: "Code evaluation temporarily unavailable - please try again shortly",
          fallback: true,
          message: "Using fallback evaluation due to API rate limits"
        };
      }
      
      throw new Error(`Failed to evaluate code submission: ${err?.message || err}`);
    }
  }

  // Generate fallback hints when API is unavailable
  generateFallbackHints(question, userAttempt, hintsUsed) {
    const fallbackHints = [
      "Try breaking down the problem into smaller steps.",
      "Consider what data structures might be helpful for this problem.",
      "Think about edge cases and how to handle them.",
      "Look at the test cases to understand the expected behavior.",
      "Consider using helper functions to organize your code better."
    ];
    
    // Ensure hintsUsed is a valid number and within bounds
    const safeHintsUsed = Math.max(0, Math.min(Number(hintsUsed) || 0, fallbackHints.length - 1));
    const hintIndex = safeHintsUsed;
    const hint = fallbackHints[hintIndex] || fallbackHints[0];
    
    // Return hint as string or object with hint property (for consistency)
    const hintText = typeof hint === 'string' ? hint : (hint.hint || hint.text || hint.message || 'Try breaking down the problem into smaller steps.');
    
    return {
      hint: hintText,
      hintLevel: safeHintsUsed + 1,
      showSolution: false,
      solution: null,
      canShowSolution: safeHintsUsed >= 2,
      fallback: true,
      message: "Using fallback hint due to API unavailability"
    };
  }

  // Generate hints
  async generateHints(question, userAttempt, hintsUsed = 0, allHints = []) {
    try {
      this._checkAvailability();
    } catch (availabilityError) {
      console.error("❌ Gemini service not available:", availabilityError?.message);
      console.warn("⚠️ Using fallback hints due to service unavailability");
      return this.generateFallbackHints(question, userAttempt, hintsUsed);
    }

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
        const parsed = JSON.parse(this._cleanJsonResponse(text));
        // Ensure we have a hint field
        if (parsed && (parsed.hint || parsed.text || parsed.message)) {
          return parsed;
        } else {
          console.warn("⚠️ Gemini returned invalid hint format, using fallback");
          return this.generateFallbackHints(question, userAttempt, hintsUsed);
        }
      } catch (parseError) {
        console.warn("⚠️ Failed to parse Gemini hint response:", parseError?.message);
        console.warn("   Attempting to extract hint from text response");
        // Try to extract hint from text response
        const textLower = text.toLowerCase();
        if (textLower.includes('hint') || text.length < 200) {
          // Might be a direct hint text
          return {
            hint: text.trim().substring(0, 200),
            hintLevel: hintsUsed + 1,
            showSolution: false,
            solution: null,
            canShowSolution: hintsUsed >= 2
          };
        } else {
          console.warn("⚠️ Could not extract hint from text, using fallback");
          return this.generateFallbackHints(question, userAttempt, hintsUsed);
        }
      }
    } catch (err) {
      console.error("❌ generateHints error:", err?.message || err);
      console.error("   Error stack:", err?.stack);
      
      // Handle rate limiting and all API errors - always return fallback hints
      if (err.message?.includes('429') || 
          err.message?.includes('quota') || 
          err.message?.includes('Too Many Requests') || 
          err.message?.includes('Rate limit exceeded') ||
          err.message?.includes('503') ||
          err.message?.includes('Service Unavailable') ||
          err.message?.includes('overloaded')) {
        console.warn('⚠️ Gemini API rate limit/error, using fallback hints...');
        return this.generateFallbackHints(question, userAttempt, hintsUsed);
      }
      
      // For any other error, also return fallback hints instead of throwing
      console.warn('⚠️ Unexpected error in generateHints, using fallback hints...');
      return this.generateFallbackHints(question, userAttempt, hintsUsed);
    }
  }

  // Detect cheating
  async detectCheating(code, question) {
    this._checkAvailability();

    const prompt = `
You are an expert code analysis AI specialized in detecting AI-generated code submissions.

🎯 GOAL:
Determine whether the given code was written by a human student or generated (fully or partially) by an AI tool such as ChatGPT or Gemini. 
Your output must be clear, structured, and concise.

---

📘 CONTEXT:
This code was submitted as an answer to a coding question.

QUESTION:
${question}

SUBMITTED CODE:
${code}

---

🔍 ANALYSIS CRITERIA:
Evaluate the following dimensions carefully:

1. **Syntax & Structure**
   - Is the syntax unusually clean, perfect, or standardized beyond the expected level for a student?
   - Does it use consistent indentation and spacing without any variation or minor mistakes?

2. **Naming & Style**
   - Are variable/function names generic (e.g., \`calculateSomething\`, \`solveProblem\`, \`resultArray\`)?
   - Is there a lack of creative or task-specific naming that students typically show?
   - Are naming conventions uniform across all variables (a strong AI indicator)?

3. **Comments & Explanations**
   - Are there comments explaining trivial steps (e.g., \`// Initialize variable\`, \`// Return result\`)?
   - Are comments written in a formal, tutorial-like tone rather than a natural learning tone?
   - Does the code contain no comments or overly perfect ones?

4. **Complexity & Efficiency**
   - Is the code more optimized than needed for the task?
   - Does it use advanced patterns (e.g., comprehensions, high-order functions) unlikely for a typical student at this level?

5. **Error Handling & Edge Cases**
   - Does it include overly broad error handling or perfect edge case management not required by the problem?

6. **Signature Patterns of AI Tools**
   - Look for patterns commonly produced by ChatGPT or Gemini, such as:
     - Consistent \`for (const item of arr)\` or similar idioms.
     - Explicit step-by-step comments (“// Step 1: Initialize variables”).
     - Overuse of blank lines between logical sections.
     - Imports that are declared but never used (AI leftover pattern).

7. **Human Behavioral Patterns**
   - Check for small human-like inconsistencies:
     - Slight indentation misalignments.
     - Unused or redundant variables.
     - Minor inefficiencies.
     - Comments in a learning tone (e.g., “not sure if this works”).
   - The presence of these indicates a likely human author.

8. **Comparison Against Student Baseline**
   - Compare the code’s quality and sophistication to that of an average student solution for the same topic or difficulty level.
   - If the code looks like a polished template or professionally formatted snippet — that’s a strong AI indicator.

---

🧠 THINKING PROCESS:
Analyze all of the above before making a decision.
Avoid bias toward “AI” just because the code is good — some students write clean code.

---

📊 OUTPUT FORMAT (JSON):
Return your analysis as a valid JSON object exactly in this structure:

{
  "aiLikelihood": <integer 0-100>,
  "humanLikelihood": <integer 0-100>,
  "explanation": "<short 3-4 sentence summary of reasoning>",
  "verdict": "AI" | "Human" | "Unclear"
}

🧩 RULES:
- Ensure the two likelihoods add up to ~100.
- Base your reasoning only on the provided code and question context.
- Be objective and explain the decision succinctly.

---

💬 EXAMPLE OUTPUT:
{
  "aiLikelihood": 92,
  "humanLikelihood": 8,
  "explanation": "The code is perfectly structured, uses generic variable names, formal comments, and advanced syntax uncommon for students. No trial-and-error signs found.",
  "verdict": "AI"
}
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

  // Validation methods for trainer-created courses
  // These methods validate trainer-created questions and provide feedback

  async validateCodingQuestion({
    question,
    topic,
    difficulty,
    nanoSkills = [],
    macroSkills = [],
    humanLanguage = 'en'
  }) {
    this._checkAvailability();
    
    const prompt = `
You are an expert programming instructor reviewing a coding question created by a human trainer.

Question to validate: "${question}"
Topic: ${topic}
Difficulty: ${difficulty}
Nano Skills: ${nanoSkills.join(", ")}
Macro Skills: ${macroSkills.join(", ")}
Respond using natural language in ${humanLanguage}.

Provide validation feedback as **strict JSON** in the following format:
\`\`\`json
{
  "is_relevant": true,
  "relevance_reason": "Explain why/why not",
  "needs_revision": false,
  "difficulty_alignment": 4,
  "clarity_rating": 5,
  "completeness_rating": 5,
  "revision_notes": ["Specific actionable recommendation 1", "Specific actionable recommendation 2"],
  "summary": "One sentence overview",
  "language": "${humanLanguage}"
}
\`\`\`

Rules:
- Return ONLY valid JSON as shown (no markdown wrapper text).
- Ratings must be integers between 1 and 5.
- If \`is_relevant\` is false, set \`needs_revision\` to true and provide concrete reasons in \`revision_notes\`.
- Keep all narrative text in ${humanLanguage}.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        const parsed = JSON.parse(this._cleanJsonResponse(text))
        return {
          isRelevant: parsed.is_relevant ?? parsed.isRelevant ?? true,
          needsRevision: parsed.needs_revision ?? !parsed.is_relevant ?? false,
          difficultyAlignment: parsed.difficulty_alignment ?? parsed.difficultyAlignment ?? null,
          clarityRating: parsed.clarity_rating ?? null,
          completenessRating: parsed.completeness_rating ?? null,
          revisionNotes: Array.isArray(parsed.revision_notes) ? parsed.revision_notes : [],
          summary: parsed.summary || parsed.relevance_reason || '',
          language: parsed.language || humanLanguage,
          raw: parsed
        }
      } catch (parseErr) {
        console.warn("validateCodingQuestion JSON parse error:", parseErr?.message || parseErr)
        return {
          isRelevant: true,
          needsRevision: false,
          revisionNotes: ["Ensure automated parsing is configured; fallback validation used."],
          summary: this._cleanJsonResponse(text),
          language: humanLanguage,
          raw: this._cleanJsonResponse(text),
          fallback: true
        }
      }
    } catch (err) {
      console.error("validateCodingQuestion error:", err?.message || err);
      
      // Fallback validation
      return {
        isRelevant: true,
        needsRevision: false,
        difficultyAlignment: 4,
        clarityRating: 4,
        completenessRating: 4,
        revisionNotes: ["Unable to reach Gemini. Performed fallback validation – consider manual review."],
        summary: "Fallback validation: question appears aligned with the topic.",
        language: humanLanguage,
        raw: null,
        fallback: true
      };
    }
  }

  async validateTheoreticalQuestion({
    question,
    topic,
    difficulty,
    nanoSkills = [],
    macroSkills = [],
    humanLanguage = 'en'
  }) {
    this._checkAvailability();
    
    const prompt = `
You are an expert educational content reviewer analyzing a theoretical question created by a human trainer.

Question to validate: "${question}"
Topic: ${topic}
Difficulty: ${difficulty}
Nano Skills: ${nanoSkills.join(", ")}
Macro Skills: ${macroSkills.join(", ")}
Respond using natural language in ${humanLanguage}.

Provide validation feedback as **strict JSON** in the following format:
\`\`\`json
{
  "is_relevant": true,
  "relevance_reason": "Explanation",
  "needs_revision": false,
  "learning_objective_alignment": 4,
  "clarity_rating": 5,
  "completeness_rating": 5,
  "revision_notes": ["Actionable improvement 1"],
  "summary": "One sentence overview",
  "language": "${humanLanguage}"
}
\`\`\`

Rules:
- Return ONLY valid JSON as shown.
- Ratings must be integers between 1 and 5.
- If \`is_relevant\` is false, set \`needs_revision\` to true and populate \`revision_notes\`.
- Keep all narrative text in ${humanLanguage}.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        const parsed = JSON.parse(this._cleanJsonResponse(text))
        return {
          isRelevant: parsed.is_relevant ?? parsed.isRelevant ?? true,
          needsRevision: parsed.needs_revision ?? !parsed.is_relevant ?? false,
          objectiveAlignment: parsed.learning_objective_alignment ?? parsed.learningObjectiveAlignment ?? null,
          clarityRating: parsed.clarity_rating ?? null,
          completenessRating: parsed.completeness_rating ?? null,
          revisionNotes: Array.isArray(parsed.revision_notes) ? parsed.revision_notes : [],
          summary: parsed.summary || parsed.relevance_reason || '',
          language: parsed.language || humanLanguage,
          raw: parsed
        }
      } catch (parseErr) {
        console.warn("validateTheoreticalQuestion JSON parse error:", parseErr?.message || parseErr)
        return {
          isRelevant: true,
          needsRevision: false,
          revisionNotes: ["Fallback validation used – unable to parse structured response."],
          summary: this._cleanJsonResponse(text),
          language: humanLanguage,
          raw: this._cleanJsonResponse(text),
          fallback: true
        }
      }
    } catch (err) {
      console.error("validateTheoreticalQuestion error:", err?.message || err);
      
      // Fallback validation
      return {
        isRelevant: true,
        needsRevision: false,
        objectiveAlignment: 4,
        clarityRating: 4,
        completenessRating: 4,
        revisionNotes: ["Unable to reach Gemini. Perform manual review for alignment if critical."],
        summary: "Fallback validation: theoretical question appears suitable.",
        language: humanLanguage,
        raw: null,
        fallback: true
      };
    }
  }
}

export const geminiService = new GeminiService();
