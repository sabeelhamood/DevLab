/**
 * Code Editor Component Unit Tests
 * TDD: RED-GREEN-REFACTOR
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeEditor from '../../../../frontend/src/components/practice/CodeEditor.jsx';
import { ThemeProvider } from '../../../../frontend/src/contexts/ThemeContext.jsx';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onChange, value }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  )
}));

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('CodeEditor Component', () => {
  it('should render code editor', () => {
    renderWithTheme(
      <CodeEditor
        code=""
        language="python"
        onChange={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('should call onChange when code is edited', async () => {
    const handleChange = jest.fn();
    
    renderWithTheme(
      <CodeEditor
        code=""
        language="python"
        onChange={handleChange}
        onSubmit={() => {}}
      />
    );

    const editor = screen.getByTestId('code-editor');
    await userEvent.type(editor, 'print("Hello")');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should call onSubmit when submit button is clicked', async () => {
    const handleSubmit = jest.fn();
    
    renderWithTheme(
      <CodeEditor
        code="print('Hello')"
        language="python"
        onChange={() => {}}
        onSubmit={handleSubmit}
      />
    );

    const submitButton = screen.getByText('Run Code');
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });
});




