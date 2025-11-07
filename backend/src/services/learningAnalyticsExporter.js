/* eslint-disable max-lines-per-function */
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 30_000;
const DEFAULT_MAX_DELAY_MS = 300_000;

const defaultSchedule = (fn, delay) => setTimeout(fn, delay);

const createLearningAnalyticsExporter = ({
  logger = console,
  transport,
  scheduleFn,
  config = {},
} = {}) => {
  const queue = new Map();
  const schedule = scheduleFn || defaultSchedule;
  const maxAttempts = config.maxAttempts || DEFAULT_MAX_ATTEMPTS;
  const baseDelay = config.baseDelayMs || DEFAULT_BASE_DELAY_MS;
  const maxDelay = config.maxDelayMs || DEFAULT_MAX_DELAY_MS;

  const defaultTransport = async payload => {
    if (!config.url) {
      logger.info?.('learningAnalyticsExporter.skip', {
        reason: 'No LEARNING_ANALYTICS_URL configured',
        competitionId: payload.competitionId,
      });
      return;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.authToken
          ? { Authorization: `Bearer ${config.authToken}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Learning analytics export failed: ${response.status} ${text}`
      );
    }
  };

  const send = async job => {
    try {
      await (transport || defaultTransport)(job.payload);
      logger.info?.('learningAnalyticsExporter.success', {
        competitionId: job.payload.competitionId,
        attempts: job.attempts,
      });
      queue.delete(job.id);
    } catch (error) {
      logger.warn?.('learningAnalyticsExporter.retry', {
        competitionId: job.payload.competitionId,
        attempts: job.attempts + 1,
        error: error.message,
      });

      if (job.attempts + 1 >= maxAttempts) {
        logger.error?.('learningAnalyticsExporter.giveUp', {
          competitionId: job.payload.competitionId,
          error: error.message,
        });
        queue.delete(job.id);
        return;
      }

      job.attempts += 1;
      const delay = Math.min(baseDelay * Math.pow(job.attempts, 2), maxDelay);
      if (job.timer) {
        clearTimeout(job.timer);
      }
      job.timer = schedule(() => send(job), delay);
      queue.set(job.id, job);
    }
  };

  return {
    async exportCompetition(payload) {
      const job = {
        id: uuid(),
        payload,
        attempts: 0,
        timer: null,
      };

      await send(job);
      return { success: true };
    },

    async flushQueue() {
      const pendingJobs = Array.from(queue.values());
      queue.clear();

      await Promise.all(
        pendingJobs.map(async job => {
          if (job.timer) {
            clearTimeout(job.timer);
            job.timer = null;
          }
          job.attempts = Math.min(job.attempts, maxAttempts - 1);
          return send(job);
        })
      );
    },

    getPendingJobs() {
      return queue.size;
    },
  };
};

export default createLearningAnalyticsExporter;
