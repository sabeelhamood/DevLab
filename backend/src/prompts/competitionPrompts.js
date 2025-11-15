export const buildCompetitionQuestionsPrompt = (courseName = 'this course') => `
You are an expert instructor generating a competition for a learner who just completed a specific course.
The course name is: ${courseName}.

Generate exactly 3 high-quality, challenging questions for this course.
- Each question should take approximately 10 minutes to solve.
- Do NOT include hints or explanations.
- Return the questions as JSON array with the following format:

[
  { "question_id": "q1", "question": "First question text" },
  { "question_id": "q2", "question": "Second question text" },
  { "question_id": "q3", "question": "Third question text" }
]

Return only valid JSON.
`.trim()


