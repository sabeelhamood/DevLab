const ExecutionResults = ({ results }) => {
  if (!results) {
    return null;
  }

  const isSuccess = results.status === 'Accepted' && results.is_correct;

  return (
    <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Execution Results</h3>
      
      <div className={`p-4 rounded-lg mb-4 ${isSuccess ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <p className={`font-semibold ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {results.status}
        </p>
      </div>
      
      {results.stdout && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-text-primary mb-2">Output</h4>
          <pre className="bg-bg-secondary rounded p-3 text-sm text-text-primary overflow-x-auto">
            {results.stdout}
          </pre>
        </div>
      )}
      
      {results.stderr && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">Errors</h4>
          <pre className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm text-red-700 dark:text-red-400 overflow-x-auto">
            {results.stderr}
          </pre>
        </div>
      )}
      
      {results.test_case_results && results.test_case_results.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-text-primary mb-2">Test Cases</h4>
          <div className="space-y-2">
            {results.test_case_results.map((testCase, index) => (
              <div
                key={index}
                className={`p-3 rounded ${testCase.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={testCase.passed ? 'text-green-600' : 'text-red-600'}>
                    {testCase.passed ? '✓' : '✗'}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    Test Case {index + 1}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">Input: {testCase.input}</p>
                <p className="text-xs text-text-secondary">Expected: {testCase.expected_output}</p>
                <p className="text-xs text-text-secondary">Got: {testCase.actual_output}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionResults;



