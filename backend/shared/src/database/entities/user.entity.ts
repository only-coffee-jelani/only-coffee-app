import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { RewardsLedger } from './rewards-ledger.entity';
import { Review } from './review.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  STORE_STAFF = 'store_staff',
  ADMIN = 'admin',
}

export enum UserTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  BLACK = 'black',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserTier, default: UserTier.BRONZE })
  loyaltyTier: UserTier;

  @Column({ type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: false })
  marketingOptIn: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  verificationCode: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationCodeExpiry: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  auth0Id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => RewardsLedger, (ledger) => ledger.user)
  rewardsLedger: RewardsLedger[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
