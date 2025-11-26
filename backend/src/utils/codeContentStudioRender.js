import { openAIContentStudioService } from '../services/openAIContentStudioService.js'
import { codeMirrorLoader } from './codeMirrorLoader.js'

const PUBLIC_API_BASE_URL =
  process.env['PUBLIC_BACKEND_URL'] ||
  process.env['PUBLIC_API_URL'] ||
  process.env['API_BASE_URL'] ||
  ''

const serializeJsonForScript = (value) =>
  JSON.stringify(value, null, 2).replace(/</g, '\\u003c')

const escapeHtml = (text) => {
  if (text === null || text === undefined) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return String(text).replace(/[&<>"']/g, (m) => map[m])
}

function buildBaseUrl() {
  if (PUBLIC_API_BASE_URL) return PUBLIC_API_BASE_URL
  return ''
}

function getBackendBaseUrl() {
  const base = PUBLIC_API_BASE_URL || 'https://devlab-backend-production.up.railway.app'
  return (base || '').replace(/\/api\/?$/, '').replace(/\/$/, '')
}

function getCodeMirrorBundleUrl() {
  return `${getBackendBaseUrl()}/static/codemirror-bundle.js`
}

const CODEMIRROR_BUNDLE_URL_PLACEHOLDER = '__CODEMIRROR_BUNDLE_URL__'
const API_BASE_URL_PLACEHOLDER = '__API_BASE_URL__'
const baseCodeMirrorTemplate = codeMirrorLoader.loadTemplate()

function extractNormalizedTestCases(question = {}) {
  const questionCases =
    (Array.isArray(question.testCases) && question.testCases) ||
    (Array.isArray(question.test_cases) && question.test_cases) ||
    []

  if (!Array.isArray(questionCases)) {
    return []
  }

  return questionCases
    .map((testCase = {}) => {
      const inputValue = testCase.input || testCase.testInput || testCase.test_input || ''
      const expectedValue = testCase.expected_output || testCase.expectedOutput || testCase.expected || testCase.output || ''
      return {
        input: inputValue,
        expectedOutput: expectedValue
      }
    })
    .filter((testCase) => testCase.input !== '' || testCase.expectedOutput !== '')
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

  // Inject API base URL directly into template (no parent access needed)
  const apiBaseUrl = getBackendBaseUrl()
  // Replace the getApiBaseUrl function to return the injected URL directly
  // This avoids needing to access window.parent which may not be available
  const apiBaseUrlReplacement = `function getApiBaseUrl() {
      // API base URL injected directly into template
      const injectedBaseUrl = ${serializeJsonForScript(apiBaseUrl)};
      if (injectedBaseUrl) return injectedBaseUrl;
      // Fallback to parent if available (for backwards compatibility)
      try {
        if (window.parent && window.parent.__DEVLAB_API_BASE__) {
          return window.parent.__DEVLAB_API_BASE__;
        }
      } catch (e) {
        // Cross-origin restriction
      }
      return '';
    }`
  // Match the entire getApiBaseUrl function (multiline match)
  template = template.replace(
    /function getApiBaseUrl\(\) \{[\s\S]*?\n\s*return '';\n\s*\}/m,
    apiBaseUrlReplacement
  )

  // Inject service headers directly into template (no parent access needed)
  const serviceKey = getDefaultServiceApiKey()
  const serviceId = getDefaultServiceId()
  const serviceHeaders = {
    ...(serviceKey ? { 'x-api-key': serviceKey } : {}),
    ...(serviceId ? { 'x-service-id': serviceId } : {})
  }
  
  const serviceHeadersReplacement = `function getServiceHeaders() {
      // Service headers injected directly into template
      const injectedHeaders = ${serializeJsonForScript(serviceHeaders)};
      if (injectedHeaders && Object.keys(injectedHeaders).length > 0) {
        return { ...injectedHeaders };
      }
      // Fallback to parent if available (for backwards compatibility)
      try {
        if (window.parent && window.parent.__DEVLAB_SERVICE_HEADERS) {
          const headers = window.parent.__DEVLAB_SERVICE_HEADERS;
          if (typeof headers === 'object') {
            return { ...headers };
          }
        }
      } catch (e) {
        // Cross-origin restriction
      }
      return {};
    }`
  
  // Match the entire getServiceHeaders function (multiline match)
  template = template.replace(
    /function getServiceHeaders\(\) \{[\s\S]*?\n\s*return \{\};\n\s*\}/m,
    serviceHeadersReplacement
  )
  
  // Add postMessage to notify parent when CodeMirror is ready
  // Insert after window.getCode is defined and send notification after editor is ready
  const readyNotification = `
    // Notify parent window that CodeMirror is ready
    setTimeout(function() {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'codemirror-ready' }, '*');
        }
      } catch (e) {
        // Cross-origin restriction, ignore
      }
    }, 100);
  `
  // Insert the notification right after window.getCode definition
  template = template.replace(
    /(window\.getCode = function\(\) \{[\s\S]*?return editor\.getValue\(\);\s*\};\s*)/,
    `$1${readyNotification}`
  )

  return template
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
  return process.env['SERVICE_ID'] || process.env['SERVICE_API_ID'] || 'content-studio-service'
}

function renderContentStudioServiceHeadersScript() {
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
          console.error('Failed to initialize content studio service headers', err);
          window.__DEVLAB_SERVICE_HEADERS = ${payload};
        }
      })();
    </script>
  `
}

function renderSingleQuestion(question, index, topicName, language) {
  const id = question.id || `code_content_${index + 1}`
  const description = question.description || ''
  const testCases = Array.isArray(question.testCases) ? question.testCases : []

  const testCasesHtml = testCases.length
    ? `
      <section style="background: rgba(255,255,255,0.92); border-radius: 20px; padding: 18px; border: 1px solid rgba(15,23,42,0.06);">
        <header style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:#F0FFF0;color:#0F6B52;font-weight:600;">TC</span>
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#0f172a;">Test Cases</h2>
        </header>
        <ol style="margin:0;padding:0;display:grid;gap:10px;">
          ${testCases
            .map(
              (tc, idx) => `
            <li style="list-style:none;background:rgba(15,23,42,0.02);border-radius:16px;padding:14px;border:1px solid rgba(15,23,42,0.06);">
              <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:0.75rem;font-weight:600;letter-spacing:0.04em;color:#0F6B52;text-transform:uppercase;">Test Case ${
                  idx + 1
                }</span>
              </header>
              <div style="display:grid;gap:8px;">
                <div>
                  <span style="display:inline-block;font-size:0.75rem;font-weight:600;margin-bottom:4px;color:rgba(15,23,42,0.55);">Input</span>
                  <pre style="margin:0;padding:10px;border-radius:10px;background:#0f172a;color:#e0f2fe;font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.8rem;white-space:pre-wrap;word-break:break-word;">${escapeHtml(
                    tc.input ?? ''
                  )}</pre>
                </div>
                <div>
                  <span style="display:inline-block;font-size:0.75rem;font-weight:600;margin-bottom:4px;color:rgba(15,23,42,0.55);">Expected Output</span>
                  <pre style="margin:0;padding:10px;border-radius:10px;background:#0f172a;color:#e0f2fe;font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.8rem;white-space:pre-wrap;word-break:break-word;">${escapeHtml(
                    tc.expected_output ?? tc.expectedOutput ?? tc.output ?? ''
                  )}</pre>
                </div>
              </div>
            </li>`
            )
            .join('')}
        </ol>
      </section>
    `
    : ''

  return `
    <article data-code-question="${escapeHtml(
      id
    )}" data-language="${escapeHtml(
      (language || 'javascript').toLowerCase()
    )}" style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #ffffff; padding: 24px; border-radius: 20px; border: 1px solid rgba(15,23,42,0.06); box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:16px;">
        <div style="display:grid;gap:10px;">
          <span style="display:inline-flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(15,23,42,0.55);">
            ${escapeHtml(topicName || 'Coding Challenge')}
          </span>
          <h1 data-role="question-title" style="margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.01em;">
            ${escapeHtml(question.title || `Coding Question ${index + 1}`)}
          </h1>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:90px;padding:8px 14px;border-radius:999px;background:#2F4F4F;color:white;font-size:0.78rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">
            ${escapeHtml(question.difficulty || 'intermediate')}
          </span>
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:90px;padding:8px 14px;border-radius:999px;background:#F0FFF0;color:#0f172a;font-size:0.78rem;font-weight:600;">
            ${escapeHtml(language || 'javascript')}
          </span>
        </div>
      </header>

      <div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.1fr);gap:20px;align-items:flex-start;">
        <div data-role="question-pane" style="display:grid;gap:16px;">
      <section style="background:rgba(255,255,255,0.95);border-radius:20px;padding:20px;border:1px solid rgba(15,23,42,0.06);">
            <p data-role="question-description" style="margin:0;font-size:1rem;line-height:1.7;">${escapeHtml(
              description
            )}</p>
      </section>

          <div data-role="test-cases-container">
            ${testCasesHtml}
          </div>
        </div>

        <div data-role="editor-pane" style="display:grid;gap:16px;">
      <section style="display:grid;gap:16px;">
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <button type="button" data-action="hint" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#FFA500;color:white;font-weight:600;">
            💡 Get Hint
          </button>
          <button type="button" data-action="show-solution" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#4b5563;color:white;font-weight:600;box-shadow:0 14px 28px rgba(15,23,42,0.35);display:none;">
            🔍 Show Solution
          </button>
          <button type="button" data-action="submit" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#0F6B52;color:white;font-weight:600;">
            🚀 Submit Solution
          </button>
        </div>
      </section>

          <section class="judge0-panel" style="background:#F5F5F5;border-radius:20px;padding:18px;color:#0f172a;display:grid;gap:14px;border:1px solid rgba(148,163,184,0.4);box-shadow:0 18px 40px rgba(15,23,42,0.12);">
        <header style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:#F0FFF0;color:#0F6B52;">{ }</span>
          <div>
            <h2 style="margin:0;font-size:1rem;font-weight:600;color:#0f172a;">Judge0 Code Execution</h2>
            <p style="margin:2px 0 0;font-size:0.8rem;color:#64748b;">Write your solution, run it instantly, or execute all test cases via Judge0.</p>
          </div>
        </header>
        <div data-role="codemirror-container" style="border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,0.5);background:#ffffff;">
          <iframe
            data-role="codemirror-editor"
            title="Code editor for ${escapeHtml(question.title || id)}"
            srcdoc="${escapeHtml(buildCodeMirrorTemplateForQuestion(question))}"
            style="width:100%;min-height:500px;border:none;background:#ffffff;"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
        <div data-role="result" style="margin-top:4px;font-size:0.8rem;color:#64748b;min-height:1em;"></div>
      </section>

      <section data-role="hints" style="background:rgba(255,255,255,0.96);border-radius:20px;padding:16px;border:1px solid rgba(15,23,42,0.06);display:none;">
        <header style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:rgba(14,165,233,0.12);color:#0ea5e9;font-weight:600;">💡</span>
          <h2 style="margin:0;font-size:0.95rem;font-weight:600;color:#0f172a;">Hints</h2>
        </header>
        <ul data-role="hints-list" style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:0.9rem;color:#475569;"></ul>
      </section>

        </div>
      </div>
    </article>
  `
}

function renderBootstrapScript(questionsMeta) {
  const baseFromEnv = buildBaseUrl().replace(/"/g, '\\"')
  const questionsJson = serializeJsonForScript(
    questionsMeta.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      language: q.language,
      topicName: q.topicName,
      testCases: q.testCases || []
    }))
  )

  return `
    <script type="application/json" data-code-content-meta>
${questionsJson}
    </script>
    <script>
      (function () {
        const DEFAULT_BASE = '${baseFromEnv || 'https://devlab-backend-production.up.railway.app'}';
        
        // Set API base URL for iframe access
        try {
          window.__DEVLAB_API_BASE__ = DEFAULT_BASE;
        } catch (err) {
          console.error('Failed to initialize API base URL', err);
        }

        const buildUrl = (path) => {
          if (!path) return '';
          if (/^https?:\\/\\//i.test(path)) return path;
          const base = (DEFAULT_BASE || window.__DEVLAB_API_BASE__ || '').replace(/\\/+$/, '');
          const normalized = path.startsWith('/') ? path : '/' + path;
          return base ? base + normalized : normalized;
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

        const metaScript = document.querySelector('script[data-code-content-meta]');
        let meta = [];
        if (metaScript) {
          try {
            meta = JSON.parse(metaScript.textContent || '[]');
          } catch (err) {
            console.error('Failed to parse code content meta:', err);
          }
          metaScript.remove();
        }

        const container = document.querySelector('[data-code-question]');
        if (!container || !meta.length) {
          return;
        }

        const baseLanguage = container.getAttribute('data-language') || 'javascript';
          const codeMirrorIframe = container.querySelector('iframe[data-role="codemirror-editor"]');
          const resultEl = container.querySelector('[data-role="result"]');
          
          let iframeReady = false;
          let getCodeFunctionAvailable = false;
          
          // Wait for iframe to load and getCode function to be available
          if (codeMirrorIframe) {
            // Listen for postMessage from iframe indicating it's ready
            const messageHandler = (event) => {
              if (event.data && event.data.type === 'codemirror-ready') {
                iframeReady = true;
                getCodeFunctionAvailable = true;
                window.removeEventListener('message', messageHandler);
              }
            };
            window.addEventListener('message', messageHandler);
            
            codeMirrorIframe.addEventListener('load', () => {
              // Give iframe scripts time to initialize
              setTimeout(() => {
                // Try to check if getCode is available
                try {
                  if (codeMirrorIframe.contentWindow && typeof codeMirrorIframe.contentWindow.getCode === 'function') {
                    iframeReady = true;
                    getCodeFunctionAvailable = true;
                  } else {
                    // Wait a bit more and check again
                    setTimeout(() => {
                      if (codeMirrorIframe.contentWindow && typeof codeMirrorIframe.contentWindow.getCode === 'function') {
                        iframeReady = true;
                        getCodeFunctionAvailable = true;
                      }
                    }, 200);
                  }
                } catch (err) {
                  // Cross-origin or not ready yet
                }
              }, 100);
            });
            
            // Check if iframe is already loaded
            try {
              if (codeMirrorIframe.contentDocument && codeMirrorIframe.contentDocument.readyState === 'complete') {
                setTimeout(() => {
                  try {
                    if (codeMirrorIframe.contentWindow && typeof codeMirrorIframe.contentWindow.getCode === 'function') {
                      iframeReady = true;
                      getCodeFunctionAvailable = true;
                    }
                  } catch (err) {
                    // Not ready yet
                  }
                }, 100);
              }
            } catch (err) {
              // Can't access contentDocument yet
            }
          }
          
          // Helper function to get code from CodeMirror iframe with existence checks and retry
          const getCodeFromEditor = (retries = 3) => {
            if (!codeMirrorIframe) {
              return '';
            }
            if (!iframeReady && retries > 0) {
              // Wait a bit and retry
              return '';
            }
            if (!codeMirrorIframe.contentWindow) {
              return '';
            }
            try {
              // Check if getCode function exists before calling
              if (typeof codeMirrorIframe.contentWindow.getCode === 'function') {
                return codeMirrorIframe.contentWindow.getCode();
              } else if (codeMirrorIframe.contentWindow.editor && codeMirrorIframe.contentWindow.editor.state) {
                return codeMirrorIframe.contentWindow.editor.state.doc?.toString() || '';
              }
            } catch (err) {
              console.warn('Unable to read code from CodeMirror iframe:', err);
            }
            return '';
          };
          
          const hintBtn = container.querySelector('[data-action="hint"]');
          const showSolutionBtn = container.querySelector('[data-action="show-solution"]');
          const submitBtn = container.querySelector('[data-action="submit"]');
          const hintsSection = container.querySelector('[data-role="hints"]');
          const hintsList = container.querySelector('[data-role="hints-list"]');
        const questionTitleEl = container.querySelector('[data-role="question-title"]');
        const questionDescriptionEl = container.querySelector('[data-role="question-description"]');
        const testCasesContainer = container.querySelector('[data-role="test-cases-container"]');

        if (!codeMirrorIframe || !resultEl) {
          return;
        }

        const totalQuestions = meta.length;
        const MAX_HINTS_PER_QUESTION = 3;
        let currentIndex = 0;
        const codeStateById = {};
        const hintsStateById = {};

        const getMetaAtIndex = (idx) => meta[idx] || meta[0] || {};
        const getCurrentMeta = () => getMetaAtIndex(currentIndex);
        const getCurrentQuestionId = () => {
          const m = getCurrentMeta();
          return m.id || String(currentIndex || 0);
        };

        const getHintStateForQuestion = (questionId) => {
          if (!hintsStateById[questionId]) {
            hintsStateById[questionId] = { hintsUsed: 0, allHints: [], solutionRevealed: false };
          }
          return hintsStateById[questionId];
        };

        const saveCurrentCode = () => {
          const m = getCurrentMeta();
          if (!m) return;
          const id = m.id || String(currentIndex || 0);
          codeStateById[id] = getCodeFromEditor();
        };

        const restoreCodeForCurrentQuestion = () => {
          const m = getCurrentMeta();
          if (!m) return;
          const id = m.id || String(currentIndex || 0);
          const stored = Object.prototype.hasOwnProperty.call(codeStateById, id)
            ? codeStateById[id]
            : '';
          // Code will be restored when iframe loads - we can't directly set it here
          // The iframe maintains its own state
        };

          const openFeedbackModal = (cardHtml) => {
            try {
              const existing = document.querySelector('[data-devlab-modal-root="true"]');
              if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
              }
              const overlay = document.createElement('div');
              overlay.setAttribute('data-devlab-modal-root', 'true');
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.zIndex = '50';
              overlay.style.display = 'flex';
              overlay.style.alignItems = 'center';
              overlay.style.justifyContent = 'center';
              overlay.style.background = 'rgba(15,23,42,0.55)';
              overlay.style.padding = '16px';
              overlay.innerHTML = cardHtml;
              document.body.appendChild(overlay);
            } catch (e) {
              console.error('Failed to render feedback modal:', e);
            }
          };

          const openSolutionConfirmationModal = ({ onConfirm, onCancel, isLoading, errorMessage }) => {
            try {
              const existing = document.querySelector('[data-devlab-solution-modal="true"]');
              if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
              }

              const overlay = document.createElement('div');
              overlay.setAttribute('data-devlab-solution-modal', 'true');
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.zIndex = '60';
              overlay.style.display = 'flex';
              overlay.style.alignItems = 'center';
              overlay.style.justifyContent = 'center';
              overlay.style.background = 'rgba(15,23,42,0.55)';
              overlay.style.padding = '16px';

              const card = document.createElement('div');
              card.style.width = '100%';
              card.style.maxWidth = '480px';
              card.style.borderRadius = '16px';
              card.style.background = '#ffffff';
              card.style.boxShadow = '0 20px 45px rgba(15,23,42,0.45)';
              card.style.border = '1px solid rgba(148,163,184,0.5)';
              card.style.padding = '20px 22px';
              card.style.display = 'grid';
              card.style.gap = '12px';

              const title = document.createElement('h2');
              title.textContent = 'Reveal Solution?';
              title.style.margin = '0';
              title.style.fontSize = '1rem';
              title.style.fontWeight = '600';
              title.style.color = '#0f172a';

              const message = document.createElement('p');
              message.textContent = 'Are you sure you want to see the solution? Try your best first before revealing it.';
              message.style.margin = '0';
              message.style.fontSize = '0.9rem';
              message.style.color = '#475569';
              message.style.lineHeight = '1.6';

              const status = document.createElement('div');
              status.style.fontSize = '0.8rem';
              status.style.minHeight = '1em';
              status.style.color = errorMessage ? '#b91c1c' : '#64748b';
              status.textContent = errorMessage || (isLoading ? 'Loading solution...' : '');

              const buttonRow = document.createElement('div');
              buttonRow.style.display = 'flex';
              buttonRow.style.justifyContent = 'flex-end';
              buttonRow.style.gap = '10px';
              buttonRow.style.marginTop = '8px';

              const cancelBtn = document.createElement('button');
              cancelBtn.type = 'button';
              cancelBtn.textContent = 'Cancel';
              cancelBtn.style.border = '1px solid rgba(148,163,184,0.7)';
              cancelBtn.style.borderRadius = '999px';
              cancelBtn.style.padding = '8px 14px';
              cancelBtn.style.background = '#ffffff';
              cancelBtn.style.color = '#4b5563';
              cancelBtn.style.fontSize = '0.85rem';
              cancelBtn.style.fontWeight = '500';
              cancelBtn.style.cursor = 'pointer';

              const confirmBtn = document.createElement('button');
              confirmBtn.type = 'button';
              confirmBtn.textContent = isLoading ? 'Revealing...' : 'Reveal Solution';
              confirmBtn.style.border = 'none';
              confirmBtn.style.borderRadius = '999px';
              confirmBtn.style.padding = '8px 16px';
              confirmBtn.style.background = '#0f172a';
              confirmBtn.style.color = '#f9fafb';
              confirmBtn.style.fontSize = '0.85rem';
              confirmBtn.style.fontWeight = '600';
              confirmBtn.style.cursor = isLoading ? 'wait' : 'pointer';
              confirmBtn.disabled = !!isLoading;

              cancelBtn.addEventListener('click', () => {
                if (overlay.parentNode) {
                  overlay.parentNode.removeChild(overlay);
                }
                if (typeof onCancel === 'function') {
                  onCancel();
                }
              });

              if (!isLoading) {
                confirmBtn.addEventListener('click', () => {
                  if (typeof onConfirm === 'function') {
                    onConfirm({ overlay, status });
                  }
                });
              }

              buttonRow.appendChild(cancelBtn);
              buttonRow.appendChild(confirmBtn);

              card.appendChild(title);
              card.appendChild(message);
              card.appendChild(status);
              card.appendChild(buttonRow);

              overlay.appendChild(card);
              document.body.appendChild(overlay);
            } catch (e) {
              console.error('Failed to render solution confirmation modal:', e);
            }
          };

          const renderEvaluationCard = (evaluation) => {
            if (!resultEl) return;
            const score = typeof evaluation.score === 'number' ? evaluation.score : 0;
            const safeScore = Math.max(0, Math.min(100, Math.round(score)));
            const feedback =
              typeof evaluation.feedback === 'string'
                ? evaluation.feedback
                : typeof evaluation.feedback === 'object' && evaluation.feedback !== null
                  ? evaluation.feedback.message || evaluation.feedback.text || JSON.stringify(evaluation.feedback, null, 2)
                  : '';
            const suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions : [];

            let suggestionsHtml = '';
            if (suggestions.length) {
              let items = '';
              suggestions.slice(0, 3).forEach((s, idx) => {
                const text = typeof s === 'string' ? s : JSON.stringify(s);
                items +=
                  '<div style="display:flex;align-items:flex-start;gap:10px;border-radius:10px;padding:10px 12px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.4);">' +
                  '<div style="width:22px;height:22px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#92400e;background:linear-gradient(135deg,#fed7aa,#fbbf24);">' +
                  (idx + 1) +
                  '</div>' +
                  '<div style="font-size:13px;line-height:1.5;color:#78350f;">' +
                  text +
                  '</div>' +
                  '</div>';
              });

              suggestionsHtml =
                '<div>' +
                '<div style="font-size:13px;font-weight:600;color:#b45309;display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
                '💡 Suggestions' +
                '</div>' +
                '<div style="display:grid;gap:8px;">' +
                items +
                '</div>' +
                '</div>';
            }

            resultEl.style.color = '#0f172a';
            const cardHtml =
              '<div style="position:relative;width:100%;max-width:640px;border-radius:12px;overflow:hidden;border:1px solid rgba(22,163,74,0.25);box-shadow:0 18px 40px rgba(22,163,74,0.35);background:linear-gradient(135deg,#dcfce7,#bbf7d0);">' +
            '<button type="button" onclick="var m=this.closest(&quot;[data-devlab-modal-root]&quot;);if(m){m.remove();}" aria-label="Close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(148,163,184,0.6);background:rgba(15,23,42,0.02);display:flex;align-items:center;justify-content:center;font-size:16px;color:#0f172a;cursor:pointer;">' +
              '✕' +
              '</button>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 16px 22px;border-bottom:1px solid rgba(22,163,74,0.25);">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#16a34a,#22c55e);color:#ecfdf5;font-size:20px;">' +
              '✅' +
              '</div>' +
              '<div>' +
              '<div style="font-weight:700;font-size:16px;color:#14532d;">🎉 Excellent Work!</div>' +
              '<div style="font-size:13px;color:#166534;">Your solution looks correct and well structured.</div>' +
              '</div>' +
              '</div>' +
              '<div style="min-width:64px;height:64px;border-radius:999px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#ecfdf5;border:2px solid rgba(22,163,74,0.35);box-shadow:0 10px 25px rgba(22,163,74,0.25);">' +
              '<div style="font-weight:800;font-size:18px;color:#166534;">' +
              safeScore +
              '%</div>' +
              '<div style="font-size:11px;font-weight:600;color:#16a34a;">SCORE</div>' +
              '</div>' +
              '</div>' +
              '<div style="padding:16px 20px 18px 20px;background:#f9fafb;">' +
              '<div style="margin-bottom:14px;">' +
              '<div style="font-size:13px;font-weight:600;color:#047857;display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
              '<span style="width:6px;height:6px;border-radius:999px;background:#22c55e;"></span>' +
              'Feedback' +
              '</div>' +
              '<div style="border-radius:12px;padding:12px 14px;background:#ffffff;border:1px solid rgba(148,163,184,0.4);font-size:13px;line-height:1.6;color:#111827;">' +
              (feedback || 'Great job! Your solution passes the automated checks.') +
              '</div>' +
              '</div>' +
              suggestionsHtml +
              '</div>' +
              '</div>';

            openFeedbackModal(cardHtml);
          };

          const renderFailureCard = (evaluation) => {
            if (!resultEl) return;
            const score = typeof evaluation.score === 'number' ? evaluation.score : 0;
            const safeScore = Math.max(0, Math.min(100, Math.round(score)));
            const feedback =
              typeof evaluation.feedback === 'string'
                ? evaluation.feedback
                : typeof evaluation.feedback === 'object' && evaluation.feedback !== null
                  ? evaluation.feedback.message || evaluation.feedback.text || JSON.stringify(evaluation.feedback, null, 2)
                  : '';
            const suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions : [];

            let suggestionsHtml = '';
            if (suggestions.length) {
              let items = '';
              suggestions.slice(0, 3).forEach((s, idx) => {
                const text = typeof s === 'string' ? s : JSON.stringify(s);
                items +=
                  '<div style="display:flex;align-items:flex-start;gap:10px;border-radius:10px;padding:10px 12px;background:rgba(254,243,199,0.4);border:1px solid rgba(245,158,11,0.6);">' +
                  '<div style="width:22px;height:22px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#92400e;background:linear-gradient(135deg,#fed7aa,#fbbf24);">' +
                  (idx + 1) +
                  '</div>' +
                  '<div style="font-size:13px;line-height:1.5;color:#78350f;">' +
                  text +
                  '</div>' +
                  '</div>';
              });

              suggestionsHtml =
                '<div>' +
                '<div style="font-size:13px;font-weight:600;color:#b45309;display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
                '💡 Suggestions' +
                '</div>' +
                '<div style="display:grid;gap:8px;">' +
                items +
                '</div>' +
                '</div>';
            }

            resultEl.style.color = '#0f172a';
            const cardHtml =
              '<div style="position:relative;width:100%;max-width:640px;border-radius:12px;overflow:hidden;border:1px solid rgba(245,158,11,0.35);box-shadow:0 18px 40px rgba(245,158,11,0.45);background:linear-gradient(135deg,#fff7ed,#fffbeb);">' +
            '<button type="button" onclick="var m=this.closest(&quot;[data-devlab-modal-root]&quot;);if(m){m.remove();}" aria-label="Close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(248,181,85,0.9);background:rgba(255,253,250,0.9);display:flex;align-items:center;justify-content:center;font-size:16px;color:#92400e;cursor:pointer;">' +
              '✕' +
              '</button>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 16px 22px;border-bottom:1px solid rgba(245,158,11,0.45);">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff7ed;font-size:20px;">' +
              '🎯' +
              '</div>' +
              '<div>' +
              '<div style="font-weight:700;font-size:16px;color:#92400e;">📚 Keep Learning!</div>' +
            '<div style="font-size:13px;color:#b45309;">Let us review and improve together.</div>' +
              '</div>' +
              '</div>' +
              '<div style="min-width:64px;height:64px;border-radius:999px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff7ed;border:2px solid rgba(245,158,11,0.7);box-shadow:0 10px 25px rgba(245,158,11,0.45);">' +
              '<div style="font-weight:800;font-size:18px;color:#b45309;">' +
              safeScore +
              '%</div>' +
              '<div style="font-size:11px;font-weight:600;color:#b45309;">SCORE</div>' +
              '</div>' +
              '</div>' +
              '<div style="padding:16px 20px 18px 20px;background:#ffffff;">' +
              '<div style="margin-bottom:14px;">' +
              '<div style="font-size:13px;font-weight:600;color:#b91c1c;display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
              '<span style="width:6px;height:6px;border-radius:999px;background:#f97316;"></span>' +
              'Feedback' +
              '</div>' +
              '<div style="border-radius:12px;padding:12px 14px;background:rgba(254,242,242,0.85);border:1px solid rgba(248,113,113,0.6);font-size:13px;line-height:1.6;color:#7f1d1d;">' +
              (feedback || 'There are a few issues with your solution. Review the details and try again.') +
              '</div>' +
              '</div>' +
              suggestionsHtml +
              '</div>' +
              '</div>';

            openFeedbackModal(cardHtml);
          };

          const renderAiFraudCard = () => {
            if (!resultEl) return;
            resultEl.style.color = '#f97316';

            const cardHtml =
              '<div style="position:relative;width:100%;max-width:620px;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 18px 40px rgba(15,23,42,0.45);border:1px solid rgba(148,163,184,0.5);font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">' +
              '<div style="width:100%;background:#FFF4E0;padding:12px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(248,181,85,0.7);">' +
              '<div style="width:28px;height:28px;border-radius:999px;background:#FFEDD5;color:#F97316;display:flex;align-items:center;justify-content:center;font-size:16px;">📚</div>' +
              '<div style="display:flex;align-items:center;gap:6px;font-size:0.9rem;font-weight:600;color:#92400E;">' +
              '<span>Keep Learning!</span>' +
              '</div>' +
              '</div>' +
              '<div style="padding:18px 20px 20px 20px;background:#ffffff;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">' +
              '<span style="font-size:0.95rem;font-weight:600;color:#0F172A;">Feedback</span>' +
              '<span style="font-size:1rem;color:#FF9500;">*</span>' +
              '</div>' +
              '<div style="border-radius:14px;padding:12px 14px;background:#FFE5E5;border:1px solid rgba(220,53,69,0.65);display:flex;align-items:flex-start;gap:10px;">' +
              '<div style="width:28px;height:28px;border-radius:999px;background:#FEE2E2;color:#DC3545;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;">!</div>' +
              '<div style="display:grid;gap:2px;">' +
              '<div style="font-size:0.9rem;font-weight:700;color:#DC3545;">AI-Generated Solution Detected</div>' +
              '<div style="font-size:0.85rem;color:#374151;">🤖 AI-generated solution detected. Please try to solve it yourself!</div>' +
              '</div>' +
              '</div>' +
              '</div>' +
              '<button type="button" onclick="var m=this.closest(&quot;[data-devlab-modal-root]&quot;);if(m){m.remove();}" aria-label="Close" style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:999px;border:1px solid rgba(148,163,184,0.7);background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;color:#4B5563;cursor:pointer;">✕</button>' +
              '</div>';

            openFeedbackModal(cardHtml);
          };

          const setResult = (message, color) => {
            if (!resultEl) return;
            resultEl.textContent = message;
            resultEl.style.color = color || '#64748b';
          };

        const appendHintElement = (hintText) => {
            if (!hintsList || !hintsSection) return;
            const li = document.createElement('li');
            li.textContent = hintText;
            li.style.fontWeight = '600';
            hintsList.appendChild(li);
          };


        const renderTestCasesForCurrentQuestion = () => {
          if (!testCasesContainer) return;
          const metaEntry = getCurrentMeta();
          const testCases = Array.isArray(metaEntry.testCases) ? metaEntry.testCases : [];

          testCasesContainer.innerHTML = '';
          if (!testCases.length) {
            return;
          }

          const section = document.createElement('section');
          section.style.background = 'rgba(255,255,255,0.92)';
          section.style.borderRadius = '20px';
          section.style.padding = '18px';
          section.style.border = '1px solid rgba(15,23,42,0.06)';

          const header = document.createElement('header');
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.gap = '10px';
          header.style.marginBottom = '12px';

          const badge = document.createElement('span');
          badge.textContent = 'TC';
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.width = '32px';
          badge.style.height = '32px';
          badge.style.borderRadius = '12px';
          badge.style.background = '#F0FFF0';
          badge.style.color = '#0F6B52';
          badge.style.fontWeight = '600';

          const heading = document.createElement('h2');
          heading.textContent = 'Test Cases';
          heading.style.margin = '0';
          heading.style.fontSize = '1rem';
          heading.style.fontWeight = '600';
          heading.style.color = '#0f172a';

          header.appendChild(badge);
          header.appendChild(heading);
          section.appendChild(header);

          const list = document.createElement('ol');
          list.style.margin = '0';
          list.style.padding = '0';
          list.style.display = 'grid';
          list.style.gap = '10px';

          testCases.forEach((tc, idx) => {
            const li = document.createElement('li');
            li.style.listStyle = 'none';
            li.style.background = 'rgba(15,23,42,0.02)';
            li.style.borderRadius = '16px';
            li.style.padding = '14px';
            li.style.border = '1px solid rgba(15,23,42,0.06)';

            const liHeader = document.createElement('header');
            liHeader.style.display = 'flex';
            liHeader.style.alignItems = 'center';
            liHeader.style.justifyContent = 'space-between';
            liHeader.style.marginBottom = '8px';

            const label = document.createElement('span');
            label.textContent = 'Test Case ' + (idx + 1);
            label.style.fontSize = '0.75rem';
            label.style.fontWeight = '600';
            label.style.letterSpacing = '0.04em';
            label.style.color = '#0F6B52';
            label.style.textTransform = 'uppercase';

            liHeader.appendChild(label);
            li.appendChild(liHeader);

            const contentGrid = document.createElement('div');
            contentGrid.style.display = 'grid';
            contentGrid.style.gap = '8px';

            const inputBlock = document.createElement('div');
            const inputLabel = document.createElement('span');
            inputLabel.textContent = 'Input';
            inputLabel.style.display = 'inline-block';
            inputLabel.style.fontSize = '0.75rem';
            inputLabel.style.fontWeight = '600';
            inputLabel.style.marginBottom = '4px';
            inputLabel.style.color = 'rgba(15,23,42,0.55)';

            const inputPre = document.createElement('pre');
            inputPre.style.margin = '0';
            inputPre.style.padding = '10px';
            inputPre.style.borderRadius = '10px';
            inputPre.style.background = '#0f172a';
            inputPre.style.color = '#e0f2fe';
            inputPre.style.fontFamily = "'JetBrains Mono','Fira Code',monospace";
            inputPre.style.fontSize = '0.8rem';
            inputPre.style.whiteSpace = 'pre-wrap';
            inputPre.style.wordBreak = 'break-word';
            inputPre.textContent = tc && tc.input != null ? String(tc.input) : '';

            inputBlock.appendChild(inputLabel);
            inputBlock.appendChild(inputPre);

            const expectedBlock = document.createElement('div');
            const expectedLabel = document.createElement('span');
            expectedLabel.textContent = 'Expected Output';
            expectedLabel.style.display = 'inline-block';
            expectedLabel.style.fontSize = '0.75rem';
            expectedLabel.style.fontWeight = '600';
            expectedLabel.style.marginBottom = '4px';
            expectedLabel.style.color = 'rgba(15,23,42,0.55)';

            const expectedPre = document.createElement('pre');
            expectedPre.style.margin = '0';
            expectedPre.style.padding = '10px';
            expectedPre.style.borderRadius = '10px';
            expectedPre.style.background = '#0f172a';
            expectedPre.style.color = '#e0f2fe';
            expectedPre.style.fontFamily = "'JetBrains Mono','Fira Code',monospace";
            expectedPre.style.fontSize = '0.8rem';
            expectedPre.style.whiteSpace = 'pre-wrap';
            expectedPre.style.wordBreak = 'break-word';
            const expectedValue =
              (tc && tc.expected_output != null && tc.expected_output) ||
              (tc && tc.expectedOutput != null && tc.expectedOutput) ||
              (tc && tc.output != null && tc.output) ||
              '';
            expectedPre.textContent = String(expectedValue);

            expectedBlock.appendChild(expectedLabel);
            expectedBlock.appendChild(expectedPre);

            contentGrid.appendChild(inputBlock);
            contentGrid.appendChild(expectedBlock);

            li.appendChild(contentGrid);
            list.appendChild(li);
          });

          section.appendChild(list);
          testCasesContainer.appendChild(section);
        };

        const updateHintAndSolutionControls = () => {
          const id = getCurrentQuestionId();
          const state = getHintStateForQuestion(id);

          if (hintBtn) {
            const reachedLimit = state.hintsUsed >= MAX_HINTS_PER_QUESTION;
            hintBtn.disabled = reachedLimit;
            hintBtn.style.opacity = reachedLimit ? '0.6' : '1';
            hintBtn.style.cursor = reachedLimit ? 'not-allowed' : 'pointer';
          }

          if (showSolutionBtn) {
            const shouldShowSolution =
              state.hintsUsed >= MAX_HINTS_PER_QUESTION || state.solutionRevealed;
            showSolutionBtn.style.display = shouldShowSolution ? 'inline-flex' : 'none';
          }
        };

        const syncHintsForCurrentQuestion = () => {
          if (!hintsSection || !hintsList) return;
          const id = getCurrentQuestionId();
          const state = getHintStateForQuestion(id);
          hintsList.innerHTML = '';
          if (!state.allHints.length) {
            hintsSection.style.display = 'none';
          } else {
            hintsSection.style.display = 'block';
            state.allHints.forEach((hint) => appendHintElement(hint));
          }
          updateHintAndSolutionControls();
        };

        const syncQuestionViewFromMeta = () => {
          const m = getCurrentMeta();
          if (!m) return;
          const questionText = m.description || m.title || '';

          if (questionTitleEl) {
            questionTitleEl.textContent = m.title || 'Coding Question ' + (currentIndex + 1);
          }
          if (questionDescriptionEl) {
            questionDescriptionEl.textContent = questionText;
          }

          renderTestCasesForCurrentQuestion();
          restoreCodeForCurrentQuestion();
          syncHintsForCurrentQuestion();

          if (testsResultSection && testsResultBody) {
            testsResultSection.style.display = 'none';
            testsResultBody.innerHTML = '';
          }

          setResult('', '#e5e7eb');
        };

          if (hintBtn && codeMirrorIframe) {
            hintBtn.addEventListener('click', async () => {
            const metaEntry = getCurrentMeta();
            const questionText = metaEntry.description || metaEntry.title || '';
            const topicName = metaEntry.topicName || '';
            const questionId = metaEntry.id || String(currentIndex || 0);
            const hintState = getHintStateForQuestion(questionId);
              
              // Wait for iframe to be ready if not already
              if (!iframeReady || !getCodeFunctionAvailable) {
                // Try to get code anyway (might be ready now)
                const code = getCodeFromEditor();
                if (!code && !iframeReady) {
                  setResult('Please wait for the code editor to load...', '#f97316');
                  return;
                }
              }
              
              const userAttempt = getCodeFromEditor();
              try {
                hintBtn.disabled = true;
                setResult('Generating hint...', '#000000');
                const endpoint = buildUrl('/api/content-studio/generate-hint');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  ...getServiceHeaders()
                  },
                  body: JSON.stringify({
                    question: questionText,
                    userAttempt,
                  hintsUsed: hintState.hintsUsed,
                  allHints: hintState.allHints,
                    topicName
                  })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  throw new Error(data.error || 'Failed to generate hint');
                }
                const hint = data.hint || data.data?.hint || '';
                if (hint) {
                hintState.allHints.push(hint);
                hintState.hintsUsed = Math.min(
                  (hintState.hintsUsed || 0) + 1,
                  MAX_HINTS_PER_QUESTION
                );
                syncHintsForCurrentQuestion();
                  setResult('Hint added below.', '#22c55e');
                } else {
                  setResult('No hint returned from service.', '#f97316');
                }
              } catch (error) {
                console.error('Hint error:', error);
                setResult('Failed to generate hint: ' + (error.message || 'Unknown error'), '#ef4444');
              } finally {
                hintBtn.disabled = false;
              }
            });
          }

          if (showSolutionBtn && codeMirrorIframe) {
            showSolutionBtn.addEventListener('click', () => {
              const metaEntry = getCurrentMeta();
              const questionText = metaEntry.description || metaEntry.title || '';
              const topicName = metaEntry.topicName || '';
              const language = metaEntry.language || baseLanguage;
              const skills = Array.isArray(metaEntry.skills) ? metaEntry.skills : [];
              const humanLanguage = metaEntry.humanLanguage || 'en';
              const questionId = metaEntry.id || String(currentIndex || 0);
              const hintState = getHintStateForQuestion(questionId);

              openSolutionConfirmationModal({
                isLoading: false,
                onConfirm: async ({ overlay, status }) => {
                  try {
                    if (status) {
                      status.style.color = '#64748b';
                      status.textContent = 'Loading solution...';
                    }
                    const endpoint = buildUrl('/api/content-studio/show-solution');
                    const response = await fetch(endpoint, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...getServiceHeaders()
                      },
                      body: JSON.stringify({
                        language,
                        skills,
                        humanLanguage,
                        question: questionText || topicName || ''
                      })
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) {
                      throw new Error(data.error || 'Failed to fetch solution');
                    }
                    const solution =
                      data.solution ||
                      data.data?.solution ||
                      data.answer ||
                      data.text ||
                      '';

                    if (!solution) {
                      throw new Error('No solution returned from service');
                    }

                    hintState.solutionRevealed = true;
                    updateHintAndSolutionControls();

                    if (overlay && overlay.parentNode) {
                      overlay.parentNode.removeChild(overlay);
                    }

                    const solutionCard =
                      '<div style="position:relative;width:100%;max-width:720px;border-radius:16px;overflow:hidden;border:1px solid rgba(15,107,82,0.45);box-shadow:none;background:linear-gradient(135deg,#ecfdf5,#d1fae5);">' +
                      '<button type="button" onclick="var m=this.closest(&quot;[data-devlab-modal-root]&quot;);if(m){m.remove();}" aria-label="Close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(148,163,184,0.6);background:rgba(15,23,42,0.02);display:flex;align-items:center;justify-content:center;font-size:16px;color:#0f172a;cursor:pointer;">✕</button>' +
                      '<div style="padding:18px 22px 10px 22px;border-bottom:1px solid rgba(15,107,82,0.4);display:flex;align-items:center;gap:10px;">' +
                      '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:rgba(15,107,82,0.14);color:#0F6B52;font-size:18px;">💡</span>' +
                      '<div>' +
                      '<div style="font-weight:700;font-size:15px;color:#0F6B52;">Suggested Solution</div>' +
                      '<div style="font-size:12px;color:#1e293b;">Review this solution carefully and compare it with your own attempt.</div>' +
                      '</div>' +
                      '</div>' +
                      '<div style="padding:14px 18px 18px 18px;background:#020617;">' +
                      '<pre style="margin:0;max-height:380px;overflow:auto;border-radius:12px;background:#020617;color:#e5e7eb;font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;font-size:0.8rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;padding:12px 14px;">' +
                      (typeof solution === 'string' ? solution : JSON.stringify(solution, null, 2)) +
                      '</pre>' +
                      '</div>' +
                      '</div>';

                    openFeedbackModal(solutionCard);
                    setResult('Solution revealed. Study it and compare with your own attempt.', '#0F6B52');
                  } catch (err) {
                    console.error('Show solution error:', err);
                    if (status) {
                      status.style.color = '#b91c1c';
                      status.textContent =
                        'Failed to load solution: ' + (err && err.message ? err.message : 'Unknown error');
                    }
                  }
                }
              });
            });
          }

          if (submitBtn && codeMirrorIframe) {
            submitBtn.addEventListener('click', async () => {
              
              // Wait for iframe to be ready if not already
              if (!iframeReady || !getCodeFunctionAvailable) {
                // Try to get code anyway (might be ready now)
                const code = getCodeFromEditor();
                if (!code && !iframeReady) {
                  setResult('Please wait for the code editor to load...', '#f97316');
                  return;
                }
              }
              
              const userSolution = getCodeFromEditor();
              if (!userSolution.trim()) {
                setResult('Please write a solution before submitting.', '#f97316');
                return;
              }
            const metaEntry = getCurrentMeta();
            const questionText = metaEntry.description || metaEntry.title || '';
            const topicName = metaEntry.topicName || '';
            const language = metaEntry.language || baseLanguage;

              try {
                submitBtn.disabled = true;
                setResult('Checking solution and running AI analysis...', '#38bdf8');
                const endpoint = buildUrl('/api/content-studio/check-solution');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  ...getServiceHeaders()
                  },
                  body: JSON.stringify({
                    question: questionText,
                    userSolution,
                    language,
                    topicName
                  })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  throw new Error(data.error || 'Failed to check solution');
                }

                const evaluation = data.evaluation || data.data || data || {};
                const score = typeof evaluation.score === 'number' ? evaluation.score : 0;
                const isAiGenerated =
                  evaluation.isAiGenerated ||
                  data.feedback?.isAiGenerated ||
                  data.aiDetection?.isAiGenerated;

                if (isAiGenerated) {
                  renderAiFraudCard();
                } else if (score >= 80) {
                  renderEvaluationCard(evaluation);
                } else {
                  renderFailureCard(evaluation);
                }
              } catch (error) {
                console.error('Check solution error:', error);
                setResult('Failed to check solution: ' + (error.message || 'Unknown error'), '#ef4444');
              } finally {
                submitBtn.disabled = false;
              }
            });
          }


        const navPrev = document.querySelector('[data-role="code-question-prev"]');
        const navNext = document.querySelector('[data-role="code-question-next"]');
        const navIndicator = document.querySelector('[data-role="code-question-indicator"]');

        const updateNavState = () => {
          if (navIndicator && totalQuestions > 1) {
            navIndicator.textContent =
              'Question ' + (currentIndex + 1) + ' of ' + totalQuestions;
          }
          if (navPrev) {
            navPrev.disabled = currentIndex === 0 || totalQuestions <= 1;
            navPrev.style.opacity = navPrev.disabled ? '0.5' : '1';
            navPrev.style.cursor = navPrev.disabled ? 'not-allowed' : 'pointer';
          }
          if (navNext) {
            navNext.disabled = currentIndex === totalQuestions - 1 || totalQuestions <= 1;
            navNext.style.opacity = navNext.disabled ? '0.5' : '1';
            navNext.style.cursor = navNext.disabled ? 'not-allowed' : 'pointer';
          }
        };

        syncQuestionViewFromMeta();
        updateNavState();

        if (navPrev && totalQuestions > 1) {
          navPrev.addEventListener('click', () => {
            if (currentIndex > 0) {
              saveCurrentCode();
              currentIndex -= 1;
              syncQuestionViewFromMeta();
              updateNavState();
            }
          });
        }

        if (navNext && totalQuestions > 1) {
          navNext.addEventListener('click', () => {
            if (currentIndex < totalQuestions - 1) {
              saveCurrentCode();
              currentIndex += 1;
              syncQuestionViewFromMeta();
              updateNavState();
            }
          });
        }
      })();
    </script>
  `
}

/**
 * Generate coding questions using OpenAI and return HTML for Content Studio style
 * rendering, including hint generation, solution checking, and AI-fraud detection.
 */
export async function generateCodeContentStudioComponent({
  topicName,
  topic_id,
  amount = 3,
  programming_language = 'javascript',
  skills = [],
  humanLanguage = 'en'
}) {
  const questions = await openAIContentStudioService.generateContentStudioCodingQuestions(
    topicName,
    Array.isArray(skills) ? skills : [],
    amount,
    programming_language,
    {
      humanLanguage,
      topic_id
    }
  )

  const questionsHtml =
    questions.length > 0
      ? renderSingleQuestion(
          { ...questions[0], id: `code_${topic_id || 'preview'}_1` },
          0,
        topicName,
        programming_language
      )
      : ''

  const meta = questions.map((q, index) => ({
    id: `code_${topic_id || 'preview'}_${index + 1}`,
    title: q.title || `Coding Question ${index + 1}`,
    description: q.description || '',
    language: q.language || programming_language,
    topicName,
    testCases: Array.isArray(q.testCases) ? q.testCases : [],
    skills: Array.isArray(skills) ? skills : [],
    humanLanguage
  }))

  const bootstrapScript = renderBootstrapScript(meta)
  const serviceHeadersScript = renderContentStudioServiceHeadersScript()

  const totalQuestions = questions.length

  return `
    <div class="content-studio-code-container" style="padding:32px;background:#f8fafc;color:#1e293b;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:960px;margin:0 auto;display:grid;gap:16px;">
        ${
          totalQuestions > 1
            ? `
        <div data-role="code-question-nav" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" data-role="code-question-prev" style="border:none;border-radius:999px;padding:8px 14px;background:#e2e8f0;color:#0f172a;font-size:0.85rem;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              ← Previous
            </button>
            <button type="button" data-role="code-question-next" style="border:none;border-radius:999px;padding:8px 14px;background:#0f172a;color:#f9fafb;font-size:0.85rem;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              Next →
            </button>
          </div>
          <div data-role="code-question-indicator" style="font-size:0.85rem;color:#64748b;">
            Question 1 of ${totalQuestions}
          </div>
        </div>
        `
            : ''
        }
        <div data-role="code-question-cards" style="display:grid;gap:24px;">
        ${questionsHtml}
      </div>
      </div>
      ${serviceHeadersScript}
      ${bootstrapScript}
    </div>
  `
}


