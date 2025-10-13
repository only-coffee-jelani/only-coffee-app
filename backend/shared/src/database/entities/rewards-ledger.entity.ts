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

export enum RewardTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted',
  BIRTHDAY_BONUS = 'birthday_bonus',
}

@Entity('rewards_ledger')
@Index(['userId', 'createdAt'])
@Index(['transactionType'])
export class RewardsLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'enum', enum: RewardTransactionType })
  transactionType: RewardTransactionType;

  @Column({ type: 'int' })
  points: number; // Positive for earned, negative for redeemed

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  orderAmount: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.rewardsLedger)
  @JoinColumn({ name: 'userId' })
  user: User;
}
