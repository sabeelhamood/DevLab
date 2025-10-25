# Judge0 Integration Setup

This document explains how to set up and use the Judge0 integration for code execution in the DEVLAB platform.

## Overview

The Judge0 integration replaces the previous CodeSandbox implementation with a more robust code execution service that supports multiple programming languages and provides better test case execution capabilities.

## Features

- **Multi-language Support**: Supports 60+ programming languages including JavaScript, Python, Java, C++, C#, and more
- **Interactive Code Execution**: Learners can write and execute code directly in the browser
- **Test Case Execution**: Run test cases provided by Gemini before submission
- **Real-time Feedback**: Immediate feedback on code execution and test results
- **Fallback Mechanism**: Automatic fallback to mock setup if Judge0 is unavailable

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# Judge0 Configuration
REACT_APP_JUDGE0_URL=https://judge0-ce.p.rapidapi.com
REACT_APP_JUDGE0_API_KEY=your_judge0_api_key_here
```

### 2. Get Judge0 API Key

1. Visit [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Subscribe to the free plan
3. Copy your API key
4. Add it to your `.env` file

### 3. Start the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Usage

### For Learners

1. **Write Code**: Use the code editor to write your solution
2. **Run Code**: Click "Run Code" to execute your code with sample input
3. **Run Tests**: Click "Run Tests" to execute all test cases provided by Gemini
4. **View Results**: Check the console output and test results for feedback
5. **Submit**: When ready, click "Submit" to send your solution for final evaluation

### For Developers

The Judge0 integration consists of:

- `Judge0Service` (`frontend/src/services/judge0Service.js`): Handles API calls to Judge0
- `Judge0Container` (`frontend/src/components/Judge0Container.jsx`): React component for the code editor
- Updated `SimpleQuestionPage` to use the new container

## Supported Languages

The integration supports the following programming languages:

- JavaScript (Node.js)
- Python 3
- Java
- C++ (GCC 9.2.0)
- C (GCC 9.2.0)
- C# (Mono 6.6.0.161)
- PHP (7.4.1)
- Ruby (2.7.0)
- Go (1.13.5)
- Rust (1.40.0)
- Swift (5.2.3)
- Kotlin (1.3.70)
- Scala (2.13.1)
- TypeScript (3.7.4)
- And many more...

## API Endpoints

The Judge0 service uses the following endpoints:

- `POST /submissions` - Submit code for execution
- `GET /submissions/{token}` - Get execution results
- `GET /languages` - Get supported languages

## Error Handling

The integration includes comprehensive error handling:

- **Connection Errors**: Automatic fallback to mock setup
- **Execution Errors**: Clear error messages with details
- **Timeout Handling**: 30-second timeout for code execution
- **Rate Limiting**: Built-in rate limiting to prevent abuse

## Fallback Mechanism

If Judge0 is unavailable, the system automatically falls back to:

1. **Mock Setup**: Previous mock implementation for testing
2. **Code Editor**: Basic text editor for code writing
3. **Gemini Evaluation**: Final evaluation still handled by Gemini

## Security Considerations

- **API Key Protection**: Store API keys in environment variables
- **Input Validation**: All code inputs are validated before execution
- **Resource Limits**: CPU time and memory limits are enforced
- **Sandboxing**: Code runs in isolated Judge0 environment

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure backend server is running on port 3001
2. **API Key Invalid**: Check your Judge0 API key in the `.env` file
3. **Execution Timeout**: Large code or infinite loops may timeout
4. **Language Not Supported**: Some languages may have limited support

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

## Performance

- **Execution Time**: Typically 1-5 seconds for most code
- **Memory Usage**: Limited to 128MB per execution
- **Concurrent Requests**: Rate limited to prevent abuse
- **Caching**: Results are cached for better performance

## Future Enhancements

- **Custom Test Cases**: Allow instructors to add custom test cases
- **Code Templates**: Pre-built code templates for different languages
- **Advanced Debugging**: Step-by-step debugging capabilities
- **Performance Metrics**: Detailed execution statistics

