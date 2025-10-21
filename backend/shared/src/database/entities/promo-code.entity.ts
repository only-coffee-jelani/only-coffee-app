import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CouponGrant } from './coupon-grant.entity';

export enum PromoType {
  SINGLE_USE = 'single_use',
  MULTI_USE = 'multi_use',
  UNLIMITED = 'unlimited',
}

@Entity('promo_codes')
@Index(['code'], { unique: true })
@Index(['isActive'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: PromoType, default: PromoType.MULTI_USE })
  type: PromoType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string | null; // Admin user ID or system identifier

  @Column({ type: 'int', nullable: true })
  maxUses: number | null; // null = unlimited

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  couponConfig: Record<string, any> | null; // Configuration for coupons to generate

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Additional campaign data

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => CouponGrant, (couponGrant) => couponGrant.promoCode)
  coupons: CouponGrant[];
}
