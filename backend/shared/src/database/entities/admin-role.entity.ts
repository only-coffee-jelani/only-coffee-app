import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { AdminUserRole } from './admin-user-role.entity';

/**
 * AdminRole Entity
 * Represents admin roles (super_admin, store_manager, content_manager, analyst, support)
 * This is a lookup/reference table
 */
@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn('uuid', { name: 'admin_role_id' })
  adminRoleId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => AdminUserRole, (adminUserRole) => adminUserRole.adminRole)
  adminUserRoles: AdminUserRole[];
}

