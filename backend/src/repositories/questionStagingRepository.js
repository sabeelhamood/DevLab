/* eslint-disable max-lines-per-function */
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

const ensureClient = () => {
  const url = process.env['SUPABASE_URL'];
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
    process.env['SUPABASE_SERVICE_KEY'] ||
    process.env['SUPABASE_KEY'];

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

const createMemoryStore = () => ({ staging: new Map() });

const clone = value => JSON.parse(JSON.stringify(value));

const createQuestionStagingRepository = ({
  supabaseClient = ensureClient(),
  memoryStore = createMemoryStore(),
} = {}) => {
  const useSupabase = Boolean(supabaseClient);

  const persist = async record => {
    if (!useSupabase) {
      memoryStore.staging.set(record.id, clone(record));
      return clone(record);
    }

    const { data, error } = await supabaseClient
      .from('question_staging')
      .upsert({
        id: record.id,
        topic_id: record.topicId,
        question_type: record.questionType,
        payload: record,
        expires_at: record.expiresAt,
        created_at: record.createdAt,
      })
      .select('payload')
      .single();

    if (error) {
      throw new Error(`SUPABASE_STAGE_ERROR: ${error.message}`);
    }

    return clone(data?.payload ?? record);
  };

  return {
    async stageQuestion(input) {
      const record = {
        id: input.id || uuid(),
        topicId: input.topicId,
        topicName: input.topicName,
        questionType: input.questionType,
        programmingLanguage: input.programmingLanguage,
        question: input.question,
        generated: input.generated || false,
        createdAt: input.createdAt || new Date().toISOString(),
        expiresAt: input.expiresAt || null,
        metadata: input.metadata || {},
      };

      return persist(record);
    },

    async getQuestion(id) {
      if (!useSupabase) {
        const record = memoryStore.staging.get(id);
        return record ? clone(record) : null;
      }

      const { data, error } = await supabaseClient
        .from('question_staging')
        .select('payload')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`SUPABASE_STAGE_FETCH_ERROR: ${error.message}`);
      }

      return data?.payload ? clone(data.payload) : null;
    },

    async deleteQuestion(id) {
      if (!useSupabase) {
        memoryStore.staging.delete(id);
        return true;
      }

      const { error } = await supabaseClient
        .from('question_staging')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`SUPABASE_STAGE_DELETE_ERROR: ${error.message}`);
      }

      return true;
    },
  };
};

export default createQuestionStagingRepository;
