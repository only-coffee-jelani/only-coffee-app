import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * ReportableEntity Entity
 * Represents entities that can be used in reports (orders, users, menu_items, etc.)
 * This is a lookup/reference table for the reporting engine
 */
@Entity('reportable_entities')
export class ReportableEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'table_name' })
  tableName: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

