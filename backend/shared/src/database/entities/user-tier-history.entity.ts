import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User, UserTier } from './user.entity';

export enum TierChangeReason {
  QUALIFIED = 'qualified', // Met tier requirements
  DOWNGRADED = 'downgraded', // Failed to meet requirements in evaluation
  MANUAL_OVERRIDE = 'manual_override', // Admin changed tier
  INITIAL_SETUP = 'initial_setup', // User created with tier
}

@Entity('user_tier_history')
@Index(['userId', 'changedAt'])
@Index(['changedAt'])
@Index(['newTier'])
export class UserTierHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: UserTier, nullable: true })
  previousTier: UserTier | null; // null for first tier assignment

  @Column({ type: 'enum', enum: UserTier })
  newTier: UserTier;

  @Column({ type: 'enum', enum: TierChangeReason })
  reason: TierChangeReason;

  @Column({ type: 'timestamptz' })
  changedAt: Date;

  @Column({ type: 'int', nullable: true })
  monthlyVisitsAtChange: number | null; // Snapshot of monthly visits

  @Column({ type: 'int', nullable: true })
  tierXPAtChange: number | null; // Snapshot of tier XP

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  annualSpendAtChange: number | null; // Snapshot of annual spend

  @Column({ type: 'int', nullable: true })
  sevenDayStreakCountAtChange: number | null; // Snapshot of streak count

  @Column({ type: 'varchar', length: 500, nullable: true })
  adminNotes: string | null; // For manual overrides

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Additional context

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
