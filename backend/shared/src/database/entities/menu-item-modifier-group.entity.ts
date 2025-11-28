import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { ModifierGroup } from './modifier-group.entity';

/**
 * MenuItemModifierGroup Entity
 * Junction table linking menu items to their available modifier groups
 */
@Entity('menu_item_modifier_groups')
@Index(['menuItemId', 'modifierGroupId'], { unique: true })
export class MenuItemModifierGroup {
  @PrimaryGeneratedColumn('uuid', { name: 'menu_item_modifier_group_id' })
  menuItemModifierGroupId: string;

  @Column({ type: 'uuid', name: 'menu_item_id' })
  menuItemId: string;

  @Column({ type: 'uuid', name: 'modifier_group_id' })
  modifierGroupId: string;

  // Relations
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.menuItemModifierGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;

  @ManyToOne(() => ModifierGroup, (modifierGroup) => modifierGroup.menuItemModifierGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modifier_group_id' })
  modifierGroup: ModifierGroup;
}

