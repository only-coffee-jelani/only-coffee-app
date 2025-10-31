import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notification_preferences')
@Index(['promotionalEnabled'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  smsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  promotionalEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  streakRemindersEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  locationTriggersEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  productLaunchesEnabled: boolean;

  @Column({ type: 'int', default: 3 })
  maxNotificationsPerDay: number;

  @Column({ type: 'int', nullable: true })
  quietHoursStart: number | null;

  @Column({ type: 'int', nullable: true })
  quietHoursEnd: number | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'timestamptz', nullable: true })
  consentTimestamp: Date | null;

  @Column({ type: 'boolean', nullable: true })
  attConsent: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  locationConsent: boolean | null;

  @Column({ type: 'boolean', default: true })
  analyticsConsent: boolean;

  @Column({ type: 'boolean', nullable: true })
  marketingConsent: boolean | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
