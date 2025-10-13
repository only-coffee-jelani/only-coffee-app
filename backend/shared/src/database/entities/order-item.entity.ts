import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from './menu-item.entity';

@Entity('order_items')
@Index(['orderId'])
@Index(['menuItemId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  menuItemId: string | null;

  @Column({ type: 'varchar', length: 255 })
  itemName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  toastItemId: string | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  modifiersPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'jsonb', default: [] })
  modifiers: Array<{
    name: string;
    value: string;
    price: number;
  }>;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string | null;

  // Relations
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => MenuItem, { nullable: true })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem | null;
}
