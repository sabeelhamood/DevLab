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
      action: 'generate-questions',
      topic_id: Number(topicId) || 0,
      topic_name: topicName || '',
      question_type: 'code',
      amount: Number(amount) > 0 ? Number(amount) : 1,
      programming_language: programmingLanguage || 'javascript',
      skills,
      humanLanguage: humanLanguage || 'en'
    }

    const wrapper = {
      requester_service: 'content-studio',
      payload,
      response: {
        answer: ''
      }
    }

    return wrapper
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
    setStatusMessage('Calling /api/data-request…')
    try {
      const response = await apiClient.post('/data-request', requestBody)
      setResponseJson(JSON.stringify(response, null, 2))

      if (!response || response.error) {
        setStatusMessage(
          response?.error || 'Request completed but an error was returned from backend.'
        )
        setHtml('')
        return
      }

      // Try to extract HTML from response.response.answer if the backend ever returns it
      const answer = response?.response?.answer
      if (typeof answer === 'string' && answer.trim().startsWith('<')) {
        setHtml(answer)
        setStatusMessage('Rendered HTML from response.answer. Try hints and submit.')
      } else {
        setHtml('')
        setStatusMessage(
          'Request to /api/data-request succeeded. See "Raw Backend Response" for JSON payload.'
        )
      }
    } catch (error) {
      console.error('CodeContentStudioPreview error:', error)
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown error while calling /api/data-request'
      setStatusMessage(`Failed to execute data request: ${message}`)
      setHtml('')
      setResponseJson(JSON.stringify(error?.response?.data || {}, null, 2))
    } finally {
      setLoading(false)
    }
  }, [requestBody])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-6 pt-20 space-y-6">
        {/* Header card */}
        <div
          className="p-6 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl"
          style={{
            background: 'var(--gradient-card)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Content Studio
              </p>
              <h1
                className="text-2xl font-bold font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                Code Content Studio Renderer Preview
              </h1>
            </div>
          </div>
          <p className="text-sm max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            This page sends a <code>/api/data-request</code> call with{' '}
            <code>requester_service = &quot;content-studio&quot;</code> and{' '}
            <code>action = &quot;generate-questions&quot;</code>, matching the Content Studio
            microservice integration and using the OpenAI-backed Content Studio service.
          </p>
          {statusMessage && (
            <div
              className="mt-3 text-sm px-3 py-2 rounded-lg inline-flex items-center"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Controls + request/response */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration panel */}
          <div
            className="card p-6 transition-all duration-300 hover:shadow-xl"
            style={{
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Generation Parameters
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Topic ID
                <input
                  type="number"
                  min="1"
                  value={topicId}
                  onChange={(event) => setTopicId(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Topic Name
                <input
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Programming Language
                <input
                  value={programmingLanguage}
                  onChange={(event) => setProgrammingLanguage(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Amount (questions)
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium flex flex-col gap-2 sm:col-span-2" style={{ color: 'var(--text-primary)' }}>
                Skills (comma separated)
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary flex items-center justify-center text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating…' : 'Generate Code Component'}
              </button>
            </div>
          </div>

          {/* Request/response panel */}
          <div
            className="card p-6 transition-all duration-300 hover:shadow-xl"
            style={{
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Debug Payload & Response
            </h2>

            <div className="space-y-3">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Request Payload (sent to /api/data-request)
              </label>
              <textarea
                value={requestJson}
                readOnly
                rows={8}
                className="w-full rounded-lg border bg-white/90 px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none"
              />

              <label
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Raw Backend Response
              </label>
              <textarea
                value={responseJson}
                readOnly
                placeholder="Response from backend will appear here after fetching."
                rows={8}
                className="w-full rounded-lg border bg-white/90 px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Rendered component preview */}
        <section>
          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{
              background: 'var(--gradient-card)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="mb-4 flex items-center justify-between border-b pb-4 border-gray-200/40">
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Rendered Code Content Studio Component
              </h2>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                Uses <code>dangerouslySetInnerHTML</code> and replays embedded scripts
              </span>
            </div>
            {html ? (
              <div
                ref={previewRef}
                className="preview-container rounded-xl border bg-white/95 p-4"
                style={{
                  borderColor: 'rgba(148, 163, 184, 0.4)',
                  color: '#0f172a'
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="rounded-lg border border-dashed p-8 text-center text-sm"
                style={{
                  borderColor: 'rgba(148, 163, 184, 0.5)',
                  background: 'rgba(15, 23, 42, 0.03)',
                  color: 'var(--text-secondary)'
                }}
              >
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


