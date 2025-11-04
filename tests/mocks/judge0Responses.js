/**
 * Judge0 API Mock Responses
 * Mock responses for Judge0 API calls
 */

export const mockJudge0SuccessResponse = {
  status: {
    id: 3,
    description: 'Accepted'
  },
  stdout: 'Hello World\n',
  stderr: '',
  compile_output: null,
  message: null,
  time: '0.100',
  memory: 1024
};

export const mockJudge0ErrorResponse = {
  status: {
    id: 6,
    description: 'Compilation Error'
  },
  stdout: null,
  stderr: 'SyntaxError: invalid syntax',
  compile_output: 'File "main.py", line 1\n    print("Hello World"\n                         ^\nSyntaxError: unexpected EOF while parsing\n',
  message: null,
  time: null,
  memory: null
};

export const mockJudge0TimeoutResponse = {
  status: {
    id: 4,
    description: 'Time Limit Exceeded'
  },
  stdout: null,
  stderr: null,
  compile_output: null,
  message: 'Time limit exceeded',
  time: null,
  memory: null
};

export const mockJudge0SubmissionResponse = {
  token: 'submission_token_12345'
};



