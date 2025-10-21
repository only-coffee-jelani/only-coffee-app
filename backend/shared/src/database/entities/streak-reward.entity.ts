import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CouponType } from './coupon-grant.entity';

export enum RewardType {
  COUPON_GRANT = 'coupon_grant',
  POINTS_GRANT = 'points_grant', // Future: legacy points system integration
}

@Entity('streak_rewards')
@Index(['streakDay'], { unique: true })
@Index(['isActive'])
export class StreakReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true })
  streakDay: number; // 2, 7, 14, 30, 90

  @Column({ type: 'enum', enum: RewardType, default: RewardType.COUPON_GRANT })
  rewardType: RewardType;

  @Column({ type: 'enum', enum: CouponType })
  couponType: CouponType; // DISCOUNT_CENTS, FREE_ITEM, etc.

  @Column({ type: 'varchar', length: 100 })
  label: string; // "Day 7 Reward: Free Drink!"

  @Column({ type: 'text', nullable: true })
  description: string | null; // "Enjoy a free drink up to $8"

  @Column({ type: 'int', nullable: true })
  valueCents: number | null; // For DISCOUNT_CENTS: 100 = $1 off

  @Column({ type: 'int', nullable: true })
  maxValueCents: number | null; // For FREE_ITEM: 800 = up to $8, null = no limit

  @Column({ type: 'int', default: 7 })
  expiryDays: number; // Days until coupon expires

  @Column({ type: 'varchar', length: 20, default: 'both' })
  channels: string; // 'mobile_only', 'in_store_only', 'both'

  @Column({ type: 'jsonb', nullable: true })
  eligibleItems: Record<string, any> | null; // SKU restrictions, category filters

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Admin can disable rewards

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // For sorting in UI

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Custom fields for A/B testing, etc.

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
