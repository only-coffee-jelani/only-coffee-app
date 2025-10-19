import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_streaks')
@Index(['userId'], { unique: true })
export class UserStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  consecutiveDays: number;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'date', nullable: true })
  lastVisitDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  firstQualifyingPurchaseDate: Date | null;

  @Column({ type: 'date', nullable: true })
  streakStartDate: Date | null;

  @Column({ type: 'int', default: 0 })
  monthlyPoints: number; // Points earned this month (with morning rush multiplier)

  @Column({ type: 'int', default: 0 })
  tierXP: number; // Lifetime XP for tier progression

  @Column({ type: 'int', default: 0 })
  monthlyVisits: number; // Visits this calendar month

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  annualSpend: number; // Total spend in last 365 days

  @Column({ type: 'int', default: 0 })
  sevenDayStreakCount: number; // Count of 7-day streaks achieved

  @Column({ type: 'date', nullable: true })
  lastMonthlyReset: Date | null; // Track when monthly counters were reset

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
