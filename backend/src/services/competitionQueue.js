/* eslint-disable max-lines-per-function */
import { v4 as uuid } from 'uuid';

const createQueueManager = ({ repository, logger }) => {
  const inviteLearner = async ({
    learnerId,
    courseId,
    courseName,
    metadata,
  }) => {
    const invitation = await repository.queueInvitation({
      learnerId,
      courseId,
      courseName,
      metadata,
      status: 'pending',
    });

    logger.info?.('competitionQueue.inviteLearner', {
      learnerId,
      courseId,
      invitationId: invitation.id,
    });
    return invitation;
  };

  const acceptInvitation = async ({ invitationId, learnerId }) => {
    const invitation = await repository.updateInvitationStatus(
      invitationId,
      'accepted'
    );

    if (!invitation) {
      const error = new Error('INVITATION_NOT_FOUND');
      error.code = 'INVITATION_NOT_FOUND';
      throw error;
    }

    if (invitation.learnerId !== learnerId) {
      const error = new Error('INVITATION_FORBIDDEN');
      error.code = 'INVITATION_FORBIDDEN';
      throw error;
    }

    logger.info?.('competitionQueue.acceptInvitation', {
      invitationId,
      learnerId,
    });
    return invitation;
  };

  const declineInvitation = async ({ invitationId, learnerId }) => {
    const invitation = await repository.updateInvitationStatus(
      invitationId,
      'declined'
    );

    if (!invitation) {
      const error = new Error('INVITATION_NOT_FOUND');
      error.code = 'INVITATION_NOT_FOUND';
      throw error;
    }

    if (invitation.learnerId !== learnerId) {
      const error = new Error('INVITATION_FORBIDDEN');
      error.code = 'INVITATION_FORBIDDEN';
      throw error;
    }

    logger.info?.('competitionQueue.declineInvitation', {
      invitationId,
      learnerId,
    });
    return invitation;
  };

  const createMatch = async ({
    courseId,
    courseName,
    participants,
    questions,
    timer,
  }) => {
    const match = await repository.createMatch({
      id: uuid(),
      courseId,
      courseName,
      participants,
      questions,
      timer,
      status: 'pending',
    });

    logger.info?.('competitionQueue.createMatch', {
      matchId: match.id,
      courseId,
      participants,
    });
    return match;
  };

  return {
    listInvitations: learnerId => repository.listInvitations(learnerId),
    inviteLearner,
    acceptInvitation,
    declineInvitation,
    createMatch,
    getMatch: matchId => repository.getMatch(matchId),
    updateMatch: (matchId, updates) => repository.updateMatch(matchId, updates),
  };
};

export default createQueueManager;
