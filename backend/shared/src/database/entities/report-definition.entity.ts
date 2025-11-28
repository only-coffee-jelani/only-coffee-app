import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { ReportableEntity } from './reportable-entity.entity';
import { ReportSchedule } from './report-schedule.entity';

/**
 * ReportDefinition Entity
 * Defines custom reports that can be generated
 */
@Entity('report_definitions')
export class ReportDefinition {
  @PrimaryGeneratedColumn('uuid', { name: 'report_definition_id' })
  reportDefinitionId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'jsonb', name: 'selected_columns' })
  selectedColumns: string[];

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  sorts: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ReportableEntity)
  @JoinColumn({ name: 'entity_id' })
  entity: ReportableEntity;

  @ManyToOne(() => AdminUser, (adminUser) => adminUser.reportDefinitions)
  @JoinColumn({ name: 'created_by' })
  createdByAdmin: AdminUser;

  @OneToMany(() => ReportSchedule, (schedule) => schedule.reportDefinition)
  reportSchedules: ReportSchedule[];
}

