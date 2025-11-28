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

/**
 * CouponType Enum
 * Types of coupons that can be granted
 */
export enum CouponType {
  PERCENT_OFF = 'PERCENT_OFF',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FIXED_PRICE = 'FIXED_PRICE',
  FREE_ITEM = 'FREE_ITEM',
}

/**
 * CouponStatus Enum
 * Status of a coupon grant
 */
export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * CouponGrant Entity
 * Represents a coupon granted to a user
 * Enterprise-grade loyalty and promotion system
 */
@Entity('coupon_grants')
@Index(['userId', 'status'])
@Index(['expiresAt'])
export class CouponGrant {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'promo_code_id', nullable: true })
  promoCodeId: string | null;

  @Column({
    type: 'enum',
    enum: CouponType,
  })
  type: CouponType;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', name: 'value_cents', nullable: true })
  valueCents: number | null;

  @Column({ type: 'int', name: 'percent_off', nullable: true })
  percentOff: number | null;

  @Column({ type: 'int', name: 'price_override_cents', nullable: true })
  priceOverrideCents: number | null;

  @Column({ type: 'jsonb', name: 'eligible_items', nullable: true })
  eligibleItems: Record<string, any> | null;

  @Column({ type: 'varchar', length: 50, default: 'both' })
  channels: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'redeemed_at', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'uuid', name: 'redeemed_order_id', nullable: true })
  redeemedOrderId: string | null;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

