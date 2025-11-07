/* eslint-disable max-lines-per-function */
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-1.5-flash';

const createStubResponse = message => ({
  correct: false,
  aiSuspected: false,
  feedback: message,
  diagnostics: { stub: true },
});

const extractText = result => {
  const candidates = result?.response?.candidates || [];
  const text = candidates[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();
  return text || '';
};

const parseJson = text => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const buildHintPrompt = ({
  question,
  previousHints,
}) => `You are an AI mentor helping a learner practice coding.
Question: ${question.stem}
Language: ${question.language}
Previous hints: ${previousHints.join(' | ') || 'None'}

Provide a JSON response with keys: hint (short precise hint that guides without revealing solution) and reasoning (one sentence).
Example: {"hint":"Consider iterating over the array once.","reasoning":"This helps maintain O(n) complexity."}`;

const buildEvaluationPrompt = ({
  question,
  submission,
}) => `Evaluate the learner's solution.

Question: ${question.stem}
Language: ${submission.language}
Code:
${submission.code}

Respond in JSON with keys:
- correct (boolean)
- aiSuspected (boolean) -> true if code appears AI-generated
- feedback (string) -> constructive, friendly guidance
- diagnostics (object) -> optional metadata (e.g., "coverage": "all tests passed")`;

const buildValidationPrompt = ({
  question,
  topicName,
  skills,
  questionType,
  programmingLanguage,
  humanLanguage,
}) => `You are validating a trainer-authored question for an enterprise learning platform.

Return JSON with keys:
- valid (boolean)
- feedback (string)
- adjustments (array of strings) optional suggestions

Question Type: ${questionType}
Programming Language: ${programmingLanguage || 'N/A'}
Content Language: ${humanLanguage || 'en'}
Topic: ${topicName}
Skills: ${(skills || []).join(', ') || 'unspecified'}
Question Draft:
${question}
`;

const buildGenerationPrompt = ({
  topicName,
  skills,
  questionType,
  programmingLanguage,
  humanLanguage,
}) => `You are generating a question for a corporate learning microservice.

Respond in JSON with keys:
- question (string)
- stem (string)
- language (string)
- hints (array of 3 short hints)
- tests (array of test cases objects with input/output)
- solution (string)
- explanation (string)

Topic: ${topicName}
Skills: ${(skills || []).join(', ') || 'unspecified'}
Question Type: ${questionType}
Programming Language: ${programmingLanguage || 'N/A'}
Content Language: ${humanLanguage || 'en'}
`;

export const createGeminiClient = ({
  apiKey = process.env['GEMINI_API_KEY'],
  model = process.env['GEMINI_MODEL'] || DEFAULT_MODEL,
  logger = console,
} = {}) => {
  if (!apiKey) {
    logger.warn?.('Gemini API key missing. Falling back to stub responses.');
    return {
      async generateHint() {
        return {
          hint: 'Unable to fetch hint: Gemini API key not configured.',
          reasoning: 'Stub response generated.',
        };
      },
      async evaluateSolution() {
        return createStubResponse(
          'Unable to evaluate: Gemini API key not configured.'
        );
      },
      async validateQuestion() {
        return {
          valid: true,
          feedback:
            'Stub validation: please configure GEMINI_API_KEY for live analysis.',
          adjustments: [],
        };
      },
      async generateQuestion() {
        return {
          question:
            'Stub question: configure GEMINI_API_KEY to generate real content.',
          stem: 'Describe a stubbed scenario.',
          language: 'javascript',
          hints: [
            'Hint 1 placeholder',
            'Hint 2 placeholder',
            'Hint 3 placeholder',
          ],
          tests: [
            { input: [1, 2], output: 3 },
            { input: [0, 0], output: 0 },
          ],
          solution: 'return stub;',
          explanation: 'Stub explanation.',
        };
      },
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const textModel = genAI.getGenerativeModel({ model });

  return {
    async generateHint({ question, previousHints = [], context = {} }) {
      const prompt = buildHintPrompt({ question, previousHints, context });
      const result = await textModel.generateContent(prompt);
      const text = extractText(result);
      const parsed = parseJson(text);

      if (parsed?.hint) {
        return parsed;
      }

      return {
        hint: text || 'Consider breaking the problem into smaller steps.',
        reasoning: 'Fallback when Gemini provides free-form text.',
      };
    },

    async evaluateSolution({ question, submission }) {
      const prompt = buildEvaluationPrompt({ question, submission });
      const result = await textModel.generateContent(prompt);
      const text = extractText(result);
      const parsed = parseJson(text);

      if (parsed) {
        return parsed;
      }

      return createStubResponse(text || 'Evaluation unavailable.');
    },

    async validateQuestion(payload) {
      const prompt = buildValidationPrompt(payload);
      const result = await textModel.generateContent(prompt);
      const text = extractText(result);
      const parsed = parseJson(text);

      if (parsed?.valid !== undefined) {
        return parsed;
      }

      return {
        valid: true,
        feedback: text || 'Validation fallback response.',
        adjustments: [],
      };
    },

    async generateQuestion(payload) {
      const prompt = buildGenerationPrompt(payload);
      const result = await textModel.generateContent(prompt);
      const text = extractText(result);
      const parsed = parseJson(text);

      if (parsed?.question) {
        return parsed;
      }

      return {
        question: text || 'Question generation fallback.',
        stem: payload.topicName,
        language: payload.programmingLanguage || 'javascript',
        hints: [
          'Consider edge cases.',
          'Outline your approach.',
          'Test with sample input.',
        ],
        tests: [],
        solution: '',
        explanation: '',
      };
    },
  };
};

export default createGeminiClient;
