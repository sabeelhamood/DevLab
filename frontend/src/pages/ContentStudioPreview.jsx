import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/api/client.js'

function ContentStudioPreview() {
  const [topicId, setTopicId] = useState(123)
  const [topicName, setTopicName] = useState('Arrays')
  const [questionType, setQuestionType] = useState('code')
  const [programmingLanguage, setProgrammingLanguage] = useState('javascript')
  const [amount, setAmount] = useState(3)
  const [humanLanguage, setHumanLanguage] = useState('en')
  const [skillsInput, setSkillsInput] = useState('loops,array-methods')

  const [htmlPreviews, setHtmlPreviews] = useState([])
  const [requestJson, setRequestJson] = useState('')
  const [responseJson, setResponseJson] = useState('')
  const [statusMessage, setStatusMessage] = useState(
    'Configure a Content Studio request and click “Generate Preview” to see how questions are rendered.'
  )
  const [loading, setLoading] = useState(false)

  const requestBody = useMemo(() => {
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const payload = {
      action: 'generate-questions',
      topic_id: Number(topicId) || 0,
      topic_name: topicName || '',
      question_type: questionType || 'code',
      programming_language:
        questionType === 'code' ? programmingLanguage || 'javascript' : undefined,
      amount: Number(amount) > 0 ? Number(amount) : 1,
      skills,
      humanLanguage: humanLanguage || 'en'
    }

    return {
      requester_service: 'content-studio',
      payload,
      response: {
        answer: ''
      }
    }
  }, [topicId, topicName, questionType, programmingLanguage, amount, skillsInput, humanLanguage])

  useEffect(() => {
    setRequestJson(JSON.stringify(requestBody, null, 2))
  }, [requestBody])

  const handleGeneratePreview = useCallback(async () => {
    setLoading(true)
    setStatusMessage('Contacting /api/data-request as content-studio…')
    try {
      const payloadString = JSON.stringify(requestBody)
      const response = await apiClient.post('/data-request', payloadString, {
        headers: {
          'Content-Type': 'text/plain',
          ...(window.__DEVLAB_SERVICE_HEADERS || {})
        }
      })

      setResponseJson(JSON.stringify(response, null, 2))

      const rawAnswer = response?.response?.answer
      if (!rawAnswer) {
        setStatusMessage('Request succeeded but response.answer was empty.')
        setHtmlPreviews([])
        return
      }

      let parsed
      try {
        parsed = JSON.parse(rawAnswer)
      } catch (error) {
        console.error('Failed to parse content-studio answer JSON:', error)
        setStatusMessage('Received non-JSON answer string from gateway.')
        setHtmlPreviews([])
        return
      }

      const questions = parsed?.data?.questions || []
      const htmlList = questions
        .map((q) => q.rendered_question || q.renderedQuestion || q.presentation?.html)
        .filter(Boolean)

      if (!htmlList.length) {
        setStatusMessage('Questions were returned but no rendered HTML was found.')
        setHtmlPreviews([])
        return
      }

      setHtmlPreviews(htmlList)
      setStatusMessage(`Loaded ${htmlList.length} question(s) from Content Studio.`)
    } catch (error) {
      console.error('Content Studio preview generation failed:', error)
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown error'
      setStatusMessage(`Failed to render Content Studio preview: ${message}`)
      setHtmlPreviews([])
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
          <h1 className="text-3xl font-semibold">
            Content Studio Question Preview
          </h1>
          <p className="text-slate-400 max-w-3xl">
            This page simulates how the Content Studio service calls the DevLab gateway and
            receives rendered coding questions. Use it to inspect the JSON wrapper and the
            generated HTML from the Content Studio perspective.
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
                Question Type
                <select
                  value={questionType}
                  onChange={(event) => setQuestionType(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  <option value="code">code</option>
                  <option value="theoretical">theoretical</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
                Programming Language (for code)
                <input
                  value={programmingLanguage}
                  onChange={(event) => setProgrammingLanguage(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
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
                Human Language
                <input
                  value={humanLanguage}
                  onChange={(event) => setHumanLanguage(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
              <label className="text-sm font-medium text-slate-300 flex flex-col gap-2">
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
                onClick={handleGeneratePreview}
                disabled={loading}
                className="rounded-md bg-emerald-500/90 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Generating…' : 'Generate Preview'}
              </button>
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
                Rendered Content Studio Questions
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Using <code>dangerouslySetInnerHTML</code> per question
              </span>
            </div>
            {htmlPreviews.length ? (
              <div className="space-y-6">
                {htmlPreviews.map((html, index) => (
                  <div
                    key={index}
                    className="preview-container prose max-w-none text-slate-200 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-8 text-center text-sm text-slate-500">
                No preview loaded yet. Configure the payload above and click
                &ldquo;Generate Preview&rdquo;.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ContentStudioPreview


