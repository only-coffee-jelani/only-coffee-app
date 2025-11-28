import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { StoreType } from './store-type.entity';
import { StoreHours } from './store-hours.entity';
import { StoreStatusHistory } from './store-status-history.entity';
import { User } from './user.entity';
import { SplashScreen } from './splash-screen.entity';
import { InventoryItem } from './inventory-item.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * Store Entity
 * Represents physical store locations with simplified structure
 */

@Entity('stores')
@Index(['isActive'])
export class Store {
  @PrimaryGeneratedColumn('uuid', { name: 'store_id' })
  storeId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', name: 'store_type_id', nullable: true })
  storeTypeId: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, name: 'toast_location_id', nullable: true })
  toastLocationId: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'accepting_orders', default: true })
  acceptingOrders: boolean;

  @Column({ type: 'varchar', length: 500, name: 'store_image_url', nullable: true })
  storeImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', name: 'opened_at', nullable: true })
  openedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => StoreType, (storeType) => storeType.stores)
  @JoinColumn({ name: 'store_type_id' })
  storeType: StoreType;

  @OneToMany(() => StoreHours, (hours) => hours.store)
  storeHours: StoreHours[];

  @OneToMany(() => StoreStatusHistory, (history) => history.store)
  storeStatusHistory: StoreStatusHistory[];

  @OneToMany(() => User, (user) => user.defaultStore)
  defaultUsers: User[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @OneToMany(() => SplashScreen, (splash) => splash.targetStore)
  splashScreens: SplashScreen[];

  @OneToMany(() => InventoryItem, (inventory) => inventory.store)
  inventoryItems: InventoryItem[];

  @OneToMany(() => SplashEvent, (event) => event.store)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.store)
  splashSessions: SplashSession[];
}
