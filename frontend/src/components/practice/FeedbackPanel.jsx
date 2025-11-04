const FeedbackPanel = ({ feedback }) => {
  if (!feedback) {
    return null;
  }

  return (
    <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">AI Feedback</h3>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-text-primary whitespace-pre-wrap">{feedback.feedback}</p>
      </div>
      
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold text-text-primary mb-2">Suggestions</h4>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {feedback.improvements && feedback.improvements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold text-text-primary mb-2">Improvements</h4>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            {feedback.improvements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;



