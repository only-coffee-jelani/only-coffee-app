import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { UserSegment } from './user-profile.entity';

export enum AIPromotionType {
  DISCOUNT_PERCENTAGE = 'discount_percentage',
  DISCOUNT_FIXED = 'discount_fixed',
  FREE_UPGRADE = 'free_upgrade',
  LOYALTY_BONUS = 'loyalty_bonus',
  STREAK_REWARD = 'streak_reward',
  WIN_BACK = 'win_back',
  PRODUCT_RECOMMENDATION = 'product_recommendation',
  LOCATION_TRIGGER = 'location_trigger',
  TIME_BASED = 'time_based',
  WEATHER_BASED = 'weather_based',
  MILESTONE_CELEBRATION = 'milestone_celebration',
}

export enum PromotionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum DeliveryChannel {
  PUSH_NOTIFICATION = 'push_notification',
  IN_APP_MODAL = 'in_app_modal',
  EMAIL = 'email',
  SMS = 'sms',
}

@Entity('ai_promotions')
@Index(['status'])
@Index(['targetUserId'])
@Index(['targetSegment'])
@Index(['scheduledFor'])
@Index(['createdAt'])
export class AIPromotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AIPromotionType })
  type: AIPromotionType;

  @Column({ type: 'enum', enum: PromotionStatus, default: PromotionStatus.PENDING })
  status: PromotionStatus;

  @Column({ type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Column({ type: 'enum', enum: UserSegment, nullable: true })
  targetSegment: UserSegment | null;

  @Column({ type: 'varchar', length: 100 })
  triggerType: string;

  @Column({ type: 'jsonb', nullable: true })
  triggerMetadata: Record<string, any> | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb' })
  offerDetails: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  discountPercentage: number | null;

  @Column({ type: 'int', nullable: true })
  discountAmountCents: number | null;

  @Column({ type: 'enum', enum: DeliveryChannel, default: DeliveryChannel.PUSH_NOTIFICATION })
  deliveryChannel: DeliveryChannel;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  predictedCTR: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  predictedConversion: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceScore: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modelVersion: string | null;

  @Column({ type: 'text', nullable: true })
  aiReasoning: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User | null;
}
