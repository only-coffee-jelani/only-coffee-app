import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CarouselItem } from './carousel-item.entity';
import { Carousel } from './carousel.entity';

/**
 * CarouselDailyAggregate Entity
 * 
 * Pre-computed daily analytics for fast dashboard performance.
 * Aggregates all carousel events and sessions into daily metrics.
 * 
 * Enhanced metrics beyond splash screen aggregates:
 * - Swipe direction analytics
 * - Auto vs manual navigation patterns
 * - Engagement scoring
 * - Position-based performance
 * - Add-to-cart tracking
 * - Device-level unique tracking
 */
@Entity('carousel_daily_aggregates')
@Index(['date', 'carouselItemId'], { unique: true })
@Index(['carouselId', 'date'])
@Index(['date'])
export class CarouselDailyAggregate {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_daily_aggregate_id' })
  carouselDailyAggregateId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'uuid', name: 'carousel_item_id' })
  carouselItemId: string;

  @Column({ type: 'uuid', name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', name: 'unique_users_shown', default: 0 })
  uniqueUsersShown: number;

  @Column({ type: 'bigint', name: 'unique_devices_shown', default: 0 })
  uniqueDevicesShown: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'bigint', name: 'unique_users_clicked', default: 0 })
  uniqueUsersClicked: number;

  @Column({ type: 'bigint', name: 'swipes_left', default: 0 })
  swipesLeft: number;

  @Column({ type: 'bigint', name: 'swipes_right', default: 0 })
  swipesRight: number;

  @Column({ type: 'bigint', name: 'auto_advances', default: 0 })
  autoAdvances: number;

  @Column({ type: 'bigint', name: 'manual_advances', default: 0 })
  manualAdvances: number;

  @Column({ type: 'bigint', name: 'view_completions', default: 0 })
  viewCompletions: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'avg_time_on_slide_seconds', default: 0 })
  avgTimeOnSlideSeconds: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'avg_engagement_score', default: 0 })
  avgEngagementScore: number;

  @Column({ type: 'bigint', name: 'associated_orders', default: 0 })
  associatedOrders: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'associated_revenue', default: 0 })
  associatedRevenue: number;

  @Column({ type: 'bigint', name: 'add_to_cart_count', default: 0 })
  addToCartCount: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'avg_order_value', default: 0 })
  avgOrderValue: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, name: 'conversion_rate', default: 0 })
  conversionRate: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, default: 0 })
  ctr: number;

  @Column({ type: 'numeric', precision: 6, scale: 4, name: 'engagement_rate', default: 0 })
  engagementRate: number;

  @Column({ type: 'int', name: 'position_in_carousel' })
  positionInCarousel: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CarouselItem)
  @JoinColumn({ name: 'carousel_item_id' })
  carouselItem: CarouselItem;

  @ManyToOne(() => Carousel)
  @JoinColumn({ name: 'carousel_id' })
  carousel: Carousel;
}

