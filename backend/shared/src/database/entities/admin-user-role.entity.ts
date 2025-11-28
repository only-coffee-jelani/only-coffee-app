import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { AdminRole } from './admin-role.entity';

/**
 * AdminUserRole Entity
 * Junction table for many-to-many relationship between admin users and roles
 */
@Entity('admin_user_roles')
@Index(['adminUserId', 'adminRoleId'], { unique: true })
export class AdminUserRole {
  @PrimaryGeneratedColumn('uuid', { name: 'admin_user_role_id' })
  adminUserRoleId: string;

  @Column({ type: 'uuid', name: 'admin_user_id' })
  adminUserId: string;

  @Column({ type: 'uuid', name: 'admin_role_id' })
  adminRoleId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'assigned_at' })
  assignedAt: Date;

  // Relations
  @ManyToOne(() => AdminUser, (adminUser) => adminUser.adminUserRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @ManyToOne(() => AdminRole, (adminRole) => adminRole.adminUserRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_role_id' })
  adminRole: AdminRole;
}

