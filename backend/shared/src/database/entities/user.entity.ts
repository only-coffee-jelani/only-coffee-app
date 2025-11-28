import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { LoyaltyTier } from './loyalty-tier.entity';
import { Store } from './store.entity';
import { UserDevice } from './user-device.entity';
import { UserSession } from './user-session.entity';
import { UserProfile } from './user-profile.entity';
import { UserSegmentAssignment } from './user-segment-assignment.entity';
import { UserEvent } from './user-event.entity';
import { AIRecommendation } from './ai-recommendation.entity';
import { LoyaltyLedger } from './loyalty-ledger.entity';
import { GiftCard } from './gift-card.entity';
import { PromotionRedemption } from './promotion-redemption.entity';
import { RefundRequest } from './refund-request.entity';
import { PaymentProvider } from './payment-provider.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * User Entity
 * Represents app users with simplified structure matching enterprise schema
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null;

  @Column({ type: 'text', name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 100, name: 'first_name', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: true })
  lastName: string | null;

  @Column({ type: 'date', nullable: true })
  birthdate: Date | null;

  // Alias for backward compatibility
  get birthDate(): Date | null {
    return this.birthdate;
  }

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ type: 'boolean', name: 'marketing_opt_in', default: false })
  marketingOptIn: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'CUSTOMER' })
  role: string;

  @Column({ type: 'uuid', name: 'loyalty_tier_id', nullable: true })
  loyaltyTierId: string | null;

  @Column({ type: 'int', name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'uuid', name: 'default_store_id', nullable: true })
  defaultStoreId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Alias for backward compatibility
  get id(): string {
    return this.userId;
  }

  // Relations
  @ManyToOne(() => LoyaltyTier, (loyaltyTier) => loyaltyTier.users)
  @JoinColumn({ name: 'loyalty_tier_id' })
  loyaltyTier: LoyaltyTier;

  @ManyToOne(() => Store, (store) => store.defaultUsers)
  @JoinColumn({ name: 'default_store_id' })
  defaultStore: Store;

  @OneToMany(() => UserDevice, (device) => device.user)
  userDevices: UserDevice[];

  @OneToMany(() => UserSession, (session) => session.user)
  userSessions: UserSession[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  userProfile: UserProfile;

  @OneToMany(() => UserSegmentAssignment, (assignment) => assignment.user)
  segmentAssignments: UserSegmentAssignment[];

  @OneToMany(() => UserEvent, (event) => event.user)
  userEvents: UserEvent[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => LoyaltyLedger, (ledger) => ledger.user)
  loyaltyLedger: LoyaltyLedger[];

  @OneToMany(() => GiftCard, (giftCard) => giftCard.purchasedByUser)
  giftCardsPurchased: GiftCard[];

  @OneToMany(() => GiftCard, (giftCard) => giftCard.redeemedByUser)
  giftCardsRedeemed: GiftCard[];

  @OneToMany(() => PromotionRedemption, (redemption) => redemption.user)
  promotionRedemptions: PromotionRedemption[];

  @OneToMany(() => AIRecommendation, (recommendation) => recommendation.user)
  aiRecommendations: AIRecommendation[];

  @OneToMany(() => RefundRequest, (refundRequest) => refundRequest.user)
  refundRequests: RefundRequest[];

  @OneToMany(() => PaymentProvider, (paymentProvider) => paymentProvider.user)
  paymentProviders: PaymentProvider[];

  @OneToMany(() => SplashEvent, (event) => event.user)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.user)
  splashSessions: SplashSession[];

  // Computed properties
  get name(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}
