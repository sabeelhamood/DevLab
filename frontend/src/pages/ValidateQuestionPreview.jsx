import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/api/client.js'

function ValidateQuestionPreview() {
  const [topicId, setTopicId] = useState(123)
  const [topicName, setTopicName] = useState('Arrays')
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')
  const [skillsInput, setSkillsInput] = useState('loops,array-methods')
  const [humanLanguage, setHumanLanguage] = useState('en')
  const [exercisesInput, setExercisesInput] = useState(
    'Write a function `rotateLeft(arr, k)` that rotates an array k positions to the left without using built-in rotate helpers.\nImplement `chunkArray(arr, size)` which splits an array into subarrays of the specified size.'
  )

  const [statusMessage, setStatusMessage] = useState(
    'Configure the validate-question payload and click "Validate & Preview" to see the rendered Content Studio component.'
  )
  const [loading, setLoading] = useState(false)
  const [responseJson, setResponseJson] = useState('')
  const [html, setHtml] = useState('')

  // Set up API base URL and service headers for iframe access
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
    const serviceId = import.meta.env.VITE_SERVICE_ID || 'content-studio-service'
    if (apiKey || serviceId) {
      window.__DEVLAB_SERVICE_HEADERS = {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(serviceId ? { 'x-service-id': serviceId } : {})
      }
    }
  }, [])

  // Build the validate-question request payload
  const requestBody = useMemo(() => {
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const exercises = exercisesInput
      .split('\n')
      .map((ex) => ex.trim())
      .filter(Boolean)

    const payload = {
      action: 'validate-question',
      topic_id: Number(topicId) || 0,
      topic_name: topicName || '',
      question_type: 'code',
      programming_language: programmingLanguage || 'javascript',
      skills,
      humanLanguage: humanLanguage || 'en',
      exercises
    }

    return {
      requester_service: 'content-studio',
      payload,
      response: {
        answer: ''
      }
    }
  }, [topicId, topicName, programmingLanguage, skillsInput, humanLanguage, exercisesInput])

  const requestJson = useMemo(
    () => JSON.stringify(requestBody, null, 2),
    [requestBody]
  )

  const handleValidate = useCallback(async () => {
    setLoading(true)
    setStatusMessage('Sending validate-question request to /api/data-request...')
    setHtml('')
    setResponseJson('')

    try {
      const payloadString = JSON.stringify(requestBody)
      const response = await apiClient.post('/data-request', payloadString, {
        headers: {
          'Content-Type': 'text/plain',
          ...(window.__DEVLAB_SERVICE_HEADERS || {})
        }
      })

      console.log('[ValidateQuestionPreview] Response:', response)
      setResponseJson(JSON.stringify(response, null, 2))

      const rawAnswer = response?.response?.answer
      if (!rawAnswer) {
        setStatusMessage('Request succeeded but response.answer was empty.')
        return
      }

      // Check if the answer is HTML (for approved questions) or JSON (for needs_revision)
      let htmlString = ''
      let parsedAnswer = null

      try {
        parsedAnswer = JSON.parse(rawAnswer)
      } catch {
        // If parsing fails, assume it's HTML
        htmlString = rawAnswer
      }

      if (parsedAnswer) {
        // Check if it's a needs_revision response
        if (parsedAnswer?.success === true && parsedAnswer?.data?.status === 'needs_revision') {
          setStatusMessage(
            `Validation failed: ${parsedAnswer.data.message || 'Exercises are not relevant to the specified constraints.'}`
          )
          setHtml('')
          return
        }

        // Check if it's an approved response with componentHtml
        if (parsedAnswer?.componentHtml) {
          htmlString = parsedAnswer.componentHtml
        } else if (parsedAnswer?.data?.componentHtml) {
          htmlString = parsedAnswer.data.componentHtml
        }
      }

      // If we still don't have HTML, try to extract it from the raw answer
      if (!htmlString && rawAnswer.trim().startsWith('<')) {
        htmlString = rawAnswer
      }

      if (htmlString) {
        setHtml(htmlString)
        setStatusMessage(
          '✅ Validation passed! Rendered Content Studio component with validated questions. Try hints and submit.'
        )
      } else {
        setStatusMessage(
          'Request completed but no HTML component was found in the response. Check the raw response below.'
        )
      }
    } catch (error) {
      console.error('ValidateQuestionPreview error:', error)
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown error while calling /api/data-request'
      setStatusMessage(`Failed to validate questions: ${message}`)
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
                Content Studio - Validate Question
              </p>
              <h1
                className="text-2xl font-bold font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                Validate Question Preview
              </h1>
            </div>
          </div>
          <p className="text-sm max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            This page sends a <code>/api/data-request</code> request with{' '}
            <code>requester_service = &quot;content-studio&quot;</code> and{' '}
            <code>action = &quot;validate-question&quot;</code>. The backend validates trainer
            exercises, transforms them into structured coding questions, and returns the rendered
            HTML component (or a rejection message if validation fails).
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
              Validation Parameters
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
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Skills (comma separated)
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  className="input px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium flex flex-col gap-2" style={{ color: 'var(--text-primary)' }}>
                Exercises (one per line)
                <textarea
                  value={exercisesInput}
                  onChange={(event) => setExercisesInput(event.target.value)}
                  rows={6}
                  className="input px-3 py-2 text-sm font-mono"
                  placeholder="Write a function..."
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={handleValidate}
                disabled={loading}
                className="btn btn-primary flex items-center justify-center text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validating…' : 'Validate & Preview'}
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
                rows={10}
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
                rows={10}
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
                Rendered Validated Questions Component
              </h2>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                Rendered HTML from validated questions
              </span>
            </div>
            {html ? (
              <iframe
                title="Validate Question Preview"
                srcDoc={html}
                className="preview-container rounded-xl border bg-white/95"
                style={{
                  borderColor: 'rgba(148, 163, 184, 0.4)',
                  color: '#0f172a',
                  width: '100%',
                  minHeight: '600px',
                  border: 'none'
                }}
                sandbox="allow-scripts allow-same-origin"
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
                &ldquo;Validate & Preview&rdquo;.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ValidateQuestionPreview

