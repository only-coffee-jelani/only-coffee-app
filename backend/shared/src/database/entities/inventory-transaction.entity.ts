import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

/**
 * InventoryTransaction Entity
 * Tracks inventory movements (additions, deductions, adjustments)
 */
@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'uuid', name: 'inventory_item_id' })
  inventoryItemId: string;

  @Column({ type: 'varchar', length: 50, name: 'transaction_type' })
  transactionType: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'quantity_delta' })
  quantityDelta: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => InventoryItem, (inventoryItem) => inventoryItem.inventoryTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;
}

