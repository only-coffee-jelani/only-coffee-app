import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { UserSession } from './user-session.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * UserDevice Entity
 * Tracks user devices for push notifications and analytics
 */
@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid', { name: 'device_id' })
  deviceId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20, name: 'device_type', nullable: true })
  deviceType: string | null;

  @Column({ type: 'text', name: 'push_token', nullable: true })
  pushToken: string | null;

  @Column({ type: 'varchar', length: 20, name: 'app_version', nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 20, name: 'os_version', nullable: true })
  osVersion: string | null;

  @Column({ type: 'timestamptz', name: 'last_active_at', nullable: true })
  lastActiveAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userDevices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => UserSession, (session) => session.device)
  userSessions: UserSession[];

  @OneToMany(() => SplashEvent, (event) => event.device)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.device)
  splashSessions: SplashSession[];
}

