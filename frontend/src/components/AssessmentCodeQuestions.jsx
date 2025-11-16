import { Code2, FileCode, TestTube, AlertCircle } from 'lucide-react'

export default function AssessmentCodeQuestions({ questions = [] }) {
  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <p>No coding questions available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Coding Assessment Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {questions.length} question{questions.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {questions.map((question, index) => (
        <div
          key={question.id || index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {question.title || `Question ${index + 1}`}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {question.programming_language || 'N/A'}
                  </span>
                  {question.difficulty && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        question.difficulty === 'easy' || question.difficulty === 'basic'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : question.difficulty === 'medium' || question.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question Description */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {question.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Skills */}
          {question.skills && question.skills.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Skills:
              </span>
              <div className="flex flex-wrap gap-2">
                {question.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases */}
          {question.testCases && question.testCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Cases ({question.testCases.length})
                </span>
              </div>
              <div className="space-y-2">
                {question.testCases.map((testCase, testIndex) => (
                  <div
                    key={testIndex}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Input:
                        </span>
                        <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {testCase.input || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Expected Output:
                        </span>
                        <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {testCase.expected_output || testCase.output || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

