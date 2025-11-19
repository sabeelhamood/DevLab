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
                ${
                  tc.explanation
                    ? `<p style="margin:0;font-size:0.85rem;line-height:1.5;color:rgba(15,23,42,0.7);">${escapeHtml(
                        tc.explanation
                      )}</p>`
                    : ''
                }
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
    )}" style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #ffffff; padding: 24px; border-radius: 20px; border: 1px solid rgba(15,23,42,0.06); box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12); display: grid; gap: 22px;">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:18px;">
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

      <section style="background:rgba(255,255,255,0.95);border-radius:20px;padding:20px;border:1px solid rgba(15,23,42,0.06);">
        <p style="margin:0;font-size:1rem;line-height:1.7;">${escapeHtml(description)}</p>
      </section>

      <section style="display:grid;gap:16px;">
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <button type="button" data-action="hint" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#0ea5e9;color:white;font-weight:600;box-shadow:0 14px 28px rgba(14,165,233,0.32);">
            💡 Get Hint
          </button>
          <button type="button" data-action="submit" style="border:none;cursor:pointer;padding:12px 18px;border-radius:14px;background:#22c55e;color:white;font-weight:600;box-shadow:0 16px 32px rgba(34,197,94,0.28);">
            🚀 Submit Solution
          </button>
        </div>
      </section>

      <section style="background:rgba(15,23,42,0.9);border-radius:20px;padding:18px;color:white;display:grid;gap:12px;">
        <header style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:rgba(14,165,233,0.28);color:#0ea5e9;">{ }</span>
            <div>
              <h2 style="margin:0;font-size:1rem;font-weight:600;">Code Editor</h2>
              <p style="margin:2px 0 0;font-size:0.8rem;color:rgba(226,232,240,0.75);">Write your solution and submit for AI feedback.</p>
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

      ${testCasesHtml}
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
      topicName: q.topicName
    }))
  )

  return `
    <script type="application/json" data-code-content-meta>
${questionsJson}
    </script>
    <script>
      (function () {
        const API_BASE = '${baseFromEnv}';

        const buildUrl = (path) => {
          if (!path) return '';
          if (/^https?:\\/\\//i.test(path)) return path;
          const base = (API_BASE || window.__DEVLAB_API_BASE__ || '').replace(/\\/+$/, '');
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
          const hintsSection = container.querySelector('[data-role="hints"]');
          const hintsList = container.querySelector('[data-role="hints-list"]');

          const metaEntry = meta.find((m) => m.id === questionId) || meta[index] || {};
          const questionText = metaEntry.description || metaEntry.title || '';
          const topicName = metaEntry.topicName || '';

          let hintsUsed = 0;
          const allHints = [];

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
                  setResult(
                    '✅ Great job! Your solution looks correct. Score: ' + score + '/100',
                    '#22c55e'
                  );
                } else {
                  setResult(
                    'Your solution needs improvement. Score: ' +
                      score +
                      '/100. Check feedback and try again.',
                    '#fbbf24'
                  );
                }
              } catch (error) {
                console.error('Check solution error:', error);
                setResult('Failed to check solution: ' + (error.message || 'Unknown error'), '#ef4444');
              } finally {
                submitBtn.disabled = false;
              }
            });
          }
        });
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
    topicName
  }))

  const bootstrapScript = renderBootstrapScript(meta)

  return `
    <div class="content-studio-code-container" style="padding:28px;background:#020617;color:#e5e7eb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:960px;margin:0 auto;display:grid;gap:24px;">
        ${questionsHtml}
      </div>
      ${bootstrapScript}
    </div>
  `
}


