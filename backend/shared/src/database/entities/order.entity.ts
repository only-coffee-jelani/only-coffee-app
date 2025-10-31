import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Store } from './store.entity';
import { OrderItem } from './order-item.entity';
import { CouponGrant } from './coupon-grant.entity';

export enum OrderStatus {
  INITIATED = 'initiated',
  SLOT_RESERVED = 'slot_reserved',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_FAILED = 'payment_failed',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  CATERING = 'catering',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  REWARD_REDEMPTION = 'reward_redemption',
}

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['storeId', 'createdAt'])
@Index(['status'])
@Index(['pickupTime'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.PICKUP })
  orderType: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.INITIATED })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  toastOrderId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  toastCheckId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tip: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'uuid', nullable: true })
  appliedCouponId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ type: 'int', default: 0 })
  pointsEarned: number;

  @Column({ type: 'int', default: 0 })
  pointsRedeemed: number;

  @Column({ type: 'timestamptz', nullable: true })
  pickupTime: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  specialInstructions: string | null;

  @Column({ type: 'jsonb', nullable: true })
  deliveryInfo: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => CouponGrant, { nullable: true })
  @JoinColumn({ name: 'appliedCouponId' })
  appliedCoupon: CouponGrant | null;

  // Computed properties for backward compatibility
  get totalAmount(): number {
    return this.total;
  }

  get promoCodeId(): string | null {
    return this.appliedCouponId;
  }
}
