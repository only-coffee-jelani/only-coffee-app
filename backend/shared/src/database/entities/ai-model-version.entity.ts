import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * AIModelVersion Entity
 * Tracks AI model versions for recommendation engine
 */
@Entity('ai_model_versions')
export class AIModelVersion {
  @PrimaryGeneratedColumn('uuid', { name: 'model_version_id' })
  modelVersionId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, name: 's3_path' })
  s3Path: string;

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any> | null;

  @Column({ type: 'boolean', name: 'is_active', default: false })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

