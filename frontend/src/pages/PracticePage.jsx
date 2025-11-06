import { useState, useEffect } from 'react';
import CodeEditor from '../components/practice/CodeEditor.jsx';
import QuestionCard from '../components/practice/QuestionCard.jsx';
import FeedbackPanel from '../components/practice/FeedbackPanel.jsx';
import HintButton from '../components/practice/HintButton.jsx';
import ExecutionResults from '../components/practice/ExecutionResults.jsx';
import codeExecutionService from '../services/codeExecutionService.js';
import questionService from '../services/questionService.js';

const PracticePage = () => {
  const [code, setCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [executionResults, setExecutionResults] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hints, setHints] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [error, setError] = useState(null);

  // Load a question on component mount or when user clicks "Generate Question"
  const loadQuestion = async () => {
    setIsLoadingQuestion(true);
    setError(null);
    
    try {
      // Simulate Content Studio request with mock data
      const mockContentStudioRequest = {
        quantity: 1, // Generate just 1 question for now
        lesson_id: 'lesson_001',
        course_name: 'Python Fundamentals',
        lesson_name: 'Introduction to Functions',
        nano_skills: ['functions', 'parameters', 'return'],
        micro_skills: ['function_definitions', 'code_organization'],
        question_type: 'code', // 'code' for coding questions, 'theoretical' for theoretical
        programming_language: 'python'
      };

      // Call backend to generate question (backend will call Gemini)
      console.log('🔄 Requesting question generation from backend...', mockContentStudioRequest);
      const response = await questionService.generateQuestions(mockContentStudioRequest);
      
      console.log('📦 Backend response:', response);
      
      if (response.success && response.questions && response.questions.length > 0) {
        const question = response.questions[0];
        
        // Log question source (Gemini or mock)
        const questionSource = question.source || 'unknown';
        console.log(`✅ Question received (source: ${questionSource}):`, question);
        
        if (questionSource === 'mock') {
          console.warn('⚠️ Using mock questions - Gemini API may not be configured or unavailable');
          setError('Using mock questions. Gemini API may not be configured. Check backend logs.');
        } else if (questionSource === 'gemini') {
          console.log('✅ Real Gemini question received!');
        }
        
        // Display the first question
        setCurrentQuestion(question);
        setCode(''); // Clear previous code
        setExecutionResults(null); // Clear previous results
        setFeedback(null); // Clear previous feedback
        setHints([]); // Clear hints
        setHintsUsed(0); // Reset hints used
      } else {
        console.error('❌ Invalid response format:', response);
        setError(`No questions generated. Response: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      console.error('❌ Question loading error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError(err.response?.data?.error || err.message || 'Failed to load question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Auto-load a question when page first loads
  useEffect(() => {
    loadQuestion();
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setError(null); // Clear error when code changes
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !code.trim()) {
      setError('Please select a question and write some code');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResults(null);

    try {
      // Execute code via Judge0
      const response = await codeExecutionService.executeCode({
        code,
        programming_language: currentQuestion.programming_language || 'python',
        test_cases: currentQuestion.test_cases || [],
        question_id: currentQuestion.question_id || 'test_question'
      });

      setExecutionResults(response.results);
    } catch (err) {
      setError(err.message || 'Failed to execute code. Please try again.');
      console.error('Code execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-16" style={{ backgroundColor: '#00ff00' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Question */}
          <div className="space-y-6">
            {!currentQuestion && !isLoadingQuestion && (
              <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
                <p className="text-text-secondary mb-4">No question loaded</p>
                <button
                  onClick={loadQuestion}
                  className="btn-primary"
                >
                  Generate Question
                </button>
              </div>
            )}
            
            {isLoadingQuestion && (
              <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
                <p className="text-text-secondary">Loading question...</p>
              </div>
            )}
            
            <QuestionCard 
              question={currentQuestion}
              onQuestionChange={setCurrentQuestion}
            />
            
            {currentQuestion && (
              <div className="space-y-4">
                <button
                  onClick={loadQuestion}
                  className="btn-secondary w-full"
                  disabled={isLoadingQuestion}
                >
                  {isLoadingQuestion ? 'Loading...' : 'Generate New Question'}
                </button>
              </div>
            )}
            
            {currentQuestion && (
              <div className="space-y-4">
                <HintButton
                  questionId={currentQuestion.question_id}
                  hints={hints}
                  hintsUsed={hintsUsed}
                  onHintsGenerated={setHints}
                  onHintUsed={() => setHintsUsed(prev => prev + 1)}
                />
                
                {hintsUsed >= 3 && (
                  <button className="btn-primary">
                    View Answer
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              code={code}
              language={currentQuestion?.programming_language || 'python'}
              onChange={handleCodeChange}
              onSubmit={handleSubmit}
              isSubmitting={isExecuting}
            />
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            
            {executionResults && (
              <ExecutionResults results={executionResults} />
            )}
            
            {feedback && (
              <FeedbackPanel feedback={feedback} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage;



