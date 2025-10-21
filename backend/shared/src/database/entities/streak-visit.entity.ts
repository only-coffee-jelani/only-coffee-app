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
import { Order } from './order.entity';

@Entity('streak_visits')
@Index(['userId', 'visitDate'])
@Index(['visitDate'])
export class StreakVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'date' })
  visitDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: number;

  @Column({ type: 'boolean', default: false })
  isMorningRush: boolean; // 5:00-10:00 AM CST

  @Column({ type: 'int' })
  pointsEarned: number; // Including morning rush multiplier

  @Column({ type: 'int' })
  xpEarned: number; // Including morning rush multiplier

  @Column({ type: 'int' })
  basePoints: number; // Points before multiplier

  @Column({ type: 'int' })
  baseXP: number; // XP before multiplier

  @Column({ type: 'int', default: 1 })
  multiplier: number; // 1 = normal, 2 = morning rush

  @Column({ type: 'int' })
  streakDayAtVisit: number; // What day of the streak was this?

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
