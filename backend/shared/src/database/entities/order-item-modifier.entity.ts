import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Modifier } from './modifier.entity';

/**
 * OrderItemModifier Entity
 * Represents modifiers applied to order items
 */
@Entity('order_item_modifiers')
export class OrderItemModifier {
  @PrimaryGeneratedColumn('uuid', { name: 'order_item_modifier_id' })
  orderItemModifierId: string;

  @Column({ type: 'uuid', name: 'order_item_id' })
  orderItemId: string;

  @Column({ type: 'uuid', name: 'modifier_id' })
  modifierId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'price_delta', default: 0 })
  priceDelta: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => OrderItem, (orderItem) => orderItem.orderItemModifiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @ManyToOne(() => Modifier, (modifier) => modifier.orderItemModifiers)
  @JoinColumn({ name: 'modifier_id' })
  modifier: Modifier;
}

