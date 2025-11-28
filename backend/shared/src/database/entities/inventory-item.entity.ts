import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Store } from './store.entity';
import { InventoryTransaction } from './inventory-transaction.entity';

/**
 * InventoryItem Entity
 * Tracks inventory items at each store
 */
@Entity('inventory_items')
@Index(['storeId', 'itemName'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid', { name: 'inventory_item_id' })
  inventoryItemId: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'varchar', length: 255, name: 'item_name' })
  itemName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'quantity_on_hand' })
  quantityOnHand: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'reorder_level', nullable: true })
  reorderLevel: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.inventoryItems)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.inventoryItem)
  inventoryTransactions: InventoryTransaction[];
}

