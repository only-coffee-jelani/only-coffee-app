import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@shared/database/entities/user.entity';

export enum PrivacyRequestType {
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  DATA_CORRECTION = 'data_correction',
  CONSENT_WITHDRAWAL = 'consent_withdrawal',
}

export enum PrivacyRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('privacy_requests')
export class PrivacyRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PrivacyRequestType,
    name: 'request_type',
  })
  requestType: PrivacyRequestType;

  @Column({
    type: 'enum',
    enum: PrivacyRequestStatus,
    default: PrivacyRequestStatus.PENDING,
  })
  status: PrivacyRequestStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @Column({
    name: 'download_url',
    type: 'text',
    nullable: true,
  })
  downloadUrl: string;

  @Column({
    name: 'processed_at',
    type: 'timestamp',
    nullable: true,
  })
  processedAt: Date;

  @Column({
    name: 'scheduled_deletion_at',
    type: 'timestamp',
    nullable: true,
  })
  scheduledDeletionAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
