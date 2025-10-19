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
import { CouponGrant } from './coupon-grant.entity';

export enum AnniversaryBadge {
  YEAR_1 = 'year_1_anniversary',
  YEAR_2 = 'year_2_anniversary',
  YEAR_3 = 'year_3_anniversary',
  YEAR_5 = 'year_5_anniversary',
  YEAR_10 = 'year_10_anniversary',
}

@Entity('anniversary_rewards')
@Index(['userId', 'anniversaryYear'], { unique: true })
@Index(['anniversaryDate'])
@Index(['isGranted'])
export class AnniversaryReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  anniversaryYear: number; // 1, 2, 3, etc.

  @Column({ type: 'date' })
  anniversaryDate: Date; // The anniversary date

  @Column({ type: 'boolean', default: false })
  isGranted: boolean; // Has the reward been granted?

  @Column({ type: 'timestamptz', nullable: true })
  grantedAt: Date | null; // When was it granted?

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null; // Link to granted coupon

  @Column({ type: 'enum', enum: AnniversaryBadge, nullable: true })
  badgeAwarded: AnniversaryBadge | null; // Commemorative badge

  @Column({ type: 'boolean', default: false })
  isRedeemed: boolean; // Has the coupon been redeemed?

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customMessage: string | null; // Personalized message for milestone years

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Extra data for special anniversaries

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => CouponGrant, { nullable: true })
  @JoinColumn({ name: 'couponId' })
  coupon: CouponGrant | null;
}
