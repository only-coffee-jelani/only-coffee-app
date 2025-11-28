import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * AITrainingJob Entity
 * Tracks AI model training jobs
 */
@Entity('ai_training_jobs')
export class AITrainingJob {
  @PrimaryGeneratedColumn('uuid', { name: 'job_id' })
  jobId: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  results: Record<string, any> | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

