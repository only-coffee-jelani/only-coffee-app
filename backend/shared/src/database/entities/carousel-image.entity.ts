import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CarouselImageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('carousel_images')
@Index(['isActive', 'position'])
@Index(['status', 'createdAt'])
@Index(['createdAt'])
export class CarouselImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ name: 'image_size_bytes', type: 'int', nullable: true })
  imageSizeBytes: number | null; // Size of the image in bytes for storage tracking

  @Column({ name: 'image_width', type: 'int', nullable: true })
  imageWidth: number | null; // Image width in pixels

  @Column({ name: 'image_height', type: 'int', nullable: true })
  imageHeight: number | null; // Image height in pixels

  @Column({ name: 'position', type: 'int', default: 0 })
  position: number; // Display order (0-4 for max 5 images)

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean; // Whether this image is currently displayed

  @Column({ type: 'enum', enum: CarouselImageStatus, default: CarouselImageStatus.ACTIVE })
  status: CarouselImageStatus;

  @Column({ name: 'target_menu_item_id', type: 'uuid', nullable: true })
  targetMenuItemId: string | null; // Optional link to a menu item

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null; // When to start showing this image

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null; // When to stop showing this image

  @Column({ name: 'display_duration', type: 'int', default: 3 })
  displayDuration: number; // How long to display in seconds (for auto-rotation)

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number; // Analytics: number of times clicked

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number; // Analytics: number of times viewed

  @Column({ name: 'conversion_count', type: 'int', default: 0 })
  conversionCount: number; // Analytics: number of conversions from this image

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null; // Admin user who created this

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null; // Admin user who last updated this

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'last_viewed_at', type: 'timestamptz', nullable: true })
  lastViewedAt: Date | null; // Last time this image was viewed

  @Column({ name: 'last_clicked_at', type: 'timestamptz', nullable: true })
  lastClickedAt: Date | null; // Last time this image was clicked

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null; // Internal notes about this carousel image
}

