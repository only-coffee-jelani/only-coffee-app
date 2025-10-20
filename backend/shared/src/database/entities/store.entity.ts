import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Review } from './review.entity';
import { MenuItem } from './menu-item.entity';

export enum StoreType {
  COFFEE_SHOP = 'coffee_shop',
  MOBILE_COFFEE_BAR = 'mobile_coffee_bar',
}

@Entity('stores')
@Index(['latitude', 'longitude'])
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: StoreType, default: StoreType.COFFEE_SHOP })
  type: StoreType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  toastLocationId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', default: {} })
  operatingHours: Record<string, any>; // { monday: { open: '06:00', close: '20:00' }, ... }

  @Column({ type: 'int', default: 20 })
  capacity: number; // Max orders per 5-minute slot

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  acceptingOrders: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 4.5 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, any>; // { parking: true, wifi: true, dineIn: true, ... }

  // ============ TIMESTAMPS & TRACKING ============
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ============ RELATIONS ============
  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @OneToMany(() => Review, (review) => review.store)
  reviews: Review[];

  @OneToMany(() => MenuItem, (menuItem) => menuItem.storeId)
  menuItems: MenuItem[];
}
