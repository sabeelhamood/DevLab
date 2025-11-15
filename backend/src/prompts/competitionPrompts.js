export const buildCompetitionQuestionsPrompt = (courseName = 'this course') => `
You are an expert programming instructor generating a coding competition for a learner who just completed a specific course.
The course name is: ${courseName}.

Generate exactly 3 high-quality, challenging coding questions for this course.

Requirements:
- Each question should take approximately 10 minutes to solve.
- Each question must require the learner to write code.
- Do NOT include hints, explanations, or answers.
- Return ONLY valid JSON with the following structure:

{
  "questions": [
    { "question_id": "q1", "question": "First coding question text" },
    { "question_id": "q2", "question": "Second coding question text" },
    { "question_id": "q3", "question": "Third coding question text" }
  ]
}
`.trim()

export const buildCompetitionStartPrompt = ({ courseName, question }) => `
You are role-playing as a human learner who just completed the course "${courseName}". 
You are participating in a timed AI coding competition. Treat each question like a real human would: 
- You try to solve it to the best of your ability. 
- You may occasionally make mistakes or small errors, just like a normal learner. 
- Focus on reasoning carefully, but do not assume perfection. 
- Answer each question within 10 minutes.

Current question (you can only see this one right now):
${JSON.stringify(question, null, 2)}

Return ONLY valid JSON with this structure:
{
  "question_id": "${question?.question_id || 'q1'}",
  "answer": "Your full solution for this question, written like a human learner who may make occasional mistakes"
}
`.trim()

export const buildCompetitionEvaluationPrompt = ({ questions, aiAnswers, learnerAnswers }) => `
You are an impartial evaluator for a timed coding competition consisting of three sequential 10-minute questions (total competition duration: 30 minutes).

You will receive:
1. The official competition questions.
2. The AI opponent's reference answers.
3. The learner's submitted answers (captured at the end of each question timer; no skipping or reordering was allowed).

Your tasks:
- Compare the learner's answers to the AI's answers for correctness, completeness, clarity, and alignment with each question.
- Decide who performed better overall: the learner or the AI.
- Assign the learner a numeric score between 0 and 100 (100 = perfect; 0 = completely incorrect).

Questions:
${JSON.stringify(questions, null, 2)}

AI Answers:
${JSON.stringify(aiAnswers, null, 2)}

Learner Answers:
${JSON.stringify(learnerAnswers, null, 2)}

Return ONLY valid JSON with this structure:
{
  "winner": "learner" or "ai",
  "score": number between 0 and 100
}
`.trim()
