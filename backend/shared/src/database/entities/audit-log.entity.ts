import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AdminUser } from './admin-user.entity';

/**
 * AuditLog Entity
 * Tracks all admin actions for compliance and security
 */
@Entity('audit_logs')
@Index(['adminUserId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid', { name: 'audit_log_id' })
  auditLogId: string;

  @Column({ type: 'uuid', name: 'admin_user_id' })
  adminUserId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  oldValues: Record<string, any> | null;

  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => AdminUser, (adminUser) => adminUser.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;
}

