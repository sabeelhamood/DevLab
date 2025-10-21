import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity('learning_sessions')
export class LearningSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  learner_id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  session_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  session_end: Date;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'completed', 'abandoned'

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  max_attempts: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  feedback_received: string;

  @Column({ type: 'text', nullable: true })
  ai_feedback: string;

  @Column({ type: 'jsonb', nullable: true })
  code_submissions: any;

  @Column({ type: 'jsonb', nullable: true })
  execution_results: any;

  @Column({ type: 'int', nullable: true })
  total_execution_time: number;

  @Column({ type: 'int', nullable: true })
  total_memory_usage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => QuestionEntity, question => question.learning_sessions)
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;
}
