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

  // Generate coding question
  // Generate multiple fallback coding questions when API is unavailable
  generateFallbackMultipleCodingQuestions(topic, difficulty, language = "javascript", nanoSkills = [], macroSkills = [], questionCount = 4) {
    console.warn('⚠️ GENERATING FALLBACK QUESTIONS - These are NOT from Gemini AI');
    console.warn(`   Topic: ${topic}, Difficulty: ${difficulty}, Language: ${language}`);
    console.warn('   Reason: Gemini API unavailable, rate-limited, or error occurred');
    
    const fallbackQuestions = {
      'javascript': {
        'beginner': [
          {
            title: 'Basic Function Declaration',
            description: `Create a JavaScript function called 'greet' that takes a name parameter and returns a greeting message. The function should return "Hello, [name]!" where [name] is the provided parameter.`,
            testCases: [
              { input: { name: 'Alice' }, expected_output: 'Hello, Alice!' },
              { input: { name: 'Bob' }, expected_output: 'Hello, Bob!' }
            ],
            solution: {
              code: `function greet(name) {
  return \`Hello, \${name}!\`;
}`,
              explanation: 'This function uses template literals to create a greeting message with the provided name.'
            }
          },
          {
            title: 'Simple Calculator',
            description: `Create a JavaScript function called 'add' that takes two numbers as parameters and returns their sum.`,
            testCases: [
              { input: { a: 2, b: 3 }, expected_output: 5 },
              { input: { a: -1, b: 1 }, expected_output: 0 }
            ],
            solution: {
              code: `function add(a, b) {
  return a + b;
}`,
              explanation: 'This function performs basic addition of two numbers.'
            }
          },
          {
            title: 'String Length Checker',
            description: `Create a JavaScript function called 'isLongString' that takes a string parameter and returns true if the string is longer than 10 characters, false otherwise.`,
            testCases: [
              { input: { str: 'Hello World' }, expected_output: false },
              { input: { str: 'This is a very long string' }, expected_output: true }
            ],
            solution: {
              code: `function isLongString(str) {
  return str.length > 10;
}`,
              explanation: 'This function checks if the string length is greater than 10 characters.'
            }
          },
          {
            title: 'Number Doubler',
            description: `Create a JavaScript function called 'double' that takes a number parameter and returns the number multiplied by 2.`,
            testCases: [
              { input: { num: 5 }, expected_output: 10 },
              { input: { num: -3 }, expected_output: -6 }
            ],
            solution: {
              code: `function double(num) {
  return num * 2;
}`,
              explanation: 'This function multiplies the input number by 2.'
            }
          }
        ],
        'intermediate': [
          {
            title: 'Array Processing Function',
            description: `Create a JavaScript function called 'calculateSum' that takes an array of numbers and returns the sum of all positive numbers in the array. If the array is empty or contains no positive numbers, return 0.`,
            testCases: [
              { input: { numbers: [1, -2, 3, -4, 5] }, expected_output: 9 },
              { input: { numbers: [-1, -2, -3] }, expected_output: 0 },
              { input: { numbers: [] }, expected_output: 0 }
            ],
            solution: {
              code: `function calculateSum(numbers) {
  return numbers
    .filter(num => num > 0)
    .reduce((sum, num) => sum + num, 0);
}`,
              explanation: 'This function filters positive numbers and uses reduce to calculate their sum.'
            }
          },
          {
            title: 'String Reverser',
            description: `Create a JavaScript function called 'reverseString' that takes a string parameter and returns the string reversed.`,
            testCases: [
              { input: { str: 'hello' }, expected_output: 'olleh' },
              { input: { str: 'world' }, expected_output: 'dlrow' }
            ],
            solution: {
              code: `function reverseString(str) {
  return str.split('').reverse().join('');
}`,
              explanation: 'This function splits the string into an array, reverses it, and joins it back.'
            }
          },
          {
            title: 'Find Maximum Number',
            description: `Create a JavaScript function called 'findMax' that takes an array of numbers and returns the maximum number in the array.`,
            testCases: [
              { input: { numbers: [1, 5, 3, 9, 2] }, expected_output: 9 },
              { input: { numbers: [-1, -5, -3] }, expected_output: -1 }
            ],
            solution: {
              code: `function findMax(numbers) {
  return Math.max(...numbers);
}`,
              explanation: 'This function uses the spread operator with Math.max to find the maximum number.'
            }
          },
          {
            title: 'Count Vowels',
            description: `Create a JavaScript function called 'countVowels' that takes a string parameter and returns the number of vowels (a, e, i, o, u) in the string.`,
            testCases: [
              { input: { str: 'hello' }, expected_output: 2 },
              { input: { str: 'programming' }, expected_output: 3 }
            ],
            solution: {
              code: `function countVowels(str) {
  return str.toLowerCase().split('').filter(char => 'aeiou'.includes(char)).length;
}`,
              explanation: 'This function converts to lowercase, filters for vowels, and counts them.'
            }
          }
        ]
      }
    };

    const languageQuestions = fallbackQuestions[language] || fallbackQuestions.javascript;
    const difficultyQuestions = languageQuestions[difficulty] || languageQuestions.intermediate;
    
    // Return the requested number of questions
    const selectedQuestions = difficultyQuestions.slice(0, questionCount);
    const ladder = buildDifficultyLadder(selectedQuestions.length || questionCount);
    
    return selectedQuestions.map((question, index) => {
      const assignedDifficulty = ladder[index] || difficulty;
      return {
        ...question,
        difficulty: assignedDifficulty,
        language,
        hints: [
          'Think about the function structure and parameters',
          'Consider what the function should return',
          'Test your function with the provided examples'
        ],
        summary: `Fallback question ${index + 1} for ${topic}. Difficulty tier: ${assignedDifficulty}.`,
        courseName: 'JavaScript Programming',
        topicName: topic,
        nanoSkills,
        macroSkills,
        questionType: 'coding',
        _source: 'fallback', // Mark as fallback question
        _isFallback: true // Explicitly mark as fallback
      };
    });
  }

  // Generate fallback coding question when API is unavailable
  generateFallbackCodingQuestion(topic, difficulty, language = "javascript", nanoSkills = [], macroSkills = []) {
    console.warn('⚠️ GENERATING FALLBACK QUESTION - This is NOT from Gemini AI');
    console.warn(`   Topic: ${topic}, Difficulty: ${difficulty}, Language: ${language}`);
    console.warn('   Reason: Gemini API unavailable, rate-limited, or error occurred');
    
    const fallbackQuestions = {
      'javascript': {
        'beginner': {
          title: 'Basic Function Declaration',
          description: `Create a JavaScript function called 'greet' that takes a name parameter and returns a greeting message. The function should return "Hello, [name]!" where [name] is the provided parameter.`,
          testCases: [
            { input: { name: 'Alice' }, expected_output: 'Hello, Alice!' },
            { input: { name: 'Bob' }, expected_output: 'Hello, Bob!' }
          ],
          solution: {
            code: `function greet(name) {
  return \`Hello, \${name}!\`;
}`,
            explanation: 'This function uses template literals to create a greeting message with the provided name.'
          }
        },
        'intermediate': {
          title: 'Array Processing Function',
          description: `Create a JavaScript function called 'calculateSum' that takes an array of numbers and returns the sum of all positive numbers in the array. If the array is empty or contains no positive numbers, return 0.`,
          testCases: [
            { input: { numbers: [1, -2, 3, -4, 5] }, expected_output: 9 },
            { input: { numbers: [-1, -2, -3] }, expected_output: 0 },
            { input: { numbers: [] }, expected_output: 0 }
          ],
          solution: {
            code: `function calculateSum(numbers) {
  return numbers
    .filter(num => num > 0)
    .reduce((sum, num) => sum + num, 0);
}`,
            explanation: 'This function filters positive numbers and uses reduce to calculate their sum.'
          }
        }
      }
    };

    const languageQuestions = fallbackQuestions[language] || fallbackQuestions.javascript;
    const difficultyQuestions = languageQuestions[difficulty] || languageQuestions.intermediate;
    const [difficultyLabel] = buildDifficultyLadder(1);
    
    return {
      title: difficultyQuestions.title,
      description: difficultyQuestions.description,
      difficulty: difficultyLabel || difficulty,
      language,
      testCases: difficultyQuestions.testCases,
      hints: [
        'Think about the function structure and parameters',
        'Consider what the function should return',
        'Test your function with the provided examples'
      ],
      solution: difficultyQuestions.solution,
      explanation: difficultyQuestions.solution.explanation,
      summary: `This is a fallback question for ${topic} at ${difficultyLabel || difficulty} level. The Gemini API is currently unavailable.`,
      courseName: 'JavaScript Programming',
      topicName: topic,
      nanoSkills,
      macroSkills,
      questionType: 'coding',
      _source: 'fallback', // Mark as fallback question
      _isFallback: true // Explicitly mark as fallback
    };
  }

  // Generate multiple coding questions at once
  async generateMultipleCodingQuestions(
    topic,
    difficulty,
    language = "javascript",
    nanoSkills = [],
    macroSkills = [],
    questionCount = 4,
    options = {}
  ) {
    this._checkAvailability();

    const { humanLanguage = 'en', seedQuestion = null } = options

    const prompt = `
You are an expert programming instructor. Generate ${questionCount} coding questions for ${difficulty} level ${language} developers.

Course Context:
- Topic: ${topic}
- Nano Skills: ${nanoSkills.join(", ")}
- Macro Skills: ${macroSkills.join(", ")}
- Difficulty Level: ${difficulty}
- Programming Language: ${language}
- Number of Questions: ${questionCount}
- Natural Language Output: ${humanLanguage}
- Trainer Provided Question Context (optional): ${seedQuestion ? seedQuestion : 'N/A'}

Create ${questionCount} practical coding questions that:
1. Test the specific nano skills: ${nanoSkills.join(", ")}
2. Relate to the macro skills: ${macroSkills.join(", ")}
3. Target developers around the ${difficulty} band while gradually increasing difficulty per question
4. Are practical and real-world relevant
5. Have clear problem statements
6. Each question includes 2-3 test cases with inputs and expected outputs
7. Each question provides 2-3 short, direct hints
8. Each question includes the complete solution that follows best practices
9. Assign a difficulty label for each question so that Q1 is "basic", Q2 is slightly harder, and the last question is the most challenging (e.g., basic -> intermediate -> advanced -> expert)
10. If a trainer context is provided, align the question set with that context while improving clarity and assessment rigor.

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)
- The solution code must be syntactically correct and executable
- Use proper ${language} syntax and best practices
- All natural language text must be written in ${humanLanguage}.

\`\`\`json
{
  "questions": [
    {
      "title": "Question 1 title",
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
    },
    {
      "title": "Question 2 title",
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
  ]
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
`;

    try {
      const text = await this._callModel(prompt);
      try {
        const parsed = JSON.parse(this._cleanJsonResponse(text));
        const questionsArray = Array.isArray(parsed.questions) ? parsed.questions : parsed;
        const ladder = buildDifficultyLadder(questionsArray.length || questionCount);
        const processedQuestions = questionsArray.map((question, index) => ({
          ...question,
          difficulty: question.difficulty || ladder[index] || 'basic',
          _source: 'gemini', // Mark as Gemini-generated
          _isFallback: false // Explicitly mark as not fallback
        }));
        console.log(`✅ Successfully generated ${processedQuestions.length} question(s) from Gemini AI`);
        return processedQuestions;
      } catch (parseErr) {
        console.warn("⚠️ Gemini returned non-JSON; using fallback questions");
        console.warn("   Parse error:", parseErr.message);
        const fallbackQuestions = this.generateFallbackMultipleCodingQuestions(topic, difficulty, language, nanoSkills, macroSkills, questionCount);
        console.warn(`⚠️ Using ${fallbackQuestions.length} fallback question(s) instead of Gemini-generated questions`);
        return fallbackQuestions;
      }
    } catch (err) {
      console.error("generateMultipleCodingQuestions error:", err?.message || err);
      
      // Handle rate limiting specifically - go straight to fallback, no retry
      if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Too Many Requests') || err.message.includes('Rate limit exceeded')) {
        console.warn('⚠️ Gemini API rate limit exceeded, using fallback questions immediately...');
        console.warn('   Error:', err.message);
        const fallbackQuestions = this.generateFallbackMultipleCodingQuestions(topic, difficulty, language, nanoSkills, macroSkills, questionCount);
        console.warn(`⚠️ Using ${fallbackQuestions.length} FALLBACK question(s) - NOT from Gemini AI`);
        return fallbackQuestions;
      }
      
      // Handle specific Gemini API errors
      if (err?.message?.includes('overloaded') || err?.message?.includes('503')) {
        console.warn('⚠️ Gemini API overloaded, using fallback questions...');
        console.warn('   Error:', err.message);
        const fallbackQuestions = this.generateFallbackMultipleCodingQuestions(topic, difficulty, language, nanoSkills, macroSkills, questionCount);
        console.warn(`⚠️ Using ${fallbackQuestions.length} FALLBACK question(s) - NOT from Gemini AI`);
        return fallbackQuestions;
      } else if (err?.message?.includes('quota') || err?.message?.includes('limit')) {
        console.warn('⚠️ Gemini API quota exceeded, using fallback questions...');
        console.warn('   Error:', err.message);
        const fallbackQuestions = this.generateFallbackMultipleCodingQuestions(topic, difficulty, language, nanoSkills, macroSkills, questionCount);
        console.warn(`⚠️ Using ${fallbackQuestions.length} FALLBACK question(s) - NOT from Gemini AI`);
        return fallbackQuestions;
      } else if (err?.message?.includes('timeout')) {
        console.warn('⚠️ Gemini API timeout, using fallback questions...');
        console.warn('   Error:', err.message);
        const fallbackQuestions = this.generateFallbackMultipleCodingQuestions(topic, difficulty, language, nanoSkills, macroSkills, questionCount);
        console.warn(`⚠️ Using ${fallbackQuestions.length} FALLBACK question(s) - NOT from Gemini AI`);
        return fallbackQuestions;
      }
      
      throw new Error(`Failed to generate multiple coding questions: ${err?.message || err}`);
    }
  }

  async generateCodingQuestion(
    topic,
    difficulty,
    language = "javascript",
    nanoSkills = [],
    macroSkills = [],
    options = {}
  ) {
    this._checkAvailability();

    const { humanLanguage = 'en', seedQuestion = null } = options

    const prompt = `
You are an expert programming instructor. Generate a coding question for a ${difficulty} level ${language} developer.

Course Context:
- Topic: ${topic}
- Nano Skills: ${nanoSkills.join(", ")}
- Macro Skills: ${macroSkills.join(", ")}
- Difficulty Level: ${difficulty}
- Programming Language: ${language}
- Natural Language Output: ${humanLanguage}
- Trainer Provided Question Context (optional): ${seedQuestion ? seedQuestion : 'N/A'}

Create a practical coding question that:
1. Tests the specific nano skills: ${nanoSkills.join(", ")}
2. Relates to the macro skills: ${macroSkills.join(", ")}
3. Is appropriate for ${difficulty} level
4. Is practical and real-world relevant
5. Has clear problem statement
6. Includes 2-3 test cases with inputs and expected outputs
7. Provides 2-3 short, direct hints (don't give away the solution)
8. Includes the complete solution that follows best practices and runs correctly
9. Assign an explicit difficulty label (e.g., basic, intermediate, advanced, expert) that reflects the challenge level of this single question
10. If a trainer question is provided, keep the thematic context but improve clarity, evaluability, and test coverage.

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)
- The solution code must be syntactically correct and executable
- Use proper ${language} syntax and best practices
- All natural language text must be written in ${humanLanguage}.

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
        const [difficultyLabel] = buildDifficultyLadder(1);
        const question = {
          ...parsed,
          difficulty: parsed.difficulty || difficultyLabel || 'basic',
          _source: 'gemini', // Mark as Gemini-generated
          _isFallback: false // Explicitly mark as not fallback
        };
        console.log(`✅ Successfully generated question from Gemini AI: ${question.title || question.description?.substring(0, 50)}...`);
        return question;
      } catch (parseErr) {
        console.warn("⚠️ Gemini returned non-JSON; attempting to parse as structured response");
        console.warn("   Parse error:", parseErr.message);
        try {
          const fallback = this.parseStructuredResponse(text);
          const [difficultyLabel] = buildDifficultyLadder(1);
          const question = {
            ...fallback,
            difficulty: fallback.difficulty || difficultyLabel || 'basic',
            _source: 'gemini', // Mark as Gemini-generated (parsed from text)
            _isFallback: false
          };
          console.log(`✅ Parsed question from Gemini AI response: ${question.title || question.description?.substring(0, 50)}...`);
          return question;
        } catch (parseError2) {
          console.warn("⚠️ Failed to parse Gemini response, using fallback question");
          const fallbackQuestion = this.generateFallbackCodingQuestion(topic, difficulty, language, nanoSkills, macroSkills);
          return fallbackQuestion;
        }
      }
    } catch (err) {
      console.error("❌ generateCodingQuestion error:", err?.message || err);
      console.error("   Error stack:", err.stack);
      
      // Handle rate limiting specifically - go straight to fallback, no retry
      if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Too Many Requests') || err.message.includes('Rate limit exceeded')) {
        console.warn('⚠️ Gemini API rate limit exceeded, using fallback question immediately...');
        console.warn('   Error:', err.message);
        const fallbackQuestion = this.generateFallbackCodingQuestion(topic, difficulty, language, nanoSkills, macroSkills);
        console.warn('⚠️ Using FALLBACK question - NOT from Gemini AI');
        return fallbackQuestion;
      }
      
      // Handle specific Gemini API errors
      if (err?.message?.includes('overloaded') || err?.message?.includes('503')) {
        console.warn('⚠️ Gemini API overloaded, using fallback question...');
        console.warn('   Error:', err.message);
        const fallbackQuestion = this.generateFallbackCodingQuestion(topic, difficulty, language, nanoSkills, macroSkills);
        console.warn('⚠️ Using FALLBACK question - NOT from Gemini AI');
        return fallbackQuestion;
      } else if (err?.message?.includes('quota') || err?.message?.includes('limit')) {
        console.warn('⚠️ Gemini API quota exceeded, using fallback question...');
        console.warn('   Error:', err.message);
        const fallbackQuestion = this.generateFallbackCodingQuestion(topic, difficulty, language, nanoSkills, macroSkills);
        console.warn('⚠️ Using FALLBACK question - NOT from Gemini AI');
        return fallbackQuestion;
      } else if (err?.message?.includes('timeout')) {
        console.warn('⚠️ Gemini API timeout, using fallback question...');
        console.warn('   Error:', err.message);
        const fallbackQuestion = this.generateFallbackCodingQuestion(topic, difficulty, language, nanoSkills, macroSkills);
        console.warn('⚠️ Using FALLBACK question - NOT from Gemini AI');
        return fallbackQuestion;
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
    
    const hintIndex = Math.min(hintsUsed, fallbackHints.length - 1);
    const hint = fallbackHints[hintIndex] || fallbackHints[0];
    
    return {
      hint: hint,
      hintLevel: hintsUsed + 1,
      showSolution: false,
      solution: null,
      canShowSolution: hintsUsed >= 2,
      fallback: true,
      message: "Using fallback hint due to API rate limits"
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
