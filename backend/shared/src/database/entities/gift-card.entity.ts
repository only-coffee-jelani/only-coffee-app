import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GiftCardType {
  AMOUNT = 'amount', // Gift card with monetary value
  FREE_COFFEE = 'free_coffee', // Free coffee voucher
}

export enum GiftCardStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('gift_cards')
@Index(['code'], { unique: true })
@Index(['senderUserId'])
@Index(['recipientUserId'])
@Index(['status'])
export class GiftCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ type: 'enum', enum: GiftCardType })
  type: GiftCardType;

  @Column({ type: 'enum', enum: GiftCardStatus, default: GiftCardStatus.PENDING })
  status: GiftCardStatus;

  @Column({ type: 'uuid' })
  senderUserId: string;

  @Column({ type: 'uuid', nullable: true })
  recipientUserId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  remainingBalance: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxRedeemValue: number | null; // For free coffee vouchers

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  redeemedOrderId: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
