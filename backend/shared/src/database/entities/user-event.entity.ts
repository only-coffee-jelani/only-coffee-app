import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

/**
 * UserEvent Entity
 * Tracks user behavior events for analytics and personalization
 */
@Entity('user_events')
@Index(['userId', 'eventType', 'createdAt'])
export class UserEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'event_id' })
  eventId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'session_id', nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Aliases for backward compatibility
  get id(): string {
    return this.eventId;
  }

  get timestamp(): Date {
    return this.createdAt;
  }

  get metadata(): Record<string, any> | null {
    return this.payload;
  }

  // Relations
  @ManyToOne(() => User, (user) => user.userEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
