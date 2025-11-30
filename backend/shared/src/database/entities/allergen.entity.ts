import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

/**
 * Allergen Entity
 * Lookup table for allergens that can be associated with menu items
 */
@Entity('allergens')
export class Allergen {
  @PrimaryGeneratedColumn('uuid', { name: 'allergen_id' })
  allergenId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToMany(() => MenuItem, (menuItem) => menuItem.allergens)
  menuItems: MenuItem[];
}

