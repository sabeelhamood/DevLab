/* eslint-disable max-lines-per-function */
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

const createMemoryStore = () => ({
  invitations: new Map(),
  matches: new Map(),
});

const clone = value => JSON.parse(JSON.stringify(value));

const ensureClient = () => {
  const url = process.env['SUPABASE_URL'];
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
    process.env['SUPABASE_SERVICE_KEY'] ||
    process.env['SUPABASE_KEY'];

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
};

export const createCompetitionRepository = ({
  supabaseClient = ensureClient(),
  memoryStore = createMemoryStore(),
} = {}) => {
  const useSupabase = Boolean(supabaseClient);

  const persistInvitation = async invitation => {
    if (!useSupabase) {
      memoryStore.invitations.set(invitation.id, clone(invitation));
      return clone(invitation);
    }

    const { data, error } = await supabaseClient
      .from('queue_invitations')
      .upsert({
        id: invitation.id,
        learner_id: invitation.learnerId,
        course_id: invitation.courseId,
        course_name: invitation.courseName,
        status: invitation.status,
        payload: invitation,
        expires_at: invitation.expiresAt,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`SUPABASE_INVITATION_ERROR: ${error.message}`);
    }

    return clone(data?.payload ?? invitation);
  };

  const persistMatch = async match => {
    if (!useSupabase) {
      memoryStore.matches.set(match.id, clone(match));
      return clone(match);
    }

    const { data, error } = await supabaseClient
      .from('competitions')
      .upsert({
        id: match.id,
        status: match.status,
        course_id: match.courseId,
        competition_data: match,
        started_at: match.startedAt,
        completed_at: match.completedAt,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`SUPABASE_COMPETITION_ERROR: ${error.message}`);
    }

    return clone(data?.competition_data ?? match);
  };

  return {
    async queueInvitation(invitationInput) {
      const invitation = {
        id: invitationInput.id || uuid(),
        learnerId: invitationInput.learnerId,
        courseId: invitationInput.courseId,
        courseName: invitationInput.courseName,
        status: invitationInput.status || 'pending',
        metadata: invitationInput.metadata || {},
        createdAt: invitationInput.createdAt || new Date().toISOString(),
        expiresAt: invitationInput.expiresAt || null,
      };

      return persistInvitation(invitation);
    },

    async listInvitations(learnerId) {
      if (!useSupabase) {
        return Array.from(memoryStore.invitations.values()).filter(
          item => item.learnerId === learnerId
        );
      }

      const { data, error } = await supabaseClient
        .from('queue_invitations')
        .select('payload')
        .eq('learner_id', learnerId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`SUPABASE_LIST_INVITES_ERROR: ${error.message}`);
      }

      return (data || []).map(item => clone(item.payload));
    },

    async updateInvitationStatus(invitationId, status) {
      if (!useSupabase) {
        const invitation = memoryStore.invitations.get(invitationId);
        if (!invitation) return null;
        invitation.status = status;
        memoryStore.invitations.set(invitationId, invitation);
        return clone(invitation);
      }

      const { data, error } = await supabaseClient
        .from('queue_invitations')
        .update({ status, payload_status: status })
        .eq('id', invitationId)
        .select('payload')
        .single();

      if (error) {
        throw new Error(`SUPABASE_UPDATE_INVITE_ERROR: ${error.message}`);
      }

      const payload = data?.payload;
      if (payload) payload.status = status;
      return clone(payload);
    },

    async createMatch(matchInput) {
      const match = {
        id: matchInput.id || uuid(),
        courseId: matchInput.courseId,
        courseName: matchInput.courseName,
        questions: matchInput.questions,
        participants: matchInput.participants,
        status: matchInput.status || 'pending',
        timer: matchInput.timer,
        createdAt: matchInput.createdAt || new Date().toISOString(),
        startedAt: matchInput.startedAt || null,
        completedAt: matchInput.completedAt || null,
        results: matchInput.results || null,
      };

      return persistMatch(match);
    },

    async updateMatch(matchId, updates) {
      if (!useSupabase) {
        const match = memoryStore.matches.get(matchId);
        if (!match) return null;
        const nextMatch = { ...match, ...updates };
        memoryStore.matches.set(matchId, nextMatch);
        return clone(nextMatch);
      }

      const { data, error } = await supabaseClient
        .from('competitions')
        .select('competition_data')
        .eq('id', matchId)
        .maybeSingle();

      if (error) {
        throw new Error(`SUPABASE_GET_MATCH_ERROR: ${error.message}`);
      }

      const existing = data?.competition_data;
      if (!existing) return null;

      const nextMatch = { ...existing, ...updates };

      return persistMatch(nextMatch);
    },

    async getMatch(matchId) {
      if (!useSupabase) {
        const match = memoryStore.matches.get(matchId);
        return match ? clone(match) : null;
      }

      const { data, error } = await supabaseClient
        .from('competitions')
        .select('competition_data')
        .eq('id', matchId)
        .maybeSingle();

      if (error) {
        throw new Error(`SUPABASE_GET_MATCH_ERROR: ${error.message}`);
      }

      return data?.competition_data ? clone(data.competition_data) : null;
    },
  };
};

export default createCompetitionRepository;
