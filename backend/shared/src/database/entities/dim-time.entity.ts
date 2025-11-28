import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { FactOrders } from './fact-orders.entity';

/**
 * DimTime Entity
 * Time dimension table for analytics
 */
@Entity('dim_time')
export class DimTime {
  @PrimaryColumn({ type: 'int', name: 'time_key' })
  timeKey: number;

  @Column({ type: 'time', name: 'full_time' })
  fullTime: string;

  @Column({ type: 'int' })
  hour: number;

  @Column({ type: 'int' })
  minute: number;

  @Column({ type: 'varchar', length: 20, name: 'time_period' })
  timePeriod: string;

  // Relations
  @OneToMany(() => FactOrders, (factOrder) => factOrder.dimTime)
  factOrders: FactOrders[];
}

