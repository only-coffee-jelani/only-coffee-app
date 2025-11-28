import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Modifier } from './modifier.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';

/**
 * ModifierGroup Entity
 * Represents groups of modifiers (Size, Milk Type, Extras, etc.)
 */
@Entity('modifier_groups')
export class ModifierGroup {
  @PrimaryGeneratedColumn('uuid', { name: 'modifier_group_id' })
  modifierGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int', name: 'min_choices', default: 0 })
  minChoices: number;

  @Column({ type: 'int', name: 'max_choices', default: 1 })
  maxChoices: number;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Modifier, (modifier) => modifier.modifierGroup)
  modifiers: Modifier[];

  @OneToMany(() => MenuItemModifierGroup, (menuItemModifierGroup) => menuItemModifierGroup.modifierGroup)
  menuItemModifierGroups: MenuItemModifierGroup[];
}

