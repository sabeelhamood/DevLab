import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { QuestionRepository } from './repositories/question.repository';
import { QuestionEntity } from './entities/question.entity';
import { LearningSessionEntity } from './entities/learning-session.entity';
import { IntegrationModule } from '../integration/integration.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity, LearningSessionEntity]),
    BullModule.registerQueue({
      name: 'question-generation',
    }),
    BullModule.registerQueue({
      name: 'question-validation',
    }),
    IntegrationModule,
    CacheModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService, QuestionRepository],
  exports: [QuestionService, QuestionRepository],
})
export class QuestionModule {}
