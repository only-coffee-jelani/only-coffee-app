import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';
import { Refund } from './refund.entity';

/**
 * RefundRequest Entity
 * Tracks customer refund requests
 */
@Entity('refund_requests')
export class RefundRequest {
  @PrimaryGeneratedColumn('uuid', { name: 'refund_request_id' })
  refundRequestId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'text', name: 'admin_notes', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.refundRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User, (user) => user.refundRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Refund, (refund) => refund.refundRequest)
  refund: Refund;
}

