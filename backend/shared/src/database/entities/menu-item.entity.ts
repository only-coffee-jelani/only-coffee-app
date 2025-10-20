import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MenuCategory {
  HOT_COFFEE = 'hot_coffee',
  ICED_COFFEE = 'iced_coffee',
  COLD_BREW = 'cold_brew',
  SIGNATURE = 'signature',
  SEASONAL_SPECIALS = 'seasonal_specials',
  CHOCOLATE = 'chocolate',
  ICE_CREAM = 'ice_cream',
  ADD_ONS = 'add_ons',
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
