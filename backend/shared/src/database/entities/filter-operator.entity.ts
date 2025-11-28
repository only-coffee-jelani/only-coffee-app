import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * FilterOperator Entity
 * Represents filter operators for the reporting engine (equals, not_equals, greater_than, etc.)
 * This is a lookup/reference table
 */
@Entity('filter_operators')
export class FilterOperator {
  @PrimaryGeneratedColumn('uuid', { name: 'operator_id' })
  operatorId: string;

  @Column({ type: 'varchar', length: 50, name: 'data_type' })
  dataType: string;

  @Column({ type: 'varchar', length: 50 })
  operator: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

