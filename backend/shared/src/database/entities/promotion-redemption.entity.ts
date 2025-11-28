import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Promotion } from './promotion.entity';
import { User } from './user.entity';
import { Order } from './order.entity';

/**
 * PromotionRedemption Entity
 * Tracks when users redeem promotions
 */
@Entity('promotion_redemptions')
export class PromotionRedemption {
  @PrimaryGeneratedColumn('uuid', { name: 'redemption_id' })
  redemptionId: string;

  @Column({ type: 'uuid', name: 'promotion_id' })
  promotionId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'discount_applied' })
  discountApplied: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'redeemed_at' })
  redeemedAt: Date;

  // Relations
  @ManyToOne(() => Promotion, (promotion) => promotion.promotionRedemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @ManyToOne(() => User, (user) => user.promotionRedemptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order, (order) => order.promotionRedemptions)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}

