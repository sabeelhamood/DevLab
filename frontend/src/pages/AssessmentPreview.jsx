import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '../services/api/client.js'
import { useTheme } from '../contexts/ThemeContext.jsx'

function AssessmentPreview() {
  const { theme } = useTheme()
  console.log('[AssessmentPreview] rendering with theme:', theme)
  const isNightMode = theme === 'night-mode'

  const pageBgClass = isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
  const mutedTextClass = isNightMode ? 'text-slate-400' : 'text-slate-500'
  const subtleTextClass = isNightMode ? 'text-slate-300' : 'text-slate-600'
  const borderClass = isNightMode ? 'border-slate-800' : 'border-slate-200'
  const cardBgClass = isNightMode ? 'bg-slate-900/60' : 'bg-white/90'
  const cardShadow = isNightMode ? 'shadow-lg shadow-emerald-900/20' : 'shadow-md shadow-emerald-200/40'
  const inputBgClass = isNightMode ? 'bg-slate-900/70 text-slate-200' : 'bg-white text-slate-900'
  const inputBorderFocus = isNightMode ? 'focus:ring-emerald-500/60' : 'focus:ring-emerald-500/80'
  const badgeBg = isNightMode ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-500/40'
  const secondaryButtonClass = isNightMode
    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100'
    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
  const dashedBoxClass = isNightMode
    ? 'border-slate-700 bg-slate-900/70 text-slate-500'
    : 'border-slate-300 bg-white text-slate-500'
  const textareaReadOnlyBg = isNightMode ? 'bg-slate-900/70 text-slate-300' : 'bg-slate-100 text-slate-700'
  const labelClass = `text-sm font-medium flex flex-col gap-2 ${subtleTextClass}`
  const helperTextClass = `text-xs ${mutedTextClass}`

  const [amount, setAmount] = useState(2)
  const [difficulty, setDifficulty] = useState('medium')
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')
  const [humanLanguage, setHumanLanguage] = useState('en')
  const [skillsInput, setSkillsInput] = useState('loops,array-methods')
   // Optional assessment identifier – when provided, generated coding questions
   // will also be saved into Supabase `assessment_codeQuestions` without
   // affecting existing behavior when left blank.
  const [assessmentId, setAssessmentId] = useState('')

  const [htmlPreview, setHtmlPreview] = useState('')
  const [requestJson, setRequestJson] = useState('')
  const [responseJson, setResponseJson] = useState('')
  const [customHtmlInput, setCustomHtmlInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('Click “Generate Live Preview” to fetch real OpenAI questions.')
  const [lastScore, setLastScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const previewRef = useRef(null)

  const requestBody = useMemo(() => {
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const payload = {
      requester_service: 'assessment',
      action: 'coding',
      payload: {
        action: 'coding',
        amount: Number(amount) > 0 ? Number(amount) : 1,
        difficulty: difficulty || 'medium',
        humanLanguage: humanLanguage || 'en',
        programming_language: programmingLanguage || 'javascript',
        skills,
        // Only include assessment_id when user has provided a value,
        // keeping the original contract untouched for existing callers.
        ...(assessmentId && assessmentId.trim()
          ? { assessment_id: assessmentId.trim() }
          : {})
      },
      response: {
        answer: ''
      }
    }
    return payload
  }, [amount, difficulty, humanLanguage, programmingLanguage, skillsInput, assessmentId])

  useEffect(() => {
    setRequestJson(JSON.stringify(requestBody, null, 2))
  }, [requestBody])

  const handleGeneratePreview = useCallback(async () => {
    setLoading(true)
    setStatusMessage('Contacting Assessment gateway…')
    try {
      const payloadString = JSON.stringify(requestBody)
      const response = await apiClient.post(
        '/data-request',
        payloadString,
        {
          headers: {
            'Content-Type': 'text/plain',
            ...(window.__DEVLAB_SERVICE_HEADERS || {})
          }
        }
      )

      setResponseJson(JSON.stringify(response, null, 2))

      const html = response?.response?.answer || ''
      if (!html) {
        setStatusMessage('Request succeeded but no HTML was returned.')
        setHtmlPreview('')
        return
      }

      setHtmlPreview(html)
      setStatusMessage('Live preview loaded from OpenAI-generated questions.')
    } catch (error) {
      console.error('Assessment preview generation failed:', error)
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown error'
      setStatusMessage(`Failed to render preview: ${message}`)
      setHtmlPreview('')
      setResponseJson(JSON.stringify(error?.response?.data || {}, null, 2))
    } finally {
      setLoading(false)
    }
  }, [requestBody])

  const handleApplyCustomHtml = () => {
    setHtmlPreview(customHtmlInput)
    setStatusMessage('Custom HTML applied locally.')
  }

  useEffect(() => {
    const rawBase =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : '') ||
      window.__DEVLAB_API_BASE__ ||
      window.location.origin

    const normalizeBase = (value) => {
      if (!value) return window.location.origin
      try {
        const parsed = new URL(value, window.location.origin)
        let href = parsed.href.replace(/\/api\/?$/, '')
        href = href.replace(/\/$/, '')
        return href || window.location.origin
      } catch {
        const fallback = value.replace(/\/api\/?$/, '').replace(/\/$/, '')
        return fallback || window.location.origin
      }
    }

    const normalizedBase = normalizeBase(rawBase)
    window.__DEVLAB_API_BASE__ = normalizedBase

    const apiKey = import.meta.env.VITE_SERVICE_API_KEY
    const serviceId = import.meta.env.VITE_SERVICE_ID || 'assessment-preview'
    if (apiKey || serviceId) {
      window.__DEVLAB_SERVICE_HEADERS = {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(serviceId ? { 'x-service-id': serviceId } : {})
      }
    }
  }, [])

  // Listen for grading events fired by the embedded assessment HTML so we can
  // surface the final score inside this React preview as well.
  useEffect(() => {
    const handler = (event) => {
      const evaluation = event?.detail?.evaluation
      if (!evaluation) return

      let rawScore
      if (typeof evaluation === 'number') {
        rawScore = evaluation
      } else if (typeof evaluation.score === 'number') {
        rawScore = evaluation.score
      } else if (typeof evaluation.data === 'object' && typeof evaluation.data.score === 'number') {
        rawScore = evaluation.data.score
      } else {
        return
      }

      const normalized = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)))
      setLastScore(normalized)
    }

    document.addEventListener('assessmentSolutionsSubmitted', handler)
    return () => {
      document.removeEventListener('assessmentSolutionsSubmitted', handler)
    }
  }, [])

  useEffect(() => {
    const container = previewRef.current
    if (!container) return
    container.innerHTML = ''
    if (!htmlPreview) return

    const template = document.createElement('template')
    template.innerHTML = htmlPreview

    const injectNode = (node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script')
        Array.from(node.attributes || []).forEach((attr) => {
          script.setAttribute(attr.name, attr.value)
        })
        script.textContent = node.textContent
        container.appendChild(script)
      } else {
        container.appendChild(node.cloneNode(true))
      }
    }

    Array.from(template.content.childNodes).forEach(injectNode)
  }, [htmlPreview])

  const inputBaseClass =
    'rounded-lg border px-3 py-2 text-sm focus:outline-none ' +
    `${inputBorderFocus}`
  const inputClass = `${inputBaseClass} ${inputBgClass} ${borderClass}`
  const textareaClass = `${inputClass} w-full`
  const readonlyTextareaClass = `w-full rounded-lg border ${borderClass} px-3 py-2 text-xs font-mono focus:outline-none ${textareaReadOnlyBg}`
  const sectionCardClass = `rounded-2xl border ${borderClass} ${cardBgClass} ${cardShadow} p-6`

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${pageBgClass}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className={`text-sm uppercase tracking-wide ${mutedTextClass}`}>
            Temporary Utility
          </p>
          <h1 className="text-3xl font-semibold">
            Assessment Question Preview
          </h1>
          <p className={`${mutedTextClass} max-w-3xl`}>
            Use this page to preview the HTML that Assessment receives. The
            controls below trigger a sample request through the existing
            `/api/data-request` gateway or let you paste custom HTML from any
            assessment payload. This page does not affect production flows.
          </p>
          {statusMessage && (
            <div className={`text-sm ${isNightMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{statusMessage}</div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Amount
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Difficulty
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className={inputClass}
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                  <option value="advanced">advanced</option>
                </select>
              </label>
              <label className={labelClass}>
                Programming Language
                <input
                  value={programmingLanguage}
                  onChange={(event) => setProgrammingLanguage(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className={labelClass}>
              Assessment ID (optional)
              <input
                value={assessmentId}
                onChange={(event) => setAssessmentId(event.target.value)}
                placeholder="e.g. assessment_123"
                className={inputClass}
              />
              <span className={helperTextClass}>
                When provided, generated coding questions will be saved to Supabase under this assessment.
              </span>
            </label>

            <label className={labelClass}>
              Skills (comma separated)
              <input
                value={skillsInput}
                onChange={(event) => setSkillsInput(event.target.value)}
                className={inputClass}
              />
            </label>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleGeneratePreview}
                disabled={loading}
                className="rounded-md bg-emerald-500/90 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Generating…' : 'Generate Live Preview'}
              </button>
              <button
                onClick={handleApplyCustomHtml}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${secondaryButtonClass}`}
              >
                Apply Custom HTML
              </button>
            </div>

            <div className="space-y-3">
              <label className={`text-sm font-medium ${subtleTextClass}`}>
                Custom HTML (renderedQuestion)
              </label>
              <textarea
                value={customHtmlInput}
                onChange={(event) => setCustomHtmlInput(event.target.value)}
                placeholder="<article>…</article>"
                rows={8}
                className={`${textareaClass} text-sm`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className={`text-sm font-medium ${subtleTextClass}`}>
              Request Payload (sent to /api/data-request)
            </label>
            <textarea
              value={requestJson}
              readOnly
              rows={12}
              className={readonlyTextareaClass}
            />

            <label className={`text-sm font-medium ${subtleTextClass}`}>
              Raw Gateway Response
            </label>
            <textarea
              value={responseJson}
              readOnly
              placeholder="Response from gateway will appear here after fetching."
              rows={12}
              className={readonlyTextareaClass}
            />
          </div>
        </section>

        <section>
          <div className={sectionCardClass}>
            <div className={`mb-4 flex items-center justify-between border-b pb-4 ${borderClass}`}>
              <h2 className={`text-lg font-semibold ${subtleTextClass}`}>
                Rendered Assessment View
              </h2>
              <div className="flex items-center gap-4">
                {lastScore !== null && (
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold border ${badgeBg}`}>
                    Last graded score: <span className="ml-1">{lastScore}/100</span>
                  </div>
                )}
                <span className={`text-xs hidden sm:inline ${mutedTextClass}`}>
                  Using <code>dangerouslySetInnerHTML</code>
                </span>
              </div>
            </div>
            {htmlPreview ? (
              <div
                ref={previewRef}
                className={`preview-container prose max-w-none ${isNightMode ? 'text-slate-200' : 'text-slate-800'}`}
              />
            ) : (
              <div className={`rounded-lg border border-dashed p-8 text-center text-sm ${dashedBoxClass}`}>
                No preview loaded yet. Click &ldquo;Load Sample Question&rdquo;
                or paste custom HTML above.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AssessmentPreview

