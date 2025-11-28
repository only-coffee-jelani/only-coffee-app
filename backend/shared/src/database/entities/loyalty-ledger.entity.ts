import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

/**
 * LoyaltyLedger Entity
 * Tracks loyalty points transactions
 */
@Entity('loyalty_ledger')
export class LoyaltyLedger {
  @PrimaryGeneratedColumn('uuid', { name: 'loyalty_ledger_id' })
  loyaltyLedgerId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int', name: 'points_delta' })
  pointsDelta: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.loyaltyLedger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order, (order) => order.loyaltyLedger)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}

