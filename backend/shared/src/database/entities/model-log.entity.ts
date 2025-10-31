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
import { AIPromotion } from './ai-promotion.entity';

export enum ModelType {
  CHURN_PREDICTION = 'churn_prediction',
  PRODUCT_RECOMMENDER = 'product_recommender',
  CONTEXTUAL_BANDIT = 'contextual_bandit',
  TIME_OPTIMIZER = 'time_optimizer',
  SEGMENTATION = 'segmentation',
  OFFER_OPTIMIZER = 'offer_optimizer',
}

@Entity('model_logs')
@Index(['modelType', 'createdAt'])
@Index(['userId'])
@Index(['feedbackReceived'])
export class ModelLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ModelType })
  modelType: ModelType;

  @Column({ type: 'varchar', length: 50 })
  modelVersion: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', nullable: true })
  promotionId: string | null;

  @Column({ type: 'jsonb' })
  inputFeatures: Record<string, any>;

  @Column({ type: 'jsonb' })
  prediction: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceScore: number | null;

  @Column({ type: 'int', nullable: true })
  executionTimeMs: number | null;

  @Column({ type: 'jsonb', nullable: true })
  outcome: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  feedbackReceived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  feedbackTimestamp: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne(() => AIPromotion, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'promotionId' })
  promotion: AIPromotion | null;
}
