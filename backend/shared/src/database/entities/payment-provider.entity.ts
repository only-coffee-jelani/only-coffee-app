import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * PaymentProvider Entity
 * Stores external payment provider customer IDs (Stripe, PayPal, etc.)
 * Allows multi-provider support and easy provider switching
 */
@Entity('payment_providers')
@Index(['userId', 'providerName'], { unique: true })
@Index(['providerCustomerId'])
export class PaymentProvider {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_provider_id' })
  paymentProviderId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'provider_name' })
  providerName: string; // 'stripe', 'paypal', 'square', etc.

  @Column({ type: 'varchar', length: 255, name: 'provider_customer_id' })
  providerCustomerId: string; // External provider's customer ID

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Additional provider-specific data

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.paymentProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

