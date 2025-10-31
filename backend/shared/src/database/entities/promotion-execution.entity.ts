import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { AIPromotion, DeliveryChannel } from './ai-promotion.entity';

export enum ExecutionStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Entity('promotion_executions')
@Index(['promotionId'])
@Index(['userId', 'status'])
@Index(['sentAt'])
export class PromotionExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promotionId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.QUEUED })
  status: ExecutionStatus;

  @Column({ type: 'enum', enum: DeliveryChannel })
  channel: DeliveryChannel;

  @CreateDateColumn({ type: 'timestamptz' })
  queuedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clickedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  notificationId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceToken: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => AIPromotion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotionId' })
  promotion: AIPromotion;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
