import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('security_events')
@Index(['type', 'severity'])
@Index(['userId', 'timestamp'])
@Index(['ipAddress', 'timestamp'])
@Index(['timestamp'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'authentication', 'authorization', 'data_access', 'code_execution', 'threat_detected'

  @Column({ type: 'varchar', length: 20 })
  severity: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  sessionId: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'text' })
  userAgent: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 255 })
  requestId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organizationId: string;

  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
