import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MenuCategory {
  BEST_SELLERS = 'best_sellers',
  SEASONAL_SPECIALS = 'seasonal_specials',
  SIGNATURE = 'signature',
  HOT_COFFEE = 'hot_coffee',
  ICED_COFFEE = 'iced_coffee',
  COLD_BREW = 'cold_brew',
  OTHER_DRINKS = 'other_drinks', // formerly CHOCOLATE
  ICE_CREAM = 'ice_cream',
  ADD_ONS = 'add_ons',
  // Legacy support
  CHOCOLATE = 'chocolate', // Deprecated: use OTHER_DRINKS
}

@Entity('menu_items')
@Index(['category'])
@Index(['toastItemId'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', array: true, default: [] })
  storeIds: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  toastItemId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: MenuCategory })
  category: MenuCategory;

  // New categories array field - supports multiple categories per item
  @Column({
    type: 'text',
    array: true,
    default: () => 'ARRAY[]::text[]'
  })
  categories: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'jsonb', default: [] })
  availableModifiers: Array<{
    id: string;
    name: string;
    type: string; // 'size', 'milk', 'syrup', 'ice', etc.
    options: Array<{ value: string; price: number }>;
    required: boolean;
  }>;

  @Column({ type: 'jsonb', default: {} })
  nutritionalInfo: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  allergens: string[];

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  preparationTime: number; // in minutes

  @Column({ type: 'int', default: 999 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;
}

// Helper function to get category display names
export function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    'best_sellers': 'Best Sellers',
    'seasonal_specials': 'Seasonal Specials',
    'signature': 'Signature',
    'hot_coffee': 'Hot Coffee',
    'iced_coffee': 'Iced Coffee',
    'cold_brew': 'Cold Brew',
    'other_drinks': 'Other Drinks',
    'chocolate': 'Other Drinks', // Legacy support - map to Other Drinks
    'ice_cream': 'Ice Cream',
    'add_ons': 'Add Ons',
  };
  // Convert snake_case to Title Case for unknown categories
  return displayNames[category] || category.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
