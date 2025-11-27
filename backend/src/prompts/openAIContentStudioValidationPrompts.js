// Dedicated prompts for the Content Studio validation workflow.
// These are intentionally separated so existing generation prompts remain untouched.

export function buildCodingExerciseValidationPrompt({
  topicName,
  questionType,
  programmingLanguage,
  skills = [],
  humanLanguage = 'en',
  exercises = []
}) {
  const normalizedSkills =
    Array.isArray(skills) && skills.length ? skills.join(', ') : 'General programming skills'
  const normalizedExercises =
    Array.isArray(exercises) && exercises.length ? exercises : ['(no exercise text provided)']

  return `
You are the strict validation gatekeeper for a coding question authoring tool called DevLab Content Studio.

A trainer submitted raw exercises that MUST be relevant to ALL of the following constraints:
1. Topic name: ${topicName || 'N/A'}
2. Question type: ${questionType || 'N/A'}
3. Programming language: ${programmingLanguage || 'N/A'}
4. Required skills: ${normalizedSkills}
5. Output language: ${humanLanguage}

Trainer-provided exercises:
${normalizedExercises.map((exercise, index) => `Exercise ${index + 1}: ${exercise}`).join('\n')}

TASK:
- Inspect every exercise.
- If every exercise satisfies ALL constraints, respond exactly with: TRUE
- If ANY constraint is violated, respond exactly with: FALSE: <one sentence explanation of the mismatch>

Rules:
- Do NOT add extra text, JSON, or commentary.
- Be explicit in the FALSE explanation (e.g., wrong topic, wrong language, missing skills).
- If the programming language is not visible in the exercises, consider that a mismatch unless the instructions clearly imply it.
`.trim()
}

export function buildTrainerExerciseTransformationPrompt({
  topicName,
  topicId,
  programmingLanguage,
  skills = [],
  humanLanguage = 'en',
  exercises = []
}) {
  const normalizedSkills =
    Array.isArray(skills) && skills.length ? skills : ['General programming skills']
  const sanitizedExercises = Array.isArray(exercises) ? exercises.filter(Boolean) : []
  const skillsJson = JSON.stringify(normalizedSkills)

  const topicIdSnippet =
    typeof topicId === 'number' || (typeof topicId === 'string' && topicId.trim().length)
      ? JSON.stringify(topicId)
      : 'null'

  return `
You are a senior instructional designer for DevLab Content Studio.

The trainer provided raw exercises that already passed validation:
${sanitizedExercises.map((exercise, index) => `Exercise ${index + 1}: ${exercise}`).join('\n')}

Transform EACH exercise into a fully-structured CODING question for the DevLab renderer located at backend/src/utils/codeContentStudioRender.js. The renderer expects the following strict JSON shape per question:
{
  "title": "Concise rewritten title (no numbering)",
  "description": "Clear rewritten instructions referencing ${programmingLanguage || 'the target language'}",
  "testCases": [
    {"input": "functionCall(…)", "expectedOutput": "value", "explanation": "why this case matters"},
    {"input": "...", "expectedOutput": "...", "explanation": "..."},
    {"input": "...", "expectedOutput": "...", "explanation": "..."}
  ],
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "language": "${programmingLanguage || 'javascript'}",
  "question_type": "code",
  "topic_id": ${topicIdSnippet},
  "topic_name": "${topicName || ''}",
  "skills": ${skillsJson}
}

Requirements:
- Maintain the trainer’s intent but rewrite titles/descriptions professionally.
- Hints must be actionable and distinct.
- Provide EXACTLY 3 test cases per exercise with the required fields.
- Output language for descriptions and hints must be ${humanLanguage}.
- Return ONLY a JSON array \`[]\` containing the transformed questions, no markdown fences or prose.
`.trim()
}


