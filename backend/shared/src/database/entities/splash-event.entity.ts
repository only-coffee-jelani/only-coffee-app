import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SplashScreen } from './splash-screen.entity';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';
import { AnonymousDevice } from './anonymous-device.entity';
import { Store } from './store.entity';
import { UserSegment } from './user-segment.entity';
import { Order } from './order.entity';

/**
 * SplashEvent Entity
 * Logs every interaction with a splash screen
 */
@Entity('splash_events')
export class SplashEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'splash_event_id' })
  splashEventId: string;

  @Column({ type: 'uuid', name: 'splash_id' })
  splashId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @Column({ type: 'uuid', name: 'segment_id', nullable: true })
  segmentId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'experiment_group', nullable: true })
  experimentGroup: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'event_type',
  })
  eventType: 'impression' | 'click' | 'skip' | 'complete' | 'order';

  @Column({ type: 'int', name: 'view_time_seconds', nullable: true })
  viewTimeSeconds: number | null;

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => SplashScreen, (splashScreen) => splashScreen.events)
  @JoinColumn({ name: 'splash_id' })
  splashScreen: SplashScreen;

  @ManyToOne(() => User, (user) => user.splashEvents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Device can be either a registered user device or an anonymous device
  // No foreign key constraint - manually managed based on whether user is logged in
  @ManyToOne(() => UserDevice, (device) => device.splashEvents)
  @JoinColumn({ name: 'device_id' })
  device: UserDevice;

  @ManyToOne(() => AnonymousDevice, (device) => device.splashEvents)
  @JoinColumn({ name: 'device_id' })
  anonymousDevice: AnonymousDevice;

  @ManyToOne(() => Store, (store) => store.splashEvents)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => UserSegment, (segment) => segment.splashEvents)
  @JoinColumn({ name: 'segment_id' })
  segment: UserSegment;

  @ManyToOne(() => Order, (order) => order.splashEvents)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}

