import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MOCK_COMPETITION = {
  competitionId: 'demo-competition-001',
  courseName: 'JavaScript Fundamentals Showdown',
  learners: [
    {
      id: '3e3526c7-b8ae-4425-9128-5aa6897a895d',
      name: 'Sabeel',
      submitted: true
    },
    {
      id: '0d220f97-4bc1-4198-9db7-fa6a9b4de8cd',
      name: 'Dan',
      submitted: false
    }
  ],
  activeLearnerId: '0d220f97-4bc1-4198-9db7-fa6a9b4de8cd',
  questions: [
    {
      id: 'q1',
      title: 'Array Manipulation Challenge',
      description:
        'Write a function that finds the longest increasing subsequence in an array. Return the length of the subsequence.',
      difficulty: 'Medium',
      language: 'JavaScript',
      timeLimit: 600,
      starterCode: `function longestIncreasingSubsequence(arr) {
  // TODO: implement dynamic programming solution
  return 0;
}`,
      testCases: [
        { input: '[1, 3, 2, 4, 5]', expected: 4 },
        { input: '[5, 4, 3, 2, 1]', expected: 1 },
        { input: '[1, 2, 3, 4, 5]', expected: 5 }
      ]
    }
  ]
}

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function CompetitionPreview() {
  const navigate = useNavigate()
  const [timeRemaining, setTimeRemaining] = useState(MOCK_COMPETITION.questions[0].timeLimit)

  useEffect(() => {
    setTimeRemaining(MOCK_COMPETITION.questions[0].timeLimit)
    const timer = setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          clearInterval(timer)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const activeQuestion = MOCK_COMPETITION.questions[0]

  const learners = useMemo(() => {
    return MOCK_COMPETITION.learners.map((learner) => ({
      ...learner,
      state:
        learner.id === MOCK_COMPETITION.activeLearnerId
          ? learner.submitted
            ? 'Awaiting opponent'
            : 'Your move'
          : learner.submitted
          ? 'Submitted'
          : 'Waiting'
    }))
  }, [])

  const handleBack = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-emerald-400/80 text-xs uppercase tracking-[0.3em]">
            Competition Preview
          </p>
          <h1 className="text-3xl font-semibold text-white">
            {MOCK_COMPETITION.courseName}
          </h1>
          <p className="text-sm text-slate-400">
            Competition ID:{' '}
            <span className="font-mono text-white/80">{MOCK_COMPETITION.competitionId}</span>
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">
                  Current Question
                </p>
                <h2 className="text-2xl font-semibold text-white mt-1">
                  {activeQuestion.title}
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  Difficulty:{' '}
                  <span className="text-emerald-300">{activeQuestion.difficulty}</span> · Language:{' '}
                  <span className="text-emerald-300">{activeQuestion.language}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">
                  Time Remaining
                </p>
                <p className="text-3xl font-bold text-emerald-300">
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Prompt</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {activeQuestion.description}
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-200">
                  Starter Code (Read-only)
                </h4>
                <pre className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs text-slate-200 overflow-x-auto">
                  {activeQuestion.starterCode}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Sample Test Cases</h4>
                <ul className="space-y-2">
                  {activeQuestion.testCases.map((testCase, index) => (
                    <li
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300"
                    >
                      <span className="font-semibold text-slate-200">Input:</span>{' '}
                      <span className="font-mono text-slate-100">{testCase.input}</span>
                      <br />
                      <span className="font-semibold text-slate-200">Expected:</span>{' '}
                      <span className="font-mono text-slate-100">{String(testCase.expected)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                Learners
              </p>
              <ul className="space-y-4">
                {learners.map((learner) => (
                  <li
                    key={learner.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{learner.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{learner.id}</p>
                    </div>
                    <div
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        learner.state === 'Your move'
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                          : learner.state === 'Submitted'
                          ? 'bg-sky-400/10 text-sky-200 border border-sky-400/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {learner.state}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Turn Insights</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                This preview simulates a ten-minute turn in a head-to-head challenge. One learner
                has already submitted; the other is still working. When both submit, the system
                automatically moves to the next question.
              </p>

              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Return to Dashboard
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

export default CompetitionPreview

