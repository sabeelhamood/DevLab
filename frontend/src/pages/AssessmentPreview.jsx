import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '../services/api/client.js'

function AssessmentPreview() {
  const [amount, setAmount] = useState(2)
  const [difficulty, setDifficulty] = useState('medium')
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')
  const [humanLanguage, setHumanLanguage] = useState('en')
  const [skillsInput, setSkillsInput] = useState('loops,array-methods')

  const [htmlPreview, setHtmlPreview] = useState('')
  const [requestJson, setRequestJson] = useState('')
  const [responseJson, setResponseJson] = useState('')
  const [customHtmlInput, setCustomHtmlInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('Click “Generate Live Preview” to fetch real OpenAI questions.')
  const [loading, setLoading] = useState(false)
  const previewRef = useRef(null)

  const requestBody = useMemo(() => {
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    return {
      requester_service: 'assessment',
      action: 'coding',
      payload: {
        action: 'coding',
        amount: Number(amount) > 0 ? Number(amount) : 1,
        difficulty: difficulty || 'medium',
        humanLanguage: humanLanguage || 'en',
        programming_language: programmingLanguage || 'javascript',
        skills
      },
      response: {
        answer: ''
      }
    }
  }, [amount, difficulty, humanLanguage, programmingLanguage, skillsInput])

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
            'Content-Type': 'text/plain'
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
    const apiBase =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : '') ||
      window.__DEVLAB_API_BASE__
    if (apiBase) {
      window.__DEVLAB_API_BASE__ = apiBase
    }

    const apiKey = import.meta.env.VITE_SERVICE_API_KEY
    const serviceId = import.meta.env.VITE_SERVICE_ID || 'assessment-preview'
    if (apiKey || serviceId) {
      window.__DEVLAB_SERVICE_HEADERS = {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(serviceId ? { 'x-service-id': serviceId } : {})
      }
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Temporary Utility
          </p>
          <h1 className="text-3xl font-semibold">
            Assessment Question Preview
          </h1>
          <p className="text-slate-400 max-w-3xl">
            Use this page to preview the HTML that Assessment receives. The
            controls below trigger a sample request through the existing
            `/api/data-request` gateway or let you paste custom HTML from any
            assessment payload. This page does not affect production flows.
          </p>
          {statusMessage && (
            <div className="text-sm text-emerald-300">{statusMessage}</div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Amount
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Difficulty
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                  <option value="advanced">advanced</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Programming Language
                <input
                  value={programmingLanguage}
                  onChange={(event) => setProgrammingLanguage(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>

            <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
              Skills (comma separated)
              <input
                value={skillsInput}
                onChange={(event) => setSkillsInput(event.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
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
                className="rounded-md bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold transition"
              >
                Apply Custom HTML
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">
                Custom HTML (renderedQuestion)
              </label>
              <textarea
                value={customHtmlInput}
                onChange={(event) => setCustomHtmlInput(event.target.value)}
                placeholder="<article>…</article>"
                rows={8}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              Request Payload (sent to /api/data-request)
            </label>
            <textarea
              value={requestJson}
              readOnly
              rows={12}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />

            <label className="text-sm font-medium text-slate-300">
              Raw Gateway Response
            </label>
            <textarea
              value={responseJson}
              readOnly
              placeholder="Response from gateway will appear here after fetching."
              rows={12}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                Rendered Assessment View
              </h2>
              <span className="text-xs text-slate-500">
                Using <code>dangerouslySetInnerHTML</code>
              </span>
            </div>
            {htmlPreview ? (
              <div ref={previewRef} className="preview-container prose max-w-none text-slate-200" />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-8 text-center text-sm text-slate-500">
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

