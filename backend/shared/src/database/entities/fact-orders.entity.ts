import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Order } from './order.entity';
import { DimDate } from './dim-date.entity';
import { DimTime } from './dim-time.entity';
import { DimStore } from './dim-store.entity';
import { DimUser } from './dim-user.entity';

/**
 * FactOrders Entity
 * Fact table for order analytics
 */
@Entity('fact_orders')
@Index(['dateKey', 'storeKey'])
export class FactOrders {
  @PrimaryGeneratedColumn('uuid', { name: 'fact_order_id' })
  factOrderId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'int', name: 'date_key' })
  dateKey: number;

  @Column({ type: 'int', name: 'time_key' })
  timeKey: number;

  @Column({ type: 'int', name: 'store_key' })
  storeKey: number;

  @Column({ type: 'int', name: 'user_key', nullable: true })
  userKey: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'int', name: 'item_count' })
  itemCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.factOrders)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => DimDate, (dimDate) => dimDate.factOrders)
  @JoinColumn({ name: 'date_key' })
  dimDate: DimDate;

  @ManyToOne(() => DimTime, (dimTime) => dimTime.factOrders)
  @JoinColumn({ name: 'time_key' })
  dimTime: DimTime;

  @ManyToOne(() => DimStore, (dimStore) => dimStore.factOrders)
  @JoinColumn({ name: 'store_key' })
  dimStore: DimStore;

  @ManyToOne(() => DimUser, (dimUser) => dimUser.factOrders)
  @JoinColumn({ name: 'user_key' })
  dimUser: DimUser;
}

