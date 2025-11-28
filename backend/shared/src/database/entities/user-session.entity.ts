import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

/**
 * UserSession Entity
 * Tracks user sessions for analytics and security
 */
@Entity('user_sessions')
@Index(['userId', 'startedAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  sessionId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserDevice, (device) => device.userSessions)
  @JoinColumn({ name: 'device_id' })
  device: UserDevice;
}

