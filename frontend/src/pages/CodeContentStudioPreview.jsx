import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '../services/api/client.js'

function CodeContentStudioPreview() {
  const [topicId, setTopicId] = useState(123)
  const [topicName, setTopicName] = useState('Arrays')
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')
  const [amount, setAmount] = useState(2)
  const [humanLanguage, setHumanLanguage] = useState('en')
  const [skillsInput, setSkillsInput] = useState('loops,array-methods')

  const [statusMessage, setStatusMessage] = useState(
    'Configure params and click “Generate Code Component” to render the Content Studio code experience (with hints, solution checking, and AI fraud detection).'
  )
  const [loading, setLoading] = useState(false)
  const [requestJson, setRequestJson] = useState('')
  const [responseJson, setResponseJson] = useState('')
  const [html, setHtml] = useState('')

  const previewRef = useRef(null)

  const requestBody = useMemo(() => {
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const payload = {
      topic_id: Number(topicId) || 0,
      topicName: topicName || '',
      amount: Number(amount) > 0 ? Number(amount) : 1,
      programming_language: programmingLanguage || 'javascript',
      skills,
      humanLanguage: humanLanguage || 'en'
    }

    return payload
  }, [topicId, topicName, amount, programmingLanguage, skillsInput, humanLanguage])

  useEffect(() => {
    setRequestJson(JSON.stringify(requestBody, null, 2))
  }, [requestBody])

  // After HTML is injected, manually execute any <script> tags so the
  // inline bootstrap logic from codeContentStudioRender.js runs.
  useEffect(() => {
    if (!html) return
    const container = previewRef.current
    if (!container) return

    const scripts = Array.from(container.querySelectorAll('script'))
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      if (oldScript.type) newScript.type = oldScript.type
      if (oldScript.src) {
        newScript.src = oldScript.src
      } else {
        newScript.text = oldScript.text || oldScript.innerHTML
      }
      oldScript.parentNode.replaceChild(newScript, oldScript)
    })
  }, [html])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setStatusMessage('Calling /api/gemini-questions/code-preview…')
    try {
      const response = await apiClient.post('/gemini-questions/code-preview', requestBody)
      setResponseJson(JSON.stringify(response, null, 2))

      if (!response?.success) {
        setStatusMessage(
          response?.error || 'Request completed but success=false was returned from backend.'
        )
        setHtml('')
        return
      }

      const htmlString = response.html || ''
      if (!htmlString) {
        setStatusMessage('Backend returned success but no html field.')
        setHtml('')
        return
      }

      setHtml(htmlString)
      setStatusMessage('Rendered Content Studio code component. Try hints and submit.')
    } catch (error) {
      console.error('CodeContentStudioPreview error:', error)
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown error while calling /gemini-questions/code-preview'
      setStatusMessage(`Failed to render code component: ${message}`)
      setHtml('')
      setResponseJson(JSON.stringify(error?.response?.data || {}, null, 2))
    } finally {
      setLoading(false)
    }
  }, [requestBody])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Temporary Utility
          </p>
          <h1 className="text-3xl font-semibold">Code Content Studio Renderer Preview</h1>
          <p className="text-slate-400 max-w-3xl">
            This page calls the <code>/api/gemini-questions/code-preview</code> endpoint, which
            uses <code>codeContentStudioRender.js</code> and the OpenAI-backed
            Content Studio service to generate a full HTML component. The returned HTML includes
            interactive hints, solution checking, and AI fraud detection.
          </p>
          {statusMessage && (
            <div className="text-sm text-emerald-300">{statusMessage}</div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Topic ID
                <input
                  type="number"
                  min="1"
                  value={topicId}
                  onChange={(event) => setTopicId(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Topic Name
                <input
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
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
                Amount (questions)
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2 sm:col-span-2">
                Skills (comma separated)
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-md bg-emerald-500/90 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Generating…' : 'Generate Code Component'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              Request Payload (sent to /api/gemini-questions/code-preview)
            </label>
            <textarea
              value={requestJson}
              readOnly
              rows={10}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />

            <label className="text-sm font-medium text-slate-300">
              Raw Backend Response
            </label>
            <textarea
              value={responseJson}
              readOnly
              placeholder="Response from backend will appear here after fetching."
              rows={10}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                Rendered Code Content Studio Component
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Uses <code>dangerouslySetInnerHTML</code> and replays embedded scripts
              </span>
            </div>
            {html ? (
              <div
                ref={previewRef}
                className="preview-container prose max-w-none text-slate-200 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-8 text-center text-sm text-slate-500">
                No component rendered yet. Configure the payload above and click
                &ldquo;Generate Code Component&rdquo;.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default CodeContentStudioPreview


