// OpenAI prompt builders for Content Studio style coding flows.
// These are adapted from the original Gemini-based prompts so that the rest of
// the application can keep the same behavior while using OpenAI instead.

export function buildGenerateCodingQuestionsPrompt({
  topic,
  skills = [],
  language = 'javascript',
  humanLanguage = 'en',
  amount = 3
}) {
  const skillsText = Array.isArray(skills) && skills.length
    ? skills.join(', ')
    : 'General programming'

  return `
You are an expert programming instructor. Generate CODING questions ONLY.

🚫 CRITICAL REQUIREMENT: Generate ONLY CODING questions where users WRITE CODE, provide 3 test cases for each question.
🚫 FORBIDDEN: DO NOT generate theoretical questions, multiple-choice questions, or questions with options/correctAnswer fields.
🚫 DO NOT include: "options", "correctAnswer", "summary", or any theoretical explanation outside of testCase explanations.

Topic: ${topic}
Skills: ${skillsText}
Programming Language: ${language}
Output Language: ${humanLanguage}
Number of Questions: ${amount}

REQUIRED FORMAT - Each question MUST have:
{
  "title": "Brief question title",
  "description": "Clear problem statement asking user to WRITE CODE (not multiple choice)",
  "testCases": [
    {"input": "example input", "expectedOutput": "expected output", "explanation": "why this test case"},
    {"input": "second input", "expectedOutput": "expected output", "explanation": "why this test case"},
    {"input": "third input", "expectedOutput": "expected output", "explanation": "why this test case"}
  ],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "language": "${language}",
  "question_type": "code",
  "expectsReturn": true
}

IMPORTANT - expectsReturn field:
- Set "expectsReturn": true if the solution should RETURN a value (function-based exercises where the function returns the result)
- Set "expectsReturn": false if the solution should PRINT output (exercises where printing is the required behavior)
- Default to true for most function-based coding exercises

FORBIDDEN FIELDS (DO NOT INCLUDE):
- "options" (multiple choice options) ❌
- "correctAnswer" (multiple choice answer) ❌
- Any free-form "explanation" block outside testCase explanations ❌
- Any mention of "multiple choice", "select", or "choose" ❌
LANGUAGE RULE:
- All human-readable text ("title", "description", "hints") MUST be written in the requested Output Language (${humanLanguage}). All technical elements (function names, code, inputs/outputs, programming keywords, JSON keys, language names, test cases) MUST ALWAYS remain in English and MUST NOT be translated.

EXAMPLE CORRECT CODING QUESTION:
\`\`\`json
[
  {
    "title": "Sum Two Numbers",
    "description": "Write a ${language} function called 'sum' that takes two numbers as parameters and returns their sum.",
    "testCases": [
      {"input": "sum(2, 3)", "expectedOutput": "5", "explanation": "2 + 3 = 5"},
      {"input": "sum(-1, 5)", "expectedOutput": "4", "explanation": "-1 + 5 = 4"}
    ],
    "hints": ["Use the + operator", "Return the result directly", "Test with different numbers"],
    "language": "${language}",
    "question_type": "code",
    "expectsReturn": true
  }
]
\`\`\`

Generate exactly ${amount} CODING questions in a JSON array. Questions should gradually increase in difficulty.
Return ONLY the JSON array, no extra text or markdown.
`.trim()
}

export function buildEvaluationPrompt({
  question,
  code,
  language = 'javascript',
  testCases = []
}) {
  return `
You are an expert code reviewer. Evaluate this ${language} code submission for correctness and quality.

Question: ${question}
Code:
${code}

Test Cases: ${JSON.stringify(testCases)}

Provide a comprehensive evaluation that:
1. Tests the code against the provided test cases
2. Evaluates code quality, readability, and efficiency
3. Checks for best practices and potential improvements
4. Syntax and semantic correctness: Do NOT execute the code. Perform strict static analysis for syntax errors and semantic logic according to the programming language of the submitted code. 
   - Treat the code as if parsed by a strict compiler/interpreter.
   - Check for ALL syntax issues including missing or extra: semicolons (;), braces ({ }), parentheses (), colons (:), commas (,), and other punctuation relevant to the language.
   - Highlight line numbers and specific issues.
5. Logical correctness: Verify the solution fully satisfies all requirements specified in the question.
6. Code quality: Assess readability, maintainability, efficiency, and adherence to best practices.
7. Constructive feedback: Provide actionable suggestions for improvements, optimizations, or better coding style.
8. Provides constructive feedback
9. Suggests specific improvements

EVALUATION REQUIREMENTS:
- isCorrect" may ONLY be true if ALL of the following are true:
   a) All test cases pass
   b) No syntax errors
   c) No runtime errors
   d) Requirements are fully satisfied
   e) No major best-practice violations
- If code is WRONG: Highlight the SPECIFIC mistake line or logic error 
- If code is CORRECT: Analyze efficiency and provide improvement tips
- For correct code: Optionally suggest a more optimized version
- Be specific about what's wrong and how to fix it
- Provide actionable feedback

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "isCorrect": true,
  "score": 85,
  "feedback": "constructive feedback message with specific details",
  "suggestions": ["specific suggestion 1", "specific suggestion 2"],
  "testResults": [
    {"testCase": "test 1", "passed": true, "actual": "actual output", "expected": "expected output", "error": "specific error if any"}
  ],
  "codeQuality": {
    "readability": "good",
    "efficiency": "excellent", 
    "bestPractices": "mostly good",
    "specificIssues": ["issue 1", "issue 2"]
  },
  "specificErrors": ["line X: specific error description", "logic error in function Y"],
  "improvements": ["improvement 1", "improvement 2"],
  "optimizedVersion": "optional optimized code if applicable",
  "summary": "Brief summary of the evaluation"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
`.trim()
}

export function buildHintPrompt({
  question,
  userAttempt,
  hintsUsed = 0,
  allHints = []
}) {
  return `
Generate a concise, direct hint for this coding question.

Question: ${question}
User's current attempt: ${userAttempt}
Hints already used: ${hintsUsed}/3
Previous hints: ${allHints.join(' | ')}

Generate a short, actionable hint for level ${hintsUsed + 1}:
- Level 1: Basic concept or approach
- Level 2: Specific implementation guidance  
- Level 3: Give near-solution direction, without revealing the full answer.

Requirements:
- Keep hint under 20 words
- Avoid repeating any phrasing, terms, or ideas from previous hints.
- Be direct and actionable
- No encouragement or extra text
- Focus only on key guidance
- Don't reveal the complete solution
- Never automatically show solution - user must choose to see it

\`\`\`json
{
  "hint": "short, direct hint text",
  "hintLevel": ${hintsUsed + 1},
  "showSolution": false,
  "solution": null,
  "canShowSolution": ${hintsUsed >= 2}
}
\`\`\`

Return ONLY the JSON object.
`.trim()
}

export function buildFraudDetectionPrompt({ code, question }) {
  return `
You are an expert code analysis AI specialized in detecting AI-generated code submissions.

🎯 GOAL:
Determine whether the given code was written by a human student or generated (fully or partially) by an AI tool such as ChatGPT, Gemini or similar. 
Provide a likelihood score and a short explanation, highlighting patterns and behavioral indicators.

---

📘 CONTEXT:
This code was submitted as an answer to a coding question.

QUESTION:
${question}

SUBMITTED CODE:
${code}

---

🔍 ANALYSIS CRITERIA:
Evaluate the following dimensions carefully:

1. **Syntax & Structure**
  - Is the syntax unusually clean, perfect, or standardized beyond the expected level for a student?
  - Consistent indentation and spacing without minor mistakes may indicate AI.
  - Lack of any small errors typical for human students.

2. **Naming & Style**
  - Generic variable/function names (e.g., \`calculateSomething\`, \`solveProblem\`) may indicate AI.
   - Consistent naming conventions throughout the code.
   - Overly formal or “template-like” style.

3. **Comments & Explanations**
   - Comments that explain trivial steps or are overly formal/tutorial-like.
   - Absence of comments in otherwise polished code may also be an AI indicator.
   - Human students often leave informal, partial, or context-specific comments.

4. **Complexity & Efficiency**
   - Over-optimization for the task, unnecessary use of advanced patterns.
   - Solutions that are more sophisticated than typical for the student’s expected skill level.

5. **Error Handling & Edge Cases**
   - Broad or perfect error handling beyond the scope of the question.
   - Overly complete edge case coverage could indicate AI assistance.

6. **Signature Patterns of AI Tools**
   - Look for patterns commonly produced by AI tools, such as:
     - Consistent \`for (const item of arr)\` or similar idioms.
     - Explicit step-by-step comments (“// Step 1: Initialize variables”).
     - Overuse of blank lines between logical sections.
     - Imports that are declared but never used (AI leftover pattern).
     - Repeated idioms or code templates common in AI outputs.


7. **Human Behavioral Patterns**
   - Check for small human-like inconsistencies:
     - Slight indentation misalignments.
     - Unused or redundant variables.
     - Minor inefficiencies.
     - Comments in a learning tone (e.g., “not sure if this works”).
   - The presence of these indicates a likely human author.

8. **Comparison Against Student Baseline**
   - Compare the code’s quality and sophistication to that of an average student solution for the same topic or difficulty level.
   - If the code looks like a polished template or professionally formatted snippet — that’s a strong AI indicator.

---

🧠 THINKING PROCESS:
Analyze all of the above before making a decision.
Avoid bias toward “AI” just because the code is good — some students write clean code.
Use patterns, human-like inconsistencies, and context to balance your judgment.


---

📊 OUTPUT FORMAT (JSON):
Return your analysis as a valid JSON object exactly in this structure:

{
  "aiLikelihood": <integer 0-100>,
  "humanLikelihood": <integer 0-100>,
  "explanation": "<short 3-4 sentence summary of reasoning>",
  "verdict": "AI" | "Human" | "Unclear"
}

🧩 RULES:
- Ensure the two likelihoods add up to ~100.
- Base your reasoning only on the provided code and question context.
- Be objective and explain the decision succinctly.
- Include in the explanation at least one concrete pattern or observation that influenced your verdict.


`.trim()
}

export function buildEnhancedFraudPatternPrompt({ code, question }) {
  return `
You are an expert at detecting AI-generated code. Analyze this code for specific AI-generated patterns.

CODE TO ANALYZE:
${code}

QUESTION CONTEXT:
${question}

DETECT THESE SPECIFIC AI PATTERNS:

1. **VARIABLE NAMING PATTERNS**:
   - Generic names: item, element, result, data, value, temp, current, total
   - Overly descriptive names that AI loves: calculateOrderTotal, processUserInput
   - Perfect camelCase without any inconsistencies

2. **COMMENT PATTERNS**:
   - Overly explanatory comments for obvious code
   - Comments that explain what the code does rather than why
   - Perfect comment formatting and placement

3. **CODE STRUCTURE PATTERNS**:
   - Perfect indentation and spacing
   - Consistent bracket placement
   - No personal coding style variations
   - Professional-level organization

4. **ALGORITHM PATTERNS**:
   - Optimal solutions that students wouldn't naturally write
   - Perfect edge case handling
   - Advanced techniques used flawlessly
   - No trial-and-error learning patterns

5. **ERROR HANDLING PATTERNS**:
   - Comprehensive error checking that students typically skip
   - Perfect validation logic
   - Professional-level defensive programming

6. **SYNTAX PERFECTION**:
   - Zero typos or syntax errors
   - Perfect use of modern JavaScript features
   - Consistent coding style throughout
   - No learning mistakes or personal quirks

ANALYSIS FOCUS:
- Look for code that is TOO PERFECT for a student submission
- Check for patterns that indicate AI generation rather than human learning
- Consider the complexity vs. expected student level
- Focus on consistency and perfection indicators

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "isAiGenerated": true,
  "confidence": 90,
  "detectedPatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "reasons": ["specific reason 1", "specific reason 2", "specific reason 3"],
  "analysis": "Detailed analysis of AI-generated patterns found",
  "recommendations": ["Write your own solution", "Try to understand the problem", "Ask for hints"],
  "summary": "AI-generated code detected based on pattern analysis"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
`.trim()
}

export function buildLearningRecommendationsPrompt({ userProfile, performanceData }) {
  return `
Generate personalized learning recommendations based on user profile and performance data.

User Profile: ${JSON.stringify(userProfile)}
Performance Data: ${JSON.stringify(performanceData)}

Analyze the user's performance and provide:
1. Strengths and areas of improvement
2. Personalized learning recommendations
3. Next steps for skill development
4. Encouraging feedback
5. Suggested resources or topics

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier
- NO extra text, explanations, or comments outside the JSON
- ALL JSON fields must be strictly valid (no trailing commas, proper quotes, etc.)

\`\`\`json
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendations": ["specific recommendation 1", "specific recommendation 2"],
  "nextSteps": ["specific next step 1", "specific next step 2"],
  "encouragement": "encouraging and motivating message",
  "suggestedResources": ["specific resource 1", "specific resource 2"],
  "learningPath": "suggested learning path with specific steps",
  "summary": "Brief summary of the learning recommendations"
}
\`\`\`

Return ONLY the JSON object in the specified format, no additional text.
`.trim()
}

export function buildRevealSolutionPrompt({ language = 'javascript', skills = [], humanLanguage = 'en', question }) {
  const skillsText =
    Array.isArray(skills) && skills.length ? skills.join(', ') : 'general programming skills'

  return `
You are an expert ${language} instructor. The learner has already tried solving the problem and used several hints.

Your task: PROVIDE THE IDEAL REFERENCE SOLUTION IMPLEMENTATION for the following coding question.

Coding Question (to be solved in ${language}, explanation/output language: ${humanLanguage}):
${question}

Relevant skills and context: ${skillsText}

CRITICAL REQUIREMENTS:
- Write a clean, correct, and idiomatic ${language} solution.
- Focus ONLY on the final code the learner should study.
- Do NOT include test code, console logs, or example calls unless they are part of the expected solution.
- Do NOT include any natural language explanation in the "solution" field.
- The solution should be something a strong mid-level engineer could have written.

OUTPUT FORMAT:
- Return ONLY a valid JSON object wrapped in triple backticks with "json" language identifier.
- NO extra commentary, no markdown outside the JSON block.
- The JSON must have exactly this structure:

\`\`\`json
{
  "solution": "FULL_SOURCE_CODE_HERE_AS_A_SINGLE_STRING"
}
\`\`\`

IMPORTANT:
- The "solution" value must contain ONLY the source code, with newlines and indentation preserved.
- Do NOT escape code with additional markdown fences.
- Do NOT add any additional fields.

Return ONLY the JSON object in the specified format, no additional text.
`.trim()
}

