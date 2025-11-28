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
import { Carousel } from './carousel.entity';
import { CarouselItem } from './carousel-item.entity';

/**
 * CarouselABTest Entity
 * 
 * Manages A/B testing for carousel items to optimize engagement and conversions.
 * 
 * Features:
 * - Traffic splitting between variants
 * - Multiple primary metrics (CTR, conversion rate, engagement score, revenue)
 * - Statistical significance calculation
 * - Winner determination
 * - Test lifecycle management (draft, running, paused, completed)
 */
@Entity('carousel_ab_tests')
@Index(['carouselId', 'status'])
@Index(['status', 'createdAt'])
export class CarouselABTest {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_ab_test_id' })
  carouselAbTestId: string;

  @Column({ type: 'varchar', length: 255, name: 'test_name' })
  testName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'uuid', name: 'variant_a_item_id' })
  variantAItemId: string;

  @Column({ type: 'uuid', name: 'variant_b_item_id' })
  variantBItemId: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, name: 'traffic_split', default: 0.5 })
  trafficSplit: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: 'draft' | 'running' | 'paused' | 'completed';

  @Column({
    type: 'varchar',
    length: 30,
    name: 'primary_metric',
    default: 'ctr',
  })
  primaryMetric: 'ctr' | 'conversion_rate' | 'engagement_score' | 'revenue';

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'varchar', length: 1, name: 'winner_variant', nullable: true })
  winnerVariant: 'A' | 'B' | null;

  @Column({ type: 'int', name: 'confidence_level', nullable: true })
  confidenceLevel: number | null;

  @Column({ type: 'bigint', name: 'variant_a_impressions', default: 0 })
  variantAImpressions: number;

  @Column({ type: 'bigint', name: 'variant_a_clicks', default: 0 })
  variantAClicks: number;

  @Column({ type: 'bigint', name: 'variant_a_conversions', default: 0 })
  variantAConversions: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'variant_a_revenue', default: 0 })
  variantARevenue: number;

  @Column({ type: 'bigint', name: 'variant_b_impressions', default: 0 })
  variantBImpressions: number;

  @Column({ type: 'bigint', name: 'variant_b_clicks', default: 0 })
  variantBClicks: number;

  @Column({ type: 'bigint', name: 'variant_b_conversions', default: 0 })
  variantBConversions: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'variant_b_revenue', default: 0 })
  variantBRevenue: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Carousel)
  @JoinColumn({ name: 'carousel_id' })
  carousel: Carousel;

  @ManyToOne(() => CarouselItem)
  @JoinColumn({ name: 'variant_a_item_id' })
  variantAItem: CarouselItem;

  @ManyToOne(() => CarouselItem)
  @JoinColumn({ name: 'variant_b_item_id' })
  variantBItem: CarouselItem;
}

