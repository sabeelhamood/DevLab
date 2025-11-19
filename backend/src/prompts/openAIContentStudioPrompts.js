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

🚫 CRITICAL REQUIREMENT: Generate ONLY CODING questions where users WRITE CODE.
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
  "question_type": "code"
}

FORBIDDEN FIELDS (DO NOT INCLUDE):
- "options" (multiple choice options) ❌
- "correctAnswer" (multiple choice answer) ❌
- Any free-form "explanation" block outside testCase explanations ❌
- Any mention of "multiple choice", "select", or "choose" ❌

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
    "question_type": "code"
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
4. Provides constructive feedback
5. Suggests specific improvements

EVALUATION REQUIREMENTS:
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
- Level 3: Near-solution direction

Requirements:
- Keep hint under 20 words
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
Determine whether the given code was written by a human student or generated (fully or partially) by an AI tool such as ChatGPT or Gemini. 
Your output must be clear, structured, and concise.

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
   - Does it use consistent indentation and spacing without any variation or minor mistakes?

2. **Naming & Style**
   - Are variable/function names generic (e.g., \`calculateSomething\`, \`solveProblem\`, \`resultArray\`)?
   - Is there a lack of creative or task-specific naming that students typically show?
   - Are naming conventions uniform across all variables (a strong AI indicator)?

3. **Comments & Explanations**
   - Are there comments explaining trivial steps (e.g., \`// Initialize variable\`, \`// Return result\`)?
   - Are comments written in a formal, tutorial-like tone rather than a natural learning tone?
   - Does the code contain no comments or overly perfect ones?

4. **Complexity & Efficiency**
   - Is the code more optimized than needed for the task?
   - Does it use advanced patterns (e.g., comprehensions, high-order functions) unlikely for a typical student at this level?

5. **Error Handling & Edge Cases**
   - Does it include overly broad error handling or perfect edge case management not required by the problem?

6. **Signature Patterns of AI Tools**
   - Look for patterns commonly produced by AI tools, such as:
     - Consistent \`for (const item of arr)\` or similar idioms.
     - Explicit step-by-step comments (“// Step 1: Initialize variables”).
     - Overuse of blank lines between logical sections.
     - Imports that are declared but never used (AI leftover pattern).

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


