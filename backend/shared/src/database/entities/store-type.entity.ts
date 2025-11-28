import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Store } from './store.entity';

/**
 * StoreType Entity
 * Represents store types (coffee_shop, kiosk, food_truck, ghost_kitchen)
 * This is a lookup/reference table
 */
@Entity('store_types')
export class StoreType {
  @PrimaryGeneratedColumn('uuid', { name: 'store_type_id' })
  storeTypeId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Store, (store) => store.storeType)
  stores: Store[];
}

