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
import { User } from './user.entity';

/**
 * CarouselEvent Entity
 * 
 * Tracks every interaction with carousel items including:
 * - Impressions (when carousel item is viewed)
 * - Clicks (when user taps on carousel item)
 * - Swipes (left/right navigation)
 * - Auto-advances (automatic carousel progression)
 * - Manual advances (user-initiated progression)
 * - View completions (user viewed item for full duration)
 * - Orders (conversions from carousel)
 * - Add to cart events
 * 
 * Enhanced beyond splash screen analytics with:
 * - Position tracking within carousel
 * - Swipe velocity and direction
 * - Time-on-slide metrics
 * - Screen dimensions for responsive analysis
 * - Connection type for performance analysis
 */
@Entity('carousel_events')
@Index(['carouselItemId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['deviceId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['orderId'])
export class CarouselEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_event_id' })
  carouselEventId: string;

  @Column({ type: 'uuid', name: 'carousel_item_id' })
  carouselItemId: string;

  @Column({ type: 'uuid', name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @Column({ type: 'uuid', name: 'segment_id', nullable: true })
  segmentId: string | null;

  @Column({ type: 'varchar', length: 50, name: 'experiment_group', nullable: true })
  experimentGroup: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'event_type',
  })
  eventType:
    | 'impression'
    | 'click'
    | 'swipe_left'
    | 'swipe_right'
    | 'auto_advance'
    | 'manual_advance'
    | 'view_complete'
    | 'order'
    | 'add_to_cart';

  @Column({ type: 'int', name: 'position_in_carousel' })
  positionInCarousel: number;

  @Column({ type: 'int', name: 'total_items_in_carousel' })
  totalItemsInCarousel: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'time_on_slide_seconds', nullable: true })
  timeOnSlideSeconds: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'swipe_velocity', nullable: true })
  swipeVelocity: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deeplink: string | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'revenue_amount', nullable: true })
  revenueAmount: number | null;

  @Column({ type: 'timestamptz', name: 'client_timestamp' })
  clientTimestamp: Date;

  @Column({ type: 'timestamptz', name: 'server_timestamp' })
  serverTimestamp: Date;

  @Column({ type: 'varchar', length: 50, name: 'app_version', nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 20, name: 'os_type', nullable: true })
  osType: 'ios' | 'android' | 'web' | null;

  @Column({ type: 'varchar', length: 100, name: 'device_model', nullable: true })
  deviceModel: string | null;

  @Column({ type: 'int', name: 'screen_width', nullable: true })
  screenWidth: number | null;

  @Column({ type: 'int', name: 'screen_height', nullable: true })
  screenHeight: number | null;

  @Column({ type: 'varchar', length: 20, name: 'connection_type', nullable: true })
  connectionType: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CarouselItem)
  @JoinColumn({ name: 'carousel_item_id' })
  carouselItem: CarouselItem;

  @ManyToOne(() => Carousel)
  @JoinColumn({ name: 'carousel_id' })
  carousel: Carousel;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

