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

  const configJson = serializeJsonForScript({
    questionId: question.id,
    ...config
  })

  return `
    <div class="judge0-panel" style="margin-top: 1.25rem; border-top: 1px solid #e5e7eb; padding-top: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <strong style="color: #065f46;">Judge0 Sandbox</strong>
      </div>
      <p style="margin: 0 0 0.5rem 0; color: #374151; font-size: 0.9rem;">
        Language: <strong>${escapeHtml((config.language || question.programming_language || 'javascript').toUpperCase())}</strong> •
        Test Cases: <strong>${testCaseCount}</strong>
      </p>
      <p style="margin: 0 0 0.75rem 0; color: #4b5563; font-size: 0.85rem;">
        ${escapeHtml(config.instructions || 'Use the provided endpoints to run these test cases via Judge0.')}
      </p>
      <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: #4b5563;">
        <span>Execute single run: <code style="color: #2563eb;">${escapeHtml(config?.endpoints?.execute || '/api/judge0/execute')}</code></span>
        <span>Run all test cases: <code style="color: #2563eb;">${escapeHtml(config?.endpoints?.runAllTestCases || '/api/judge0/test-cases')}</code></span>
      </div>
      <details style="margin-top: 0.75rem;">
        <summary style="cursor: pointer; color: #2563eb; font-size: 0.85rem;">Judge0 payload preview</summary>
        <pre style="margin-top: 0.5rem; background: #0f172a; color: #e2e8f0; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; overflow-x: auto;">
${escapeHtml(JSON.stringify(config.testCases || question.testCases || [], null, 2))}
        </pre>
      </details>
      <script type="application/json" data-judge0-config="${escapeHtml(question.id || `question_${Date.now()}`)}">
${configJson}
      </script>
    </div>
  `
}

function serializeJsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}




