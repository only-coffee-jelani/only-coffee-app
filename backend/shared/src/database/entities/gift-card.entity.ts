import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

/**
 * GiftCard Entity
 * Represents gift cards that can be purchased and redeemed
 */
@Entity('gift_cards')
@Index(['code'], { unique: true })
export class GiftCard {
  @PrimaryGeneratedColumn('uuid', { name: 'gift_card_id' })
  giftCardId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'uuid', name: 'purchased_by_user_id', nullable: true })
  purchasedByUserId: string | null;

  @Column({ type: 'uuid', name: 'redeemed_by_user_id', nullable: true })
  redeemedByUserId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'initial_balance' })
  initialBalance: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'timestamptz', name: 'purchased_at', nullable: true })
  purchasedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'redeemed_at', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.giftCardsPurchased)
  @JoinColumn({ name: 'purchased_by_user_id' })
  purchasedByUser: User;

  @ManyToOne(() => User, (user) => user.giftCardsRedeemed)
  @JoinColumn({ name: 'redeemed_by_user_id' })
  redeemedByUser: User;
}
