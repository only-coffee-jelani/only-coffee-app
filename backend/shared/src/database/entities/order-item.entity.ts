import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from './menu-item.entity';
import { OrderItemModifier } from './order-item-modifier.entity';

/**
 * OrderItem Entity
 * Represents individual items within an order
 */
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid', { name: 'order_item_id' })
  orderItemId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'menu_item_id' })
  menuItemId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.orderItems)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;

  @OneToMany(() => OrderItemModifier, (orderItemModifier) => orderItemModifier.orderItem)
  orderItemModifiers: OrderItemModifier[];
}
