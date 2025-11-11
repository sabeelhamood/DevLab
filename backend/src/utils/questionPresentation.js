const THEMES = {
  code: {
    accent: '#0ea5e9',
    accentMuted: 'rgba(14, 165, 233, 0.12)',
    badgeText: '#0f172a',
    gradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    surface: '#ffffff',
    codeBackground: '#0f172a',
    codeColor: '#e0f2fe'
  },
  theoretical: {
    accent: '#8b5cf6',
    accentMuted: 'rgba(139, 92, 246, 0.14)',
    badgeText: '#1f2937',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 100%)',
    surface: '#ffffff',
    codeBackground: '#312e81',
    codeColor: '#ede9fe'
  },
  default: {
    accent: '#0f172a',
    accentMuted: 'rgba(15, 23, 42, 0.08)',
    badgeText: '#0f172a',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    surface: '#ffffff',
    codeBackground: '#0f172a',
    codeColor: '#f8fafc'
  }
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatMultiline = (value = '') => escapeHtml(value).replace(/\n/g, '<br />')

const serializeValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}

const buildTestCasesHtml = (testCases = [], theme) => {
  if (!Array.isArray(testCases) || !testCases.length) {
    return ''
  }

  const items = testCases
    .map((testCase, index) => {
      const input = serializeValue(testCase?.input)
      const expected = serializeValue(testCase?.expected_output ?? testCase?.output)
      const explanation = serializeValue(testCase?.explanation)

      return `
        <li style="list-style: none; background: rgba(15, 23, 42, 0.02); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 16px; padding: 16px; margin-bottom: 12px;">
          <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; color: ${theme.accent}; text-transform: uppercase;">Test Case ${index + 1}</span>
            ${
              testCase?.name
                ? `<span style="font-size: 0.75rem; color: rgba(15, 23, 42, 0.6);">${escapeHtml(testCase.name)}</span>`
                : ''
            }
          </header>
          <div style="display: grid; gap: 12px;">
            <div>
              <span style="display: inline-block; font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; color: rgba(15, 23, 42, 0.55);">Input</span>
              <pre style="margin: 0; padding: 12px; border-radius: 12px; background: ${theme.codeBackground}; color: ${theme.codeColor}; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; line-height: 1.45; white-space: pre-wrap; word-break: break-word;">${escapeHtml(
        input
      )}</pre>
            </div>
            <div>
              <span style="display: inline-block; font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; color: rgba(15, 23, 42, 0.55);">Expected Output</span>
              <pre style="margin: 0; padding: 12px; border-radius: 12px; background: ${theme.codeBackground}; color: ${theme.codeColor}; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; line-height: 1.45; white-space: pre-wrap; word-break: break-word;">${escapeHtml(
        expected
      )}</pre>
            </div>
            ${
              explanation
                ? `<p style="margin: 0; font-size: 0.9rem; line-height: 1.55; color: rgba(15, 23, 42, 0.7);">${formatMultiline(
                    explanation
                  )}</p>`
                : ''
            }
          </div>
        </li>
      `
    })
    .join('')

  return `
    <section style="background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 20px; padding: 20px;">
      <header style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: ${theme.accentMuted}; color: ${theme.accent}; font-weight: 600;">TC</span>
        <h2 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: rgba(15, 23, 42, 0.92);">Test Cases</h2>
      </header>
      <ol style="margin: 0; padding: 0; display: grid; gap: 12px;">
        ${items}
      </ol>
    </section>
  `
}

const buildHintsHtml = (hints = [], theme) => {
  if (!Array.isArray(hints) || !hints.length) {
    return ''
  }

  const items = hints
    .filter(Boolean)
    .map(
      (hint, index) => `
        <li style="list-style: none; display: flex; gap: 12px; padding: 12px 16px; border-radius: 14px; background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.18); color: rgba(15, 23, 42, 0.78);">
          <span style="flex-shrink: 0; font-size: 0.75rem; font-weight: 600; color: ${theme.accent};">Hint ${index + 1}</span>
          <p style="margin: 0; font-size: 0.92rem; line-height: 1.55;">${formatMultiline(hint)}</p>
        </li>
      `
    )
    .join('')

  return `
    <section style="display: grid; gap: 14px;">
      <header style="display: flex; align-items: center; gap: 12px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: ${theme.accentMuted}; color: ${theme.accent}; font-weight: 600;">💡</span>
        <h2 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: rgba(15, 23, 42, 0.92);">Helpful Hints</h2>
      </header>
      <ul style="margin: 0; padding: 0; display: grid; gap: 12px;">
        ${items}
      </ul>
    </section>
  `
}

const buildExpectedAnswerHtml = (expectedAnswer, theme) => {
  if (!expectedAnswer) {
    return ''
  }

  return `
    <section style="background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 20px; padding: 20px;">
      <header style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; background: ${theme.accentMuted}; color: ${theme.accent}; font-weight: 600;">✔</span>
        <h2 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: rgba(15, 23, 42, 0.92);">Expected Answer</h2>
      </header>
      <p style="margin: 0; font-size: 0.98rem; line-height: 1.6; color: rgba(15, 23, 42, 0.75);">${formatMultiline(
        expectedAnswer
      )}</p>
    </section>
  `
}

export const buildQuestionPresentation = ({
  id,
  questionType = 'default',
  title,
  prompt,
  topicName,
  difficulty,
  programmingLanguage,
  hints = [],
  testCases = [],
  expectedAnswer
}) => {
  const theme = THEMES[questionType] || THEMES.default
  const headerTitle =
    title || (questionType === 'code' ? 'Code Challenge' : 'Concept Check')

  const normalizedPrompt = formatMultiline(prompt || '')
  const testCasesHtml = buildTestCasesHtml(testCases, theme)
  const hintsHtml = buildHintsHtml(hints, theme)
  const expectedHtml = buildExpectedAnswerHtml(expectedAnswer, theme)

  const html = `
    <article data-question-id="${escapeHtml(id || '')}" data-question-type="${escapeHtml(
    questionType
  )}" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: ${theme.gradient}; padding: 28px; border-radius: 24px; box-shadow: 0 32px 64px rgba(15, 23, 42, 0.12); display: grid; gap: 22px;">
      <header style="display: flex; align-items: center; justify-content: space-between; gap: 18px;">
        <div style="display: grid; gap: 10px;">
          ${
            topicName
              ? `<span style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(15, 23, 42, 0.55);">${escapeHtml(
                  topicName
                )}</span>`
              : ''
          }
          <h1 style="margin: 0; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.01em;">${escapeHtml(
            headerTitle
          )}</h1>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${
            difficulty
              ? `<span style="display: inline-flex; align-items: center; justify-content: center; min-width: 90px; padding: 8px 14px; border-radius: 999px; background: ${theme.accent}; color: white; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">${escapeHtml(
                  difficulty
                )}</span>`
              : ''
          }
          ${
            programmingLanguage
              ? `<span style="display: inline-flex; align-items: center; justify-content: center; min-width: 90px; padding: 8px 14px; border-radius: 999px; background: ${theme.accentMuted}; color: ${theme.badgeText}; font-size: 0.78rem; font-weight: 600;">${escapeHtml(
                  programmingLanguage
                )}</span>`
              : ''
          }
        </div>
      </header>
      <section style="background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(15, 23, 42, 0.07); border-radius: 20px; padding: 22px;">
        <p style="margin: 0; font-size: 1rem; line-height: 1.7;">${normalizedPrompt}</p>
      </section>
      ${testCasesHtml}
      ${expectedHtml}
      ${hintsHtml}
    </article>
  `.trim()

  const styleTokens = {
    version: 'v1',
    theme: questionType,
    palette: {
      accent: theme.accent,
      accentMuted: theme.accentMuted,
      background: theme.gradient,
      surface: theme.surface,
      textPrimary: '#0f172a',
      textSecondary: '#475569'
    },
    typography: {
      heading: "700 1.6rem/1.25 'Inter', sans-serif",
      body: "400 1rem/1.6 'Inter', sans-serif",
      code: "500 0.85rem/1.45 'JetBrains Mono', monospace"
    },
    layout: {
      borderRadius: 24,
      cardPadding: 28,
      sectionSpacing: 22
    }
  }

  const structuredLayout = {
    version: 'v1',
    type: 'question-card',
    questionId: id,
    questionType,
    header: {
      title: headerTitle,
      topicName: topicName || null,
      badges: [
        difficulty
          ? {
              label: difficulty,
              variant: 'difficulty',
              color: theme.accent,
              textColor: '#ffffff'
            }
          : null,
        programmingLanguage
          ? {
              label: programmingLanguage,
              variant: 'language',
              color: theme.accentMuted,
              textColor: theme.badgeText
            }
          : null
      ].filter(Boolean)
    },
    prompt: prompt || '',
    expectedAnswer: expectedAnswer || null,
    sections: [
      Array.isArray(testCases) && testCases.length
        ? {
            type: 'test-cases',
            items: testCases.map((testCase, index) => ({
              label: `Test Case ${index + 1}`,
              input: serializeValue(testCase?.input),
              expectedOutput: serializeValue(
                testCase?.expected_output ?? testCase?.output
              ),
              explanation: testCase?.explanation || null
            }))
          }
        : null,
      Array.isArray(hints) && hints.length
        ? {
            type: 'hints',
            items: hints
              .filter(Boolean)
              .map((hint, index) => ({
                label: `Hint ${index + 1}`,
                text: hint
              }))
          }
        : null
    ].filter(Boolean),
    metadata: {
      difficulty: difficulty || null,
      programmingLanguage: programmingLanguage || null
    }
  }

  return {
    version: '1.0.0',
    html,
    styleTokens,
    structuredLayout
  }
}

export const addPresentationToQuestion = (question = {}, presentationConfig = {}) => {
  const presentation = buildQuestionPresentation(presentationConfig)

  return {
    ...question,
    renderedQuestion: presentation.html,
    rendered_question: presentation.html,
    presentation
  }
}


