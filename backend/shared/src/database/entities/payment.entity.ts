import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

/**
 * Payment Entity
 * Represents payment transactions for orders
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'text', name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'text', name: 'failure_reason', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}

