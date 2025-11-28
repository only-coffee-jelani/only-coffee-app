import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { UserSegment } from './user-segment.entity';

/**
 * UserProfile Entity
 * AI-focused user profile for personalization and analytics
 * Uses user_id as primary key (one-to-one with users table)
 */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int', name: 'orders_last_30d', default: 0 })
  ordersLast30d: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'avg_order_value', nullable: true })
  avgOrderValue: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'total_ltv', nullable: true })
  totalLtv: number | null;

  @Column({ type: 'varchar', length: 255, name: 'favorite_category', nullable: true })
  favoriteCategory: string | null;

  @Column({ type: 'timestamptz', name: 'last_order_at', nullable: true })
  lastOrderAt: Date | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, name: 'churn_risk_score', nullable: true })
  churnRiskScore: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 4, name: 'ltv_score', nullable: true })
  ltvScore: number | null;

  @Column({ type: 'uuid', name: 'segment_primary_id', nullable: true })
  segmentPrimaryId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.userProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSegment, (segment) => segment.userProfiles)
  @JoinColumn({ name: 'segment_primary_id' })
  segmentPrimary: UserSegment;
}
