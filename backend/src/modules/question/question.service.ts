import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CacheService } from '../../shared/cache/cache.service';
import { IntegrationService } from '../integration/integration.service';
import { QuestionEntity } from './entities/question.entity';
import { LearningSessionEntity } from './entities/learning-session.entity';
import { 
  PersonalizedQuestionsDto, 
  QuestionSubmissionDto, 
  QuestionResponseDto,
  LearningSessionDto 
} from './dto/question.dto';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
    @InjectRepository(LearningSessionEntity)
    private readonly sessionRepository: Repository<LearningSessionEntity>,
    @InjectQueue('question-generation')
    private readonly questionGenerationQueue: Queue,
    @InjectQueue('question-validation')
    private readonly questionValidationQueue: Queue,
    private readonly cacheService: CacheService,
    private readonly integrationService: IntegrationService,
  ) {}

  /**
   * Get personalized questions for a learner
   */
  async getPersonalizedQuestions(
    learnerId: string, 
    personalizedQuestionsDto: PersonalizedQuestionsDto
  ): Promise<QuestionResponseDto> {
    try {
      this.logger.log(`Getting personalized questions for learner: ${learnerId}`);

      // Check cache first
      const cacheKey = `questions:personalized:${learnerId}:${JSON.stringify(personalizedQuestionsDto)}`;
      const cachedQuestions = await this.cacheService.get(cacheKey);
      
      if (cachedQuestions) {
        this.logger.log('Personalized questions found in cache');
        return cachedQuestions;
      }

      // Get learner profile and quotas
      const learnerProfile = await this.integrationService.getUserProfile(learnerId);
      const questionQuotas = await this.integrationService.getQuestionQuotas(learnerId);

      // Check if learner has remaining quota
      if (questionQuotas.daily_used >= questionQuotas.daily_limit) {
        throw new BadRequestException('Daily question quota exceeded');
      }

      // Get contextual content from Content Studio
      const contextualContent = await this.integrationService.getContextualContent(
        personalizedQuestionsDto.topic || 'general'
      );

      // Generate AI-powered questions using Gemini
      const aiQuestions = await this.generateAIQuestions({
        learnerId,
        skillLevel: learnerProfile.skillLevel,
        topic: personalizedQuestionsDto.topic,
        language: personalizedQuestionsDto.language,
        difficulty: personalizedQuestionsDto.difficulty,
        contextualContent,
      });

      // Get existing questions from repository
      const existingQuestions = await this.getQuestionsFromRepository(
        personalizedQuestionsDto,
        learnerProfile.skillLevel
      );

      // Combine and prioritize questions
      const allQuestions = [...aiQuestions, ...existingQuestions];
      const personalizedQuestions = this.prioritizeQuestions(allQuestions, learnerProfile);

      // Limit results based on quota
      const limitedQuestions = personalizedQuestions.slice(0, 
        Math.min(personalizedQuestionsDto.limit || 10, questionQuotas.daily_remaining)
      );

      const response: QuestionResponseDto = {
        questions: limitedQuestions,
        total_count: limitedQuestions.length,
        has_more: personalizedQuestions.length > limitedQuestions.length,
        learner_profile: {
          skill_level: learnerProfile.skillLevel,
          daily_quota_used: questionQuotas.daily_used,
          daily_quota_remaining: questionQuotas.daily_remaining,
        },
      };

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, response, 300);

      this.logger.log(`Generated ${limitedQuestions.length} personalized questions for learner: ${learnerId}`);
      return response;

    } catch (error) {
      this.logger.error(`Failed to get personalized questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit code solution for a question
   */
  async submitCodeSolution(
    questionId: string,
    submissionDto: QuestionSubmissionDto
  ): Promise<any> {
    try {
      this.logger.log(`Submitting code solution for question: ${questionId}`);

      // Get question details
      const question = await this.questionRepository.findOne({
        where: { id: questionId, is_active: true }
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      // Create or update learning session
      let session = await this.sessionRepository.findOne({
        where: { 
          learner_id: submissionDto.learnerId,
          question_id: questionId,
          status: 'active'
        }
      });

      if (!session) {
        session = this.sessionRepository.create({
          learner_id: submissionDto.learnerId,
          question_id: questionId,
          session_start: new Date(),
          status: 'active',
          attempts: 0,
        });
      }

      // Execute code using SandBox API
      const executionResult = await this.integrationService.executeCode({
        code: submissionDto.code,
        language: submissionDto.language,
        test_cases: question.test_cases,
        timeout: 30000,
      });

      // Generate AI feedback using Gemini
      const aiFeedback = await this.integrationService.generateFeedback({
        question: question,
        code: submissionDto.code,
        execution_result: executionResult,
        learner_profile: await this.integrationService.getUserProfile(submissionDto.learnerId),
      });

      // Update session with results
      session.attempts += 1;
      session.code_submissions = [...(session.code_submissions || []), {
        code: submissionDto.code,
        timestamp: new Date(),
        execution_result: executionResult,
      }];
      session.execution_results = executionResult;
      session.total_execution_time = executionResult.execution_time;
      session.total_memory_usage = executionResult.memory_usage;
      session.ai_feedback = aiFeedback.feedback;

      // Calculate score
      const score = this.calculateScore(executionResult, question.test_cases);
      session.score = score;

      // Check if session should be completed
      if (score >= 0.8 || session.attempts >= session.max_attempts) {
        session.status = 'completed';
        session.session_end = new Date();
      }

      await this.sessionRepository.save(session);

      // Send analytics data
      await this.sendAnalyticsData(session, executionResult, aiFeedback);

      this.logger.log(`Code solution submitted successfully for question: ${questionId}`);
      return {
        execution_result: executionResult,
        feedback: aiFeedback,
        score: score,
        session_status: session.status,
        attempts_remaining: session.max_attempts - session.attempts,
      };

    } catch (error) {
      this.logger.error(`Failed to submit code solution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate AI-powered questions using Gemini
   */
  private async generateAIQuestions(params: any): Promise<any[]> {
    try {
      const aiQuestions = await this.integrationService.generateQuestion({
        topic: params.topic,
        difficulty_level: params.difficulty || params.skillLevel,
        programming_language: params.language,
        learner_profile: {
          skill_level: params.skillLevel,
          learning_style: 'practical',
          previous_topics: [],
        },
        contextual_content: params.contextualContent,
      });

      return aiQuestions.questions || [];
    } catch (error) {
      this.logger.error(`Failed to generate AI questions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get questions from repository
   */
  private async getQuestionsFromRepository(
    filters: PersonalizedQuestionsDto,
    skillLevel: number
  ): Promise<QuestionEntity[]> {
    const query = this.questionRepository
      .createQueryBuilder('question')
      .where('question.is_active = :isActive', { isActive: true })
      .andWhere('question.difficulty_level BETWEEN :minLevel AND :maxLevel', {
        minLevel: Math.max(1, skillLevel - 1),
        maxLevel: Math.min(10, skillLevel + 1),
      });

    if (filters.topic) {
      query.andWhere('question.topic = :topic', { topic: filters.topic });
    }

    if (filters.language) {
      query.andWhere('question.programming_language = :language', { 
        language: filters.language 
      });
    }

    if (filters.difficulty) {
      query.andWhere('question.difficulty_level = :difficulty', { 
        difficulty: filters.difficulty 
      });
    }

    return query
      .orderBy('question.quality_score', 'DESC')
      .addOrderBy('question.success_rate', 'DESC')
      .limit(20)
      .getMany();
  }

  /**
   * Prioritize questions based on learner profile
   */
  private prioritizeQuestions(questions: any[], learnerProfile: any): any[] {
    return questions
      .map(question => ({
        ...question,
        priority_score: this.calculatePriorityScore(question, learnerProfile),
      }))
      .sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Calculate priority score for question
   */
  private calculatePriorityScore(question: any, learnerProfile: any): number {
    let score = 0;

    // Difficulty alignment
    const difficultyDiff = Math.abs(question.difficulty_level - learnerProfile.skillLevel);
    score += Math.max(0, 10 - difficultyDiff);

    // Quality score
    score += (question.quality_score || 0) * 10;

    // Success rate
    score += (question.success_rate || 0) * 5;

    // Usage count (prefer less used questions)
    score += Math.max(0, 10 - (question.usage_count || 0) / 10);

    return score;
  }

  /**
   * Calculate score based on execution results
   */
  private calculateScore(executionResult: any, testCases: any[]): number {
    if (!executionResult.success) {
      return 0;
    }

    const passedTests = executionResult.test_results?.filter((result: any) => result.passed).length || 0;
    const totalTests = testCases?.length || 1;
    
    return Math.round((passedTests / totalTests) * 100) / 100;
  }

  /**
   * Send analytics data to external services
   */
  private async sendAnalyticsData(session: LearningSessionEntity, executionResult: any, aiFeedback: any): Promise<void> {
    try {
      // Send to Learning Analytics
      await this.integrationService.sendPracticeCompletion({
        learner_id: session.learner_id,
        session_id: session.id,
        question_id: session.question_id,
        score: session.score,
        attempts: session.attempts,
        execution_time: executionResult.execution_time,
        completion_status: session.status,
      });

      // Send to HR Reporting
      await this.integrationService.sendPracticeLevel({
        learner_id: session.learner_id,
        practice_level: session.score,
        skill_improvement: aiFeedback.skill_improvement,
        completion_date: new Date(),
      });

      // Send to Contextual Assistant
      await this.integrationService.sendLearnerPerformance({
        learner_id: session.learner_id,
        performance_metrics: {
          score: session.score,
          execution_time: executionResult.execution_time,
          feedback_quality: aiFeedback.quality_score,
        },
        learning_insights: aiFeedback.insights,
      });

    } catch (error) {
      this.logger.error(`Failed to send analytics data: ${error.message}`);
    }
  }
}
