import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Carousel } from './carousel.entity';
import { MediaAsset } from './media-asset.entity';

/**
 * CarouselImageStatus Enum
 * Status of carousel images
 */
export enum CarouselImageStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SCHEDULED = 'SCHEDULED',
  EXPIRED = 'EXPIRED',
}

/**
 * CarouselItem Entity
 * Represents individual items within a carousel
 */
@Entity('carousel_items')
export class CarouselItem {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_item_id' })
  carouselItemId: string;

  @Column({ type: 'uuid', name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'uuid', name: 'image_asset_id' })
  imageAssetId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deeplink: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'start_at', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', name: 'end_at', nullable: true })
  endAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Carousel, (carousel) => carousel.carouselItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carousel_id' })
  carousel: Carousel;

  @ManyToOne(() => MediaAsset, (mediaAsset) => mediaAsset.carouselItems)
  @JoinColumn({ name: 'image_asset_id' })
  imageAsset: MediaAsset;
}

// Type alias for backward compatibility
export type CarouselImage = CarouselItem;

