import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';

/**
 * OrderStatus Entity
 * Represents order statuses (pending, confirmed, preparing, ready, completed, cancelled)
 * This is a lookup/reference table
 */
@Entity('order_statuses')
export class OrderStatus {
  @PrimaryGeneratedColumn('uuid', { name: 'order_status_id' })
  orderStatusId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.orderStatus)
  orders: Order[];
}

