import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const CodeEditor = ({ code, language, onChange, onSubmit, isSubmitting: externalIsSubmitting }) => {
  const { theme } = useTheme();
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  
  // Use external isSubmitting if provided, otherwise use internal state
  const isSubmitting = externalIsSubmitting !== undefined ? externalIsSubmitting : internalIsSubmitting;

  const handleEditorChange = (value) => {
    onChange(value || '');
  };

  const handleSubmit = async () => {
    if (externalIsSubmitting === undefined) {
      setInternalIsSubmitting(true);
    }
    try {
      await onSubmit();
    } finally {
      if (externalIsSubmitting === undefined) {
        setInternalIsSubmitting(false);
      }
    }
  };

  const editorTheme = theme === 'night' ? 'vs-dark' : 'vs';

  return (
    <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">Code Editor</h3>
          <span className="text-sm text-text-secondary">{language}</span>
        </div>
      </div>
      
      <div className="h-96">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={editorTheme}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2
          }}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !code}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Running...' : 'Run Code'}
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;



