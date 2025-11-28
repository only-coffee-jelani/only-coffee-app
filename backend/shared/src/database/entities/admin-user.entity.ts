import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { AdminUserRole } from './admin-user-role.entity';
import { AuditLog } from './audit-log.entity';
import { MediaAsset } from './media-asset.entity';
import { SplashScreen } from './splash-screen.entity';
import { Promotion } from './promotion.entity';
import { ReportDefinition } from './report-definition.entity';

/**
 * AdminUser Entity
 * Represents admin users with RBAC (Role-Based Access Control)
 */
@Entity('admin_users')
@Index(['email'], { unique: true })
export class AdminUser {
  @PrimaryGeneratedColumn('uuid', { name: 'admin_user_id' })
  adminUserId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => AdminUserRole, (adminUserRole) => adminUserRole.adminUser)
  adminUserRoles: AdminUserRole[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.adminUser)
  auditLogs: AuditLog[];

  @OneToMany(() => MediaAsset, (mediaAsset) => mediaAsset.createdBy)
  mediaAssets: MediaAsset[];

  @OneToMany(() => SplashScreen, (splashScreen) => splashScreen.createdBy)
  splashScreens: SplashScreen[];

  @OneToMany(() => Promotion, (promotion) => promotion.createdByAdmin)
  promotions: Promotion[];

  @OneToMany(() => ReportDefinition, (reportDefinition) => reportDefinition.createdByAdmin)
  reportDefinitions: ReportDefinition[];
}

