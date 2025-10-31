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
import { UserSegment } from './user-profile.entity';

@Entity('user_segments')
@Index(['userId', 'assignedAt'])
@Index(['segment'])
export class UserSegmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: UserSegment })
  segment: UserSegment;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modelVersion: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
