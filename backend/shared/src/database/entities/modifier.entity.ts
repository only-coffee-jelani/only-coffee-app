import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';
import { OrderItemModifier } from './order-item-modifier.entity';

/**
 * Modifier Entity
 * Represents individual modifiers within a group (Small, Medium, Large, Almond Milk, etc.)
 */
@Entity('modifiers')
export class Modifier {
  @PrimaryGeneratedColumn('uuid', { name: 'modifier_id' })
  modifierId: string;

  @Column({ type: 'uuid', name: 'modifier_group_id' })
  modifierGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'price_delta', default: 0 })
  priceDelta: number;

  @Column({ type: 'int', name: 'calories_delta', nullable: true })
  caloriesDelta: number | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ModifierGroup, (modifierGroup) => modifierGroup.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modifier_group_id' })
  modifierGroup: ModifierGroup;

  @OneToMany(() => OrderItemModifier, (orderItemModifier) => orderItemModifier.modifier)
  orderItemModifiers: OrderItemModifier[];
}

