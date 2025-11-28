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
import { OrderStatus } from './order-status.entity';
import { PaymentMethod } from './payment-method.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { LoyaltyLedger } from './loyalty-ledger.entity';
import { PromotionRedemption } from './promotion-redemption.entity';
import { RefundRequest } from './refund-request.entity';
import { Refund } from './refund.entity';
import { FactOrders } from './fact-orders.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * Order Entity
 * Represents customer orders with simplified structure
 */

@Entity('orders')
@Index(['userId', 'placedAt'])
@Index(['storeId', 'placedAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'uuid', name: 'order_status_id' })
  orderStatusId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'discount_total', default: 0 })
  discountTotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'uuid', name: 'payment_method_id', nullable: true })
  paymentMethodId: string | null;

  @Column({ type: 'timestamptz', name: 'pickup_time', nullable: true })
  pickupTime: Date | null;

  @Column({ type: 'timestamptz', name: 'placed_at', default: () => 'NOW()' })
  placedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => OrderStatus, (orderStatus) => orderStatus.orders)
  @JoinColumn({ name: 'order_status_id' })
  orderStatus: OrderStatus;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.orders)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => LoyaltyLedger, (ledger) => ledger.order)
  loyaltyLedger: LoyaltyLedger[];

  @OneToMany(() => PromotionRedemption, (redemption) => redemption.order)
  promotionRedemptions: PromotionRedemption[];

  @OneToMany(() => RefundRequest, (refundRequest) => refundRequest.order)
  refundRequests: RefundRequest[];

  @OneToMany(() => Refund, (refund) => refund.order)
  refunds: Refund[];

  @OneToMany(() => FactOrders, (factOrder) => factOrder.order)
  factOrders: FactOrders[];

  @OneToMany(() => SplashEvent, (event) => event.order)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.order)
  splashSessions: SplashSession[];
}
