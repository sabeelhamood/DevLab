import React, { useEffect, useState } from 'react'
import { apiClient } from '../services/api/client.js'

const SAMPLE_PAYLOAD = {
  requester_service: 'assessment',
  payload: {
    action: 'code',
    topic_name: 'Preview Topic',
    programming_language: 'javascript',
    number_of_questions: 1
  }
}

function AssessmentPreview() {
  const [htmlPreview, setHtmlPreview] = useState('')
  const [presentationJson, setPresentationJson] = useState('')
  const [rawQuestionJson, setRawQuestionJson] = useState('')
  const [customHtmlInput, setCustomHtmlInput] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoadSample = async () => {
    setLoading(true)
    setStatusMessage('Requesting assessment preview sample…')
    try {
      const response = await apiClient.post('/data-request', SAMPLE_PAYLOAD)
      const question =
        response?.data?.questions?.[0] ||
        response?.data?.data?.questions?.[0] ||
        null

      if (!question) {
        setStatusMessage('Sample request completed but no question was returned.')
        setHtmlPreview('')
        setPresentationJson('')
        setRawQuestionJson(JSON.stringify(response, null, 2))
        setLoading(false)
        return
      }

      setHtmlPreview(question.renderedQuestion || '')
      setPresentationJson(
        JSON.stringify(question.presentation || {}, null, 2)
      )
      setRawQuestionJson(JSON.stringify(question, null, 2))
      setStatusMessage('Sample assessment question loaded.')
    } catch (error) {
      console.error('Assessment preview sample failed:', error)
      setStatusMessage(
        `Failed to load sample question: ${error?.message || 'Unknown error'}`
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleLoadSample()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyCustomHtml = () => {
    setHtmlPreview(customHtmlInput)
    setStatusMessage('Custom HTML applied.')
  }

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
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleLoadSample}
                disabled={loading}
                className="rounded-md bg-emerald-500/90 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load Sample Question'}
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
              Presentation JSON
            </label>
            <textarea
              value={presentationJson}
              readOnly
              placeholder="Presentation metadata will appear here after loading a sample."
              rows={16}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            />

            <label className="text-sm font-medium text-slate-300">
              Raw Question JSON
            </label>
            <textarea
              value={rawQuestionJson}
              readOnly
              placeholder="Full question payload for debugging."
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
              <div
                className="preview-container prose max-w-none text-slate-200"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
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

