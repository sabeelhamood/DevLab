// backend/src/utils/codeHarnessTemplates.js
/**
 * Harness templates for wrapping student code when expectsReturn = true
 * These templates capture function return values and output them in a standardized format
 * to avoid interference from debug print statements.
 */

/**
 * Generate a harness-wrapped version of student code for a specific language
 * @param {string} sourceCode - The student's code
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of test cases with input and expectedOutput
 * @returns {string} - Wrapped code ready for Judge0 execution
 */
export function generateHarnessWrappedCode(sourceCode, language, testCases) {
  const lang = language.toLowerCase();
  
  const harnessGenerators = {
    'javascript': () => generateJavaScriptHarness(sourceCode, testCases),
    'typescript': () => generateJavaScriptHarness(sourceCode, testCases),
    'python': () => generatePythonHarness(sourceCode, testCases),
    'java': () => generateJavaHarness(sourceCode, testCases),
    'cpp': () => generateCppHarness(sourceCode, testCases),
    'c': () => generateCHarness(sourceCode, testCases),
    'csharp': () => generateCSharpHarness(sourceCode, testCases),
    'go': () => generateGoHarness(sourceCode, testCases),
    'rust': () => generateRustHarness(sourceCode, testCases),
    'ruby': () => generateRubyHarness(sourceCode, testCases),
    'php': () => generatePHPHarness(sourceCode, testCases),
    'swift': () => generateSwiftHarness(sourceCode, testCases),
    'kotlin': () => generateKotlinHarness(sourceCode, testCases)
  };
  
  const generator = harnessGenerators[lang];
  if (generator) {
    return generator();
  }
  
  // Fallback: return code as-is if no harness template exists
  console.warn(`⚠️ No harness template for language: ${language}, executing as-is`);
  return sourceCode;
}

/**
 * Extract function name from code using common patterns
 */
function extractFunctionName(sourceCode, patterns) {
  for (const pattern of patterns) {
    const match = sourceCode.match(pattern);
    if (match) {
      return match[1] || match[2];
    }
  }
  return null;
}

/**
 * Parse test input safely for function calls
 */
function parseTestInput(input) {
  if (typeof input === 'string') {
    // Try to parse as JSON if it looks like JSON
    if ((input.startsWith('[') || input.startsWith('{')) && input.trim().length > 0) {
      try {
        return JSON.parse(input);
      } catch (e) {
        // Not valid JSON, return as string
      }
    }
    // Check if it's a function call like "sum(2, 3)"
    if (input.includes('(') && input.includes(')')) {
      return input; // Return as-is for function calls
    }
    return input;
  }
  return input;
}

/**
 * JavaScript/TypeScript harness
 */
function generateJavaScriptHarness(sourceCode, testCases) {
  const functionPatterns = [
    /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*=\s*(?:async\s*)?function/,
    /function\s+(\w+)\s*\([^)]*\)/,
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    // Fallback: try to execute code as-is
    return `${sourceCode}\n\n// Harness execution\nconsole.log("RESULT: Code executed");`;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `const results = [];\n`;
  harnessCode += `try {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      // Input is already a function call like "sum(2, 3)"
      functionCall = input;
    } else if (Array.isArray(input)) {
      functionCall = `${functionName}(...${JSON.stringify(input)})`;
    } else if (input !== null && input !== undefined) {
      functionCall = `${functionName}(${JSON.stringify(input)})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `  const result${index} = ${functionCall};\n`;
    harnessCode += `  console.log("RESULT: " + JSON.stringify(result${index}));\n`;
  });
  
  harnessCode += `} catch (error) {\n`;
  harnessCode += `  console.log("RESULT: ERROR - " + error.message);\n`;
  harnessCode += `}\n`;
  
  return harnessCode;
}

/**
 * Python harness
 */
function generatePythonHarness(sourceCode, testCases) {
  const functionPatterns = [
    /^def\s+(\w+)\s*\([^)]*\)\s*:/m,
    /^async\s+def\s+(\w+)\s*\([^)]*\)\s*:/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return `${sourceCode}\n\n# Harness execution\nprint("RESULT: Code executed")`;
  }
  
  let harnessCode = `${sourceCode}\n\n# Harness: Execute test cases\n`;
  harnessCode += `import json\n`;
  harnessCode += `try:\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => {
        if (typeof arg === 'string') {
          return `json.loads('${JSON.stringify(arg)}')`;
        }
        return JSON.stringify(arg);
      }).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (input !== null && input !== undefined) {
      if (typeof input === 'string') {
        functionCall = `${functionName}(${JSON.stringify(input)})`;
      } else {
        functionCall = `${functionName}(${JSON.stringify(input)})`;
      }
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `    result${index} = ${functionCall}\n`;
    harnessCode += `    print("RESULT: " + json.dumps(result${index}))\n`;
  });
  
  harnessCode += `except Exception as e:\n`;
  harnessCode += `    print("RESULT: ERROR - " + str(e))\n`;
  
  return harnessCode;
}

/**
 * Java harness
 */
function generateJavaHarness(sourceCode, testCases) {
  const methodPatterns = [
    /public\s+static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m,
    /public\s+(\w+)\s+(\w+)\s*\([^)]*\)/m,
    /static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const match = sourceCode.match(methodPatterns[0]) || sourceCode.match(methodPatterns[1]) || sourceCode.match(methodPatterns[2]);
  if (!match) {
    return sourceCode; // Can't wrap without method detection
  }
  
  const returnType = match[1];
  const methodName = match[2];
  
  // Remove 'public' from class if present for Judge0 compatibility
  const modifiedSource = sourceCode.replace(/public\s+class\s+(\w+)/, 'class $1');
  
  let harnessCode = `${modifiedSource}\n\n    // Harness: Execute test cases\n`;
  harnessCode += `    public static void main(String[] args) {\n`;
  harnessCode += `        try {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let methodCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      methodCall = input.replace(/^\w+\./, ''); // Remove class prefix if present
    } else if (Array.isArray(input)) {
      const args = input.map(arg => typeof arg === 'string' ? `"${arg}"` : String(arg)).join(', ');
      methodCall = `${methodName}(${args})`;
    } else if (input !== null && input !== undefined) {
      const arg = typeof input === 'string' ? `"${input}"` : String(input);
      methodCall = `${methodName}(${arg})`;
    } else {
      methodCall = `${methodName}()`;
    }
    
    harnessCode += `            ${returnType} result${index} = ${methodCall};\n`;
    harnessCode += `            System.out.println("RESULT: " + result${index});\n`;
  });
  
  harnessCode += `        } catch (Exception e) {\n`;
  harnessCode += `            System.out.println("RESULT: ERROR - " + e.getMessage());\n`;
  harnessCode += `        }\n`;
  harnessCode += `    }\n`;
  
  return harnessCode;
}

/**
 * C++ harness
 */
function generateCppHarness(sourceCode, testCases) {
  const functionPatterns = [
    /(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /int\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /void\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /string\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /double\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /bool\s+(\w+)\s*\([^)]*\)\s*\{/m
  ];
  
  const match = sourceCode.match(functionPatterns[0]);
  if (!match) {
    return sourceCode;
  }
  
  const functionName = match[2] || match[1];
  
  // Check if main already exists
  if (sourceCode.includes('int main')) {
    return sourceCode; // Don't wrap if main exists
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `#include <iostream>\n`;
  harnessCode += `#include <string>\n`;
  harnessCode += `int main() {\n`;
  harnessCode += `    try {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => typeof arg === 'string' ? `"${arg}"` : String(arg)).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (input !== null && input !== undefined) {
      const arg = typeof input === 'string' ? `"${input}"` : String(input);
      functionCall = `${functionName}(${arg})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `        auto result${index} = ${functionCall};\n`;
    harnessCode += `        std::cout << "RESULT: " << result${index} << std::endl;\n`;
  });
  
  harnessCode += `    } catch (...) {\n`;
  harnessCode += `        std::cout << "RESULT: ERROR" << std::endl;\n`;
  harnessCode += `    }\n`;
  harnessCode += `    return 0;\n`;
  harnessCode += `}\n`;
  
  return harnessCode;
}

/**
 * C harness
 */
function generateCHarness(sourceCode, testCases) {
  const functionPatterns = [
    /(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /int\s+(\w+)\s*\([^)]*\)\s*\{/m,
    /void\s+(\w+)\s*\([^)]*\)\s*\{/m
  ];
  
  const match = sourceCode.match(functionPatterns[0]);
  if (!match) {
    return sourceCode;
  }
  
  const functionName = match[2] || match[1];
  
  if (sourceCode.includes('int main')) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `#include <stdio.h>\n`;
  harnessCode += `int main() {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      // C doesn't handle arrays well, simplified
      functionCall = `${functionName}()`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `    printf("RESULT: %%d\\n", ${functionCall});\n`;
  });
  
  harnessCode += `    return 0;\n`;
  harnessCode += `}\n`;
  
  return harnessCode;
}

/**
 * C# harness
 */
function generateCSharpHarness(sourceCode, testCases) {
  const methodPatterns = [
    /public\s+static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m,
    /static\s+(\w+)\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const match = sourceCode.match(methodPatterns[0]) || sourceCode.match(methodPatterns[1]);
  if (!match) {
    return sourceCode;
  }
  
  const returnType = match[1];
  const methodName = match[2];
  
  let harnessCode = `${sourceCode}\n\n    // Harness: Execute test cases\n`;
  harnessCode += `    public static void Main(string[] args) {\n`;
  harnessCode += `        try {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let methodCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      methodCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => typeof arg === 'string' ? `"${arg}"` : String(arg)).join(', ');
      methodCall = `${methodName}(${args})`;
    } else if (input !== null && input !== undefined) {
      const arg = typeof input === 'string' ? `"${input}"` : String(input);
      methodCall = `${methodName}(${arg})`;
    } else {
      methodCall = `${methodName}()`;
    }
    
    harnessCode += `            ${returnType} result${index} = ${methodCall};\n`;
    harnessCode += `            Console.WriteLine("RESULT: " + result${index});\n`;
  });
  
  harnessCode += `        } catch (Exception e) {\n`;
  harnessCode += `            Console.WriteLine("RESULT: ERROR - " + e.Message);\n`;
  harnessCode += `        }\n`;
  harnessCode += `    }\n`;
  
  return harnessCode;
}

/**
 * Go harness
 */
function generateGoHarness(sourceCode, testCases) {
  const functionPatterns = [
    /func\s+(\w+)\s*\([^)]*\)\s+(\w+)/m,
    /func\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `func main() {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `    result${index} := ${functionCall}\n`;
    harnessCode += `    fmt.Println("RESULT:", result${index})\n`;
  });
  
  harnessCode += `}\n`;
  
  return harnessCode;
}

/**
 * Rust harness
 */
function generateRustHarness(sourceCode, testCases) {
  const functionPatterns = [
    /fn\s+(\w+)\s*\([^)]*\)\s*->\s*\w+/m,
    /fn\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `fn main() {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `    let result${index} = ${functionCall};\n`;
    harnessCode += `    println!("RESULT: {:?}", result${index});\n`;
  });
  
  harnessCode += `}\n`;
  
  return harnessCode;
}

/**
 * Ruby harness
 */
function generateRubyHarness(sourceCode, testCases) {
  const functionPatterns = [
    /def\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n# Harness: Execute test cases\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => arg.inspect).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (input !== null && input !== undefined) {
      functionCall = `${functionName}(${input.inspect})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `result${index} = ${functionCall}\n`;
    harnessCode += `puts "RESULT: " + result${index}.to_s\n`;
  });
  
  return harnessCode;
}

/**
 * PHP harness
 */
function generatePHPHarness(sourceCode, testCases) {
  const functionPatterns = [
    /function\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => typeof arg === 'string' ? `"${arg}"` : String(arg)).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (input !== null && input !== undefined) {
      const arg = typeof input === 'string' ? `"${input}"` : String(input);
      functionCall = `${functionName}(${arg})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `$result${index} = ${functionCall};\n`;
    harnessCode += `echo "RESULT: " . json_encode($result${index}) . "\\n";\n`;
  });
  
  return harnessCode;
}

/**
 * Swift harness
 */
function generateSwiftHarness(sourceCode, testCases) {
  const functionPatterns = [
    /func\s+(\w+)\s*\([^)]*\)\s*->/m,
    /func\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `let result${index} = ${functionCall}\n`;
    harnessCode += `print("RESULT: \\(result${index})")\n`;
  });
  
  return harnessCode;
}

/**
 * Kotlin harness
 */
function generateKotlinHarness(sourceCode, testCases) {
  const functionPatterns = [
    /fun\s+(\w+)\s*\([^)]*\)\s*:/m,
    /fun\s+(\w+)\s*\([^)]*\)/m
  ];
  
  const functionName = extractFunctionName(sourceCode, functionPatterns);
  
  if (!functionName) {
    return sourceCode;
  }
  
  let harnessCode = `${sourceCode}\n\n// Harness: Execute test cases\n`;
  harnessCode += `fun main() {\n`;
  harnessCode += `    try {\n`;
  
  testCases.forEach((testCase, index) => {
    const input = parseTestInput(testCase.input);
    let functionCall;
    
    if (typeof input === 'string' && input.includes('(')) {
      functionCall = input;
    } else if (Array.isArray(input)) {
      const args = input.map(arg => typeof arg === 'string' ? `"${arg}"` : String(arg)).join(', ');
      functionCall = `${functionName}(${args})`;
    } else if (input !== null && input !== undefined) {
      const arg = typeof input === 'string' ? `"${input}"` : String(input);
      functionCall = `${functionName}(${arg})`;
    } else {
      functionCall = `${functionName}()`;
    }
    
    harnessCode += `        val result${index} = ${functionCall}\n`;
    harnessCode += `        println("RESULT: $result${index}")\n`;
  });
  
  harnessCode += `    } catch (e: Exception) {\n`;
  harnessCode += `        println("RESULT: ERROR - ${e.message}")\n`;
  harnessCode += `    }\n`;
  harnessCode += `}\n`;
  
  return harnessCode;
}

