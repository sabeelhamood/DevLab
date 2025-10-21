import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { LearningSessionEntity } from './learning-session.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', default: 1 })
  difficulty_level: number;

  @Column({ type: 'varchar', length: 50 })
  programming_language: string;

  @Column({ type: 'varchar', length: 50 })
  question_type: string; // 'coding', 'theoretical', 'multiple_choice'

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @Column({ type: 'text', array: true, default: [] })
  micro_skills: string[];

  @Column({ type: 'text', array: true, default: [] })
  nano_skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  test_cases: any;

  @Column({ type: 'text', nullable: true })
  expected_output: string;

  @Column({ type: 'text', array: true, default: [] })
  hints: string[];

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'boolean', default: false })
  ai_validated: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  quality_score: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  success_rate: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => LearningSessionEntity, session => session.question)
  learning_sessions: LearningSessionEntity[];
}
