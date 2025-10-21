import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserTier } from './user.entity';

export enum PerkType {
  BIRTHDAY_REWARD = 'birthday_reward', // Free drink on birthday
  EARLY_ACCESS = 'early_access', // Early access to new drinks/promos
  EXCLUSIVE_DISCOUNT = 'exclusive_discount', // Tier-exclusive discounts
  FREE_UPGRADE = 'free_upgrade', // Free size upgrades
  PRIORITY_SUPPORT = 'priority_support', // VIP customer service
  CUSTOM_REWARD = 'custom_reward', // Admin-defined custom perks
}

@Entity('tier_perks')
@Index(['tier', 'perkType'])
@Index(['isActive'])
export class TierPerk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserTier })
  tier: UserTier;

  @Column({ type: 'enum', enum: PerkType })
  perkType: PerkType;

  @Column({ type: 'varchar', length: 100 })
  perkName: string; // "Birthday Free Drink"

  @Column({ type: 'text' })
  description: string; // User-facing description

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // Order in UI lists

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any> | null;
  // Example for BIRTHDAY_REWARD: { maxValueCents: 1000, expiryDays: 7 }
  // Example for EXCLUSIVE_DISCOUNT: { percentOff: 10, eligibleCategories: ['beverages'] }

  @Column({ type: 'varchar', length: 50, nullable: true })
  iconName: string | null; // For mobile UI: 'gift', 'star', 'crown', etc.

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
