import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';

export class PersonalizedQuestionsDto {
  @ApiProperty({
    description: 'Topic filter for questions',
    example: 'algorithms',
    required: false
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({
    description: 'Programming language filter',
    example: 'python',
    required: false
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Difficulty level (1-10)',
    example: 3,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  difficulty?: number;

  @ApiProperty({
    description: 'Maximum number of questions to return',
    example: 10,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class QuestionSubmissionDto {
  @ApiProperty({
    description: 'Learner ID',
    example: 'learner-123'
  })
  @IsString()
  @IsNotEmpty()
  learnerId: string;

  @ApiProperty({
    description: 'Code solution',
    example: 'def solution():\n    return "Hello World"'
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'python'
  })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class QuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'question-123'
  })
  id: string;

  @ApiProperty({
    description: 'Question title',
    example: 'Implement a binary search algorithm'
  })
  title: string;

  @ApiProperty({
    description: 'Question description',
    example: 'Write a function that performs binary search on a sorted array'
  })
  description: string;

  @ApiProperty({
    description: 'Difficulty level (1-10)',
    example: 3
  })
  difficulty_level: number;

  @ApiProperty({
    description: 'Programming language',
    example: 'python'
  })
  programming_language: string;

  @ApiProperty({
    description: 'Question type',
    example: 'coding'
  })
  question_type: string;

  @ApiProperty({
    description: 'Topic',
    example: 'algorithms'
  })
  topic: string;

  @ApiProperty({
    description: 'Micro skills',
    example: ['binary-search', 'array-manipulation'],
    type: [String]
  })
  micro_skills: string[];

  @ApiProperty({
    description: 'Nano skills',
    example: ['recursion', 'divide-and-conquer'],
    type: [String]
  })
  nano_skills: string[];

  @ApiProperty({
    description: 'Test cases',
    example: [
      { input: '[1, 2, 3, 4, 5], 3', expected_output: '2' },
      { input: '[1, 2, 3, 4, 5], 6', expected_output: '-1' }
    ]
  })
  test_cases: any[];

  @ApiProperty({
    description: 'Hints',
    example: ['Use recursion', 'Compare middle element'],
    type: [String]
  })
  hints: string[];
}

export class QuestionResponseDto {
  @ApiProperty({
    description: 'List of personalized questions',
    type: [QuestionDto]
  })
  questions: QuestionDto[];

  @ApiProperty({
    description: 'Total number of questions',
    example: 10
  })
  total_count: number;

  @ApiProperty({
    description: 'Whether there are more questions available',
    example: true
  })
  has_more: boolean;

  @ApiProperty({
    description: 'Learner profile information',
    schema: {
      type: 'object',
      properties: {
        skill_level: { type: 'number' },
        daily_quota_used: { type: 'number' },
        daily_quota_remaining: { type: 'number' }
      }
    }
  })
  learner_profile: any;
}

export class LearningSessionDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'session-123'
  })
  id: string;

  @ApiProperty({
    description: 'Learner ID',
    example: 'learner-123'
  })
  learner_id: string;

  @ApiProperty({
    description: 'Question ID',
    example: 'question-123'
  })
  question_id: string;

  @ApiProperty({
    description: 'Session start time',
    example: '2024-01-01T10:00:00Z'
  })
  session_start: Date;

  @ApiProperty({
    description: 'Session end time',
    example: '2024-01-01T10:30:00Z',
    required: false
  })
  session_end?: Date;

  @ApiProperty({
    description: 'Session status',
    example: 'completed'
  })
  status: string;

  @ApiProperty({
    description: 'Number of attempts',
    example: 2
  })
  attempts: number;

  @ApiProperty({
    description: 'Maximum attempts allowed',
    example: 3
  })
  max_attempts: number;

  @ApiProperty({
    description: 'Current score',
    example: 0.85
  })
  score?: number;

  @ApiProperty({
    description: 'AI feedback received',
    example: 'Great job! Your solution is efficient and well-structured.'
  })
  ai_feedback?: string;

  @ApiProperty({
    description: 'Code submissions',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        timestamp: { type: 'string' },
        execution_result: { type: 'object' }
      }
    }
  })
  code_submissions?: any[];

  @ApiProperty({
    description: 'Execution results',
    type: 'object'
  })
  execution_results?: any;
}
