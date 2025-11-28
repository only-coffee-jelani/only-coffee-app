import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { FactOrders } from './fact-orders.entity';

/**
 * DimStore Entity
 * Store dimension table for analytics
 */
@Entity('dim_store')
export class DimStore {
  @PrimaryColumn({ type: 'int', name: 'store_key' })
  storeKey: number;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'varchar', length: 255, name: 'store_name' })
  storeName: string;

  @Column({ type: 'varchar', length: 100, name: 'store_type' })
  storeType: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  // Relations
  @OneToMany(() => FactOrders, (factOrder) => factOrder.dimStore)
  factOrders: FactOrders[];
}

