import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReportDefinition } from './report-definition.entity';

/**
 * ReportSchedule Entity
 * Schedules automatic report generation
 */
@Entity('report_schedules')
export class ReportSchedule {
  @PrimaryGeneratedColumn('uuid', { name: 'schedule_id' })
  scheduleId: string;

  @Column({ type: 'uuid', name: 'report_definition_id' })
  reportDefinitionId: string;

  @Column({ type: 'varchar', length: 50 })
  frequency: string;

  @Column({ type: 'jsonb', name: 'recipient_emails' })
  recipientEmails: string[];

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'last_run_at', nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'timestamptz', name: 'next_run_at', nullable: true })
  nextRunAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ReportDefinition, (reportDefinition) => reportDefinition.reportSchedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_definition_id' })
  reportDefinition: ReportDefinition;
}

