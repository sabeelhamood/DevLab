import { useState } from 'react';
import CodeEditor from '../practice/CodeEditor.jsx';

const CompetitionRoom = ({ competition, onCompetitionComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [solutions, setSolutions] = useState({});
  const [code, setCode] = useState('');

  const questions = competition.questions || [];

  const handleSubmit = async () => {
    // TODO: Submit solution
    console.log('Solution submitted for question:', currentQuestionIndex);
  };

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Competition</h2>
        <div className="flex justify-between items-center">
          <p className="text-text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`px-3 py-1 rounded ${
                  index === currentQuestionIndex
                    ? 'bg-primary-cyan text-white'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {questions[currentQuestionIndex] && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Question {currentQuestionIndex + 1}
            </h3>
            <p className="text-text-primary whitespace-pre-wrap">
              {questions[currentQuestionIndex].question_text}
            </p>
          </div>

          <CodeEditor
            code={code}
            language={questions[currentQuestionIndex].programming_language}
            onChange={setCode}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default CompetitionRoom;





