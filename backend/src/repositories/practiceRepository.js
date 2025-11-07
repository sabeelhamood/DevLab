/* eslint-disable max-lines-per-function */
import { createClient } from '@supabase/supabase-js';

const createMemoryStore = () => ({
  sessions: new Map(),
});

const clone = value => JSON.parse(JSON.stringify(value));

export const createPracticeRepository = ({
  supabaseClient,
  memoryStore = createMemoryStore(),
} = {}) => {
  const hasSupabase = Boolean(supabaseClient);

  const saveToMemory = session => {
    memoryStore.sessions.set(session.id, clone(session));
    return clone(session);
  };

  const getFromMemory = sessionId => {
    const session = memoryStore.sessions.get(sessionId);
    return session ? clone(session) : null;
  };

  const persistSession = async session => {
    if (!hasSupabase) {
      return saveToMemory(session);
    }

    const { error } = await supabaseClient.from('practice_sessions').upsert({
      id: session.id,
      learner_id: session.learnerId,
      course_id: session.courseId,
      session_data: session,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`SUPABASE_PERSIST_ERROR: ${error.message}`);
    }

    return clone(session);
  };

  const fetchSession = async sessionId => {
    if (!hasSupabase) {
      return getFromMemory(sessionId);
    }

    const { data, error } = await supabaseClient
      .from('practice_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`SUPABASE_FETCH_ERROR: ${error.message}`);
    }

    return data?.session_data ? clone(data.session_data) : null;
  };

  return {
    async saveSession(session) {
      return persistSession(session);
    },

    async getSession(sessionId) {
      return fetchSession(sessionId);
    },

    async updateQuestion(sessionId, questionId, updater) {
      const session = await fetchSession(sessionId);
      if (!session) return null;

      const questionIndex = session.questions.findIndex(
        q => q.id === questionId
      );
      if (questionIndex === -1) return null;

      const currentQuestion = session.questions[questionIndex];
      const updates = updater(clone(currentQuestion)) || {};

      session.questions[questionIndex] = {
        ...currentQuestion,
        ...updates,
      };
      session.updatedAt = new Date().toISOString();

      await persistSession(session);
      return clone(session.questions[questionIndex]);
    },

    async recordSubmission(sessionId, questionId, submission) {
      const session = await fetchSession(sessionId);
      if (!session) return null;

      const questionIndex = session.questions.findIndex(
        q => q.id === questionId
      );
      if (questionIndex === -1) return null;

      const question = session.questions[questionIndex];
      const submissions = question.submissions ? [...question.submissions] : [];
      submissions.push(submission);

      session.questions[questionIndex] = {
        ...question,
        submissions,
        lastSubmissionAt: submission.submittedAt,
      };
      session.updatedAt = new Date().toISOString();

      await persistSession(session);
      return clone(session.questions[questionIndex]);
    },
  };
};

export const createSupabasePracticeRepository = () => {
  const url = process.env['SUPABASE_URL'];
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
    process.env['SUPABASE_SERVICE_KEY'] ||
    process.env['SUPABASE_KEY'];

  if (!url || !key) {
    return createPracticeRepository({});
  }

  const client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return createPracticeRepository({ supabaseClient: client });
};

export default createSupabasePracticeRepository;
