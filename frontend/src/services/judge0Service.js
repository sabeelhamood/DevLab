/**
 * Judge0 Service for Code Execution
 * Handles code execution requests through backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://devlab-backend-production.up.railway.app/api' : 'http://localhost:3000/api')

// Language mapping for Judge0
const LANGUAGE_MAPPING = {
  'javascript': 63, // Node.js
  'python': 71,    // Python 3
  'java': 62,       // Java
  'cpp': 54,        // C++ (GCC 9.2.0)
  'c': 50,          // C (GCC 9.2.0)
  'csharp': 51,     // C# (Mono 6.6.0.161)
  'php': 68,        // PHP (7.4.1)
  'ruby': 72,       // Ruby (2.7.0)
  'go': 60,         // Go (1.13.5)
  'rust': 73,       // Rust (1.40.0)
  'swift': 83,      // Swift (5.2.3)
  'kotlin': 78,     // Kotlin (1.3.70)
  'scala': 81,      // Scala (2.13.1)
  'r': 80,          // R (4.0.0)
  'typescript': 74, // TypeScript (3.7.4)
  'dart': 69,       // Dart (2.7.0)
  'lua': 64,        // Lua (5.3.5)
  'perl': 85,       // Perl (5.28.1)
  'haskell': 61,    // Haskell (GHC 8.8.1)
  'clojure': 86,    // Clojure (1.10.1)
  'erlang': 88,     // Erlang (OTP 22.2)
  'elixir': 57,     // Elixir (1.9.4)
  'ocaml': 79,      // OCaml (4.09.0)
  'fsharp': 87,     // F# (.NET Core SDK 3.1.201)
  'cobol': 77,      // COBOL (GnuCOBOL 3.1.2)
  'fortran': 58,    // Fortran (GFortran 9.2.0)
  'pascal': 67,     // Pascal (FPC 3.0.4)
  'assembly': 45,   // Assembly (NASM 2.14.02)
  'bash': 46,       // Bash (5.0.0)
  'powershell': 70, // PowerShell (6.2.3)
  'sql': 82,        // SQL (SQLite 3.27.2)
  'vbnet': 84,      // Visual Basic.Net (vbnc 0.0.0.5943)
  'tcl': 75,        // Tcl (8.6)
  'whitespace': 89, // Whitespace
  'plaintext': 43   // Plain Text
}

// Judge0 status codes
const STATUS_CODES = {
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
}

class Judge0Service {
  constructor() {
    // Judge0 service communicates through backend API
    this.baseURL = null // Not used directly in frontend
    this.apiKey = null // Not used directly in frontend
    this.isAvailable = true
  }

  /**
   * Get language ID for Judge0
   */
  getLanguageId(language) {
    const normalizedLang = language.toLowerCase()
    return LANGUAGE_MAPPING[normalizedLang] || LANGUAGE_MAPPING['javascript']
  }

  /**
   * Execute code through backend API
   */
  async executeCode(code, language, stdin = '', expectedOutput = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/judge0/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceCode: code,
          language: language,
          input: stdin,
          expectedOutput: expectedOutput
        })
      })

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result.result
    } catch (error) {
      console.error('Code execution error:', error)
      this.isAvailable = false
      throw error
    }
  }

  /**
   * Run test cases through backend API
   */
  async runTestCases(code, language, testCases) {
    if (!testCases || testCases.length === 0) {
      return []
    }

    try {
      const response = await fetch(`${API_BASE_URL}/judge0/test-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceCode: code,
          language: language,
          testCases: testCases
        })
      })

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result.results || []
    } catch (error) {
      console.error('Test execution error:', error)
      this.isAvailable = false
      throw error
    }
  }


  /**
   * Check if Judge0 is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${API_BASE_URL}/judge0/health`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const result = await response.json()
        this.isAvailable = result.available
        return this.isAvailable
      } else {
        this.isAvailable = false
        return false
      }
    } catch (error) {
      console.error('Judge0 availability check failed:', error)
      this.isAvailable = false
      return false
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await fetch(`${API_BASE_URL}/judge0/languages`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`)
      }
      
      const result = await response.json()
      return result.languages || []
    } catch (error) {
      console.error('Failed to fetch supported languages:', error)
      return []
    }
  }
}

// Create singleton instance
const judge0Service = new Judge0Service()

export default judge0Service
