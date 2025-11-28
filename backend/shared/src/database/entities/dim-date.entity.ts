import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { FactOrders } from './fact-orders.entity';

/**
 * DimDate Entity
 * Date dimension table for analytics
 */
@Entity('dim_date')
export class DimDate {
  @PrimaryColumn({ type: 'int', name: 'date_key' })
  dateKey: number;

  @Column({ type: 'date', name: 'full_date' })
  fullDate: Date;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  quarter: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  week: number;

  @Column({ type: 'int', name: 'day_of_month' })
  dayOfMonth: number;

  @Column({ type: 'int', name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 20, name: 'day_name' })
  dayName: string;

  @Column({ type: 'boolean', name: 'is_weekend' })
  isWeekend: boolean;

  // Relations
  @OneToMany(() => FactOrders, (factOrder) => factOrder.dimDate)
  factOrders: FactOrders[];
}

