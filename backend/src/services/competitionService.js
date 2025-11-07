/* eslint-disable max-lines-per-function */
const createCompetitionService = ({
  queueManager,
  geminiClient,
  analyticsExporter,
}) => {
  const now = () => new Date().toISOString();

  const scheduleInvitation = async ({
    courseId,
    courseName,
    learnerId,
    metadata,
  }) => {
    const invitation = await queueManager.inviteLearner({
      courseId,
      courseName,
      learnerId,
      metadata,
    });
    return invitation;
  };

  const listInvitations = learnerId => queueManager.listInvitations(learnerId);

  const acceptInvitation = async ({ invitationId, learnerId }) => {
    const invitation = await queueManager.acceptInvitation({
      invitationId,
      learnerId,
    });
    return invitation;
  };

  const declineInvitation = ({ invitationId, learnerId }) =>
    queueManager.declineInvitation({ invitationId, learnerId });

  const startMatch = async ({
    courseId,
    courseName,
    participants,
    questions,
    timer,
  }) => {
    const match = await queueManager.createMatch({
      courseId,
      courseName,
      participants,
      questions,
      timer,
    });
    return match;
  };

  const submitRound = async ({ matchId, submission }) => {
    const match = await queueManager.getMatch(matchId);
    if (!match) {
      const error = new Error('MATCH_NOT_FOUND');
      error.code = 'MATCH_NOT_FOUND';
      throw error;
    }

    const currentQuestionIndex = submission.questionIndex;
    match.results = match.results || {};
    match.results[submission.participantId] =
      match.results[submission.participantId] || [];

    const evaluation = await geminiClient.evaluateSolution({
      question: match.questions[currentQuestionIndex],
      submission: {
        language: submission.language,
        code: submission.code,
      },
    });

    match.results[submission.participantId][currentQuestionIndex] = {
      submittedAt: now(),
      evaluation,
    };

    await queueManager.updateMatch(matchId, match);

    return {
      evaluation,
    };
  };

  const completeMatch = async ({ matchId }) => {
    const match = await queueManager.getMatch(matchId);
    if (!match) {
      const error = new Error('MATCH_NOT_FOUND');
      error.code = 'MATCH_NOT_FOUND';
      throw error;
    }

    const scoreParticipant = participantId => {
      const submissions = match.results?.[participantId] || [];
      const score = submissions.reduce(
        (total, result) => total + (result?.evaluation?.correct ? 1 : 0),
        0
      );
      return {
        participantId,
        score,
        questionsAnswered: submissions.filter(res => res?.evaluation?.correct)
          .length,
      };
    };

    const [participantOne, participantTwo] = match.participants;
    const performanceLearner1 = scoreParticipant(participantOne.id);
    const performanceLearner2 = scoreParticipant(participantTwo.id);

    match.status = 'completed';
    match.completedAt = now();
    match.winner =
      performanceLearner1.score >= performanceLearner2.score
        ? participantOne.id
        : participantTwo.id;

    await queueManager.updateMatch(matchId, match);

    await analyticsExporter?.exportCompetition?.({
      competitionId: match.id,
      courseId: match.courseId,
      createdAt: match.createdAt,
      timer: match.timer,
      learner1Id: participantOne.id,
      learner2Id: participantTwo.id,
      performanceLearner1,
      performanceLearner2,
      score: {
        learner1: performanceLearner1.score,
        learner2: performanceLearner2.score,
      },
      questionsAnswered: {
        learner1: performanceLearner1.questionsAnswered,
        learner2: performanceLearner2.questionsAnswered,
      },
    });

    return match;
  };

  return {
    scheduleInvitation,
    listInvitations,
    acceptInvitation,
    declineInvitation,
    startMatch,
    submitRound,
    completeMatch,
    getMatch: matchId => queueManager.getMatch(matchId),
  };
};

export default createCompetitionService;
