import { getFetch } from '../utils/http.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4'

const parseJsonResponse = (raw) => {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    // Remove markdown code fences if present
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/```json?|\```/gi, '').trim()
      : trimmed
    try {
      return JSON.parse(withoutFence)
    } catch (e) {
      // If parsing fails, return the raw string
      return { description: withoutFence }
    }
  }
  return raw
}

class OpenAIService {
  async #callOpenAI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured')
    }

    const fetchFn = await getFetch()

    const response = await fetchFn(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an examiner generating coding assessment questions. Respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    })

    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        responseBody?.error?.message ||
        JSON.stringify(responseBody || {}) ||
        'No response body'
      throw new Error(`OpenAI API responded with status ${response.status}: ${message}`)
    }

    const content = responseBody?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI API returned an empty response')
    }

    return content
  }

  async generateAssessmentCoding(amount, difficulty, humanLanguage, skills, programming_language) {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be a positive number')
    }

    if (!programming_language) {
      throw new Error('Programming language is required')
    }

    const skillsText = Array.isArray(skills) && skills.length > 0
      ? `The question should be based on the following skills: ${skills.join(', ')}.`
      : ''

    const difficultyLevel = difficulty || 'medium'
    const humanLangText = humanLanguage ? (humanLanguage === 'en' ? 'English' : humanLanguage) : 'English'
    const questionPlural = amount > 1 ? 's' : ''
    const mustText = amount > 1 ? 's must' : ' must'
    
    const prompt = 'You are now an examiner generating a coding assessment question.\n\n' +
      `Generate ${amount} coding question${questionPlural} in ${programming_language}.\n\n` +
      (skillsText ? skillsText + '\n\n' : '') +
      `The difficulty level should be: ${difficultyLevel}.\n\n` +
      'Requirements:\n' +
      `- The question${mustText} be clear, well-structured, and without hints.\n` +
      '- Do not reveal the solution.\n' +
      '- Each question should include:\n' +
      '  - A clear description of the problem\n' +
      '  - Test cases with input and expected output\n' +
      '  - Appropriate difficulty level\n\n' +
      `The question should be written in ${humanLangText}.\n\n` +
      'Return the result as a JSON array of questions. Each question should have this structure:\n' +
      '{\n' +
      '  "title": "Question title",\n' +
      '  "description": "Detailed question description",\n' +
      `  "difficulty": "${difficultyLevel}",\n` +
      '  "testCases": [\n' +
      '    {\n' +
      '      "input": "input example",\n' +
      '      "expected_output": "expected output"\n' +
      '    }\n' +
      '  ],\n' +
      `  "language": "${programming_language}"\n` +
      '}\n\n' +
      'Return only the JSON array, no additional text.'

    try {
      const rawResponse = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(rawResponse)

      // Handle both array and single object responses
      let questions = Array.isArray(parsed) ? parsed : [parsed]

      // Ensure each question has required fields
      questions = questions.map((q, index) => ({
        title: q.title || `Coding Question ${index + 1}`,
        description: q.description || q.question || '',
        difficulty: q.difficulty || difficulty || 'medium',
        testCases: Array.isArray(q.testCases) && q.testCases.length > 0
          ? q.testCases
          : [
              {
                input: 'sampleInput()',
                expected_output: 'expected output'
              }
            ],
        language: q.language || programming_language,
        skills: Array.isArray(skills) ? skills : []
      }))

      // Limit to requested amount
      return questions.slice(0, amount)
    } catch (error) {
      console.error('OpenAI generateAssessmentCoding error:', error)
      throw new Error(`Failed to generate coding questions: ${error.message}`)
    }
  }

  async gradeAssessmentSolutions(questions, solutions, skills) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions array is required and must not be empty')
    }

    if (!Array.isArray(solutions) || solutions.length === 0) {
      throw new Error('Solutions array is required and must not be empty')
    }

    if (questions.length !== solutions.length) {
      throw new Error('Questions and solutions arrays must have the same length')
    }

    // Build the grading prompt
    const questionsText = questions.map((q, idx) => {
      const solution = solutions[idx]?.solution || ''
      const testCases = (q.testCases || q.test_cases || []).map((tc, tcIdx) => 
        `  Test Case ${tcIdx + 1}:
    Input: ${JSON.stringify(tc.input)}
    Expected Output: ${JSON.stringify(tc.expected_output || tc.output)}`
      ).join('\n')

      return `Question ${idx + 1}:
  ID: ${q.id || `question_${idx + 1}`}
  Title: ${q.title || 'Untitled Question'}
  Description: ${q.description || q.question || 'No description'}
  Programming Language: ${q.programming_language || q.language || 'unknown'}
  Skills to Assess: ${(q.skills || []).join(', ') || 'N/A'}
  Test Cases:
${testCases || '  No test cases provided'}
  Student Solution:
\`\`\`${q.programming_language || q.language || 'javascript'}
${solution}
\`\`\``
    }).join('\n\n---\n\n')

    const allSkills = Array.isArray(skills) && skills.length > 0
      ? skills.join(', ')
      : Array.from(new Set(questions.flatMap(q => q.skills || []))).join(', ') || 'N/A'

    const prompt = `You are an expert coding assessment evaluator. Your task is to evaluate student solutions for coding assessment questions.

EVALUATION CRITERIA:
1. Correctness (40 points): Does the solution produce the correct output for all test cases?
2. Skill Application (30 points): Does the solution demonstrate proper use of the skills the question was designed to assess?
3. Requirement Compliance (30 points): Does the solution fully meet all requirements described in the question description?

For each question, provide:
- A score from 0 to 100 (weighted: Correctness 40%, Skill Application 30%, Requirement Compliance 30%)
- A detailed explanation of your evaluation
- Specific feedback on what was done well and what needs improvement
- Skill-specific feedback indicating mastery level for each skill tested

ASSESSMENT DETAILS:
Total Questions: ${questions.length}
Skills Being Assessed: ${allSkills}

QUESTIONS AND SOLUTIONS:
${questionsText}

Return your evaluation as a JSON object with this exact structure:
{
  "overallScore": <number 0-100, calculated as average of all question scores>,
  "questions": [
    {
      "questionId": "<question id>",
      "score": <number 0-100>,
      "correctness": {
        "score": <number 0-40>,
        "explanation": "<detailed explanation>"
      },
      "skillApplication": {
        "score": <number 0-30>,
        "explanation": "<detailed explanation>"
      },
      "requirementCompliance": {
        "score": <number 0-30>,
        "explanation": "<detailed explanation>"
      },
      "detailedFeedback": "<comprehensive feedback on the solution>",
      "strengths": ["<strength 1>", "<strength 2>", ...],
      "improvements": ["<improvement 1>", "<improvement 2>", ...]
    }
  ],
  "skillFeedback": [
    {
      "skill": "<skill name>",
      "masteryLevel": "<beginner|intermediate|advanced|expert>",
      "performance": "<description of performance>",
      "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
    }
  ],
  "summary": "<comprehensive evaluation summary covering overall performance, key strengths, and areas for improvement>"
}

Return only the JSON object, no additional text or markdown formatting.`

    try {
      const rawResponse = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(rawResponse)

      // Validate and normalize the response
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format from OpenAI')
      }

      // Ensure all required fields are present
      const normalized = {
        overallScore: typeof parsed.overallScore === 'number' ? Math.max(0, Math.min(100, parsed.overallScore)) : 0,
        questions: Array.isArray(parsed.questions) ? parsed.questions.map((q, idx) => ({
          questionId: q.questionId || questions[idx]?.id || `question_${idx + 1}`,
          score: typeof q.score === 'number' ? Math.max(0, Math.min(100, q.score)) : 0,
          correctness: {
            score: typeof q.correctness?.score === 'number' ? Math.max(0, Math.min(40, q.correctness.score)) : 0,
            explanation: q.correctness?.explanation || 'No explanation provided'
          },
          skillApplication: {
            score: typeof q.skillApplication?.score === 'number' ? Math.max(0, Math.min(30, q.skillApplication.score)) : 0,
            explanation: q.skillApplication?.explanation || 'No explanation provided'
          },
          requirementCompliance: {
            score: typeof q.requirementCompliance?.score === 'number' ? Math.max(0, Math.min(30, q.requirementCompliance.score)) : 0,
            explanation: q.requirementCompliance?.explanation || 'No explanation provided'
          },
          detailedFeedback: q.detailedFeedback || q.feedback || 'No detailed feedback provided',
          strengths: Array.isArray(q.strengths) ? q.strengths : [],
          improvements: Array.isArray(q.improvements) ? q.improvements : []
        })) : [],
        skillFeedback: Array.isArray(parsed.skillFeedback) ? parsed.skillFeedback : [],
        summary: parsed.summary || parsed.evaluationSummary || 'No summary provided'
      }

      // Always calculate overall score as the average of all question scores
      if (normalized.questions.length > 0) {
        const calculatedScore = normalized.questions.reduce((sum, q) => sum + q.score, 0) / normalized.questions.length
        normalized.overallScore = Math.round(calculatedScore * 100) / 100
      } else {
        // If no questions were evaluated, set overall score to 0
        normalized.overallScore = 0
      }

      return normalized
    } catch (error) {
      console.error('OpenAI gradeAssessmentSolutions error:', error)
      throw new Error(`Failed to grade assessment solutions: ${error.message}`)
    }
  }
}

export const openAIService = new OpenAIService()

