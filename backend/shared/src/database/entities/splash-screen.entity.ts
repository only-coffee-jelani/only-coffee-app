import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MediaAsset } from './media-asset.entity';
import { UserSegment } from './user-segment.entity';
import { Store } from './store.entity';
import { AdminUser } from './admin-user.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';
import { SplashDailyAggregate } from './splash-daily-aggregate.entity';

/**
 * SplashScreen Entity
 * Represents splash screens displayed on app launch
 */
@Entity('splash_screens')
export class SplashScreen {
  @PrimaryGeneratedColumn('uuid', { name: 'splash_id' })
  splashId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'uuid', name: 'image_asset_id' })
  imageAssetId: string;

  @Column({ type: 'int', name: 'duration_seconds', default: 3 })
  durationSeconds: number;

  @Column({ type: 'timestamptz', name: 'start_at', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', name: 'end_at', nullable: true })
  endAt: Date | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'uuid', name: 'target_segment_id', nullable: true })
  targetSegmentId: string | null;

  @Column({ type: 'uuid', name: 'target_store_id', nullable: true })
  targetStoreId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deeplink: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MediaAsset, (mediaAsset) => mediaAsset.splashScreens)
  @JoinColumn({ name: 'image_asset_id' })
  imageAsset: MediaAsset;

  @ManyToOne(() => UserSegment, (segment) => segment.splashScreens)
  @JoinColumn({ name: 'target_segment_id' })
  targetSegment: UserSegment;

  @ManyToOne(() => Store, (store) => store.splashScreens)
  @JoinColumn({ name: 'target_store_id' })
  targetStore: Store;

  @ManyToOne(() => AdminUser, (adminUser) => adminUser.splashScreens)
  @JoinColumn({ name: 'created_by' })
  createdByAdmin: AdminUser;

  @OneToMany(() => SplashEvent, (event) => event.splashScreen)
  events: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.splashScreen)
  sessions: SplashSession[];

  @OneToMany(() => SplashDailyAggregate, (aggregate) => aggregate.splashScreen)
  dailyAggregates: SplashDailyAggregate[];
}

