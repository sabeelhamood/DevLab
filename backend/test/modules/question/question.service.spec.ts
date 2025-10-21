import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionService } from '../../../src/modules/question/question.service';
import { QuestionEntity } from '../../../src/modules/question/entities/question.entity';
import { LearningSessionEntity } from '../../../src/modules/question/entities/learning-session.entity';
import { CacheService } from '../../../src/shared/cache/cache.service';
import { IntegrationService } from '../../../src/modules/integration/integration.service';
import { TestHelpers } from '../../helpers/test-helpers';

describe('QuestionService', () => {
  let service: QuestionService;
  let questionRepository: Repository<QuestionEntity>;
  let sessionRepository: Repository<LearningSessionEntity>;
  let cacheService: CacheService;
  let integrationService: IntegrationService;

  const mockQuestionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        {
          provide: getRepositoryToken(QuestionEntity),
          useValue: mockQuestionRepository,
        },
        {
          provide: getRepositoryToken(LearningSessionEntity),
          useValue: mockSessionRepository,
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            flushAll: jest.fn(),
          },
        },
        {
          provide: IntegrationService,
          useValue: TestHelpers.createMockIntegrationService(),
        },
      ],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
    questionRepository = module.get<Repository<QuestionEntity>>(getRepositoryToken(QuestionEntity));
    sessionRepository = module.get<Repository<LearningSessionEntity>>(getRepositoryToken(LearningSessionEntity));
    cacheService = module.get<CacheService>(CacheService);
    integrationService = module.get<IntegrationService>(IntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalizedQuestions', () => {
    it('should return personalized questions successfully', async () => {
      const learnerId = 'test-learner-123';
      const filters = { topic: 'algorithms', language: 'python', limit: 10 };
      const mockUserProfile = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = [TestHelpers.createMockQuestion()];

      // Mock cache miss
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      
      // Mock integration service calls
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUserProfile);
      jest.spyOn(integrationService, 'getQuestionQuotas').mockResolvedValue(mockQuestionQuotas);
      jest.spyOn(integrationService, 'getContextualContent').mockResolvedValue(mockContextualContent);
      jest.spyOn(integrationService, 'generateQuestion').mockResolvedValue({
        questions: mockQuestions
      });

      // Mock repository query
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(questionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      // Mock cache set
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      const result = await service.getPersonalizedQuestions(learnerId, filters);

      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('total_count');
      expect(result).toHaveProperty('has_more');
      expect(result).toHaveProperty('learner_profile');
      expect(integrationService.getUserProfile).toHaveBeenCalledWith(learnerId);
      expect(integrationService.getQuestionQuotas).toHaveBeenCalledWith(learnerId);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return cached questions when available', async () => {
      const learnerId = 'test-learner-123';
      const filters = { topic: 'algorithms' };
      const cachedResult = {
        questions: [TestHelpers.createMockQuestion()],
        total_count: 1,
        has_more: false,
        learner_profile: {
          skill_level: 3,
          daily_quota_used: 5,
          daily_quota_remaining: 45,
        },
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedResult);

      const result = await service.getPersonalizedQuestions(learnerId, filters);

      expect(result).toEqual(cachedResult);
      expect(integrationService.getUserProfile).not.toHaveBeenCalled();
    });

    it('should throw error when quota exceeded', async () => {
      const learnerId = 'test-learner-123';
      const filters = { topic: 'algorithms' };
      const mockUserProfile = TestHelpers.createMockUser();
      const mockQuestionQuotas = {
        daily_limit: 50,
        daily_used: 50,
        daily_remaining: 0,
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUserProfile);
      jest.spyOn(integrationService, 'getQuestionQuotas').mockResolvedValue(mockQuestionQuotas);

      await expect(service.getPersonalizedQuestions(learnerId, filters)).rejects.toThrow(
        'Daily question quota exceeded'
      );
    });
  });

  describe('submitCodeSolution', () => {
    it('should submit code solution successfully', async () => {
      const questionId = 'test-question-123';
      const submission = {
        learnerId: 'test-learner-123',
        code: 'def solution():\n    return "Hello World"',
        language: 'python',
      };
      const mockQuestion = TestHelpers.createMockQuestion();
      const mockSession = TestHelpers.createMockLearningSession();
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      // Mock question repository
      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(mockQuestion as any);

      // Mock session repository
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'create').mockReturnValue(mockSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(mockSession as any);

      // Mock integration service calls
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(TestHelpers.createMockUser());

      // Mock analytics calls
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      const result = await service.submitCodeSolution(questionId, submission);

      expect(result).toHaveProperty('execution_result');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('session_status');
      expect(result).toHaveProperty('attempts_remaining');
      expect(integrationService.executeCode).toHaveBeenCalled();
      expect(integrationService.generateFeedback).toHaveBeenCalled();
    });

    it('should throw error when question not found', async () => {
      const questionId = 'invalid-question-id';
      const submission = {
        learnerId: 'test-learner-123',
        code: 'def solution():\n    return "Hello World"',
        language: 'python',
      };

      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.submitCodeSolution(questionId, submission)).rejects.toThrow(
        'Question not found'
      );
    });

    it('should update existing session when found', async () => {
      const questionId = 'test-question-123';
      const submission = {
        learnerId: 'test-learner-123',
        code: 'def solution():\n    return "Hello World"',
        language: 'python',
      };
      const mockQuestion = TestHelpers.createMockQuestion();
      const existingSession = TestHelpers.createMockLearningSession();
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(mockQuestion as any);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(existingSession as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(existingSession as any);
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(TestHelpers.createMockUser());

      // Mock analytics calls
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      const result = await service.submitCodeSolution(questionId, submission);

      expect(result).toHaveProperty('execution_result');
      expect(sessionRepository.save).toHaveBeenCalled();
    });
  });

  describe('calculateScore', () => {
    it('should calculate score correctly for successful execution', () => {
      const executionResult = TestHelpers.createMockExecutionResult();
      const testCases = [
        { input: '[1, 2, 3, 4, 5], 3', expected_output: '2' },
        { input: '[1, 2, 3, 4, 5], 6', expected_output: '-1' }
      ];

      const score = (service as any).calculateScore(executionResult, testCases);

      expect(score).toBe(0.5); // 1 passed test out of 2 total tests
    });

    it('should return 0 for failed execution', () => {
      const executionResult = {
        success: false,
        output: '',
        error_message: 'Syntax error',
        execution_time: 0,
        memory_usage: 0,
        test_results: []
      };
      const testCases = [
        { input: '[1, 2, 3, 4, 5], 3', expected_output: '2' }
      ];

      const score = (service as any).calculateScore(executionResult, testCases);

      expect(score).toBe(0);
    });
  });

  describe('calculatePriorityScore', () => {
    it('should calculate priority score correctly', () => {
      const question = TestHelpers.createMockQuestion();
      const learnerProfile = TestHelpers.createMockUser();

      const score = (service as any).calculatePriorityScore(question, learnerProfile);

      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });
  });
});
