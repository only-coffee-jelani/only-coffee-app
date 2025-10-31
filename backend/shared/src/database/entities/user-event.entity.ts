import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Store } from './store.entity';

export enum EventType {
  APP_OPENED = 'app_opened',
  APP_CLOSED = 'app_closed',
  PURCHASE_COMPLETED = 'purchase_completed',
  CART_ABANDONED = 'cart_abandoned',
  MENU_VIEWED = 'menu_viewed',
  ITEM_VIEWED = 'item_viewed',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  NOTIFICATION_OPENED = 'notification_opened',
  NOTIFICATION_DISMISSED = 'notification_dismissed',
  PROMOTION_VIEWED = 'promotion_viewed',
  PROMOTION_CLICKED = 'promotion_clicked',
  LOCATION_ENTERED = 'location_entered',
  LOCATION_EXITED = 'location_exited',
  GEOFENCE_TRIGGERED = 'geofence_triggered',
  PROFILE_UPDATED = 'profile_updated',
  PREFERENCE_CHANGED = 'preference_changed',
  LOYALTY_CHECKED = 'loyalty_checked',
  REWARD_VIEWED = 'reward_viewed',
}

@Entity('user_events')
@Index(['userId', 'timestamp'])
@Index(['eventType', 'timestamp'])
@Index(['sessionId'])
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceType: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  appVersion: string | null;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location: string | null;

  @Column({ type: 'uuid', nullable: true })
  storeId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Store, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'storeId' })
  store: Store | null;
}
