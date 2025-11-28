import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

/**
 * LoyaltyTier Entity
 * Represents loyalty tier levels (Bronze, Silver, Gold, Platinum)
 * This is a lookup/reference table
 */
@Entity('loyalty_tiers')
export class LoyaltyTier {
  @PrimaryGeneratedColumn('uuid', { name: 'loyalty_tier_id' })
  loyaltyTierId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', name: 'min_points', default: 0 })
  minPoints: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'discount_rate', default: 0 })
  discountRate: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => User, (user) => user.loyaltyTier)
  users: User[];
}

