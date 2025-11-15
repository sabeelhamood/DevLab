export const buildCompetitionQuestionsPrompt = (courseName = 'this course') => `
You are an expert programming instructor generating a coding competition for a learner who just completed a specific course.
The course name is: ${courseName}.

Generate exactly 3 high-quality, challenging coding questions for this course.
- Each question should take approximately 10 minutes to solve.
- Do NOT include hints or explanations.
- Each question must require the learner to write code to solve it.
- Return the questions as a JSON array with the following format:

[
  { "question_id": "q1", "question": "First coding question text" },
  { "question_id": "q2", "question": "Second coding question text" },
  { "question_id": "q3", "question": "Third coding question text" }
]

Return only valid JSON.
`.trim()


