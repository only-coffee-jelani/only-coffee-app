import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MenuCategory } from './menu-category.entity';
import { MediaAsset } from './media-asset.entity';
import { OrderItem } from './order-item.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';
import { AIRecommendation } from './ai-recommendation.entity';

/**
 * MenuItem Entity
 * Represents menu items with category and image asset relations
 */
@Entity('menu_items')
@Index(['categoryId'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid', { name: 'menu_item_id' })
  menuItemId: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'base_price' })
  basePrice: number;

  @Column({ type: 'int', nullable: true })
  calories: number | null;

  @Column({ type: 'uuid', name: 'image_asset_id', nullable: true })
  imageAssetId: string | null;

  @Column({ type: 'varchar', length: 100, name: 'toast_item_id', nullable: true })
  toastItemId: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MenuCategory, (category) => category.menuItems)
  @JoinColumn({ name: 'category_id' })
  category: MenuCategory;

  @ManyToOne(() => MediaAsset, (mediaAsset) => mediaAsset.menuItems)
  @JoinColumn({ name: 'image_asset_id' })
  imageAsset: MediaAsset;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menuItem)
  orderItems: OrderItem[];

  @OneToMany(() => MenuItemModifierGroup, (menuItemModifierGroup) => menuItemModifierGroup.menuItem)
  menuItemModifierGroups: MenuItemModifierGroup[];

  @OneToMany(() => AIRecommendation, (recommendation) => recommendation.menuItem)
  aiRecommendations: AIRecommendation[];
}
