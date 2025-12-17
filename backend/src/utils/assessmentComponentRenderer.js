/**
 * Renders AssessmentCodeQuestions component as HTML string
 * This generates HTML that matches the React component structure
 */
import { postgres } from '../config/database.js'
import { codeMirrorLoader } from './codeMirrorLoader.js'

const PUBLIC_API_BASE_URL =
  process.env['ASSESSMENT_PUBLIC_API_BASE_URL'] ||
  process.env['PUBLIC_BACKEND_URL'] ||
  process.env['PUBLIC_API_URL'] ||
  process.env['API_BASE_URL'] ||
  ''

function getBackendBaseUrl() {
  const base =
    PUBLIC_API_BASE_URL ||
    process.env['PUBLIC_BACKEND_URL'] ||
    process.env['PUBLIC_API_URL'] ||
    process.env['API_BASE_URL'] ||
    'https://devlab-backend-production-59bb.up.railway.app' ||
    'https://devlab-backend-production.up.railway.app'

  return (base || '').replace(/\/api\/?$/, '').replace(/\/$/, '')
}

const CODEMIRROR_BUNDLE_URL_PLACEHOLDER = '__CODEMIRROR_BUNDLE_URL__'

function getCodeMirrorBundleUrl() {
  return `${getBackendBaseUrl()}/static/codemirror-bundle.js`
}

const baseCodeMirrorTemplate = codeMirrorLoader.loadTemplate()

/**
 * Saves generated coding questions to Supabase
 * @param {Array} questions - Array of question objects
 * @param {string} assessmentId - Assessment identifier
 * @returns {Promise<Array>} Array of inserted question IDs
 */
export async function saveAssessmentCodeQuestions(questions = [], assessmentId) {
  if (!questions || questions.length === 0) {
    console.warn('[saveAssessmentCodeQuestions] No questions provided to save')
    return []
  }

  if (!assessmentId) {
    console.warn('[saveAssessmentCodeQuestions] No assessmentId provided, skipping save')
    return []
  }

  try {
    const insertPromises = questions.map(async (question) => {
      // Extract question text (description or title)
      const questionText = question.description || question.title || question.question || ''
      
      // Extract test cases (without answers)
      const testCases = Array.isArray(question.testCases) 
        ? question.testCases.map(tc => ({
            input: tc.input || '',
            expected_output: tc.expected_output || tc.output || ''
          }))
        : Array.isArray(question.test_cases)
          ? question.test_cases.map(tc => ({
              input: tc.input || '',
              expected_output: tc.expected_output || tc.output || ''
            }))
          : []

      // Extract skills array
      const skills = Array.isArray(question.skills) ? question.skills : []

      // Insert into Supabase
      const { rows } = await postgres.query(
        `INSERT INTO "assessment_codeQuestions" 
         ("assessment_id", "question", "testCases", "skills", "createdAt")
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING "id"`,
        [assessmentId, questionText, JSON.stringify(testCases), JSON.stringify(skills)]
      )

      return rows[0]?.id
    })

    const insertedIds = await Promise.all(insertPromises)
    console.log(`[saveAssessmentCodeQuestions] Successfully saved ${insertedIds.length} questions for assessment ${assessmentId}`)
    return insertedIds.filter(Boolean)
  } catch (error) {
    console.error('[saveAssessmentCodeQuestions] Error saving questions to Supabase:', error)
    // Don't throw - allow the request to continue even if saving fails
    return []
  }
}

export function renderAssessmentCodeQuestions(questions = []) {
  if (!questions || questions.length === 0) {
    return `
      <div class="assessment-questions-container" style="padding: 1.5rem; background: #f9fafb; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #6b7280;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No coding questions available.</p>
        </div>
      </div>
    `
  }

  const questionsHtml = questions.map((question, index) => {
    const difficulty = 'medium'
    const difficultyClass = 
      difficulty === 'easy' || difficulty === 'basic' ? 'difficulty-easy' :
      difficulty === 'medium' || difficulty === 'intermediate' ? 'difficulty-medium' :
      'difficulty-hard'

    const skillsHtml = question.skills && question.skills.length > 0
      ? `
        <div style="margin-bottom: 1rem;">
          <span style="font-size: 0.875rem; font-weight: 500; color: #374151; display: block; margin-bottom: 0.5rem;">Skills:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${question.skills.map(skill => `
              <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #EEE8AA; color: #8B4513; border-radius: 9999px;">
                ${escapeHtml(skill)}
              </span>
            `).join('')}
          </div>
        </div>
      `
      : ''

    const testCasesHtml = question.testCases && question.testCases.length > 0
      ? `
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #6b7280;">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">
              Test Cases (${question.testCases.length})
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${question.testCases.map((testCase, testIndex) => `
              <div style="background: #FAFAFA; border-radius: 0.5rem; padding: 0.75rem; border: 1px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <span style="font-size: 0.75rem; font-weight: 500; color: #6b7280; display: block; margin-bottom: 0.25rem;">Input:</span>
                    <code style="font-size: 0.875rem; color: #1f2937; background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; display: inline-block;">
                      ${escapeHtml(testCase.input || 'N/A')}
                    </code>
                  </div>
                  <div>
                    <span style="font-size: 0.75rem; font-weight: 500; color: #6b7280; display: block; margin-bottom: 0.25rem;">Expected Output:</span>
                    <code style="font-size: 0.875rem; color: #1f2937; background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; display: inline-block;">
                      ${escapeHtml(testCase.expected_output || testCase.output || 'N/A')}
                    </code>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : ''

    const judge0Html = renderJudge0Section(question)

    return `
      <div class="question-step" data-question-index="${index}" style="${index === 0 ? '' : 'display:none;'}">
        <div class="question-layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 32px; align-items: flex-start;">
          <div class="question-card" style="background: linear-gradient(145deg, #ffffff, #f0fdfa); border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 60px rgba(6, 95, 70, 0.12); padding: 32px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="padding: 12px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 style="font-size: 24px; line-height: 32px; font-weight: 700; color: #0f172a; margin: 0;">
                    ${escapeHtml(question.title || `Question ${index + 1}`)}
                  </h3>
                  <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px; font-size: 16px; color: #475569;">
                    <span style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${escapeHtml(question.programming_language || 'N/A')}
                    </span>
                    <span class="${difficultyClass}" style="
                      font-size: 12px;
                      padding: 4px 12px;
                      border-radius: 9999px;
                      font-weight: 600;
                      letter-spacing: 0.05em;
                      ${
                        difficultyClass === 'difficulty-easy' ? 'background: #dcfce7; color: #166534;' :
                        difficultyClass === 'difficulty-medium' ? 'background: #fef3c7; color: #92400e;' :
                        'background: #fee2e2; color: #991b1b;'
                      }">
                      ${escapeHtml(difficulty)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #475569;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span style="font-size: 14px; font-weight: 600; color: #0f172a; letter-spacing: 0.01em;">Description</span>
              </div>
              <div style="background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid rgba(15, 23, 42, 0.05);">
                <p style="color: #1f2937; white-space: pre-wrap; margin: 0; line-height: 1.7; font-size: 16px;">${escapeHtml(question.description || 'No description provided.')}
                </p>
              </div>
            </div>

            ${skillsHtml}
            ${testCasesHtml}
          </div>
          ${judge0Html}
        </div>
      </div>
    `
  }).join('')

  const serviceHeadersScript = renderServiceHeadersScript()
  const apiBaseUrlScript = renderApiBaseUrlScript()

  return `
    ${apiBaseUrlScript}
    ${serviceHeadersScript}
    <div class="assessment-questions-container" style="padding: 32px; background: #f8fafc; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b;">
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 30px; line-height: 40px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
          Coding Assessment Questions
        </h2>
        <p style="color: #475569; margin: 0; font-size: 16px;">
          ${questions.length} question${questions.length !== 1 ? 's' : ''} generated
        </p>
      </div>
      <div class="question-steps-wrapper">
        ${questionsHtml}
      </div>
      <div class="assessment-navigation" style="margin-top: 2rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem;">
        <button type="button" data-nav-prev style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.8rem 1.4rem; border-radius: 9999px; border: 1px solid rgba(15, 23, 42, 0.12); background: white; color: #0f172a; font-weight: 600; cursor: pointer;">
          ← Previous Question
        </button>
        <div data-step-indicator style="font-weight: 600; color: #0f172a;">Question 1 of ${questions.length}</div>
        <button type="button" data-nav-next style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.8rem 1.4rem; border-radius: 9999px; border: none; background: #000000; color: white; font-weight: 600; cursor: pointer;">
          Next Question →
        </button>
      </div>
      <div style="margin-top: 1.5rem; text-align: center;">
        <button type="button" data-submit-all-answers style="display: none; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.95rem 3rem; border-radius: 9999px; border: none; font-size: 1rem; font-weight: 700; background: #FF8C00; color: white; box-shadow: 0 18px 35px rgba(37, 99, 235, 0.35); cursor: pointer;">
          Submit All Solutions 🚀
        </button>
      </div>
      <div style="margin-top: 1rem;">
        <div data-grading-results style="display: none;"></div>
        <pre data-submit-output style="display: none; background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.75rem; font-size: 0.8rem; overflow-x: auto;"></pre>
      </div>
    </div>
    ${renderQuestionMetaScript(questions)}
    ${renderStepperBootstrap()}
  `
}

function escapeHtml(text) {
  if (typeof text !== 'string') {
    text = String(text)
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

function buildCodeMirrorTemplateForQuestion(question = {}) {
  if (!baseCodeMirrorTemplate) {
    return '<p>Unable to load code editor.</p>'
  }

  let template = baseCodeMirrorTemplate

  const normalizedTestCases = extractNormalizedTestCases(question)
  if (normalizedTestCases.length) {
    const serializedTests = JSON.stringify(normalizedTestCases, null, 4)
    // Replace existing tests array (handles both empty [] and non-empty arrays)
    template = template.replace(/const tests = \[[\s\S]*?\];/, `const tests = ${serializedTests};`)
  }

  // Initialize editor in neutral state - no language pre-selected
  // The learner must select a language from the dropdown
  template = template.replace(
    /<textarea id="editor">[\s\S]*?<\/textarea>/,
    `<textarea id="editor">// Please select a programming language to begin</textarea>`
  )
  
  // Set editor to null mode initially (no syntax highlighting until language is selected)
  template = template.replace(
    /mode:\s*["'][^"']*["']/,
    `mode: null`
  )

  const bundleUrl = getCodeMirrorBundleUrl()
  template = template.replace(new RegExp(CODEMIRROR_BUNDLE_URL_PLACEHOLDER, 'g'), bundleUrl)

  return template
}

// Map Judge0 language names to CodeMirror modes
function getCodeMirrorModeFromLanguage(language) {
  const lang = (language || 'javascript').toLowerCase()
  const modeMap = {
    'javascript': 'javascript',
    'typescript': 'javascript', // TypeScript uses JavaScript mode
    'python': 'python',
    'java': 'text/x-java',
    'c': 'text/x-csrc',
    'cpp': 'text/x-c++src',
    'c++': 'text/x-c++src',
    'csharp': 'text/x-csrc', // C# uses C-like mode
    'c#': 'text/x-csrc',
    'php': 'php',
    'ruby': 'python', // Ruby uses Python-like mode
    'go': 'text/x-csrc', // Go uses C-like mode
    'rust': 'text/x-csrc', // Rust uses C-like mode
    'xml': 'xml',
    'html': 'xml',
    'css': 'css'
  }
  return modeMap[lang] || 'javascript'
}

// Get default code snippet for a language
function getDefaultCodeForLanguage(language) {
  const lang = (language || 'javascript').toLowerCase()
  const defaultCodes = {
    'javascript': 'console.log("Hello!");',
    'typescript': 'console.log("Hello!");',
    'python': 'print("Hello!")',
    'java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}',
    'c': '#include <stdio.h>\n\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}',
    'cpp': '#include <iostream>\n\nint main() {\n    std::cout << "Hello!" << std::endl;\n    return 0;\n}',
    'c++': '#include <iostream>\n\nint main() {\n    std::cout << "Hello!" << std::endl;\n    return 0;\n}',
    'csharp': 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello!");\n    }\n}',
    'c#': 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello!");\n    }\n}',
    'php': '<?php\necho "Hello!";\n?>',
    'ruby': 'puts "Hello!"',
    'go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello!")\n}',
    'rust': 'fn main() {\n    println!("Hello!");\n}'
  }
  return defaultCodes[lang] || 'console.log("Hello!");'
}

function extractNormalizedTestCases(question = {}) {
  const configCases =
    (question?.judge0?.testCases && Array.isArray(question.judge0.testCases) && question.judge0.testCases) ||
    (question?.judge0?.test_cases && Array.isArray(question.judge0.test_cases) && question.judge0.test_cases)
  const questionCases =
    (Array.isArray(question.testCases) && question.testCases) ||
    (Array.isArray(question.test_cases) && question.test_cases) ||
    []

  const rawCases = configCases || questionCases
  if (!Array.isArray(rawCases)) {
    return []
  }

  return rawCases
    .map((testCase = {}) => {
      const inputValue = getFirstDefinedField(testCase, ['input', 'testInput', 'test_input'])
      const expectedValue = getFirstDefinedField(testCase, ['expected_output', 'expectedOutput', 'expected', 'output'])
      return {
        input: normalizeTestCaseValue(inputValue, ''),
        expectedOutput: normalizeTestCaseValue(expectedValue, '')
      }
    })
    .filter((testCase) => testCase.input !== '' || testCase.expectedOutput !== '')
}

function normalizeTestCaseValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback
  }
  return value
}

function getFirstDefinedField(obj, fields = []) {
  if (!obj || typeof obj !== 'object') {
    return undefined
  }
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      return obj[field]
    }
  }
  return undefined
}

function renderJudge0Section(question) {
  const config = question?.judge0
  if (!config || config.enabled === false) return ''

  const questionId = question.id || `question_${Date.now()}`
  const language = (config.language || question.programming_language || 'javascript').toLowerCase()
  const normalizedTestCases = extractNormalizedTestCases(question)
  const testCaseCount = normalizedTestCases.length
  const iframeContent = buildCodeMirrorTemplateForQuestion(question)
  const iframeTitle = `Code editor for ${question.title || questionId}`

  return `
    <div class="judge0-panel" style="margin-top: 1.25rem;">
      <div class="judge0-sandbox-card" data-question-id="${escapeHtml(questionId)}" data-language="${escapeHtml(language)}" style="background: #F5F5F5; border-radius: 1.5rem; padding: 1.5rem; border: 1px solid rgba(15, 23, 42, 0.08); box-shadow: 0 25px 45px rgba(15, 23, 42, 0.1); color: #0f172a;">
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 700;">Judge0 Code Execution</div>
              <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: #475569;">
                Powered by Judge0 
              </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-end;">
              <span style="font-size: 0.8rem; color: #475569;">Loaded test cases: ${testCaseCount || 'N/A'}</span>
             
              </div>
            </div>
          <div class="codemirror-sandbox-frame" style="border-radius: 1.25rem; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.45); background: #ffffff;">
            <iframe
              data-codemirror-editor
              title="${escapeHtml(iframeTitle)}"
              srcdoc="${escapeHtml(iframeContent)}"
              style="width: 100%; min-height: 720px; border: none; background: #ffffff;"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>
          <div style="font-size: 0.85rem; color: #475569; background: #ffffff; border-radius: 1rem; padding: 1rem; border: 1px solid rgba(148, 163, 184, 0.3);">
            <p style="margin: 0 0 0.5rem 0;">Tips:</p>
            <ul style="margin: 0; padding-left: 1.25rem; color: #1e293b;">
              <li>Switch languages or themes directly inside the CodeMirror toolbar.</li>
              <li>Use "Run" for ad-hoc checks or "Run All Tests" to execute ${testCaseCount ? `${testCaseCount} provided test case${testCaseCount === 1 ? '' : 's'}` : 'the default sample tests'}.</li>
              <li>Reset the editor to restore the default snippet.</li>
            </ul>
        </div>
      </div>
      </div>
    </div>
  `
}

function serializeJsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}

function getDefaultServiceApiKey() {
  if (process.env['SERVICE_API_KEY']) {
    return process.env['SERVICE_API_KEY']
  }
  const raw = process.env['SERVICE_API_KEYS'] || ''
  const tokens = raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  return tokens.length ? tokens[0] : ''
}

function getDefaultServiceId() {
  return process.env['SERVICE_ID'] || process.env['SERVICE_API_ID'] || 'assessment-service'
}

function renderServiceHeadersScript() {
  const serviceKey = getDefaultServiceApiKey()
  const serviceId = getDefaultServiceId()
  if (!serviceKey && !serviceId) {
    return ''
  }

  const payload = serializeJsonForScript({
    ...(serviceKey ? { 'x-api-key': serviceKey } : {}),
    ...(serviceId ? { 'x-service-id': serviceId } : {})
  })

  return `
    <script>
      (function () {
        try {
          var existing = window.__DEVLAB_SERVICE_HEADERS || {};
          var provided = ${payload};
          window.__DEVLAB_SERVICE_HEADERS = Object.assign({}, provided, existing);
          console.log('[DevLab Assessment] Service headers initialized:', {
            hasApiKey: !!window.__DEVLAB_SERVICE_HEADERS['x-api-key'],
            hasServiceId: !!window.__DEVLAB_SERVICE_HEADERS['x-service-id'],
            keys: Object.keys(window.__DEVLAB_SERVICE_HEADERS)
          });
        } catch (err) {
          console.error('[DevLab Assessment] Failed to initialize service headers', err);
          window.__DEVLAB_SERVICE_HEADERS = ${payload};
        }
      })();
    </script>
  `
}

function renderApiBaseUrlScript() {
  const baseUrl = getBackendBaseUrl()
  if (!baseUrl) {
    return ''
  }

  return `
    <script>
      (function () {
        try {
          window.__DEVLAB_API_BASE__ = ${serializeJsonForScript(baseUrl)};
          console.log('[DevLab Assessment] API base URL set:', window.__DEVLAB_API_BASE__);
        } catch (err) {
          console.error('[DevLab Assessment] Failed to initialize API base URL', err);
        }
      })();
    </script>
  `
}

function renderQuestionMetaScript(questions = []) {
  const payload = questions.map((question, index) => ({
    id: question.id || `question_${index + 1}`,
    title: question.title || `Question ${index + 1}`,
    description: question.description || '',
    programming_language: question.programming_language || question.language || 'javascript',
    language: (question.programming_language || question.language || 'javascript').toLowerCase(),
    skills: Array.isArray(question.skills) ? question.skills : [],
    testCases: Array.isArray(question.testCases) ? question.testCases : (Array.isArray(question.test_cases) ? question.test_cases : [])
  }))
  const json = serializeJsonForScript(payload)
  return `
    <script type="application/json" data-question-meta>
${json}
    </script>
  `
}

function renderStepperBootstrap() {
  const scriptBody = `
    (function () {
      const init = () => {
        const steps = Array.from(document.querySelectorAll('.question-step'));
        if (!steps.length) return;

        const prevBtn = document.querySelector('[data-nav-prev]');
        const nextBtn = document.querySelector('[data-nav-next]');
        const submitBtn = document.querySelector('[data-submit-all-answers]');
        const stepIndicator = document.querySelector('[data-step-indicator]');
        const submitOutput = document.querySelector('[data-submit-output]');

        const metaScript = document.querySelector('script[data-question-meta]');
        let meta = [];
        if (metaScript) {
          try {
            meta = JSON.parse(metaScript.textContent || '[]');
          } catch (err) {
            console.error('Failed to parse question meta:', err);
          }
          metaScript.remove();
        }

        let currentIndex = 0;
        const total = steps.length;

        const updateVisibility = () => {
          steps.forEach((step, idx) => {
            step.style.display = idx === currentIndex ? '' : 'none';
          });
          if (prevBtn) prevBtn.disabled = currentIndex === 0;
          if (nextBtn) nextBtn.disabled = currentIndex === total - 1;
          if (stepIndicator) {
            stepIndicator.textContent = 'Question ' + (currentIndex + 1) + ' of ' + total;
          }
          if (submitBtn) {
            submitBtn.style.display = currentIndex === total - 1 ? 'inline-flex' : 'none';
          }
        };

        const clampIndex = (value) => Math.max(0, Math.min(value, total - 1));

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            currentIndex = clampIndex(currentIndex - 1);
            updateVisibility();
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            currentIndex = clampIndex(currentIndex + 1);
            updateVisibility();
          });
        }

        const gatherSolutions = () => {
          return steps.map((step, idx) => {
            const sandbox = step.querySelector('.judge0-sandbox-card');
            const textarea = sandbox ? sandbox.querySelector('.judge0-code-input') : null;
            const iframe = sandbox ? sandbox.querySelector('iframe[data-codemirror-editor]') : null;
            const questionId = sandbox?.getAttribute('data-question-id') || meta[idx]?.id || 'question_' + (idx + 1);
            const language = sandbox?.getAttribute('data-language') || meta[idx]?.language || 'javascript';

            let solution = '';
            if (textarea) {
              solution = textarea.value;
            } else if (iframe && iframe.contentWindow) {
              try {
                if (typeof iframe.contentWindow.getCode === 'function') {
                  solution = iframe.contentWindow.getCode();
                } else if (iframe.contentWindow.editor && iframe.contentWindow.editor.state) {
                  solution = iframe.contentWindow.editor.state.doc?.toString() || '';
                }
              } catch (err) {
                console.warn('Unable to read code from CodeMirror iframe:', err);
              }
            }

            return {
              id: questionId,
              language,
              solution
            };
          });
        };

        const gatherQuestions = () => {
          return meta.map((q, idx) => ({
            id: q.id || 'question_' + (idx + 1),
            title: q.title || 'Question ' + (idx + 1),
            description: q.description || '',
            programming_language: q.programming_language || q.language || 'javascript',
            language: q.language || 'javascript',
            skills: Array.isArray(q.skills) ? q.skills : [],
            testCases: Array.isArray(q.testCases) ? q.testCases : []
          }));
        };

        const buildUrl = (path) => {
          const base = window.__DEVLAB_API_BASE__ || '';
          if (!path) return '';
          if (/^https?:\\/\\//i.test(path)) return path;
          const normalized = path.startsWith('/') ? path : '/' + path;
          return base ? (base.replace(/\\/+$/, '') + normalized) : normalized;
        };

        const getServiceHeaders = () => {
          const globalHeaders = window.__DEVLAB_SERVICE_HEADERS;
          if (globalHeaders && typeof globalHeaders === 'object') {
            try {
              return JSON.parse(JSON.stringify(globalHeaders));
            } catch {
              return { ...globalHeaders };
            }
          }
          return {};
        };

        const renderGradingResults = (evaluation) => {
          if (!evaluation) return '';

          const rawScore = typeof evaluation === 'number'
            ? evaluation
            : (typeof evaluation.score === 'number'
                ? evaluation.score
                : (typeof evaluation.data === 'object' && typeof evaluation.data.score === 'number'
                    ? evaluation.data.score
                    : 0));

          const score = Math.max(0, Math.min(100, Math.round(rawScore)));
          const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

          let html = '<div style="background: white; border-radius: 1rem; padding: 2rem; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 1.5rem; text-align: center;">';
          html += '<h3 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.75rem 0;">Assessment Score</h3>';
          html += '<p style="font-size: 0.95rem; color: #6b7280; margin: 0 0 1.5rem 0;">This score was computed by the centralized grading service.</p>';
          html += '<div style="display: inline-flex; align-items: center; justify-content: center; width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, ' + scoreColor + ', ' + scoreColor + 'dd); margin-bottom: 0.75rem;">';
          html += '<span style="font-size: 2.75rem; font-weight: 800; color: white;">' + score + '</span>';
          html += '</div>';
          html += '<p style="font-size: 1rem; color: #475569; margin: 0;">Final Score (0–100)</p>';
          html += '</div>';

          return html;
        };

        const escapeHtml = (text) => {
          if (text === null || text === undefined) return '';
          const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
          return String(text).replace(/[&<>"']/g, m => map[m]);
        };

        const gradingResults = document.querySelector('[data-grading-results]');

        if (submitBtn) {
          submitBtn.addEventListener('click', async () => {
            const questions = gatherQuestions();
            const solutions = gatherSolutions();
            const skills = Array.isArray(meta)
              ? Array.from(new Set(
                  meta
                    .flatMap((q) => Array.isArray(q.skills) ? q.skills : [])
                    .map((s) => (typeof s === 'string' ? s.trim() : s))
                    .filter(Boolean)
                ))
              : [];
            
            // Validate solutions
            const emptySolutions = solutions.filter(s => !s.solution || !s.solution.trim());
            if (emptySolutions.length > 0) {
              alert('Please provide solutions for all questions before submitting.');
              return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Grading...';
            if (gradingResults) {
              gradingResults.style.display = 'block';
              gradingResults.innerHTML = '<div style="text-align: center; padding: 2rem; color: #475569;">Grading your solutions, please wait...</div>';
            }

            try {
              const endpoint = buildUrl('/api/external/assessment/grade');
              const headers = {
                'Content-Type': 'application/json',
                ...getServiceHeaders()
              };

              const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ questions, solutions, skills })
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || 'Failed to grade assessment');
              }

              const scorePayload = result && typeof result === 'object'
                ? (result.data || result)
                : result;

              // Display only the final score
              if (gradingResults) {
                gradingResults.innerHTML = renderGradingResults(scorePayload);
              }

              // Also log to console
              console.log('Assessment grading results (score only):', result);
              
              // Dispatch event with score-focused payload
              const event = new CustomEvent('assessmentSolutionsSubmitted', { detail: { questions, solutions, evaluation: scorePayload } });
              document.dispatchEvent(event);

              // Scroll to results
              gradingResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } catch (error) {
              console.error('Assessment grading error:', error);
              if (gradingResults) {
                gradingResults.innerHTML = '<div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 0.75rem; padding: 1rem; color: #991b1b;">Error: ' + escapeHtml(error.message) + '</div>';
              }
              alert('Failed to grade assessment: ' + error.message);
            } finally {
              submitBtn.disabled = false;
              submitBtn.textContent = 'SUBMIT ALL SOLUTIONS';
            }
          });
        }

        updateVisibility();
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  `

  return `
    <script>
${scriptBody}
    </script>
  `
}