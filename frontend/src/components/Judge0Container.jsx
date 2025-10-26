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
  Clock,
  Cpu,
  MemoryStick,
  Timer
} from 'lucide-react'
import { judge0API } from '../services/api/judge0.js'

const Judge0Container = ({ 
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
  const [executionStats, setExecutionStats] = useState({})

  // Check Judge0 availability on component mount
  useEffect(() => {
    checkJudge0Availability()
  }, [])

  const checkJudge0Availability = async () => {
    try {
      console.log('🔍 Checking Judge0 availability...')
      const connectivity = await judge0API.testConnectivity()
      
      console.log('📊 Judge0 connectivity result:', connectivity)
      
      if (connectivity.connected && connectivity.available) {
        setJudge0Available(true)
        setSupportedLanguages(connectivity.languages || {})
        console.log('✅ Judge0 is available and ready')
      } else {
        setJudge0Available(false)
        console.warn('⚠️ Judge0 not available, using fallback:', connectivity.error)
      }
    } catch (error) {
      console.error('❌ Judge0 availability check failed:', error)
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

  // Reset the execution environment
  const handleReset = () => {
    setConsoleOutput([])
    setTestResults([])
    setExecutionError(null)
    setShowTestResults(false)
    setExecutionTime('')
    setExecutionStats({})
    if (onReset) onReset()
  }

  // Helper function to safely format values for display
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'null'
    }
    
    if (typeof value === 'string') {
      // Trim whitespace and newlines
      const trimmed = value.trim()
      // If it's an empty string after trimming, show as empty
      if (trimmed === '') {
        return '""'
      }
      return JSON.stringify(trimmed)
    }
    
    if (typeof value === 'number') {
      return value.toString()
    }
    
    if (typeof value === 'boolean') {
      return value.toString()
    }
    
    if (Array.isArray(value)) {
      return JSON.stringify(value)
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  // Helper function to safely get test result values
  const getTestResultValue = (result, field) => {
    if (!result) return null
    
    // Handle different possible field names
    const possibleFields = {
      expected: ['expected', 'expectedOutput', 'expected_output'],
      actual: ['result', 'actual', 'actualOutput', 'actual_output', 'output'],
      input: ['input', 'testInput', 'test_input'],
      status: ['status', 'executionStatus'],
      passed: ['passed', 'isPassed', 'success'],
      error: ['stderr', 'error', 'errorMessage'],
      time: ['time', 'executionTime', 'execution_time']
    }
    
    const fieldNames = possibleFields[field] || [field]
    
    for (const fieldName of fieldNames) {
      if (result.hasOwnProperty(fieldName)) {
        return result[fieldName]
      }
    }
    
    return null
  }

  // Run test cases using Judge0
  const runTestCases = async () => {
    if (!testCases || testCases.length === 0) {
      setConsoleOutput(['No test cases available to run.'])
      return
    }

    // Clear previous results before running new tests
    setTestResults([])
    setConsoleOutput([])
    setExecutionError(null)
    setExecutionStats({})
    setExecutionTime('')

    setIsRunningTests(true)
    setConsoleOutput(['🧪 Running test cases with Judge0...'])
    setShowTestResults(true)

    const startTime = Date.now()

    try {
      const judge0Language = getJudge0Language(language)
      
      console.log('🚀 Executing test cases:', {
        language: judge0Language,
        testCasesCount: testCases.length,
        userCodeLength: userCode.length
      })
      
      // Execute test cases with fallback
      const result = await judge0API.executeTestCasesWithFallback(
        userCode,
        judge0Language,
        testCases
      )

      const endTime = Date.now()
      setExecutionTime(`${(endTime - startTime) / 1000}s`)

      console.log('📊 Test execution result:', result)

      if (result.success && result.results) {
        // Process and validate results
        const processedResults = result.results.map((testResult, index) => {
          const processed = {
            testNumber: testResult.testNumber || index + 1,
            input: getTestResultValue(testResult, 'input'),
            expected: getTestResultValue(testResult, 'expected'),
            result: getTestResultValue(testResult, 'actual'),
            passed: getTestResultValue(testResult, 'passed') || false,
            status: getTestResultValue(testResult, 'status') || 'Unknown',
            error: getTestResultValue(testResult, 'error') || false,
            stderr: getTestResultValue(testResult, 'error') || '',
            time: getTestResultValue(testResult, 'time') || '0.000'
          }
          
          console.log(`📋 Processed test ${processed.testNumber}:`, processed)
          return processed
        })
        
        setTestResults(processedResults)
        
        // Update console output with results
        const output = []
        processedResults.forEach((testResult) => {
          const status = testResult.passed ? '✅ PASSED' : '❌ FAILED'
          output.push(`Test ${testResult.testNumber}: ${status}`)
          output.push(`  Input: ${formatValue(testResult.input)}`)
          output.push(`  Expected: ${formatValue(testResult.expected)}`)
          output.push(`  Got: ${formatValue(testResult.result)}`)
          if (testResult.stderr) {
            output.push(`  Error: ${testResult.stderr}`)
          }
          output.push('---')
        })
        
        output.push('')
        output.push(`📊 Test Results: ${result.passedTests || processedResults.filter(r => r.passed).length}/${result.totalTests || processedResults.length} tests passed`)
        output.push(`⏱️ Execution Time: ${executionTime}`)
        
        setConsoleOutput(output)
        
        // Update execution stats
        const passedCount = processedResults.filter(r => r.passed).length
        const totalCount = processedResults.length
        setExecutionStats({
          totalTests: totalCount,
          passedTests: passedCount,
          failedTests: totalCount - passedCount,
          passRate: totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : '0.0'
        })
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
    setConsoleOutput(['🚀 Executing code with Judge0...'])
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
        
        // Update execution stats
        setExecutionStats({
          status: result.result.status,
          time: result.result.time,
          memory: result.result.memory,
          passed: result.result.passed
        })
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

  return (
    <div className="w-full">
      {/* Judge0 Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Judge0 Code Execution
            </h3>
            <p className="text-sm text-gray-600">
              {judge0Available ? 'Powered by Judge0 RapidAPI' : 'Mock Mode'} • {language.toUpperCase()}
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

          {/* Test Connectivity Button */}
          <button
            onClick={checkJudge0Availability}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Connection
          </button>

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

      {/* Execution Stats */}
      {Object.keys(executionStats).length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="p-1 bg-green-100 rounded-lg">
              <Timer className="h-4 w-4 text-green-600" />
            </div>
            <span className="font-semibold text-gray-900 ml-2">Execution Statistics</span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {executionStats.totalTests && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{executionStats.totalTests}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{executionStats.passedTests}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{executionStats.failedTests}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{executionStats.passRate}%</div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
              </>
            )}
            {executionStats.status && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{executionStats.status}</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{executionStats.time}s</div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{executionStats.memory}KB</div>
                  <div className="text-sm text-gray-600">Memory</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{executionStats.passed ? 'PASS' : 'FAIL'}</div>
                  <div className="text-sm text-gray-600">Result</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            {testResults.map((result, index) => {
              const expectedValue = formatValue(result.expected)
              const actualValue = formatValue(result.result)
              const inputValue = formatValue(result.input)
              
              return (
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
                        {inputValue}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Expected:</span>
                      <div className="mt-1 p-2 rounded bg-gray-100 font-mono text-xs">
                        {expectedValue}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Got:</span>
                      <div className={`mt-1 p-2 rounded font-mono text-xs ${
                        result.passed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {actualValue}
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
              )
            })}
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
          <div className="p-4 text-gray-800 font-mono text-xs max-h-60 overflow-y-auto bg-gray-50">
            {consoleOutput.map((output, index) => (
              <div key={index} className="mb-1">
                {output}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Execution Section */}
      {testCases && testCases.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Test Execution</span>
              <span className="text-sm text-gray-500">
                ({testCases.length} test case{testCases.length !== 1 ? 's' : ''})
              </span>
            </div>
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
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {/* Test Results Display */}
          {testResults.length > 0 && (
            <div className="p-4 space-y-4">
              {testResults.map((result, index) => {
                const expectedValue = formatValue(result.expected)
                const actualValue = formatValue(result.result)
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          result.passed ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Test Case {result.testNumber}: {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.time}s
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Your Output:</span>
                        <div className={`mt-1 p-2 rounded font-mono text-xs ${
                          result.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {actualValue}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Expected:</span>
                        <div className="mt-1 p-2 rounded bg-gray-100 font-mono text-xs">
                          {expectedValue}
                        </div>
                      </div>
                    </div>

                    {result.stderr && (
                      <div className="mt-3">
                        <span className="font-medium text-red-700">Error:</span>
                        <div className="mt-1 p-2 rounded bg-red-100 font-mono text-xs text-red-800">
                          {result.stderr}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Test Summary */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      {testResults.filter(r => r.passed).length} Passed
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      {testResults.filter(r => !r.passed).length} Failed
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {testResults.filter(r => r.passed).length}/{testResults.length} tests passed
                  </div>
                </div>
              </div>
            </div>
          )}
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
              <div className="mt-2">
                <button
                  onClick={checkJudge0Availability}
                  className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">How to use Judge0:</h4>
            <ul className="mt-1 text-sm text-blue-800 space-y-1">
              <li>• Write your code in the editor above</li>
              <li>• Click "Run Code" to execute your code with Judge0</li>
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

export default Judge0Container