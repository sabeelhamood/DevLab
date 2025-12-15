import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Code,
  Terminal,
  Zap,
  Loader,
  PlayCircle,
  TestTube,
  FileCode,
  Clock
} from 'lucide-react'
import { judge0API } from '../services/api/judge0.js'

const CodeSandboxContainer = ({ 
  question, 
  userCode, 
  onCodeChange, 
  onRunCode,
  testCases = [],
  language = 'javascript',
  isRunning = false,
  runResults = null,
  onReset
}) => {
  const [consoleOutput, setConsoleOutput] = useState([])
  const [testResults, setTestResults] = useState([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [showTestResults, setShowTestResults] = useState(false)
  const [judge0Available, setJudge0Available] = useState(true)
  const [supportedLanguages, setSupportedLanguages] = useState({})
  const [executionTime, setExecutionTime] = useState('')

  // Check Judge0 availability on component mount
  useEffect(() => {
    checkJudge0Availability()
  }, [])

  const checkJudge0Availability = async () => {
    try {
      const health = await judge0API.checkHealth()
      setJudge0Available(health.available)
      
      if (health.available) {
        const languages = await judge0API.getSupportedLanguages()
        setSupportedLanguages(languages.languages || {})
      }
    } catch (error) {
      console.warn('Judge0 not available, using fallback:', error)
      setJudge0Available(false)
    }
  }

  // Get the appropriate language mapping for Judge0
  const getJudge0Language = (lang) => {
    const languageMap = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'php': 'php',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'typescript': 'typescript',
      'dart': 'dart',
      'haskell': 'haskell',
      'lua': 'lua',
      'perl': 'perl',
      'clojure': 'clojure',
      'elixir': 'elixir',
      'erlang': 'erlang',
      'fsharp': 'fsharp',
      'julia': 'julia',
      'ocaml': 'ocaml',
      'pascal': 'pascal',
      'prolog': 'prolog',
      'scheme': 'scheme',
      'smalltalk': 'smalltalk',
      'vbnet': 'vbnet',
      'tcl': 'tcl',
      'brainfuck': 'brainfuck',
      'fortran': 'fortran',
      'assembly': 'assembly',
      'bash': 'bash',
      'basic': 'basic',
      'cobol': 'cobol',
      'lisp': 'lisp',
      'nim': 'nim',
      'octave': 'octave',
      'sql': 'sql',
      'zig': 'zig'
    }
    return languageMap[lang] || 'javascript'
  }

  // Reset the sandbox
  const handleReset = () => {
    setConsoleOutput([])
    setTestResults([])
    setExecutionError(null)
    setShowTestResults(false)
    setExecutionTime('')
    if (onReset) onReset()
  }

  // Run test cases using Judge0
  const runTestCases = async () => {
    if (!testCases || testCases.length === 0) {
      setConsoleOutput(['No test cases available to run.'])
      return
    }

    setIsRunningTests(true)
    setTestResults([])
    setConsoleOutput(['🧪 Running test cases...'])
    setShowTestResults(true)
    setExecutionError(null)

    const startTime = Date.now()

    try {
      const judge0Language = getJudge0Language(language)
      
      // Execute test cases with fallback
      const result = await judge0API.executeTestCasesWithFallback(
        userCode,
        judge0Language,
        testCases
      )

      const endTime = Date.now()
      setExecutionTime(`${(endTime - startTime) / 1000}s`)

      if (result.success) {
        setTestResults(result.results)
        
        // Update console output with results
        const output = []
        result.results.forEach((testResult, index) => {
          const status = testResult.passed ? '✅ PASSED' : '❌ FAILED'
          output.push(`Test ${testResult.testNumber}: ${status}`)
          output.push(`  Input: ${JSON.stringify(testResult.input)}`)
          output.push(`  Expected: ${JSON.stringify(testResult.expected)}`)
          output.push(`  Got: ${JSON.stringify(testResult.result)}`)
          if (testResult.stderr) {
            output.push(`  Error: ${testResult.stderr}`)
          }
          output.push('---')
        })
        
        output.push('')
        output.push(`📊 Test Results: ${result.passedTests}/${result.totalTests} tests passed`)
        output.push(`⏱️ Execution Time: ${executionTime}`)
        
        setConsoleOutput(output)
      } else {
        throw new Error(result.error || 'Test execution failed')
      }
    } catch (error) {
      console.error('Test execution error:', error)
      setExecutionError(error.message)
      setConsoleOutput(prev => [
        ...prev,
        `❌ Error running tests: ${error.message}`
      ])
    } finally {
      setIsRunningTests(false)
    }
  }

  // Execute single code snippet
  const executeCode = async () => {
    if (!userCode.trim()) {
      setConsoleOutput(['Please write some code first.'])
      return
    }

    setIsExecuting(true)
    setConsoleOutput(['🚀 Executing code...'])
    setExecutionError(null)

    const startTime = Date.now()

    try {
      const judge0Language = getJudge0Language(language)
      const result = await judge0API.executeCode(userCode, judge0Language)

      const endTime = Date.now()
      setExecutionTime(`${(endTime - startTime) / 1000}s`)

      if (result.success) {
        const output = []
        if (result.result.stdout) {
          output.push('📤 Output:')
          output.push(result.result.stdout)
        }
        if (result.result.stderr) {
          output.push('⚠️ Errors:')
          output.push(result.result.stderr)
        }
        if (result.result.compile_output) {
          output.push('🔨 Compilation:')
          output.push(result.result.compile_output)
        }
        output.push(`⏱️ Execution Time: ${executionTime}`)
        output.push(`📊 Status: ${result.result.status}`)
        
        setConsoleOutput(output)
      } else {
        throw new Error(result.error || 'Code execution failed')
      }
    } catch (error) {
      console.error('Code execution error:', error)
      setExecutionError(error.message)
      setConsoleOutput(prev => [
        ...prev,
        `❌ Error executing code: ${error.message}`
      ])
    } finally {
      setIsExecuting(false)
    }
  }

  // Get initial code template based on language
  const getInitialCode = () => {
    switch (language) {
      case 'javascript':
        return `function calculateFinalOrderPrice(unitPrice, quantity, discountPercentage, taxRate) {
  // Your code here
  return 0;
}`
      case 'python':
        return `def calculate_final_order_price(unit_price, quantity, discount_percentage, tax_rate):
    # Your code here
    return 0`
      case 'java':
        return `public class Solution {
    public static int calculateFinalOrderPrice(int unitPrice, int quantity, int discountPercentage, int taxRate) {
        // Your code here
        return 0;
    }
}`
      case 'cpp':
        return `#include <iostream>
using namespace std;

int calculateFinalOrderPrice(int unitPrice, int quantity, int discountPercentage, int taxRate) {
    // Your code here
    return 0;
}`
      case 'c':
        return `#include <stdio.h>

int calculateFinalOrderPrice(int unitPrice, int quantity, int discountPercentage, int taxRate) {
    // Your code here
    return 0;
}`
      default:
        return `function main() {
  // Your code here
  return 0;
}`
    }
  }

  return (
    <div className="w-full">
      {/* Clean Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileCode className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Code Execution Environment
            </h3>
            <p className="text-sm text-gray-600">
              {judge0Available ? 'Powered by Judge0' : 'Mock Mode'} • {language.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Execute Code Button */}
          <button
            onClick={executeCode}
            disabled={isExecuting || !userCode.trim()}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            {isExecuting ? 'Executing...' : 'Run Code'}
          </button>

          {/* Run Tests Button */}
          {testCases && testCases.length > 0 && (
            <button
              onClick={runTestCases}
              disabled={isRunningTests}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunningTests ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              {isRunningTests ? 'Running Tests...' : 'Run Tests'}
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <span className="text-gray-600 text-sm font-medium ml-3">
              {language.toUpperCase()} Editor
            </span>
          </div>
          <div className="text-gray-500 text-xs">
            {userCode.split('\n').length} lines
          </div>
        </div>
        <textarea
          value={userCode}
          onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
          className="w-full h-96 p-4 font-mono text-sm border-0 focus:ring-0 resize-none focus:outline-none"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
          placeholder={`// Write your ${language} code here...\n// Use proper syntax and formatting\n// Test your solution with the provided test cases`}
        />
      </div>

      {/* Test Results Section */}
      {showTestResults && testResults.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-semibold text-gray-900">Test Results</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                {testResults.filter(r => r.passed).length}/{testResults.length} passed
              </span>
              {executionTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{executionTime}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                result.passed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${
                      result.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`font-semibold ${
                      result.passed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Test {result.testNumber}: {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.time}s
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Input:</span>
                    <div className="mt-1 p-2 rounded bg-gray-100 font-mono text-xs">
                      {JSON.stringify(result.input)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Expected:</span>
                    <div className="mt-1 p-2 rounded bg-gray-100 font-mono text-xs">
                      {JSON.stringify(result.expected)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Got:</span>
                    <div className="mt-1 p-2 rounded bg-gray-100 font-mono text-xs">
                      {JSON.stringify(result.result)}
                    </div>
                  </div>

                  {result.stderr && (
                    <div>
                      <span className="font-medium text-red-700">Error:</span>
                      <div className="mt-1 p-2 rounded bg-red-100 font-mono text-xs text-red-800">
                        {result.stderr}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console Output */}
      {consoleOutput.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="p-1 bg-blue-100 rounded-lg">
              <Terminal className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-900 ml-2">Console Output</span>
          </div>
          <div className="p-4 text-gray-800 font-mono text-xs bg-gray-50">
            {consoleOutput.map((output, index) => (
              <div key={index} className="mb-1">
                {output}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases Display */}
      {testCases && testCases.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Test Cases</span>
            </div>
            <div className="text-sm text-gray-500">
              {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Input:
                  </label>
                  <div className="bg-gray-100 border border-gray-300 rounded p-3 font-mono text-sm">
                    <div className="space-y-1">
                      {typeof testCase.input === 'object' ? (
                        Object.entries(testCase.input).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <span className="text-gray-600">{key} =</span>
                            <span className="text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-900">{testCase.input}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Expected Output:
                  </label>
                  <div className="bg-gray-100 border border-gray-300 rounded p-3 font-mono text-sm">
                    <div className="text-gray-900">
                      {typeof testCase.expected_output === 'object' 
                        ? JSON.stringify(testCase.expected_output) 
                        : testCase.expected_output}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Test Case {index + 1} - Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {executionError && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Execution Error</h4>
              <p className="mt-1 text-sm text-red-800">
                {executionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      {!judge0Available && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Judge0 Unavailable</h4>
              <p className="mt-1 text-sm text-yellow-800">
                Code execution is running in mock mode. Test results are simulated for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">How to use:</h4>
            <ul className="mt-1 text-sm text-blue-800 space-y-1">
              <li>• Write your code in the editor above</li>
              <li>• Click "Run Code" to execute your code</li>
              <li>• Click "Run Tests" to test against all test cases</li>
              <li>• Check the console output and test results</li>
              <li>• When ready, click "Submit" to send your solution for evaluation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeSandboxContainer