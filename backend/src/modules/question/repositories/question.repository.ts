import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QuestionEntity } from '../entities/question.entity';
import { LearningSessionEntity } from '../entities/learning-session.entity';

@Injectable()
export class QuestionRepository {
  private readonly logger = new Logger(QuestionRepository.name);

  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
    @InjectRepository(LearningSessionEntity)
    private readonly sessionRepository: Repository<LearningSessionEntity>,
  ) {}

  /**
   * Find questions by criteria
   */
  async findQuestions(criteria: {
    topic?: string;
    language?: string;
    difficulty?: number;
    skillLevel?: number;
    limit?: number;
  }): Promise<QuestionEntity[]> {
    try {
      const query = this.questionRepository
        .createQueryBuilder('question')
        .where('question.is_active = :isActive', { isActive: true });

      if (criteria.topic) {
        query.andWhere('question.topic = :topic', { topic: criteria.topic });
      }

      if (criteria.language) {
        query.andWhere('question.programming_language = :language', { 
          language: criteria.language 
        });
      }

      if (criteria.difficulty) {
        query.andWhere('question.difficulty_level = :difficulty', { 
          difficulty: criteria.difficulty 
        });
      } else if (criteria.skillLevel) {
        query.andWhere('question.difficulty_level BETWEEN :minLevel AND :maxLevel', {
          minLevel: Math.max(1, criteria.skillLevel - 1),
          maxLevel: Math.min(10, criteria.skillLevel + 1),
        });
      }

      return query
        .orderBy('question.quality_score', 'DESC')
        .addOrderBy('question.success_rate', 'DESC')
        .limit(criteria.limit || 20)
        .getMany();

    } catch (error) {
      this.logger.error(`Failed to find questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find question by ID
   */
  async findById(id: string): Promise<QuestionEntity | null> {
    try {
      return this.questionRepository.findOne({
        where: { id, is_active: true }
      });
    } catch (error) {
      this.logger.error(`Failed to find question by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new question
   */
  async create(questionData: Partial<QuestionEntity>): Promise<QuestionEntity> {
    try {
      const question = this.questionRepository.create(questionData);
      return this.questionRepository.save(question);
    } catch (error) {
      this.logger.error(`Failed to create question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update question
   */
  async update(id: string, updateData: Partial<QuestionEntity>): Promise<QuestionEntity> {
    try {
      await this.questionRepository.update(id, updateData);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Failed to update question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Soft delete question
   */
  async delete(id: string): Promise<void> {
    try {
      await this.questionRepository.update(id, { is_active: false });
    } catch (error) {
      this.logger.error(`Failed to delete question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get learning sessions for a learner
   */
  async getLearningSessions(
    learnerId: string, 
    filters: { status?: string; limit?: number } = {}
  ): Promise<LearningSessionEntity[]> {
    try {
      const query = this.sessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.question', 'question')
        .where('session.learner_id = :learnerId', { learnerId });

      if (filters.status) {
        query.andWhere('session.status = :status', { status: filters.status });
      }

      return query
        .orderBy('session.created_at', 'DESC')
        .limit(filters.limit || 20)
        .getMany();

    } catch (error) {
      this.logger.error(`Failed to get learning sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get learning session by ID
   */
  async getLearningSession(sessionId: string, learnerId: string): Promise<LearningSessionEntity | null> {
    try {
      return this.sessionRepository.findOne({
        where: { id: sessionId, learner_id: learnerId },
        relations: ['question']
      });
    } catch (error) {
      this.logger.error(`Failed to get learning session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create learning session
   */
  async createLearningSession(sessionData: Partial<LearningSessionEntity>): Promise<LearningSessionEntity> {
    try {
      const session = this.sessionRepository.create(sessionData);
      return this.sessionRepository.save(session);
    } catch (error) {
      this.logger.error(`Failed to create learning session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update learning session
   */
  async updateLearningSession(
    sessionId: string, 
    updateData: Partial<LearningSessionEntity>
  ): Promise<LearningSessionEntity> {
    try {
      await this.sessionRepository.update(sessionId, updateData);
      return this.sessionRepository.findOne({ where: { id: sessionId } });
    } catch (error) {
      this.logger.error(`Failed to update learning session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(questionId: string): Promise<any> {
    try {
      const stats = await this.sessionRepository
        .createQueryBuilder('session')
        .select([
          'COUNT(*) as total_attempts',
          'AVG(session.score) as average_score',
          'COUNT(CASE WHEN session.score >= 0.8 THEN 1 END) as successful_attempts',
          'AVG(session.total_execution_time) as average_execution_time'
        ])
        .where('session.question_id = :questionId', { questionId })
        .andWhere('session.status = :status', { status: 'completed' })
        .getRawOne();

      return {
        total_attempts: parseInt(stats.total_attempts) || 0,
        average_score: parseFloat(stats.average_score) || 0,
        success_rate: stats.total_attempts > 0 ? 
          (parseInt(stats.successful_attempts) / parseInt(stats.total_attempts)) : 0,
        average_execution_time: parseFloat(stats.average_execution_time) || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get question stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get learner progress
   */
  async getLearnerProgress(learnerId: string): Promise<any> {
    try {
      const progress = await this.sessionRepository
        .createQueryBuilder('session')
        .select([
          'COUNT(*) as total_sessions',
          'COUNT(CASE WHEN session.status = :completed THEN 1 END) as completed_sessions',
          'AVG(session.score) as average_score',
          'COUNT(DISTINCT session.question_id) as unique_questions',
          'AVG(session.total_execution_time) as average_execution_time'
        ])
        .where('session.learner_id = :learnerId', { learnerId })
        .setParameter('completed', 'completed')
        .getRawOne();

      return {
        total_sessions: parseInt(progress.total_sessions) || 0,
        completed_sessions: parseInt(progress.completed_sessions) || 0,
        completion_rate: progress.total_sessions > 0 ? 
          (parseInt(progress.completed_sessions) / parseInt(progress.total_sessions)) : 0,
        average_score: parseFloat(progress.average_score) || 0,
        unique_questions: parseInt(progress.unique_questions) || 0,
        average_execution_time: parseFloat(progress.average_execution_time) || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get learner progress: ${error.message}`);
      throw error;
    }
  }
}
