import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Order } from './order.entity';
import { RefundRequest } from './refund-request.entity';

/**
 * Refund Entity
 * Tracks processed refunds
 */
@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid', { name: 'refund_id' })
  refundId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'refund_request_id', nullable: true })
  refundRequestId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', name: 'stripe_refund_id', nullable: true })
  stripeRefundId: string | null;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToOne(() => RefundRequest, (refundRequest) => refundRequest.refund)
  @JoinColumn({ name: 'refund_request_id' })
  refundRequest: RefundRequest;
}

