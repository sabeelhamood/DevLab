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
            result: getTestResultValue(testResult, 'result'),
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
        <div className="mt-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/40 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-lg">Test Results</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/60 rounded-lg">
                <span className="font-medium">
                  {testResults.filter(r => r.passed).length}/{testResults.length} passed
                </span>
              </div>
              {executionTime && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-white/60 rounded-lg">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{executionTime}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {testResults.map((result, index) => {
              const expectedValue = formatValue(result.expected)
              const actualValue = formatValue(result.result)
              const inputValue = formatValue(result.input)
              
              return (
                <div key={index} className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  result.passed 
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60 shadow-emerald-100/50' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60 shadow-red-100/50'
                }`}>
                  <div className="relative p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                          result.passed ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'
                        }`}></div>
                        <span className={`font-semibold text-sm ${
                          result.passed ? 'text-emerald-800' : 'text-red-800'
                        }`}>
                          Test {result.testNumber}: {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1 bg-white/70 rounded-lg shadow-sm">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="text-xs font-medium text-slate-600">
                          {result.time}s
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Input */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          <span className="font-medium text-slate-700 text-sm">Input</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-slate-200/60 shadow-sm">
                          <code className="text-xs text-slate-800 font-mono break-all">
                            {inputValue}
                          </code>
                        </div>
                      </div>
                      
                      {/* Expected */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="font-medium text-slate-700 text-sm">Expected</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-slate-200/60 shadow-sm">
                          <code className="text-xs text-slate-800 font-mono break-all">
                            {expectedValue}
                          </code>
                        </div>
                      </div>
                      
                      {/* Got */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            result.passed ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-slate-700 text-sm">Got</span>
                        </div>
                        <div className={`p-3 rounded-lg border shadow-sm ${
                          result.passed 
                            ? 'bg-emerald-50/80 border-emerald-200/60' 
                            : 'bg-red-50/80 border-red-200/60'
                        }`}>
                          <code className={`text-xs font-mono break-all ${
                            result.passed ? 'text-emerald-800' : 'text-red-800'
                          }`}>
                            {actualValue}
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    {result.stderr && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="font-medium text-red-700 text-sm">Error</span>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/60 shadow-sm">
                          <code className="text-xs text-red-800 font-mono break-all">
                            {result.stderr}
                          </code>
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
        <div className="mt-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-center px-6 py-4 border-b border-slate-200/40 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg ml-3">Console Output</span>
          </div>
          <div className="p-6 text-slate-800 font-mono text-sm max-h-60 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50 rounded-b-2xl">
            {consoleOutput.map((output, index) => (
              <div key={index} className="mb-1 leading-relaxed">
                {output}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Execution Section */}
      {testCases && testCases.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/40 bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
                <TestTube className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-lg">Test Execution</span>
              <div className="px-3 py-1 bg-white/60 rounded-lg">
                <span className="text-sm font-medium text-slate-600">
                  {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={runTestCases}
              disabled={isRunningTests}
              className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
            <div className="p-6 space-y-4">
              {testResults.map((result, index) => {
                const expectedValue = formatValue(result.expected)
                const actualValue = formatValue(result.result)
                
                return (
                  <div key={index} className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    result.passed 
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60 shadow-emerald-100/50' 
                      : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60 shadow-red-100/50'
                  }`}>
                    <div className="relative p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {result.passed ? (
                            <div className="p-1 bg-emerald-500 rounded-lg shadow-sm">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="p-1 bg-red-500 rounded-lg shadow-sm">
                              <XCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span className={`font-semibold text-sm ${
                            result.passed ? 'text-emerald-800' : 'text-red-800'
                          }`}>
                            Test Case {result.testNumber}: {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1 bg-white/70 rounded-lg shadow-sm">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className="text-xs font-medium text-slate-600">
                            {result.time}s
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              result.passed ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium text-slate-700 text-sm">Your Output</span>
                          </div>
                          <div className={`p-3 rounded-lg border shadow-sm ${
                            result.passed 
                              ? 'bg-emerald-50/80 border-emerald-200/60' 
                              : 'bg-red-50/80 border-red-200/60'
                          }`}>
                            <code className={`text-xs font-mono break-all ${
                              result.passed ? 'text-emerald-800' : 'text-red-800'
                            }`}>
                              {actualValue}
                            </code>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="font-medium text-slate-700 text-sm">Expected</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white/80 border border-slate-200/60 shadow-sm">
                            <code className="text-xs text-slate-800 font-mono break-all">
                              {expectedValue}
                            </code>
                          </div>
                        </div>
                      </div>
                      
                      {result.stderr && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="font-medium text-red-700 text-sm">Error</span>
                          </div>
                          <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/60 shadow-sm">
                            <code className="text-xs text-red-800 font-mono break-all">
                              {result.stderr}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Test Summary */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200/40 rounded-b-2xl">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center space-x-3 px-4 py-2 bg-emerald-100/80 rounded-lg">
                    <div className="p-1 bg-emerald-500 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-emerald-800">
                      {testResults.filter(r => r.passed).length} Passed
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-red-100/80 rounded-lg">
                    <div className="p-1 bg-red-500 rounded-lg">
                      <XCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-red-800">
                      {testResults.filter(r => !r.passed).length} Failed
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-white/80 rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-slate-600">
                      {testResults.filter(r => r.passed).length}/{testResults.length} tests passed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {executionError && (
        <div className="mt-6 p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-900 mb-2">Execution Error</h4>
              <p className="text-sm text-red-800 leading-relaxed">
                {executionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      {!judge0Available && (
        <div className="mt-6 p-5 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200/60 shadow-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-yellow-900 mb-2">Judge0 Unavailable</h4>
              <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                Code execution is running in mock mode. Test results are simulated for demonstration purposes.
              </p>
              <button
                onClick={checkJudge0Availability}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Retry Connection
              </button>
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