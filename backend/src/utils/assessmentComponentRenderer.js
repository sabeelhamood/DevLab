/**
 * Renders AssessmentCodeQuestions component as HTML string
 * This generates HTML that matches the React component structure
 */
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
    const difficulty = question.difficulty || 'medium'
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
              <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #f3e8ff; color: #7c3aed; border-radius: 9999px;">
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
              <div style="background: #f9fafb; border-radius: 0.5rem; padding: 0.75rem; border: 1px solid #e5e7eb;">
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
      <div class="question-card" style="background: white; border-radius: 0.5rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); padding: 1.5rem; margin-bottom: 1.5rem; transition: box-shadow 0.2s;">
        <!-- Question Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="padding: 0.5rem; background: #dbeafe; border-radius: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem 0;">
                ${escapeHtml(question.title || `Question ${index + 1}`)}
              </h3>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                <span style="font-size: 0.875rem; color: #6b7280;">
                  ${escapeHtml(question.programming_language || 'N/A')}
                </span>
                ${question.difficulty ? `
                  <span class="${difficultyClass}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 9999px; font-weight: 500; ${
                    difficultyClass === 'difficulty-easy' ? 'background: #dcfce7; color: #166534;' :
                    difficultyClass === 'difficulty-medium' ? 'background: #fef3c7; color: #92400e;' :
                    'background: #fee2e2; color: #991b1b;'
                  }">
                    ${escapeHtml(question.difficulty)}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Question Description -->
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #6b7280;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">Description</span>
          </div>
          <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
            <p style="color: #374151; white-space: pre-wrap; margin: 0;">
              ${escapeHtml(question.description || 'No description provided.')}
            </p>
          </div>
        </div>

        ${skillsHtml}
        ${testCasesHtml}
        ${judge0Html}
      </div>
    `
  }).join('')

  const judge0BootstrapScript = renderJudge0Bootstrap(questions)

  return `
    <div class="assessment-questions-container" style="padding: 1.5rem;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0;">
          Coding Assessment Questions
        </h2>
        <p style="color: #6b7280; margin: 0;">
          ${questions.length} question${questions.length !== 1 ? 's' : ''} generated
        </p>
      </div>
      ${questionsHtml}
    </div>
    ${judge0BootstrapScript}
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
      <div class="judge0-sandbox-card" data-question-id="${escapeHtml(questionId)}" style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 1.25rem; padding: 1.5rem; border: 1px solid rgba(148, 163, 184, 0.25); box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35); color: #e2e8f0;">
        <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="display: flex; gap: 0.25rem;">
                <span style="width: 0.75rem; height: 0.75rem; border-radius: 9999px; background: #f87171; display: inline-block;"></span>
                <span style="width: 0.75rem; height: 0.75rem; border-radius: 9999px; background: #fbbf24; display: inline-block;"></span>
                <span style="width: 0.75rem; height: 0.75rem; border-radius: 9999px; background: #34d399; display: inline-block;"></span>
              </div>
              <div>
                <div style="font-size: 0.95rem; font-weight: 600;">Judge0 Live Sandbox</div>
                <div style="font-size: 0.75rem; color: #a5b4fc;">
                  ${escapeHtml((config.language || question.programming_language || 'javascript').toUpperCase())} • ${testCaseCount} test case${testCaseCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            <button type="button" data-judge0-reset style="background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12); border-radius: 9999px; font-size: 0.75rem; padding: 0.35rem 0.9rem; cursor: pointer;">
              Reset Template
            </button>
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #cbd5f5;">
            ${escapeHtml(config.instructions || 'Write your solution below and run it against the official Judge0-powered test suite.')}
          </p>
        </div>

        <textarea class="judge0-code-input" spellcheck="false" style="width: 100%; min-height: 220px; border-radius: 0.85rem; border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(15, 23, 42, 0.85); padding: 1rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.9rem; color: #e2e8f0; resize: vertical; line-height: 1.5;" placeholder="// Write your solution here..."></textarea>

        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0;">
          <button type="button" data-judge0-run-single style="flex: 1; min-width: 180px; border-radius: 0.9rem; border: none; background: linear-gradient(135deg, #34d399, #059669); padding: 0.85rem 1rem; font-weight: 600; color: white; cursor: pointer; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.35);">
            Run Sample Test
          </button>
          <button type="button" data-judge0-run-all style="flex: 1; min-width: 180px; border-radius: 0.9rem; border: 1px solid rgba(59, 130, 246, 0.6); background: rgba(59, 130, 246, 0.1); padding: 0.85rem 1rem; font-weight: 600; color: #bfdbfe; cursor: pointer; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.35);">
            Run All Tests
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #cbd5f5; margin-bottom: 0.5rem;">
          <span>Status:</span>
          <span data-judge0-status>Idle</span>
        </div>

        <pre data-judge0-output style="margin: 0; background: rgba(15, 23, 42, 0.65); border-radius: 0.85rem; border: 1px solid rgba(148, 163, 184, 0.25); padding: 1rem; font-size: 0.8rem; line-height: 1.6; color: #e2e8f0; min-height: 120px; white-space: pre-wrap; overflow-x: auto;">
// Results will appear here. Use "Run Sample Test" for a quick sanity check or run all tests for full validation.
        </pre>
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

  const scriptBody = `
    (function () {
      try {
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
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
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

        document.querySelectorAll('.judge0-sandbox-card').forEach((sandbox) => {
          const questionId = sandbox.getAttribute('data-question-id');
          if (!questionId) return;
          const config = configMap[questionId];
          if (!config) return;

          const textarea = sandbox.querySelector('.judge0-code-input');
          const statusEl = sandbox.querySelector('[data-judge0-status]');
          const outputEl = sandbox.querySelector('[data-judge0-output]');
          const runSampleBtn = sandbox.querySelector('[data-judge0-run-single]');
          const runAllBtn = sandbox.querySelector('[data-judge0-run-all]');
          const resetBtn = sandbox.querySelector('[data-judge0-reset]');
          const defaultTemplate = templates[questionId] || textarea?.value || '';

          if (textarea && !textarea.value.trim()) {
            textarea.value = defaultTemplate;
          }

          const setStatus = (message, options = {}) => {
            if (statusEl) {
              statusEl.textContent = message;
              statusEl.style.color = options.color || '#cbd5f5';
            }
          };

          const setOutput = (message) => {
            if (outputEl) {
              outputEl.textContent = message;
            }
          };

          const runSample = async () => {
            if (!textarea) return;
            const code = textarea.value;
            if (!code.trim()) {
              setStatus('Please write some code before running tests.', { color: '#f87171' });
              return;
            }

            const firstTest = (config.testCases && config.testCases[0]) || (config.test_cases && config.test_cases[0]);
            if (!firstTest) {
              setStatus('No sample test case available.', { color: '#facc15' });
              return;
            }

            try {
              setStatus('Running sample test…', { color: '#38bdf8' });
              setOutput('// Executing sample test via Judge0…');
              const result = await postJson(config.endpoints?.execute || '/api/judge0/execute', {
                sourceCode: code,
                language: config.language || 'javascript',
                input: firstTest.input || '',
                expectedOutput: firstTest.expected_output ?? firstTest.output ?? ''
              });
              setStatus('Sample test completed.', { color: '#34d399' });
              setOutput(JSON.stringify(result, null, 2));
            } catch (err) {
              console.error('Judge0 sample run failed:', err);
              setStatus('Sample test failed.', { color: '#f87171' });
              setOutput('Error: ' + err.message);
            }
          };

          const runAllTests = async () => {
            if (!textarea) return;
            const code = textarea.value;

            if (!code.trim()) {
              setStatus('Please write some code before running tests.', { color: '#f87171' });
              return;
            }

            const allTestCases = config.testCases || config.test_cases || [];
            if (!allTestCases.length) {
              setStatus('No test cases available to run.', { color: '#facc15' });
              return;
            }

            try {
              setStatus('Running all tests…', { color: '#38bdf8' });
              setOutput('// Executing Judge0 test suite…');
              const result = await postJson(config.endpoints?.runAllTestCases || '/api/judge0/test-cases', {
                sourceCode: code,
                language: config.language || 'javascript',
                testCases: allTestCases
              });
              setStatus('All tests completed.', { color: '#34d399' });
              setOutput(JSON.stringify(result, null, 2));
            } catch (err) {
              console.error('Judge0 run-all failed:', err);
              setStatus('Test execution failed.', { color: '#f87171' });
              setOutput('Error: ' + err.message);
            }
          };

          if (runSampleBtn) {
            runSampleBtn.addEventListener('click', runSample);
          }
          if (runAllBtn) {
            runAllBtn.addEventListener('click', runAllTests);
          }
          if (resetBtn && textarea) {
            resetBtn.addEventListener('click', () => {
              textarea.value = defaultTemplate;
              setStatus('Template reset.', { color: '#cbd5f5' });
              setOutput('// Editor reset to default template.');
            });
          }
        });
      } catch (err) {
        console.error('Judge0 sandbox bootstrap error:', err);
      }
    })();
  `

  return `
    <script>
${scriptBody}
    </script>
  `
}




