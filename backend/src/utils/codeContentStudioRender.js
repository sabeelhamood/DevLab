import { openAIContentStudioService } from '../services/openAIContentStudioService.js'

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

function renderSingleQuestion(question, index, topicName, language) {
  const id = question.id || `code_content_${index + 1}`
  const description = question.description || ''
  const testCases = Array.isArray(question.testCases) ? question.testCases : []

  const testCasesHtml = testCases.length
    ? `
      <section style="background: rgba(255,255,255,0.92); border-radius: 20px; padding: 18px; border: 1px solid rgba(15,23,42,0.06);">
        <header style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:rgba(14,165,233,0.12);color:#0ea5e9;font-weight:600;">TC</span>
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#0f172a;">Test Cases</h2>
        </header>
        <ol style="margin:0;padding:0;display:grid;gap:10px;">
          ${testCases
            .map(
              (tc, idx) => `
            <li style="list-style:none;background:rgba(15,23,42,0.02);border-radius:16px;padding:14px;border:1px solid rgba(15,23,42,0.06);">
              <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:0.75rem;font-weight:600;letter-spacing:0.04em;color:#0ea5e9;text-transform:uppercase;">Test Case ${
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
          <h1 style="margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.01em;">
            ${escapeHtml(question.title || `Coding Question ${index + 1}`)}
          </h1>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:90px;padding:8px 14px;border-radius:999px;background:#0ea5e9;color:white;font-size:0.78rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">
            ${escapeHtml(question.difficulty || 'intermediate')}
          </span>
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:90px;padding:8px 14px;border-radius:999px;background:rgba(14,165,233,0.12);color:#0f172a;font-size:0.78rem;font-weight:600;">
            ${escapeHtml(language || 'javascript')}
          </span>
        </div>
      </header>

      <div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.1fr);gap:20px;align-items:flex-start;">
        <div data-role="question-pane" style="display:grid;gap:16px;">
          <section style="background:rgba(255,255,255,0.95);border-radius:20px;padding:20px;border:1px solid rgba(15,23,42,0.06);">
            <p style="margin:0;font-size:1rem;line-height:1.7;">${escapeHtml(description)}</p>
          </section>

          ${testCasesHtml}
        </div>

        <div data-role="editor-pane" style="display:grid;gap:16px;">
          <section style="display:grid;gap:16px;">
            <div style="display:flex;flex-wrap:wrap;gap:12px;">
              <button type="button" data-action="hint" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#0ea5e9;color:white;font-weight:600;box-shadow:0 14px 28px rgba(14,165,233,0.32);">
                💡 Get Hint
              </button>
              <button type="button" data-action="submit" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#22c55e;color:white;font-weight:600;box-shadow:0 16px 32px rgba(34,197,94,0.28);">
                🚀 Submit Solution
              </button>
              <button type="button" data-action="run-tests" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#6366f1;color:white;font-weight:600;box-shadow:0 16px 32px rgba(79,70,229,0.35);">
                🧪 Run All Tests
              </button>
            </div>
          </section>

          <section style="background:rgba(15,23,42,0.9);border-radius:20px;padding:18px;color:white;display:grid;gap:12px;">
            <header style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:rgba(14,165,233,0.28);color:#0ea5e9;">{ }</span>
                <div>
                  <h2 style="margin:0;font-size:1rem;font-weight:600;">Code Editor</h2>
                  <p style="margin:2px 0 0;font-size:0.8rem;color:rgba(226,232,240,0.75);">Write your solution, run all tests via Judge0, or submit for AI feedback.</p>
                </div>
              </div>
            </header>
            <textarea data-role="code-input" spellcheck="false" style="width:100%;min-height:200px;border-radius:14px;border:1px solid rgba(148,163,184,0.4);background:#020617;color:#e2e8f0;padding:10px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.85rem;resize:vertical;" placeholder="// Write your solution here..."></textarea>
            <div data-role="result" style="margin-top:6px;font-size:0.8rem;color:#e5e7eb;"></div>
          </section>

          <section data-role="hints" style="background:rgba(255,255,255,0.96);border-radius:20px;padding:16px;border:1px solid rgba(15,23,42,0.06);display:none;">
            <header style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:rgba(14,165,233,0.12);color:#0ea5e9;font-weight:600;">💡</span>
              <h2 style="margin:0;font-size:0.95rem;font-weight:600;color:#0f172a;">Hints</h2>
            </header>
            <ul data-role="hints-list" style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:0.9rem;color:#475569;"></ul>
          </section>

          <section data-role="tests-result" style="background:#ffffff;border-radius:16px;padding:16px;border:1px solid rgba(15,23,42,0.08);box-shadow:inset 0 0 0 1px rgba(15,23,42,0.02);display:none;">
            <header style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:rgba(148,163,184,0.2);color:#1e293b;font-weight:600;font-size:0.8rem;">🧪</span>
              <h2 style="margin:0;font-size:0.95rem;font-weight:600;color:#0f172a;">Test Results (Judge0)</h2>
            </header>
            <div data-role="tests-result-body" style="display:grid;gap:8px;font-size:0.9rem;color:#475569;"></div>
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

        const buildUrl = (path) => {
          if (!path) return '';
          if (/^https?:\\/\\//i.test(path)) return path;
          const base = (DEFAULT_BASE || window.__DEVLAB_API_BASE__ || '').replace(/\\/+$/, '');
          const normalized = path.startsWith('/') ? path : '/' + path;
          return base ? base + normalized : normalized;
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

        const containers = Array.from(document.querySelectorAll('[data-code-question]'));
        containers.forEach((container, index) => {
          const questionId = container.getAttribute('data-code-question');
          const language = container.getAttribute('data-language') || 'javascript';
          const codeInput = container.querySelector('[data-role="code-input"]');
          const resultEl = container.querySelector('[data-role="result"]');
          const hintBtn = container.querySelector('[data-action="hint"]');
          const submitBtn = container.querySelector('[data-action="submit"]');
          const runTestsBtn = container.querySelector('[data-action="run-tests"]');
          const hintsSection = container.querySelector('[data-role="hints"]');
          const hintsList = container.querySelector('[data-role="hints-list"]');
          const testsResultSection = container.querySelector('[data-role="tests-result"]');
          const testsResultBody = container.querySelector('[data-role="tests-result-body"]');

          const metaEntry = meta.find((m) => m.id === questionId) || meta[index] || {};
          const questionText = metaEntry.description || metaEntry.title || '';
          const topicName = metaEntry.topicName || '';
          const testCases = Array.isArray(metaEntry.testCases) ? metaEntry.testCases : [];

          let hintsUsed = 0;
          const allHints = [];

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
              '<button type="button" onclick="var m=this.closest(\'[data-devlab-modal-root]\');if(m){m.remove();}" aria-label="Close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(148,163,184,0.6);background:rgba(15,23,42,0.02);display:flex;align-items:center;justify-content:center;font-size:16px;color:#0f172a;cursor:pointer;">' +
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
              '<button type="button" onclick="var m=this.closest(\'[data-devlab-modal-root]\');if(m){m.remove();}" aria-label="Close" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(248,181,85,0.9);background:rgba(255,253,250,0.9);display:flex;align-items:center;justify-content:center;font-size:16px;color:#92400e;cursor:pointer;">' +
              '✕' +
              '</button>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 16px 22px;border-bottom:1px solid rgba(245,158,11,0.45);">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff7ed;font-size:20px;">' +
              '🎯' +
              '</div>' +
              '<div>' +
              '<div style="font-weight:700;font-size:16px;color:#92400e;">📚 Keep Learning!</div>' +
              '<div style="font-size:13px;color:#b45309;">Let\'s review and improve together.</div>' +
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

          const setResult = (message, color) => {
            if (!resultEl) return;
            resultEl.textContent = message;
            resultEl.style.color = color || '#e5e7eb';
          };

          const appendHint = (hintText) => {
            if (!hintsList || !hintsSection) return;
            hintsSection.style.display = 'block';
            const li = document.createElement('li');
            li.textContent = hintText;
            hintsList.appendChild(li);
          };

          const renderTestResults = (results) => {
            if (!testsResultSection || !testsResultBody) return;
            testsResultSection.style.display = 'block';
            testsResultBody.innerHTML = '';

            if (!results || !results.length) {
              const p = document.createElement('p');
              p.textContent = 'No test results available.';
              testsResultBody.appendChild(p);
              return;
            }

            results.forEach((res) => {
              const card = document.createElement('div');
              card.style.borderRadius = '12px';
              card.style.padding = '10px 12px';
              card.style.border = '1px solid rgba(148,163,184,0.5)';
              card.style.background = res.passed ? 'rgba(22,163,74,0.06)' : 'rgba(248,113,113,0.06)';

              const statusColor = res.passed ? '#16a34a' : '#b91c1c';
              const statusLabel = res.passed ? 'PASS' : 'FAIL';

              card.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                '<span style="font-weight:600;color:#0f172a;">Test ' + (res.testNumber || '') + '</span>' +
                '<span style="font-size:0.75rem;font-weight:600;color:' + statusColor + ';">' + statusLabel + '</span>' +
                '</div>' +
                '<div style="font-size:0.8rem;color:#475569;display:grid;gap:2px;">' +
                '<div><strong>Input:</strong> ' + (res.input != null ? String(res.input) : '—') + '</div>' +
                '<div><strong>Expected:</strong> ' + (res.expected != null ? String(res.expected) : '—') + '</div>' +
                '<div><strong>Received:</strong> ' + (res.result != null ? String(res.result) : '—') + '</div>' +
                (res.stderr
                  ? '<div><strong>Error:</strong> ' + String(res.stderr) + '</div>'
                  : '') +
                '</div>';

              testsResultBody.appendChild(card);
            });
          };

          if (hintBtn && codeInput) {
            hintBtn.addEventListener('click', async () => {
              const userAttempt = codeInput.value || '';
              try {
                hintBtn.disabled = true;
                setResult('Generating hint...', '#38bdf8');
                const endpoint = buildUrl('/api/content-studio/generate-hint');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    question: questionText,
                    userAttempt,
                    hintsUsed,
                    allHints,
                    topicName
                  })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  throw new Error(data.error || 'Failed to generate hint');
                }
                const hint = data.hint || data.data?.hint || '';
                if (hint) {
                  allHints.push(hint);
                  hintsUsed += 1;
                  appendHint(hint);
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

          if (submitBtn && codeInput) {
            submitBtn.addEventListener('click', async () => {
              const userSolution = codeInput.value || '';
              if (!userSolution.trim()) {
                setResult('Please write a solution before submitting.', '#f97316');
                return;
              }
              try {
                submitBtn.disabled = true;
                setResult('Checking solution and running AI analysis...', '#38bdf8');
                const endpoint = buildUrl('/api/content-studio/check-solution');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
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
                  setResult(
                    'AI-generated solution detected. Please try to solve it yourself.',
                    '#f97316'
                  );
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

          if (runTestsBtn && codeInput) {
            runTestsBtn.addEventListener('click', async () => {
              const userSolution = codeInput.value || '';
              if (!userSolution.trim()) {
                setResult('Please write a solution before running tests.', '#f97316');
                return;
              }

              if (!testCases.length) {
                setResult('No test cases available for this question.', '#f97316');
                return;
              }

              try {
                runTestsBtn.disabled = true;
                setResult('Running all tests via Judge0...', '#38bdf8');
                if (testsResultSection && testsResultBody) {
                  testsResultSection.style.display = 'none';
                  testsResultBody.innerHTML = '';
                }

                const endpoint = buildUrl('/api/judge0/test-cases');
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    sourceCode: userSolution,
                    language,
                    testCases
                  })
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok || data.success === false) {
                  throw new Error(data.error || 'Failed to run Judge0 test-cases');
                }

                const results = Array.isArray(data.results) ? data.results : [];
                renderTestResults(results);

                const total = data.totalTests || results.length;
                const passed =
                  typeof data.passedTests === 'number'
                    ? data.passedTests
                    : results.filter((r) => r.passed).length;

                if (total > 0) {
                  const allPassed = passed === total;
                  const somePassed = passed > 0 && passed < total;
                  setResult(
                    'Judge0: ' + passed + '/' + total + ' tests passed.',
                    allPassed ? '#22c55e' : somePassed ? '#f97316' : '#ef4444'
                  );
                } else {
                  setResult('Judge0: No test results returned.', '#f97316');
                }
              } catch (error) {
                console.error('Judge0 Run All Tests error:', error);
                setResult(
                  'Failed to run tests via Judge0: ' + (error.message || 'Unknown error'),
                  '#ef4444'
                );
                if (testsResultSection && testsResultBody) {
                  testsResultSection.style.display = 'none';
                  testsResultBody.innerHTML = '';
                }
              } finally {
                runTestsBtn.disabled = false;
              }
            });
          }
        });

        // Navigation: single-card view with Next/Previous controls
        const totalQuestions = containers.length;
        if (totalQuestions > 0) {
          const navPrev = document.querySelector('[data-role="code-question-prev"]');
          const navNext = document.querySelector('[data-role="code-question-next"]');
          const navIndicator = document.querySelector('[data-role="code-question-indicator"]');

          let currentIndex = 0;

          const updateView = () => {
            containers.forEach((container, idx) => {
              if (idx === currentIndex) {
                container.style.display = '';
              } else {
                container.style.display = 'none';
              }
            });

            if (navIndicator) {
              navIndicator.textContent = 'Question ' + (currentIndex + 1) + ' of ' + totalQuestions;
            }
            if (navPrev) {
              navPrev.disabled = currentIndex === 0;
              navPrev.style.opacity = currentIndex === 0 ? '0.5' : '1';
              navPrev.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            }
            if (navNext) {
              navNext.disabled = currentIndex === totalQuestions - 1;
              navNext.style.opacity = currentIndex === totalQuestions - 1 ? '0.5' : '1';
              navNext.style.cursor =
                currentIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer';
            }
          };

          updateView();

          if (navPrev) {
            navPrev.addEventListener('click', () => {
              if (currentIndex > 0) {
                currentIndex -= 1;
                updateView();
              }
            });
          }

          if (navNext) {
            navNext.addEventListener('click', () => {
              if (currentIndex < totalQuestions - 1) {
                currentIndex += 1;
                updateView();
              }
            });
          }
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

  const questionsHtml = questions
    .map((q, index) =>
      renderSingleQuestion(
        { ...q, id: `code_${topic_id || 'preview'}_${index + 1}` },
        index,
        topicName,
        programming_language
      )
    )
    .join('')

  const meta = questions.map((q, index) => ({
    id: `code_${topic_id || 'preview'}_${index + 1}`,
    title: q.title || `Coding Question ${index + 1}`,
    description: q.description || '',
    language: q.language || programming_language,
    topicName,
    testCases: Array.isArray(q.testCases) ? q.testCases : []
  }))

  const bootstrapScript = renderBootstrapScript(meta)

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
      ${bootstrapScript}
    </div>
  `
}


