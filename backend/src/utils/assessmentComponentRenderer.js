/**
 * Renders AssessmentCodeQuestions component as HTML string
 * This generates HTML that matches the React component structure
 */
import { postgres } from '../config/database.js'

const PUBLIC_API_BASE_URL =
  process.env['ASSESSMENT_PUBLIC_API_BASE_URL'] ||
  process.env['PUBLIC_BACKEND_URL'] ||
  process.env['PUBLIC_API_URL'] ||
  process.env['API_BASE_URL'] ||
  ''

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
  const judge0BootstrapScript = renderJudge0Bootstrap(questions)

  return `
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
    ${serviceHeadersScript}
    ${judge0BootstrapScript}
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

function renderJudge0Section(question) {
  const config = question?.judge0
  if (!config || config.enabled === false) return ''

  const testCaseCount =
    Array.isArray(config.testCases) && config.testCases.length
      ? config.testCases.length
      : Array.isArray(question.testCases)
        ? question.testCases.length
        : 0

  const questionId = question.id || `question_${Date.now()}`
  const configJson = serializeJsonForScript({
    questionId,
    ...config
  })

  const templateJson = serializeJsonForScript({
    questionId,
    template: getDefaultCodeTemplate(config.language || question.programming_language)
  })

  return `
    <div class="judge0-panel" style="margin-top: 1.25rem;">
      <div class="judge0-sandbox-card" data-question-id="${escapeHtml(questionId)}" data-language="${escapeHtml((config.language || question.programming_language || 'javascript').toLowerCase())}" style="background: #F5F5F5; border-radius: 1.5rem; padding: 1.5rem; border: 1px solid rgba(15, 23, 42, 0.08); box-shadow: 0 25px 45px rgba(15, 23, 42, 0.1); color: #0f172a;">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 700;">Judge0 Code Execution</div>
              <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: #475569;">
                Powered by Judge0 • ${escapeHtml((config.language || question.programming_language || 'javascript').toUpperCase())}
              </p>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <button type="button" data-judge0-run-code style="border: none; border-radius: 9999px; background: #0F6B52; color: white; padding: 0.6rem 1.4rem; font-weight: 600; cursor: pointer; box-shadow: 0 12px 24px rgba(34, 197, 94, 0.3);">
                Run Code
              </button>
              <button type="button" data-judge0-run-tests style="border: 1px solid #0F6B52; border-radius: 9999px; background: #F0FFF0; color: #0F6B52; padding: 0.6rem 1.4rem; font-weight: 600; cursor: pointer;">
                Run All Tests (${testCaseCount})
              </button>
              <button type="button" data-judge0-reset aria-label="Reset Editor" style="border: 1px solid rgba(148, 163, 184, 0.5); border-radius: 9999px; background: white; color: #475569; padding: 0.6rem 1.4rem; font-weight: 600; cursor: pointer;">
                ↺
              </button>
            </div>
          </div>

          <div style="border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.45); overflow: hidden;">
            <textarea class="judge0-code-input" spellcheck="false" style="width: 100%; min-height: 240px; border: none; background: #0f172a; color: #e2e8f0; padding: 1rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.9rem; line-height: 1.5; resize: vertical;" placeholder="// Write your solution here..."></textarea>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="background: rgba(15, 23, 42, 0.85); color: #e2e8f0; border-radius: 1rem; padding: 1rem; border: 1px solid rgba(96, 165, 250, 0.2);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 600;">Console Output</span>
                <span data-judge0-status style="font-size: 0.8rem; color: #cbd5f5;">Idle</span>
              </div>
              <pre data-judge0-console style="margin: 0; white-space: pre-wrap; font-size: 0.8rem; max-height: 180px; overflow-y: auto;">
// Use "Run Code" to execute your solution or "Run All Tests" for full validation.
              </pre>
            </div>
            <div style="background: white; border-radius: 1rem; padding: 1rem; border: 1px solid rgba(15, 23, 42, 0.08); box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.02);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <div>
                  <div style="font-weight: 600; color: #0f172a;">Judge0 Test Results</div>
                  <p data-judge0-summary style="margin: 0; font-size: 0.85rem; color: #475569;">Run all tests to see detailed feedback.</p>
                </div>
                <span style="font-size: 0.75rem; font-weight: 600; color: #1e293b; background: rgba(148, 163, 184, 0.2); padding: 0.2rem 0.75rem; border-radius: 9999px;">
                  ${testCaseCount} tests
                </span>
              </div>
              <div data-judge0-results style="display: flex; flex-direction: column; gap: 0.65rem; max-height: 220px; overflow-y: auto;"></div>
            </div>
          </div>
        </div>
      </div>
      <script type="application/json" data-judge0-config="${escapeHtml(questionId)}">
${configJson}
      </script>
      <script type="application/json" data-judge0-template="${escapeHtml(questionId)}">
${templateJson}
      </script>
    </div>
  `
}

function serializeJsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}

function getDefaultCodeTemplate(language = 'javascript') {
  const normalized = (language || '').toLowerCase()
  switch (normalized) {
    case 'python':
      return [
        'def solve(data):',
        '    # TODO: implement your logic here',
        '    return data',
        '',
        'if __name__ == "__main__":',
        '    # Sample usage',
        '    print(solve("sample input"))',
        ''
      ].join('\n')
    case 'java':
      return [
        'import java.util.*;',
        '',
        'public class Solution {',
        '    public static Object solve(Object input) {',
        '        // TODO: implement your logic here',
        '        return input;',
        '    }',
        '',
        '    public static void main(String[] args) {',
        '        System.out.println(solve("sample input"));',
        '    }',
        '}',
        ''
      ].join('\n')
    case 'cpp':
    case 'c++':
      return [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        '',
        'int main() {',
        '    ios::sync_with_stdio(false);',
        '    cin.tie(nullptr);',
        '    // TODO: implement your logic here',
        '    cout << "sample output" << endl;',
        '    return 0;',
        '}',
        ''
      ].join('\n')
    default:
      return [
        'function solve(input) {',
        '  // TODO: implement your logic here',
        '  return input;',
        '}',
        '',
        'console.log(solve("sample input"));',
        ''
      ].join('\n')
  }
}

function renderJudge0Bootstrap(questions) {
  const hasJudge0 = Array.isArray(questions) && questions.some((q) => q?.judge0 && q.judge0.enabled !== false)
  if (!hasJudge0) return ''

  const baseFromEnv = PUBLIC_API_BASE_URL ? PUBLIC_API_BASE_URL.replace(/"/g, '\\"') : ''

  const scriptBody = `
    (function () {
      try {
        const scriptEl = document.currentScript;
        const providedBase = scriptEl ? scriptEl.getAttribute('data-api-base') : '';
        const defaultBase = providedBase || window.__DEVLAB_API_BASE__ || '${baseFromEnv || 'https://devlab-backend-production.up.railway.app'}';
        const attrServiceKey = scriptEl ? scriptEl.getAttribute('data-service-key') : '';
        const attrServiceId = scriptEl ? scriptEl.getAttribute('data-service-id') : '';

        const buildUrl = (path) => {
          if (!path) return '';
          if (/^https?:\\/\\//i.test(path)) return path;
          const base = (defaultBase || '').replace(/\\/+$/, '');
          const normalized = path.startsWith('/') ? path : '/' + path;
          return base ? base + normalized : normalized;
        };

        const configMap = {};
        document.querySelectorAll('script[data-judge0-config]').forEach((script) => {
          const key = script.getAttribute('data-judge0-config');
          if (!key) return;
          try {
            configMap[key] = JSON.parse(script.textContent || '{}');
          } catch (err) {
            console.error('Failed to parse judge0 config for', key, err);
          }
          script.remove();
        });

        const templates = {};
        document.querySelectorAll('script[data-judge0-template]').forEach((script) => {
          const key = script.getAttribute('data-judge0-template');
          if (!key) return;
          try {
            const parsed = JSON.parse(script.textContent || '{}');
            templates[key] = parsed.template || '';
          } catch (err) {
            console.error('Failed to parse judge0 template for', key, err);
          }
          script.remove();
        });

        const postJson = async (endpoint, payload) => {
          const extraHeaders = (() => {
            const globalHeaders = window.__DEVLAB_SERVICE_HEADERS;
            if (globalHeaders && typeof globalHeaders === 'object') {
              try {
                return JSON.parse(JSON.stringify(globalHeaders));
              } catch {
                return { ...globalHeaders };
              }
            }
            const headers = {};
            if (attrServiceKey) {
              headers['x-api-key'] = attrServiceKey;
            }
            if (attrServiceId) {
              headers['x-service-id'] = attrServiceId;
            }
            return headers;
          })();

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...extraHeaders
            },
            body: JSON.stringify(payload)
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            const message = data?.error || data?.message || response.statusText;
            throw new Error(message);
          }
          return data;
        };

        const escapeHtml = (value) => {
          if (value === null || value === undefined) return '';
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

        const formatValue = (value) => {
          if (value === null || value === undefined) return 'null';
          if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed === '' ? '""' : JSON.stringify(trimmed);
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            return value.toString();
          }
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        };

        const getFieldValue = (obj, candidates = []) => {
          if (!obj) return '';
          for (const field of candidates) {
            if (Object.prototype.hasOwnProperty.call(obj, field)) {
              return obj[field];
            }
          }
          return '';
        };

        document.querySelectorAll('.judge0-sandbox-card').forEach((sandbox) => {
          const questionId = sandbox.getAttribute('data-question-id');
          if (!questionId) return;
          const config = configMap[questionId];
          if (!config) return;

          const textarea = sandbox.querySelector('.judge0-code-input');
          const statusEl = sandbox.querySelector('[data-judge0-status]');
          const consoleEl = sandbox.querySelector('[data-judge0-console]');
          const resultsEl = sandbox.querySelector('[data-judge0-results]');
          const summaryEl = sandbox.querySelector('[data-judge0-summary]');
          const runCodeBtn = sandbox.querySelector('[data-judge0-run-code]');
          const runTestsBtn = sandbox.querySelector('[data-judge0-run-tests]');
          const resetBtn = sandbox.querySelector('[data-judge0-reset]');
          const defaultTemplate = templates[questionId] || textarea?.value || '';

          if (textarea && !textarea.value.trim()) {
            textarea.value = defaultTemplate;
          }

          const setStatus = (message, color = '#475569') => {
            if (statusEl) {
              statusEl.textContent = message;
              statusEl.style.color = color;
            }
          };

          const updateConsole = (lines, append = false) => {
            if (!consoleEl) return;
            const text = Array.isArray(lines) ? lines.join('\\n') : String(lines);
            if (append) {
              consoleEl.textContent = (consoleEl.textContent || '') + '\\n' + text;
            } else {
              consoleEl.textContent = text;
            }
          };

          const updateSummary = (message) => {
            if (summaryEl) {
              summaryEl.textContent = message;
            }
          };

          const renderResults = (results) => {
            if (!resultsEl) return;
            if (!results || !results.length) {
              resultsEl.innerHTML = '<div style="font-size:0.85rem; color:#94a3b8;">Run the full suite to see pass/fail details here.</div>';
              return;
            }

            const cards = results.map((result, idx) => {
              const status = result.passed ? 'PASS' : 'FAIL';
              const statusColor = result.passed ? '#22c55e' : '#ef4444';
              const badgeBg = result.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

              return '' +
                '<div style="border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 0.85rem; padding: 0.85rem; background: white;">' +
                  '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.4rem;">' +
                    '<span style="font-weight:600; color:#0f172a;">Test ' + (idx + 1) + '</span>' +
                    '<span style="font-size:0.75rem; font-weight:600; color:' + statusColor + '; background:' + badgeBg + '; padding:0.2rem 0.75rem; border-radius:9999px;">' +
                      escapeHtml(status) +
                    '</span>' +
                  '</div>' +
                  '<div style="font-size:0.78rem; color:#475569; line-height:1.5;">' +
                    '<div><strong>Input:</strong> ' + escapeHtml(formatValue(result.input)) + '</div>' +
                    '<div><strong>Expected:</strong> ' + escapeHtml(formatValue(result.expected)) + '</div>' +
                    '<div><strong>Received:</strong> ' + escapeHtml(formatValue(result.result)) + '</div>' +
                    (result.stderr ? '<div><strong>Error:</strong> ' + escapeHtml(result.stderr) + '</div>' : '') +
                    '<div style="margin-top:0.25rem; font-size:0.75rem; color:#94a3b8;">' +
                      'Time: ' + escapeHtml(result.time || '0.000s') +
                    '</div>' +
                  '</div>' +
                '</div>';
            });

            resultsEl.innerHTML = cards.join('');
          };

          const runCode = async () => {
            if (!textarea) return;
            const code = textarea.value;
            if (!code.trim()) {
              setStatus('Please write some code first.', '#ef4444');
              return;
            }

            try {
              setStatus('Running code through Judge0…', '#1d4ed8');
              updateConsole('// Sending code to Judge0 execution service…', false);
              const endpoint = buildUrl(config.endpoints?.execute || '/api/judge0/execute');
              const payload = {
                sourceCode: code,
                language: config.language || 'javascript',
                input: '',
                expectedOutput: null
              };
              const result = await postJson(endpoint, payload);
              setStatus('Execution complete.', '#22c55e');

              const lines = [];
              if (result?.result?.stdout) {
                lines.push('📤 Output:', result.result.stdout.trim());
              }
              if (result?.result?.stderr) {
                lines.push('⚠️ Errors:', result.result.stderr.trim());
              }
              if (result?.result?.compile_output) {
                lines.push('🔨 Compilation:', result.result.compile_output.trim());
              }
              lines.push('📊 Status: ' + (result?.result?.status || 'Unknown'));
              lines.push('⏱️ Time: ' + (result?.result?.time || 'N/A'));
              lines.push('💾 Memory: ' + (result?.result?.memory || 'N/A'));
              updateConsole(lines);
            } catch (err) {
              console.error('Judge0 execute error:', err);
              setStatus('Execution failed.', '#ef4444');
              updateConsole('❌ Error: ' + err.message);
            }
          };

          const findArrayBoundary = (text) => {
            let depth = 0;
            let inString = false;
            let stringChar = '';
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const prevChar = i > 0 ? text[i - 1] : '';
              if (inString) {
                if (char === stringChar && prevChar !== '\\\\') {
                  inString = false;
                  stringChar = '';
                }
                continue;
              }
              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
              }
              if (char === '[') {
                depth++;
              } else if (char === ']') {
                depth--;
                if (depth === 0) {
                  return i;
                }
              }
            }
            return -1;
          };

          const splitTopLevelValues = (text) => {
            const values = [];
            let current = '';
            let depth = 0;
            let inString = false;
            let stringChar = '';

            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const prevChar = i > 0 ? text[i - 1] : '';

              if (inString) {
                current += char;
                if (char === stringChar && prevChar !== '\\\\') {
                  inString = false;
                  stringChar = '';
                }
                continue;
              }

              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                current += char;
                continue;
              }

              if (char === '[' || char === '{' || char === '(') {
                depth++;
                current += char;
                continue;
              }

              if (char === ']' || char === '}' || char === ')') {
                depth = Math.max(depth - 1, 0);
                current += char;
                continue;
              }

              if (char === ',' && depth === 0) {
                if (current.trim()) {
                  values.push(current.trim());
                }
                current = '';
                continue;
              }

              current += char;
            }

            if (current.trim()) {
              values.push(current.trim());
            }

            return values;
          };

          const sanitizeValueString = (raw) => {
            if (typeof raw !== 'string') return raw;
            let trimmed = raw.trim();
            const startsWithQuote =
              (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
              (trimmed.startsWith("'") && trimmed.endsWith("'"));
            if (startsWithQuote) {
              trimmed = trimmed.slice(1, -1);
            }
            return trimmed.trim();
          };

          const convertArrayArgumentString = (raw) => {
            if (typeof raw !== 'string') return null;
            const trimmed = sanitizeValueString(raw);
            if (!trimmed.startsWith('[')) return null;
            const boundaryIndex = findArrayBoundary(trimmed);
            if (boundaryIndex === -1 || boundaryIndex === trimmed.length - 1) {
              return null;
            }

            const arraySegment = trimmed.slice(0, boundaryIndex + 1);
            try {
              JSON.parse(arraySegment);
            } catch {
              return null;
            }

            const remainder = trimmed.slice(boundaryIndex + 1).trim();
            if (!remainder.startsWith(',')) {
              return null;
            }

            const rest = remainder.slice(1).trim();
            if (!rest) {
              return null;
            }

            const extraSegments = splitTopLevelValues(rest);
            if (!extraSegments.length) {
              return null;
            }

            const assignments = ['arg0 = ' + arraySegment];
            extraSegments.forEach((segment, index) => {
              if (segment) {
                assignments.push('arg' + (index + 1) + ' = ' + segment);
              }
            });
            return assignments.join(', ');
          };

          const normalizeTestCaseValue = (value) => {
            if (value === null || value === undefined) return value;
            const primitiveTypes = ['string', 'number', 'boolean'];
            if (primitiveTypes.includes(typeof value)) {
              if (typeof value === 'string') {
                const sanitizedValue = sanitizeValueString(value);
                const assignmentString = convertArrayArgumentString(sanitizedValue);
                if (assignmentString) {
                  return assignmentString;
                }
                return sanitizedValue;
              }
              return value;
            }
            try {
              return JSON.stringify(value);
            } catch {
              return String(value);
            }
          };

          const normalizeTestCases = (testCases = []) => {
            return testCases.map((testCase) => {
              const normalized = { ...testCase };
              if (Object.prototype.hasOwnProperty.call(normalized, 'input')) {
                normalized.input = normalizeTestCaseValue(normalized.input);
              }
              if (Object.prototype.hasOwnProperty.call(normalized, 'testInput')) {
                normalized.testInput = normalizeTestCaseValue(normalized.testInput);
              }
              if (Object.prototype.hasOwnProperty.call(normalized, 'test_input')) {
                normalized.test_input = normalizeTestCaseValue(normalized.test_input);
              }
              if (Object.prototype.hasOwnProperty.call(normalized, 'expected')) {
                normalized.expected = normalizeTestCaseValue(normalized.expected);
              }
              if (Object.prototype.hasOwnProperty.call(normalized, 'expected_output')) {
                normalized.expected_output = normalizeTestCaseValue(normalized.expected_output);
              }
              if (Object.prototype.hasOwnProperty.call(normalized, 'output')) {
                normalized.output = normalizeTestCaseValue(normalized.output);
              }
              return normalized;
            });
          };

          const runAllTests = async () => {
            if (!textarea) return;
            const code = textarea.value;

            if (!code.trim()) {
              setStatus('Please write some code first.', '#ef4444');
              return;
            }

            const allTestCases = config.testCases || config.test_cases || [];
            if (!allTestCases.length) {
              setStatus('No test cases available for this question.', '#f97316');
              return;
            }

            try {
              setStatus('Running Judge0 test suite…', '#1d4ed8');
              updateConsole('// Executing official test suite via Judge0…', false);
              renderResults([]);
              updateSummary('Running tests…');

              const endpoint = buildUrl(config.endpoints?.runAllTestCases || '/api/judge0/test-cases');
              const payload = {
                sourceCode: code,
                language: config.language || 'javascript',
                testCases: normalizeTestCases(allTestCases)
              };
              const result = await postJson(endpoint, payload);

              const processed = (result?.results || []).map((testResult, index) => ({
                input: getFieldValue(testResult, ['input', 'testInput', 'test_input']),
                expected: getFieldValue(testResult, ['expected', 'expected_output', 'expectedOutput']),
                result: getFieldValue(testResult, ['result', 'actual', 'output', 'actual_output']),
                stderr: getFieldValue(testResult, ['stderr', 'error', 'errorMessage']),
                passed: Boolean(getFieldValue(testResult, ['passed', 'success', 'isPassed'])),
                time: getFieldValue(testResult, ['time', 'executionTime', 'execution_time'])
              }));

              const passed = processed.filter((p) => p.passed).length;
              const total = processed.length;
              setStatus('Tests completed.', '#22c55e');
              updateSummary(total && passed === total ? 'All tests passed.' : 'Tests completed. Review detailed feedback below.');
              renderResults(processed);

              const lines = [
                \`📊 Test Results: \\\${passed}/\\\${total} passed\`,
                \`⏱️ Total tests: \\\${total}\`
              ];
              updateConsole(lines);
            } catch (err) {
              console.error('Judge0 run tests error:', err);
              setStatus('Test run failed.', '#ef4444');
              updateSummary('Unable to complete tests.');
              updateConsole('❌ Error: ' + err.message);
            }
          };

          if (runCodeBtn) {
            runCodeBtn.addEventListener('click', runCode);
          }
          if (runTestsBtn) {
            runTestsBtn.addEventListener('click', runAllTests);
          }
          if (resetBtn && textarea) {
            resetBtn.addEventListener('click', () => {
              textarea.value = defaultTemplate;
              renderResults([]);
              updateSummary('Editor reset. Run tests to see results here.');
              setStatus('Template reset.', '#475569');
              updateConsole('// Editor reset to default template.');
            });
          }
        });
      } catch (err) {
        console.error('Judge0 sandbox bootstrap error:', err);
      }
    })();
  `

  const attrs = [
    `data-api-base="${escapeHtml(baseFromEnv)}"`,
    `data-service-key="${escapeHtml(getDefaultServiceApiKey())}"`,
    `data-service-id="${escapeHtml(getDefaultServiceId())}"`
  ].join(' ')

  return `
    <script ${attrs}>
${scriptBody}
    </script>
  `
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
        } catch (err) {
          console.error('Failed to initialize service headers', err);
          window.__DEVLAB_SERVICE_HEADERS = ${payload};
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
            const questionId = sandbox?.getAttribute('data-question-id') || meta[idx]?.id || 'question_' + (idx + 1);
            const language = sandbox?.getAttribute('data-language') || meta[idx]?.language || 'javascript';
            return {
              id: questionId,
              language,
              solution: textarea ? textarea.value : ''
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




