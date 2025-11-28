import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Carousel } from './carousel.entity';
import { User } from './user.entity';

/**
 * CarouselSession Entity
 * 
 * Tracks user sessions with carousels to measure engagement:
 * - Session duration
 * - Items viewed and clicked
 * - Swipe patterns (left/right)
 * - Auto vs manual navigation
 * - Engagement scoring
 * - Conversion tracking
 * 
 * Provides deeper insights than splash screen sessions with:
 * - Detailed swipe analytics
 * - Engagement scoring algorithm
 * - Multi-item interaction tracking
 */
@Entity('carousel_sessions')
@Index(['carouselId', 'startedAt'])
@Index(['userId', 'startedAt'])
@Index(['deviceId', 'startedAt'])
@Index(['wasConverted', 'startedAt'])
export class CarouselSession {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_session_id' })
  carouselSessionId: string;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @Column({ type: 'uuid', name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', name: 'total_time_seconds', nullable: true })
  totalTimeSeconds: number | null;

  @Column({ type: 'int', name: 'items_viewed', default: 0 })
  itemsViewed: number;

  @Column({ type: 'int', name: 'items_clicked', default: 0 })
  itemsClicked: number;

  @Column({ type: 'int', name: 'swipes_left', default: 0 })
  swipesLeft: number;

  @Column({ type: 'int', name: 'swipes_right', default: 0 })
  swipesRight: number;

  @Column({ type: 'int', name: 'auto_advances', default: 0 })
  autoAdvances: number;

  @Column({ type: 'int', name: 'manual_advances', default: 0 })
  manualAdvances: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'engagement_score', default: 0 })
  engagementScore: number;

  @Column({ type: 'boolean', name: 'was_converted', default: false })
  wasConverted: boolean;

  @Column({ type: 'int', name: 'conversion_time_seconds', nullable: true })
  conversionTimeSeconds: number | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'revenue_amount', nullable: true })
  revenueAmount: number | null;

  @Column({ type: 'uuid', name: 'segment_id', nullable: true })
  segmentId: string | null;

  @Column({ type: 'varchar', length: 50, name: 'experiment_group', nullable: true })
  experimentGroup: string | null;

  @Column({ type: 'varchar', length: 50, name: 'app_version', nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 20, name: 'os_type', nullable: true })
  osType: string | null;

  @Column({ type: 'varchar', length: 100, name: 'device_model', nullable: true })
  deviceModel: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Carousel)
  @JoinColumn({ name: 'carousel_id' })
  carousel: Carousel;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

