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
   * Get language ID for Judge0 API
   */
  getLanguageId(language) {
    const languageId = this.supportedLanguages[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }
    return languageId;
  }

  /**
   * Universal code wrapping function for all programming languages
   */
  wrapCodeForLanguage(sourceCode, language, testInput) {
    console.log('🔧 Judge0: Wrapping code for language:', language);
    console.log('📝 Judge0: Original code:', sourceCode);
    console.log('📥 Judge0: Test input:', testInput);
    
    const lang = language.toLowerCase();
    
    // Parse input safely
    const parsedInput = this.parseInputSafely(testInput);
    console.log('📥 Judge0: Parsed input:', parsedInput, 'Type:', typeof parsedInput);
    
    // Language-specific wrapping patterns
    const languagePatterns = {
      // Scripting languages - direct function calls
      'javascript': () => this.wrapJavaScriptCode(sourceCode, testInput),
      'typescript': () => this.wrapJavaScriptCode(sourceCode, testInput),
      'python': () => this.wrapPythonCode(sourceCode, parsedInput),
      'ruby': () => this.wrapRubyCode(sourceCode, parsedInput),
      'php': () => this.wrapPHPCode(sourceCode, parsedInput),
      'perl': () => this.wrapPerlCode(sourceCode, parsedInput),
      'lua': () => this.wrapLuaCode(sourceCode, parsedInput),
      'r': () => this.wrapRCode(sourceCode, parsedInput),
      'julia': () => this.wrapJuliaCode(sourceCode, parsedInput),
      
      // Compiled languages - main function wrapper
      'java': () => this.wrapJavaCode(sourceCode, parsedInput),
      'cpp': () => this.wrapCppCode(sourceCode, parsedInput),
      'c': () => this.wrapCCode(sourceCode, parsedInput),
      'csharp': () => this.wrapCSharpCode(sourceCode, parsedInput),
      'go': () => this.wrapGoCode(sourceCode, parsedInput),
      'rust': () => this.wrapRustCode(sourceCode, parsedInput),
      'swift': () => this.wrapSwiftCode(sourceCode, parsedInput),
      'kotlin': () => this.wrapKotlinCode(sourceCode, parsedInput),
      'scala': () => this.wrapScalaCode(sourceCode, parsedInput),
      'dart': () => this.wrapDartCode(sourceCode, parsedInput),
      'haskell': () => this.wrapHaskellCode(sourceCode, parsedInput),
      'ocaml': () => this.wrapOCamlCode(sourceCode, parsedInput),
      'fsharp': () => this.wrapFSharpCode(sourceCode, parsedInput),
      'pascal': () => this.wrapPascalCode(sourceCode, parsedInput),
      'fortran': () => this.wrapFortranCode(sourceCode, parsedInput),
      'zig': () => this.wrapZigCode(sourceCode, parsedInput),
      'nim': () => this.wrapNimCode(sourceCode, parsedInput),
      
      // Functional languages
      'clojure': () => this.wrapClojureCode(sourceCode, parsedInput),
      'elixir': () => this.wrapElixirCode(sourceCode, parsedInput),
      'erlang': () => this.wrapErlangCode(sourceCode, parsedInput),
      'scheme': () => this.wrapSchemeCode(sourceCode, parsedInput),
      'lisp': () => this.wrapLispCode(sourceCode, parsedInput),
      
      // Other languages
      'bash': () => this.wrapBashCode(sourceCode, parsedInput),
      'sql': () => this.wrapSQLCode(sourceCode, parsedInput),
      'prolog': () => this.wrapPrologCode(sourceCode, parsedInput),
      'smalltalk': () => this.wrapSmalltalkCode(sourceCode, parsedInput),
      'vbnet': () => this.wrapVBNetCode(sourceCode, parsedInput),
      'basic': () => this.wrapBasicCode(sourceCode, parsedInput),
      'cobol': () => this.wrapCobolCode(sourceCode, parsedInput),
      'octave': () => this.wrapOctaveCode(sourceCode, parsedInput),
      'tcl': () => this.wrapTclCode(sourceCode, parsedInput)
    };
    
    const wrapper = languagePatterns[lang];
    if (wrapper) {
      return wrapper();
    } else {
      console.log('⚠️ Judge0: No wrapper found for language:', language, '- executing as-is');
      return sourceCode;
    }
  }

  /**
   * Wrap Python code to execute and capture output
   */
  wrapPythonCode(sourceCode, parsedInput) {
    console.log('🐍 Judge0: Wrapping Python code');
    
    // Try to detect function patterns
    const functionPatterns = [
      /^def\s+(\w+)\s*\([^)]*\)\s*:/m,
      /^async\s+def\s+(\w+)\s*\([^)]*\)\s*:/m,
      /^class\s+(\w+).*:\s*$/m
    ];
    
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) {
        functionName = match[1];
        console.log('✅ Judge0: Found Python function/class:', functionName);
        break;
      }
    }
    
    if (!functionName) {
      console.log('⚠️ Judge0: No Python function detected, executing as-is');
      return sourceCode;
    }
    
    // Create function call
    let functionCall;
    if (Array.isArray(parsedInput)) {
      const args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (parsedInput !== null && parsedInput !== undefined) {
      functionCall = `${functionName}(${JSON.stringify(parsedInput)})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    const wrappedCode = `${sourceCode}\n\n# Test execution\nresult = ${functionCall}\nprint(result)`;
    console.log('🔧 Judge0: Wrapped Python code:', wrappedCode);
    return wrappedCode;
  }

  /**
   * Wrap Java code to execute and capture output
   */
  wrapJavaCode(sourceCode, parsedInput) {
    console.log('☕ Judge0: Wrapping Java code');
    
    // Try to detect method patterns
    const methodPatterns = [
      /public\s+static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m,
      /public\s+(\w+)\s+(\w+)\s*\([^)]*\)/m,
      /static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m
    ];
    
    let methodName = null;
    let returnType = null;
    for (const pattern of methodPatterns) {
      const match = sourceCode.match(pattern);
      if (match) {
        returnType = match[1];
        methodName = match[2];
        console.log('✅ Judge0: Found Java method:', methodName, 'Return type:', returnType);
        break;
      }
    }
    
    if (!methodName) {
      console.log('⚠️ Judge0: No Java method detected, executing as-is');
      return sourceCode;
    }
    
    // Create main method wrapper
    let argsString = '';
    if (Array.isArray(parsedInput)) {
      argsString = parsedInput.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        return String(arg);
      }).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      if (typeof parsedInput === 'string') {
        argsString = `"${parsedInput}"`;
      } else {
        argsString = String(parsedInput);
      }
    }
    
    const mainMethod = `
    public static void main(String[] args) {
        ${returnType} result = ${methodName}(${argsString});
        System.out.println(result);
    }`;
    
    // Remove 'public' modifier from class declaration for Judge0 compatibility
    const modifiedSourceCode = sourceCode.replace(/public\s+class\s+(\w+)/, 'class $1');
    
    // Insert main method before the closing brace of the class
    const wrappedCode = modifiedSourceCode.replace(/\}\s*$/, `${mainMethod}\n}`);
    console.log('🔧 Judge0: Wrapped Java code:', wrappedCode);
    return wrappedCode;
  }

  /**
   * Wrap C++ code to execute and capture output
   */
  wrapCppCode(sourceCode, parsedInput) {
    console.log('⚡ Judge0: Wrapping C++ code');
    
    // Try to detect function patterns - prioritize function name over return type
    const functionPatterns = [
      /(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/m,  // return_type function_name(...)
      /int\s+(\w+)\s*\([^)]*\)\s*\{/m,    // int function_name(...)
      /void\s+(\w+)\s*\([^)]*\)\s*\{/m,   // void function_name(...)
      /string\s+(\w+)\s*\([^)]*\)\s*\{/m, // string function_name(...)
      /double\s+(\w+)\s*\([^)]*\)\s*\{/m, // double function_name(...)
      /bool\s+(\w+)\s*\([^)]*\)\s*\{/m    // bool function_name(...)
    ];
    
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) {
        // For patterns with two groups, use the second one (function name)
        // For patterns with one group, use that one
        functionName = match[2] || match[1];
        console.log('✅ Judge0: Found C++ function:', functionName);
        break;
      }
    }
    
    if (!functionName) {
      console.log('⚠️ Judge0: No C++ function detected, executing as-is');
      return sourceCode;
    }
    
    // Create main function wrapper
    let argsString = '';
    if (Array.isArray(parsedInput)) {
      argsString = parsedInput.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        return String(arg);
      }).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      if (typeof parsedInput === 'string') {
        argsString = `"${parsedInput}"`;
      } else {
        argsString = String(parsedInput);
      }
    }
    
    const mainFunction = `
int main() {
    auto result = ${functionName}(${argsString});
    std::cout << result << std::endl;
    return 0;
}`;
    
    const wrappedCode = `${sourceCode}\n${mainFunction}`;
    console.log('🔧 Judge0: Wrapped C++ code:', wrappedCode);
    return wrappedCode;
  }

  /**
   * Wrap C code to execute and capture output
   */
  wrapCCode(sourceCode, parsedInput) {
    console.log('🔧 Judge0: Wrapping C code');
    
    // Try to detect function patterns - prioritize function name over return type
    const functionPatterns = [
      /(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/m,  // return_type function_name(...)
      /int\s+(\w+)\s*\([^)]*\)\s*\{/m,    // int function_name(...)
      /void\s+(\w+)\s*\([^)]*\)\s*\{/m,   // void function_name(...)
      /char\s+(\w+)\s*\([^)]*\)\s*\{/m,   // char function_name(...)
      /double\s+(\w+)\s*\([^)]*\)\s*\{/m, // double function_name(...)
      /float\s+(\w+)\s*\([^)]*\)\s*\{/m   // float function_name(...)
    ];
    
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) {
        // For patterns with two groups, use the second one (function name)
        // For patterns with one group, use that one
        functionName = match[2] || match[1];
        console.log('✅ Judge0: Found C function:', functionName);
        break;
      }
    }
    
    if (!functionName) {
      console.log('⚠️ Judge0: No C function detected, executing as-is');
      return sourceCode;
    }
    
    // Create main function wrapper
    let argsString = '';
    if (Array.isArray(parsedInput)) {
      argsString = parsedInput.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        return String(arg);
      }).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      if (typeof parsedInput === 'string') {
        argsString = `"${parsedInput}"`;
      } else {
        argsString = String(parsedInput);
      }
    }
    
    const mainFunction = `
int main() {
    int result = ${functionName}(${argsString});
    printf("%d\\n", result);
    return 0;
}`;
    
    const wrappedCode = `${sourceCode}\n${mainFunction}`;
    console.log('🔧 Judge0: Wrapped C code:', wrappedCode);
    return wrappedCode;
  }

  /**
   * Wrap JavaScript code to execute and capture output
   */
  wrapJavaScriptCode(sourceCode, input) {
    console.log('🔧 Judge0: Wrapping JavaScript code');
    console.log('📝 Judge0: Original code:', sourceCode);
    console.log('📥 Judge0: Input:', input);
    
    // Try to detect different function patterns with more precise matching
    const functionPatterns = [
      // Standard function declaration: function name(...) { ... }
      { pattern: /^function\s+(\w+)\s*\([^)]*\)\s*\{/m, type: 'declaration' },
      // Arrow function with parentheses: const name = (...) => ...
      { pattern: /^(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/m, type: 'arrow' },
      // Arrow function without parentheses: const name = x => ...
      { pattern: /^(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*=>/m, type: 'arrow-simple' },
      // Function expression: const name = function(...) { ... }
      { pattern: /^(?:const|let|var)\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{/m, type: 'expression' },
      // Class method: methodName(...) { ... } (but not constructor)
      { pattern: /^(\w+)\s*\([^)]*\)\s*\{/m, type: 'method', exclude: ['constructor'] }
    ];
    
    let functionName = null;
    let functionType = null;
    
    // Find the first matching pattern
    for (const { pattern, type, exclude } of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) {
        const candidateName = match[1];
        // Skip excluded names
        if (exclude && exclude.includes(candidateName)) {
          continue;
        }
        functionName = candidateName;
        functionType = type;
        console.log('✅ Judge0: Found function pattern:', type, 'Function name:', functionName);
        break;
      }
    }
    
    if (!functionName) {
      console.log('⚠️ Judge0: No function pattern detected, executing code as-is');
      return sourceCode;
    }
    
    // Parse input safely
    let parsedInput = this.parseInputSafely(input);
    console.log('📥 Judge0: Parsed input:', parsedInput, 'Type:', typeof parsedInput);
    
    // Create function call based on input type
    let functionCall;
    if (Array.isArray(parsedInput)) {
      // For arrays, spread the arguments
      const args = parsedInput.map(arg => {
        if (typeof arg === 'string') {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return JSON.stringify(arg);
      }).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (parsedInput !== null && parsedInput !== undefined) {
      // Single argument
      if (typeof parsedInput === 'string') {
        functionCall = `${functionName}("${parsedInput.replace(/"/g, '\\"')}")`;
      } else {
        functionCall = `${functionName}(${JSON.stringify(parsedInput)})`;
      }
    } else {
      // No arguments
      functionCall = `${functionName}()`;
    }
    
    // Create wrapped code that executes the function and prints the result
    const wrappedCode = `${sourceCode}\n\n// Test execution\nconst result = ${functionCall};\nconsole.log(result);`;
    
    console.log('🔧 Judge0: Wrapped code:', wrappedCode);
    return wrappedCode;
  }

  // Additional language wrappers
  wrapRubyCode(sourceCode, parsedInput) {
    console.log('💎 Judge0: Wrapping Ruby code');
    const functionPatterns = [/^def\s+(\w+)/m, /^class\s+(\w+)/m];
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) { functionName = match[1]; break; }
    }
    if (!functionName) return sourceCode;
    
    let args = '';
    if (Array.isArray(parsedInput)) {
      args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      args = JSON.stringify(parsedInput);
    }
    
    return `${sourceCode}\n\n# Test execution\nresult = ${functionName}(${args})\nputs result`;
  }

  wrapPHPCode(sourceCode, parsedInput) {
    console.log('🐘 Judge0: Wrapping PHP code');
    const functionPatterns = [/function\s+(\w+)/m, /class\s+(\w+)/m];
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) { functionName = match[1]; break; }
    }
    if (!functionName) return sourceCode;
    
    let args = '';
    if (Array.isArray(parsedInput)) {
      args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      args = JSON.stringify(parsedInput);
    }
    
    return `${sourceCode}\n\n<?php\n// Test execution\n$result = ${functionName}(${args});\necho $result;\n?>`;
  }

  wrapGoCode(sourceCode, parsedInput) {
    console.log('🐹 Judge0: Wrapping Go code');
    const functionPatterns = [/func\s+(\w+)/m];
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) { functionName = match[1]; break; }
    }
    if (!functionName) return sourceCode;
    
    let args = '';
    if (Array.isArray(parsedInput)) {
      args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      args = JSON.stringify(parsedInput);
    }
    
    return `${sourceCode}\n\nfunc main() {\n    result := ${functionName}(${args})\n    fmt.Println(result)\n}`;
  }

  wrapRustCode(sourceCode, parsedInput) {
    console.log('🦀 Judge0: Wrapping Rust code');
    const functionPatterns = [/fn\s+(\w+)/m];
    let functionName = null;
    for (const pattern of functionPatterns) {
      const match = sourceCode.match(pattern);
      if (match) { functionName = match[1]; break; }
    }
    if (!functionName) return sourceCode;
    
    let args = '';
    if (Array.isArray(parsedInput)) {
      args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      args = JSON.stringify(parsedInput);
    }
    
    return `${sourceCode}\n\nfn main() {\n    let result = ${functionName}(${args});\n    println!("{}", result);\n}`;
  }

  wrapCSharpCode(sourceCode, parsedInput) {
    console.log('🔷 Judge0: Wrapping C# code');
    const methodPatterns = [/public\s+static\s+(\w+)\s+(\w+)/m, /static\s+(\w+)\s+(\w+)/m];
    let methodName = null;
    for (const pattern of methodPatterns) {
      const match = sourceCode.match(pattern);
      if (match) { methodName = match[2]; break; }
    }
    if (!methodName) return sourceCode;
    
    let args = '';
    if (Array.isArray(parsedInput)) {
      args = parsedInput.map(arg => JSON.stringify(arg)).join(', ');
    } else if (parsedInput !== null && parsedInput !== undefined) {
      args = JSON.stringify(parsedInput);
    }
    
    return `${sourceCode}\n\nclass Program {\n    public static void Main() {\n        var result = ${methodName}(${args});\n        System.Console.WriteLine(result);\n    }\n}`;
  }

  // Placeholder wrappers for other languages
  wrapPerlCode(sourceCode, parsedInput) { return sourceCode; }
  wrapLuaCode(sourceCode, parsedInput) { return sourceCode; }
  wrapRCode(sourceCode, parsedInput) { return sourceCode; }
  wrapJuliaCode(sourceCode, parsedInput) { return sourceCode; }
  wrapSwiftCode(sourceCode, parsedInput) { return sourceCode; }
  wrapKotlinCode(sourceCode, parsedInput) { return sourceCode; }
  wrapScalaCode(sourceCode, parsedInput) { return sourceCode; }
  wrapDartCode(sourceCode, parsedInput) { return sourceCode; }
  wrapHaskellCode(sourceCode, parsedInput) { return sourceCode; }
  wrapOCamlCode(sourceCode, parsedInput) { return sourceCode; }
  wrapFSharpCode(sourceCode, parsedInput) { return sourceCode; }
  wrapPascalCode(sourceCode, parsedInput) { return sourceCode; }
  wrapFortranCode(sourceCode, parsedInput) { return sourceCode; }
  wrapZigCode(sourceCode, parsedInput) { return sourceCode; }
  wrapNimCode(sourceCode, parsedInput) { return sourceCode; }
  wrapClojureCode(sourceCode, parsedInput) { return sourceCode; }
  wrapElixirCode(sourceCode, parsedInput) { return sourceCode; }
  wrapErlangCode(sourceCode, parsedInput) { return sourceCode; }
  wrapSchemeCode(sourceCode, parsedInput) { return sourceCode; }
  wrapLispCode(sourceCode, parsedInput) { return sourceCode; }
  wrapBashCode(sourceCode, parsedInput) { return sourceCode; }
  wrapSQLCode(sourceCode, parsedInput) { return sourceCode; }
  wrapPrologCode(sourceCode, parsedInput) { return sourceCode; }
  wrapSmalltalkCode(sourceCode, parsedInput) { return sourceCode; }
  wrapVBNetCode(sourceCode, parsedInput) { return sourceCode; }
  wrapBasicCode(sourceCode, parsedInput) { return sourceCode; }
  wrapCobolCode(sourceCode, parsedInput) { return sourceCode; }
  wrapOctaveCode(sourceCode, parsedInput) { return sourceCode; }
  wrapTclCode(sourceCode, parsedInput) { return sourceCode; }

  /**
   * Safely parse input for function calls
   */
  parseInputSafely(input) {
    // Handle empty string explicitly
    if (input === '') {
      return '';
    }
    
    if (!input || input === null || input === undefined) {
      return null;
    }
    
    // If input is already an object or array, return as-is
    if (typeof input === 'object') {
      return input;
    }
    
    // Handle string input
    if (typeof input === 'string') {
      // Check if input contains assignment expressions (e.g., "products = [...], taxRate = 0.10")
      if (this.containsAssignmentExpressions(input)) {
        console.log('🔧 Judge0: Detected assignment expressions, extracting function arguments');
        return this.extractFunctionArguments(input);
      }
      
      // Check if input is a function call string (e.g., "calculateProductFinalPrice(120, 10, 8)")
      if (this.containsFunctionCall(input)) {
        console.log('🔧 Judge0: Detected function call, extracting arguments');
        return this.extractFunctionCallArguments(input);
      }
      
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(input);
        console.log('✅ Judge0: Successfully parsed JSON input:', parsed);
        return parsed;
      } catch (e) {
        // If JSON parsing fails, check if it's a single value that should be parsed
        const trimmed = input.trim();
        
        // Try to parse as number
        if (!isNaN(trimmed) && trimmed !== '') {
          const num = parseFloat(trimmed);
          console.log('🔢 Judge0: Parsed as number:', num);
          return num;
        }
        
        // Try to parse as boolean
        if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
          const bool = trimmed.toLowerCase() === 'true';
          console.log('🔘 Judge0: Parsed as boolean:', bool);
          return bool;
        }
        
        // Try to parse as null
        if (trimmed.toLowerCase() === 'null') {
          console.log('🔘 Judge0: Parsed as null');
          return null;
        }
        
        // Return as string (including empty string)
        console.log('📝 Judge0: Input treated as string:', input);
        return input;
      }
    }
    
    // Return as-is for other types
    console.log('📝 Judge0: Input returned as-is:', input, 'Type:', typeof input);
    return input;
  }

  /**
   * Check if input contains assignment expressions or parameter patterns
   */
  containsAssignmentExpressions(input) {
    // Look for patterns like "variable = value" or "variable: value" or "variable: [...], other: value"
    const assignmentPattern = /^\s*\w+\s*[=:]\s*.+/;
    return assignmentPattern.test(input.trim());
  }

  /**
   * Extract function arguments from assignment expressions or parameter patterns
   * Converts "products = [...], taxRate = 0.10" or "items: [...], taxRate: 0.08" to [[...], 0.10]
   */
  extractFunctionArguments(input) {
    console.log('🔧 Judge0: Extracting function arguments from:', input);
    
    try {
      // Split by comma, but be careful with nested structures
      const assignments = this.splitAssignments(input);
      console.log('📋 Judge0: Split assignments:', assignments);
      
      const functionArgs = [];
      
      for (const assignment of assignments) {
        const trimmed = assignment.trim();
        if (!trimmed) continue;
        
        // Find the '=' or ':' sign and extract the value part
        const equalIndex = trimmed.indexOf('=');
        const colonIndex = trimmed.indexOf(':');
        const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;
        
        if (separatorIndex === -1) {
          console.log('⚠️ Judge0: No assignment operator found in:', trimmed);
          continue;
        }
        
        const valuePart = trimmed.substring(separatorIndex + 1).trim();
        console.log('📥 Judge0: Extracting value from:', valuePart);
        
        // Try to parse the value
        let parsedValue;
        try {
          parsedValue = JSON.parse(valuePart);
        } catch (e) {
          // If JSON parsing fails, try other types
          if (!isNaN(valuePart) && !isNaN(parseFloat(valuePart))) {
            parsedValue = parseFloat(valuePart);
          } else if (valuePart.toLowerCase() === 'true') {
            parsedValue = true;
          } else if (valuePart.toLowerCase() === 'false') {
            parsedValue = false;
          } else if (valuePart.toLowerCase() === 'null') {
            parsedValue = null;
          } else {
            // Remove quotes if present
            parsedValue = valuePart.replace(/^["']|["']$/g, '');
          }
        }
        
        functionArgs.push(parsedValue);
        console.log('✅ Judge0: Parsed argument:', parsedValue, 'Type:', typeof parsedValue);
      }
      
      console.log('📤 Judge0: Final function arguments:', functionArgs);
      return functionArgs;
    } catch (error) {
      console.error('❌ Judge0: Error extracting function arguments:', error);
      // Fallback to original input
      return input;
    }
  }

  /**
   * Check if input is a function call string
   */
  containsFunctionCall(input) {
    // Look for patterns like "functionName(arg1, arg2, arg3)"
    const functionCallPattern = /^\s*\w+\s*\([^)]*\)\s*$/;
    return functionCallPattern.test(input.trim());
  }

  /**
   * Extract function arguments from function call string
   * Converts "calculateProductFinalPrice(120, 10, 8)" to [120, 10, 8]
   */
  extractFunctionCallArguments(input) {
    console.log('🔧 Judge0: Extracting function call arguments from:', input);
    
    try {
      // Find the opening parenthesis
      const openParenIndex = input.indexOf('(');
      const closeParenIndex = input.lastIndexOf(')');
      
      if (openParenIndex === -1 || closeParenIndex === -1 || openParenIndex >= closeParenIndex) {
        console.log('⚠️ Judge0: No valid parentheses found in function call');
        return input;
      }
      
      // Extract the arguments string
      const argsString = input.substring(openParenIndex + 1, closeParenIndex).trim();
      console.log('📥 Judge0: Arguments string:', argsString);
      
      if (!argsString) {
        console.log('📤 Judge0: No arguments found, returning empty array');
        return [];
      }
      
      // Split arguments by comma, handling nested structures
      const functionArgs = this.splitFunctionArguments(argsString);
      console.log('📋 Judge0: Split arguments:', functionArgs);
      
      const parsedArguments = [];
      
      for (const arg of functionArgs) {
        const trimmed = arg.trim();
        if (!trimmed) continue;
        
        console.log('📥 Judge0: Parsing argument:', trimmed);
        
        // Try to parse the argument
        let parsedValue;
        try {
          parsedValue = JSON.parse(trimmed);
        } catch (e) {
          // If JSON parsing fails, try other types
          if (!isNaN(trimmed) && !isNaN(parseFloat(trimmed))) {
            parsedValue = parseFloat(trimmed);
          } else if (trimmed.toLowerCase() === 'true') {
            parsedValue = true;
          } else if (trimmed.toLowerCase() === 'false') {
            parsedValue = false;
          } else if (trimmed.toLowerCase() === 'null') {
            parsedValue = null;
          } else {
            // Remove quotes if present
            parsedValue = trimmed.replace(/^["']|["']$/g, '');
          }
        }
        
        parsedArguments.push(parsedValue);
        console.log('✅ Judge0: Parsed argument:', parsedValue, 'Type:', typeof parsedValue);
      }
      
      console.log('📤 Judge0: Final function call arguments:', parsedArguments);
      return parsedArguments;
    } catch (error) {
      console.error('❌ Judge0: Error extracting function call arguments:', error);
      // Fallback to original input
      return input;
    }
  }

  /**
   * Split function arguments by comma, handling nested structures
   */
  splitFunctionArguments(input) {
    const functionArgs = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '[' || char === '{' || char === '(') {
          depth++;
        } else if (char === ']' || char === '}' || char === ')') {
          depth--;
        } else if (char === ',' && depth === 0) {
          functionArgs.push(current.trim());
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      functionArgs.push(current.trim());
    }
    
    return functionArgs;
  }

  /**
   * Compare actual output with expected output, handling different data types
   */
  compareOutputs(actualOutput, expectedOutput) {
    console.log('🔍 Judge0: Comparing outputs - Actual:', actualOutput, 'Expected:', expectedOutput);
    
    // Handle null/undefined cases
    if (actualOutput === null || actualOutput === undefined) {
      return expectedOutput === null || expectedOutput === undefined;
    }
    
    if (expectedOutput === null || expectedOutput === undefined) {
      return actualOutput === null || actualOutput === undefined;
    }
    
    // Convert both to strings for comparison
    const actualStr = String(actualOutput).trim();
    const expectedStr = String(expectedOutput).trim();
    
    // Direct string comparison first
    if (actualStr === expectedStr) {
      console.log('✅ Judge0: Direct string match');
      return true;
    }
    
    // Try numeric comparison if both look like numbers
    const actualNum = parseFloat(actualStr);
    const expectedNum = parseFloat(expectedStr);
    
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      const numericMatch = actualNum === expectedNum;
      console.log('🔢 Judge0: Numeric comparison:', actualNum, '===', expectedNum, '=', numericMatch);
      return numericMatch;
    }
    
    // Try boolean comparison
    const actualBool = actualStr.toLowerCase();
    const expectedBool = expectedStr.toLowerCase();
    
    if ((actualBool === 'true' || actualBool === 'false') && 
        (expectedBool === 'true' || expectedBool === 'false')) {
      const boolMatch = actualBool === expectedBool;
      console.log('🔘 Judge0: Boolean comparison:', actualBool, '===', expectedBool, '=', boolMatch);
      return boolMatch;
    }
    
    // Try JSON comparison for objects/arrays
    try {
      const actualParsed = JSON.parse(actualStr);
      const expectedParsed = JSON.parse(expectedStr);
      const jsonMatch = JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
      console.log('📦 Judge0: JSON comparison:', jsonMatch);
      return jsonMatch;
    } catch (e) {
      // Not valid JSON, fall back to string comparison
      console.log('📝 Judge0: Fallback to string comparison:', actualStr, '===', expectedStr, '=', false);
      return false;
    }
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
      
      // Wrap the code to capture function output for all languages
      const wrappedCode = this.wrapCodeForLanguage(sourceCode, language, input);
      
      // Create submission
      const submissionData = {
        source_code: wrappedCode,
        language_id: languageId,
        stdin: '',
        expected_output: expectedOutput,
        cpu_time_limit: '2.0',
        memory_limit: '128000',
        wall_time_limit: '5.0',
        base64_encoded: false  // Get plain text output instead of Base64
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

    // Judge0 returns stdout - since we set base64_encoded: false, we get plain text
    let actualOutput = result.stdout || '';
    
    console.log('🔍 Judge0: Raw stdout:', actualOutput, 'Length:', actualOutput.length);
    
    // Since we're using base64_encoded: false, we should get plain text output
    // Only attempt Base64 decoding if the output looks suspiciously like Base64
    // and we're not getting readable text
    if (actualOutput && actualOutput.length > 0) {
      // Check if it looks like Base64 AND doesn't contain readable characters
      const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(actualOutput) && 
                       actualOutput.length % 4 === 0 && 
                       actualOutput.length > 4;
      
      // Only decode if it's Base64 AND doesn't contain readable ASCII characters
      const hasReadableChars = /[a-zA-Z0-9\s.,!?;:'"(){}[\]-]/.test(actualOutput);
      
      if (isBase64 && !hasReadableChars) {
        try {
          const decoded = Buffer.from(actualOutput, 'base64').toString('utf-8');
          // Only use decoded if it produces readable text and doesn't contain null bytes
          if (decoded && decoded.length > 0 && !decoded.includes('\0') && decoded !== actualOutput) {
            actualOutput = decoded;
            console.log('🔓 Judge0: Successfully decoded Base64 stdout:', actualOutput);
          } else {
            console.log('🔍 Judge0: Base64 decode produced same or invalid result, using original');
          }
        } catch (error) {
          console.log('🔍 Judge0: Base64 decode failed, using original output:', error.message);
        }
      } else {
        console.log('🔍 Judge0: Output appears to be plain text, using as-is');
      }
    }
    
    const trimmedOutput = actualOutput.trim();
    
    console.log('🔍 Judge0: Raw response:', {
      statusId: result.status?.id,
      rawStdout: result.stdout,
      rawStderr: result.stderr,
      rawCompileOutput: result.compile_output,
      rawMessage: result.message
    });
    
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
      passed = this.compareOutputs(trimmedOutput, expectedOutput);
      console.log('🔍 Judge0: Output comparison:', {
        actual: `"${trimmedOutput}"`,
        expected: `"${expectedOutput}"`,
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
        
        // Handle both camelCase and snake_case field names
        const expectedOutput = testCase.expected_output !== undefined 
          ? (typeof testCase.expected_output === 'object' ? JSON.stringify(testCase.expected_output) : testCase.expected_output)
          : (testCase.expectedOutput !== undefined 
              ? (typeof testCase.expectedOutput === 'object' ? JSON.stringify(testCase.expectedOutput) : testCase.expectedOutput)
              : null);

        const result = await this.executeCode(sourceCode, language, input, expectedOutput);
        
        results.push({
          testNumber: i + 1,
          input: testCase.input,
          expected: testCase.expected_output,
          result: result.actualOutput,
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
        
        // Handle both camelCase and snake_case field names
        const expectedOutput = testCase.expected_output !== undefined 
          ? (typeof testCase.expected_output === 'object' ? JSON.stringify(testCase.expected_output) : testCase.expected_output)
          : (testCase.expectedOutput !== undefined 
              ? (typeof testCase.expectedOutput === 'object' ? JSON.stringify(testCase.expectedOutput) : testCase.expectedOutput)
              : null);

        console.log(`📋 Judge0: Test case ${index + 1}:`, {
          input,
          expectedOutput,
          inputType: typeof testCase.input,
          expectedType: typeof testCase.expected_output
        });

        // Wrap code for each test case for all languages
        const wrappedSourceCode = this.wrapCodeForLanguage(sourceCode, language, input);

        return {
          source_code: wrappedSourceCode,
          language_id: languageId,
          stdin: '', // Input is handled in the wrapped code for all languages
          expected_output: expectedOutput,
          cpu_time_limit: '2.0',
          memory_limit: '128000',
          wall_time_limit: '5.0',
          base64_encoded: false  // Get plain text output instead of Base64
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
