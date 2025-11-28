import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * AnonymousDevice Entity
 * Tracks devices before user login/registration
 * When user logs in, device is migrated to user_devices table
 */
@Entity('anonymous_devices')
export class AnonymousDevice {
  @PrimaryColumn({ type: 'uuid', name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar', length: 20, name: 'device_type', nullable: true })
  deviceType: string | null;

  @Column({ type: 'varchar', length: 20, name: 'app_version', nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 20, name: 'os_version', nullable: true })
  osVersion: string | null;

  @Column({ type: 'varchar', length: 100, name: 'device_model', nullable: true })
  deviceModel: string | null;

  @Column({ type: 'timestamptz', name: 'first_seen_at', default: () => 'NOW()' })
  firstSeenAt: Date;

  @Column({ type: 'timestamptz', name: 'last_active_at', nullable: true })
  lastActiveAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => SplashEvent, (event) => event.anonymousDevice)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.anonymousDevice)
  splashSessions: SplashSession[];
}

