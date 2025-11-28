import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SplashScreen } from './splash-screen.entity';

/**
 * SplashDailyAggregate Entity
 * Precomputed daily analytics for fast dashboards
 */
@Entity('splash_daily_aggregates')
@Index(['date', 'splashId'], { unique: true })
export class SplashDailyAggregate {
  @PrimaryGeneratedColumn('uuid', { name: 'splash_daily_aggregate_id' })
  splashDailyAggregateId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'uuid', name: 'splash_id' })
  splashId: string;

  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', name: 'unique_users_shown', default: 0 })
  uniqueUsersShown: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'bigint', name: 'unique_users_clicked', default: 0 })
  uniqueUsersClicked: number;

  @Column({ type: 'bigint', default: 0 })
  skips: number;

  @Column({ type: 'bigint', default: 0 })
  completions: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'avg_view_time_seconds', default: 0 })
  avgViewTimeSeconds: number;

  @Column({ type: 'bigint', name: 'associated_orders', default: 0 })
  associatedOrders: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'associated_revenue', default: 0 })
  associatedRevenue: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'avg_order_value', default: 0 })
  avgOrderValue: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, name: 'conversion_rate', default: 0 })
  conversionRate: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, default: 0 })
  ctr: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, name: 'skip_rate', default: 0 })
  skipRate: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => SplashScreen, (splashScreen) => splashScreen.dailyAggregates)
  @JoinColumn({ name: 'splash_id' })
  splashScreen: SplashScreen;
}

