const QuestionCard = ({ question, onQuestionChange }) => {
  if (!question) {
    return (
      <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
        <p className="text-text-secondary">No question loaded</p>
      </div>
    );
  }

  // Handle different question formats
  const difficulty = question.style?.difficulty || question.difficulty || 'medium';
  const programmingLanguage = question.programming_language || 'python';
  const questionText = question.question_text || question.question || '';
  const testCases = question.test_cases || [];

  return (
    <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold text-text-primary">Question</h2>
          <span className="text-sm px-2 py-1 rounded bg-primary-cyan text-white capitalize">
            {difficulty}
          </span>
        </div>
        <p className="text-text-secondary capitalize">{programmingLanguage}</p>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-text-primary whitespace-pre-wrap">{questionText}</p>
      </div>
      
      {testCases.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Test Cases</h3>
          <div className="space-y-2">
            {testCases.slice(0, 2).map((testCase, index) => (
              <div key={index} className="bg-bg-secondary rounded p-3">
                <p className="text-sm text-text-secondary">
                  <strong>Input:</strong> {testCase.input}
                </p>
                <p className="text-sm text-text-secondary">
                  <strong>Expected Output:</strong> {testCase.expected_output}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;



