import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('splash_screens')
@Index(['isActive'])
@Index(['startDate', 'endDate'])
@Index(['createdAt'])
export class SplashScreen {
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

  @Column({ name: 'display_duration', type: 'int', default: 3 })
  displayDuration: number; // in seconds

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Reporting and Analytics Fields
  @Column({ name: 'impressions', type: 'int', default: 0 })
  impressions: number; // Number of times the splash screen was shown

  @Column({ name: 'clicks', type: 'int', default: 0 })
  clicks: number; // Number of times users clicked on the splash screen

  @Column({ name: 'skips', type: 'int', default: 0 })
  skips: number; // Number of times users skipped the splash screen

  @Column({ name: 'ctr', type: 'decimal', precision: 5, scale: 2, default: 0 })
  ctr: number; // Click-through rate (percentage)

  @Column({ name: 'skip_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  skipRate: number; // Skip rate (percentage)

  // Sales and Conversion Tracking
  @Column({ name: 'associated_orders', type: 'int', default: 0 })
  associatedOrders: number; // Number of orders placed after viewing this splash screen

  @Column({ name: 'associated_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
  associatedRevenue: number; // Total revenue from orders associated with this splash screen

  @Column({ name: 'conversion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversionRate: number; // Conversion rate (percentage) - orders / impressions

  @Column({ name: 'average_order_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageOrderValue: number; // Average order value from associated orders

  // Engagement Metrics
  @Column({ name: 'unique_users_shown', type: 'int', default: 0 })
  uniqueUsersShown: number; // Number of unique users who saw this splash screen

  @Column({ name: 'unique_users_clicked', type: 'int', default: 0 })
  uniqueUsersClicked: number; // Number of unique users who clicked

  @Column({ name: 'average_view_time', type: 'decimal', precision: 8, scale: 2, default: 0 })
  averageViewTime: number; // Average time spent viewing the splash screen (in seconds)

  // Performance Tracking
  @Column({ name: 'last_impression_at', type: 'timestamptz', nullable: true })
  lastImpressionAt: Date | null; // Timestamp of the last impression

  @Column({ name: 'last_click_at', type: 'timestamptz', nullable: true })
  lastClickAt: Date | null; // Timestamp of the last click

  // Metadata
  @Column({ name: 'target_menu_item_id', type: 'uuid', nullable: true })
  targetMenuItemId: string | null; // Optional: Link to a specific menu item

  @Column({ name: 'target_url', type: 'varchar', length: 500, nullable: true })
  targetUrl: string | null; // Optional: External URL to redirect to

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null; // Admin notes about this splash screen

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'replaced_at', type: 'timestamptz', nullable: true })
  replacedAt: Date | null; // When this splash screen was replaced by another

  @Column({ name: 'replaced_by_id', type: 'uuid', nullable: true })
  replacedById: string | null; // ID of the splash screen that replaced this one

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null; // ID of the admin user who created this splash screen
}

