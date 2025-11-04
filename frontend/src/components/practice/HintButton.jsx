import { useState } from 'react';
import hintService from '../../services/hintService.js';

const HintButton = ({ questionId, hints, hintsUsed, onHintsGenerated, onHintUsed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHint, setCurrentHint] = useState(null);

  const handleGetHint = async () => {
    if (hintsUsed >= 3) {
      return;
    }

    setIsLoading(true);
    try {
      // If hints not generated yet, generate all 3 in single call
      if (hints.length === 0) {
        const response = await hintService.generateHints(questionId);
        onHintsGenerated(response.hints);
        setCurrentHint(response.hints[0]);
      } else {
        // Retrieve next hint from cache
        const response = await hintService.getHint(questionId, hintsUsed + 1);
        setCurrentHint(response.hint_text);
      }
      
      onHintUsed();
    } catch (error) {
      console.error('Error getting hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGetHint}
        disabled={isLoading || hintsUsed >= 3}
        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : `Get Hint ${hintsUsed + 1}/3`}
      </button>
      
      {currentHint && (
        <div className="bg-bg-secondary rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-text-primary">{currentHint}</p>
        </div>
      )}
      
      {hintsUsed >= 3 && (
        <p className="text-sm text-text-muted">All hints used. You can now view the answer.</p>
      )}
    </div>
  );
};

export default HintButton;



