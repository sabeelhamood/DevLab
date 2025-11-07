/* eslint-disable max-lines-per-function */
import fetch from 'node-fetch';

const DEFAULT_BASE_URL =
  process.env['JUDGE0_BASE_URL'] || 'https://judge0-ce.p.rapidapi.com';

const LANGUAGE_ID_MAP = {
  javascript: 63, // Node.js 16.14.0
  python: 71, // Python 3.9.2
  java: 62, // Java 17
  'c++': 54, // GCC 9.2.0
  cpp: 54,
  go: 60,
  rust: 73,
};

const resolveLanguageId = language => {
  if (!language) return LANGUAGE_ID_MAP.javascript;
  const key = language.toLowerCase();
  return LANGUAGE_ID_MAP[key] ?? LANGUAGE_ID_MAP.javascript;
};

const encode = (value = '') => Buffer.from(value).toString('base64');

export const createJudge0Client = ({
  rapidApiKey = process.env['X_RAPIDAPI_KEY'] || process.env['RAPIDAPI_KEY'],
  rapidApiHost = process.env['X_RAPIDAPI_HOST'] ||
    process.env['RAPIDAPI_HOST'] ||
    'judge0-ce.p.rapidapi.com',
  baseUrl = DEFAULT_BASE_URL,
  logger = console,
} = {}) => {
  if (!rapidApiKey) {
    logger.warn?.(
      'RapidAPI key missing for Judge0. Falling back to stub executor.'
    );
    return {
      async execute() {
        return {
          stdout: '',
          stderr: 'Judge0 credentials not configured.',
          status: { description: 'Configuration Error' },
        };
      },
    };
  }

  const headers = {
    'content-type': 'application/json',
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': rapidApiHost,
  };

  const submissionsEndpoint = `${baseUrl}/submissions?base64_encoded=true&wait=true`;

  return {
    async execute({ language, code, stdin = '', expectedOutput = '' }) {
      const payload = {
        language_id: resolveLanguageId(language),
        source_code: encode(code),
        stdin: encode(stdin),
        expected_output: expectedOutput ? encode(expectedOutput) : undefined,
      };

      const response = await fetch(submissionsEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Judge0 execution failed: ${response.status} ${text}`);
      }

      const data = await response.json();
      return {
        stdout: data.stdout
          ? Buffer.from(data.stdout, 'base64').toString('utf8')
          : '',
        stderr: data.stderr
          ? Buffer.from(data.stderr, 'base64').toString('utf8')
          : '',
        status: data.status,
        time: data.time,
        memory: data.memory,
      };
    },
  };
};

export default createJudge0Client;
