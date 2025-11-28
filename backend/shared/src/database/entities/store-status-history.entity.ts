import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Store } from './store.entity';
import { AdminUser } from './admin-user.entity';

/**
 * StoreStatusHistory Entity
 * Tracks store status changes over time
 */
@Entity('store_status_history')
@Index(['storeId', 'changedAt'])
export class StoreStatusHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'store_status_history_id' })
  storeStatusHistoryId: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', name: 'changed_by', nullable: true })
  changedBy: string | null;

  @Column({ type: 'timestamptz', name: 'changed_at', default: () => 'NOW()' })
  changedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.storeStatusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'changed_by' })
  changedByAdmin: AdminUser;
}

