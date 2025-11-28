import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';

/**
 * PaymentMethod Entity
 * Represents payment methods (credit_card, debit_card, apple_pay, google_pay, gift_card)
 * This is a lookup/reference table
 */
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_method_id' })
  paymentMethodId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];
}

