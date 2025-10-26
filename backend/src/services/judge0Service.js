// backend/src/services/judge0Service.js
import fetch from 'node-fetch';

/**
 * Judge0 Service for code execution
 * Supports multiple programming languages with test case execution
 */
export class Judge0Service {
  constructor() {
    // Use RapidAPI Judge0 endpoint
    this.baseUrl = 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = 'd8541ebf75mshdc29c5b8bb9bfbep1a7b1cjsna3a55d787653';
    this.isAvailable = true;
    this.supportedLanguages = {
      'javascript': 63,    // Node.js
      'python': 71,        // Python 3
      'java': 62,          // Java
      'cpp': 54,           // C++ (GCC 9.2.0)
      'c': 50,             // C (GCC 9.2.0)
      'csharp': 51,        // C# (Mono 6.6.0)
      'php': 68,           // PHP 7.4.1
      'ruby': 72,          // Ruby 2.7.0
      'go': 60,            // Go 1.13.5
      'rust': 73,          // Rust 1.40.0
      'swift': 83,         // Swift 5.2.3
      'kotlin': 78,        // Kotlin 1.3.70
      'scala': 81,         // Scala 2.13.1
      'r': 80,             // R 4.0.0
      'typescript': 74,    // TypeScript 3.7.4
      'dart': 69,          // Dart 2.7.2
      'haskell': 61,       // Haskell 8.8.1
      'lua': 64,           // Lua 5.3.4
      'perl': 67,          // Perl 5.28.1
      'clojure': 86,       // Clojure 1.10.1
      'elixir': 57,        // Elixir 1.9.4
      'erlang': 58,        // Erlang 22.2
      'fsharp': 59,        // F# 4.7
      'julia': 65,         // Julia 1.0.5
      'ocaml': 66,         // OCaml 4.09.0
      'pascal': 70,        // Pascal (FPC 3.0.4)
      'prolog': 75,        // Prolog (GNU Prolog 1.4.5)
      'scheme': 79,        // Scheme (Gauche 0.9.9)
      'smalltalk': 82,     // Smalltalk (Pharo 7.0)
      'vbnet': 84,         // VB.NET (Mono 6.6.0)
      'whitespace': 85,    // Whitespace
      'tcl': 77,           // Tcl 8.6
      'brainfuck': 46,     // Brainfuck
      'fortran': 55,       // Fortran (GFortran 9.2.0)
      'assembly': 45,      // Assembly (NASM 2.14.02)
      'bash': 46,          // Bash 5.0.0
      'basic': 47,         // Basic (FBC 1.07.1)
      'cobol': 49,         // COBOL (GnuCOBOL 2.2)
      'lisp': 64,          // Lisp (SBCL 2.0.0)
      'nim': 78,           // Nim 1.0.6
      'octave': 66,        // Octave 5.1.0
      'sql': 82,           // SQL (SQLite 3.27.2)
      'zig': 87            // Zig 0.6.0
    };
  }

  /**
   * Check if Judge0 service is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });
      
      if (response.ok) {
        this.isAvailable = true;
        return true;
      } else {
        this.isAvailable = false;
        return false;
      }
    } catch (error) {
      console.error('Judge0 availability check failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Get language ID for a given language name
   */
  getLanguageId(language) {
    const langId = this.supportedLanguages[language.toLowerCase()];
    if (!langId) {
      throw new Error(`Unsupported language: ${language}`);
    }
    return langId;
  }

  /**
   * Execute code with Judge0
   */
  async executeCode(sourceCode, language, input = '', expectedOutput = null) {
    if (!this.isAvailable) {
      throw new Error('Judge0 service is not available');
    }

    try {
      const languageId = this.getLanguageId(language);
      
      // Wrap the code to capture function output for JavaScript
      let wrappedCode = sourceCode;
      if (language.toLowerCase() === 'javascript') {
        // Extract function name from the code (simple regex)
        const functionMatch = sourceCode.match(/function\s+(\w+)\s*\(/);
        if (functionMatch) {
          const functionName = functionMatch[1];
          // Parse input as JSON if it's a string representation of an array/object
          let parsedInput = input;
          try {
            parsedInput = JSON.parse(input);
          } catch (e) {
            // If not JSON, use as string
            parsedInput = input;
          }
          
          // Create a wrapper that calls the function and prints the result
          if (Array.isArray(parsedInput)) {
            wrappedCode = `${sourceCode}\n\n// Test execution\nconst result = ${functionName}(${parsedInput.map(arg => JSON.stringify(arg)).join(', ')});\nconsole.log(result);`;
          } else {
            wrappedCode = `${sourceCode}\n\n// Test execution\nconst result = ${functionName}(${JSON.stringify(parsedInput)});\nconsole.log(result);`;
          }
        }
      }
      
      // Create submission
      const submissionData = {
        source_code: wrappedCode,
        language_id: languageId,
        stdin: '',
        expected_output: expectedOutput,
        cpu_time_limit: '2.0',
        memory_limit: '128000',
        wall_time_limit: '5.0'
      };

      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`Judge0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const token = result.token;

      // Poll for result
      return await this.pollSubmission(token, expectedOutput);
    } catch (error) {
      console.error('Judge0 execution error:', error);
      throw error;
    }
  }

  /**
   * Poll submission result
   */
  async pollSubmission(token, expectedOutput = null, maxAttempts = 30, delay = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/submissions/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        });

        if (!response.ok) {
          throw new Error(`Judge0 polling error: ${response.status}`);
        }

        const result = await response.json();
        
        // Check if processing is complete
        if (result.status && result.status.id !== 1 && result.status.id !== 2) {
          return this.formatResult(result, expectedOutput);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('Polling error:', error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Submission timeout - result not available');
  }

  /**
   * Format Judge0 result for our application
   */
  formatResult(result, expectedOutput = null) {
    const statusMap = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error (SIGSEGV)',
      8: 'Runtime Error (SIGFPE)',
      9: 'Runtime Error (SIGABRT)',
      10: 'Runtime Error (NZEC)',
      11: 'Runtime Error (Other)',
      12: 'Internal Error',
      13: 'Exec Format Error'
    };

    const actualOutput = result.stdout || '';
    const trimmedOutput = actualOutput.trim();
    
    console.log('🔍 Judge0: Formatting result:', {
      statusId: result.status?.id,
      actualOutput: trimmedOutput,
      expectedOutput: expectedOutput,
      actualType: typeof trimmedOutput,
      expectedType: typeof expectedOutput
    });
    
    // Determine if test passed based on output comparison
    let passed = false;
    if (result.status?.id === 3 && expectedOutput !== null) {
      // Code executed successfully, now compare outputs
      const expectedStr = String(expectedOutput).trim();
      passed = trimmedOutput === expectedStr;
      console.log('🔍 Judge0: Output comparison:', {
        actual: `"${trimmedOutput}"`,
        expected: `"${expectedStr}"`,
        passed: passed
      });
    } else if (result.status?.id === 3 && expectedOutput === null) {
      // No expected output to compare, just check if code ran successfully
      passed = true;
      console.log('🔍 Judge0: No expected output, marking as passed');
    } else {
      // Code failed to execute or had errors
      passed = false;
      console.log('🔍 Judge0: Code execution failed, marking as failed');
    }

    return {
      status: statusMap[result.status?.id] || 'Unknown',
      statusId: result.status?.id,
      stdout: actualOutput,
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      time: result.time || '0.000',
      memory: result.memory || 0,
      passed: passed,
      error: result.status?.id > 3,
      expectedOutput: expectedOutput,
      actualOutput: trimmedOutput
    };
  }

  /**
   * Execute multiple test cases
   */
  async executeTestCases(sourceCode, language, testCases) {
    if (!this.isAvailable) {
      throw new Error('Judge0 service is not available');
    }

    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      try {
        const input = typeof testCase.input === 'object' 
          ? JSON.stringify(testCase.input) 
          : testCase.input;
        const expectedOutput = typeof testCase.expected_output === 'object'
          ? JSON.stringify(testCase.expected_output)
          : testCase.expected_output;

        const result = await this.executeCode(sourceCode, language, input, expectedOutput);
        
        results.push({
          testNumber: i + 1,
          input: testCase.input,
          expected: testCase.expected_output,
          result: result.stdout.trim(),
          passed: result.passed,
          status: result.status,
          error: result.error,
          stderr: result.stderr,
          time: result.time
        });
      } catch (error) {
        results.push({
          testNumber: i + 1,
          input: testCase.input,
          expected: testCase.expected_output,
          result: error.message,
          passed: false,
          status: 'Error',
          error: true,
          stderr: error.message,
          time: '0.000'
        });
      }
    }

    return results;
  }

  /**
   * Batch execute multiple submissions (more efficient for multiple test cases)
   */
  async batchExecute(sourceCode, language, testCases) {
    if (!this.isAvailable) {
      throw new Error('Judge0 service is not available');
    }

    try {
      const languageId = this.getLanguageId(language);
      
      console.log('🔧 Judge0: Starting batch execution');
      console.log('📝 Judge0: Source code:', sourceCode);
      console.log('🌐 Judge0: Language:', language, '(ID:', languageId, ')');
      console.log('🧪 Judge0: Test cases:', testCases);
      
      // Prepare batch submissions
      const submissions = testCases.map((testCase, index) => {
        const input = typeof testCase.input === 'object' 
          ? JSON.stringify(testCase.input) 
          : testCase.input;
        const expectedOutput = typeof testCase.expected_output === 'object'
          ? JSON.stringify(testCase.expected_output)
          : testCase.expected_output;

        console.log(`📋 Judge0: Test case ${index + 1}:`, {
          input,
          expectedOutput,
          inputType: typeof testCase.input,
          expectedType: typeof testCase.expected_output
        });

        return {
          source_code: sourceCode,
          language_id: languageId,
          stdin: input,
          expected_output: expectedOutput,
          cpu_time_limit: '2.0',
          memory_limit: '128000',
          wall_time_limit: '5.0'
        };
      });

      console.log('📤 Judge0: Submitting batch:', submissions);

      // Submit batch
      const response = await fetch(`${this.baseUrl}/submissions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({ submissions })
      });

      if (!response.ok) {
        throw new Error(`Judge0 batch API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📨 Judge0: Batch submission response:', result);

      const tokens = result.map(sub => sub.token);
      console.log('🎫 Judge0: Received tokens:', tokens);

      // Poll all submissions
      const results = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const testCase = testCases[i];
        
        console.log(`🔄 Judge0: Polling submission ${i + 1}/${tokens.length} (token: ${token})`);
        
        try {
          const executionResult = await this.pollSubmission(token, testCase.expected_output);
          console.log(`✅ Judge0: Submission ${i + 1} result:`, executionResult);
          
          results.push({
            testNumber: i + 1,
            input: testCase.input,
            expected: testCase.expected_output,
            result: executionResult.actualOutput,
            passed: executionResult.passed,
            status: executionResult.status,
            error: executionResult.error,
            stderr: executionResult.stderr,
            time: executionResult.time
          });
        } catch (error) {
          console.error(`❌ Judge0: Submission ${i + 1} failed:`, error);
          results.push({
            testNumber: i + 1,
            input: testCase.input,
            expected: testCase.expected_output,
            result: error.message,
            passed: false,
            status: 'Error',
            error: true,
            stderr: error.message,
            time: '0.000'
          });
        }
      }

      console.log('📊 Judge0: Final results:', results);
      return results;
    } catch (error) {
      console.error('Judge0 batch execution error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const judge0Service = new Judge0Service();
