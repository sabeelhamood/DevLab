import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { QuestionService } from './question.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  PersonalizedQuestionsDto, 
  QuestionSubmissionDto, 
  QuestionResponseDto,
  LearningSessionDto 
} from './dto/question.dto';

@ApiTags('Questions')
@Controller('questions')
@UseGuards(ThrottlerGuard, AuthGuard)
export class QuestionController {
  private readonly logger = new Logger(QuestionController.name);

  constructor(private readonly questionService: QuestionService) {}

  @Get('personalized')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get personalized questions',
    description: 'Retrieves AI-generated personalized questions based on learner profile and preferences'
  })
  @ApiQuery({ name: 'topic', required: false, description: 'Topic filter for questions' })
  @ApiQuery({ name: 'language', required: false, description: 'Programming language filter' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Difficulty level filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of questions to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Personalized questions retrieved successfully',
    type: QuestionResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters or quota exceeded' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getPersonalizedQuestions(
    @Request() req,
    @Query() personalizedQuestionsDto: PersonalizedQuestionsDto
  ): Promise<QuestionResponseDto> {
    this.logger.log(`Getting personalized questions for user: ${req.user.userId}`);
    return this.questionService.getPersonalizedQuestions(req.user.userId, personalizedQuestionsDto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Submit code solution',
    description: 'Submits code solution for a question and receives AI-powered feedback'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code solution submitted successfully',
    schema: {
      type: 'object',
      properties: {
        execution_result: { type: 'object' },
        feedback: { type: 'object' },
        score: { type: 'number' },
        session_status: { type: 'string' },
        attempts_remaining: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Question not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async submitCodeSolution(
    @Param('id') questionId: string,
    @Body() submissionDto: QuestionSubmissionDto,
    @Request() req
  ): Promise<any> {
    this.logger.log(`Submitting code solution for question: ${questionId}`);
    return this.questionService.submitCodeSolution(questionId, {
      ...submissionDto,
      learnerId: req.user.userId,
    });
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get learning sessions',
    description: 'Retrieves learning sessions for the authenticated user'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by session status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of sessions to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Learning sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessions: { type: 'array' },
        total_count: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getLearningSessions(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: number
  ): Promise<any> {
    this.logger.log(`Getting learning sessions for user: ${req.user.userId}`);
    return this.questionService.getLearningSessions(req.user.userId, { status, limit });
  }

  @Get('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get learning session details',
    description: 'Retrieves detailed information about a specific learning session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Learning session details retrieved successfully',
    type: LearningSessionDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getLearningSession(
    @Param('sessionId') sessionId: string,
    @Request() req
  ): Promise<LearningSessionDto> {
    this.logger.log(`Getting learning session: ${sessionId}`);
    return this.questionService.getLearningSession(sessionId, req.user.userId);
  }

  @Post('sessions/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Complete learning session',
    description: 'Marks a learning session as completed'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        final_score: { type: 'number' },
        completion_time: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async completeLearningSession(
    @Param('sessionId') sessionId: string,
    @Request() req
  ): Promise<any> {
    this.logger.log(`Completing learning session: ${sessionId}`);
    return this.questionService.completeLearningSession(sessionId, req.user.userId);
  }
}
