import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './store.entity';

/**
 * StoreHours Entity
 * Represents store operating hours by day of week
 */
@Entity('store_hours')
export class StoreHours {
  @PrimaryGeneratedColumn('uuid', { name: 'store_hours_id' })
  storeHoursId: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'int', name: 'day_of_week' })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Column({ type: 'time', name: 'open_time' })
  openTime: string;

  @Column({ type: 'time', name: 'close_time' })
  closeTime: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.storeHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;
}

