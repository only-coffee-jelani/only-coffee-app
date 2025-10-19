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
import { PromoCode } from './promo-code.entity';

export enum CouponType {
  PERCENT_OFF = 'percent_off',
  FIXED_PRICE = 'fixed_price',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_ITEM = 'free_item',
}

export enum CouponStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('coupon_grants')
@Index(['userId', 'status'])
@Index(['status', 'expiresAt'])
@Index(['promoCodeId'])
export class CouponGrant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  promoCodeId: string | null; // null if not from promo code (e.g., loyalty reward)

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'varchar', length: 255 })
  label: string; // Display name (e.g., "50% Off Drink", "First Sip")

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Value fields (only one should be set based on type)
  @Column({ type: 'int', nullable: true })
  valueCents: number | null; // For FIXED_AMOUNT

  @Column({ type: 'int', nullable: true })
  percentOff: number | null; // For PERCENT_OFF (0-100)

  @Column({ type: 'int', nullable: true })
  priceOverrideCents: number | null; // For FIXED_PRICE (e.g., $1.99 = 199)

  @Column({ type: 'jsonb', nullable: true })
  eligibleItems: Record<string, any> | null; // { exclude: ["waffolino", "pistacchio"] } or { include: [...] }

  @Column({ type: 'varchar', length: 50, default: 'both' })
  channels: string; // 'app_only', 'in_store', 'both'

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  redeemedOrderId: string | null;

  @Column({ type: 'enum', enum: CouponStatus, default: CouponStatus.ACTIVE })
  status: CouponStatus;

  @Column({ type: 'varchar', length: 100 })
  source: string; // 'promo_code', 'loyalty_reward', 'referral', 'admin_grant', 'new_user'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Additional data

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.rewardsLedger)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => PromoCode, (promoCode) => promoCode.coupons, {
    nullable: true,
  })
  @JoinColumn({ name: 'promoCodeId' })
  promoCode: PromoCode | null;
}
