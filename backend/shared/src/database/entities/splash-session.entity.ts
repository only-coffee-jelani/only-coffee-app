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
 * SplashSession Entity
 * Captures a full session of interaction with a splash screen
 */
@Entity('splash_sessions')
export class SplashSession {
  @PrimaryGeneratedColumn('uuid', { name: 'splash_session_id' })
  splashSessionId: string;

  @Column({ type: 'uuid', name: 'splash_id' })
  splashId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', name: 'total_time_seconds', nullable: true })
  totalTimeSeconds: number | null;

  @Column({ type: 'boolean', name: 'was_skipped', default: false })
  wasSkipped: boolean;

  @Column({ type: 'boolean', name: 'was_clicked', default: false })
  wasClicked: boolean;

  @Column({ type: 'boolean', name: 'auto_completed', default: false })
  autoCompleted: boolean;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'boolean', name: 'was_converted', default: false })
  wasConverted: boolean;

  @Column({ type: 'int', name: 'conversion_time_seconds', nullable: true })
  conversionTimeSeconds: number | null;

  @Column({ type: 'uuid', name: 'segment_id', nullable: true })
  segmentId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'experiment_group', nullable: true })
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
  @ManyToOne(() => SplashScreen, (splashScreen) => splashScreen.sessions)
  @JoinColumn({ name: 'splash_id' })
  splashScreen: SplashScreen;

  @ManyToOne(() => User, (user) => user.splashSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Device can be either a registered user device or an anonymous device
  // No foreign key constraint - manually managed based on whether user is logged in
  @ManyToOne(() => UserDevice, (device) => device.splashSessions)
  @JoinColumn({ name: 'device_id' })
  device: UserDevice;

  @ManyToOne(() => AnonymousDevice, (device) => device.splashSessions)
  @JoinColumn({ name: 'device_id' })
  anonymousDevice: AnonymousDevice;

  @ManyToOne(() => Store, (store) => store.splashSessions)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => UserSegment, (segment) => segment.splashSessions)
  @JoinColumn({ name: 'segment_id' })
  segment: UserSegment;

  @ManyToOne(() => Order, (order) => order.splashSessions)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}

