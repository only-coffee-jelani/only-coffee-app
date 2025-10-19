import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum TokenStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('streak_saver_tokens')
@Index(['userId', 'status'])
@Index(['grantedAt'])
export class StreakSaverToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: TokenStatus, default: TokenStatus.AVAILABLE })
  status: TokenStatus;

  @Column({ type: 'timestamptz' })
  grantedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'date', nullable: true })
  appliedToDate: Date | null; // Which missed day was this token applied to?

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null; // Tokens expire end of the month they're granted

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
