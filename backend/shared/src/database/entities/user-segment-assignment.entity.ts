import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

// Import the UserSegment enum from user-profile
export { UserSegment } from './user-profile.entity';
import { UserSegment } from './user-profile.entity';

@Entity('user_segment_assignments')
@Index(['userId', 'isActive'])
@Index(['segmentName'])
export class UserSegmentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  segmentName: string;

  @Column({ type: 'varchar', length: 255 })
  segmentDisplayName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rfmScore: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  recencyScore: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  frequencyScore: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  monetaryScore: number | null;

  @Column({ type: 'timestamptz' })
  assignedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Computed property for backward compatibility
  get segment(): string {
    return this.segmentName;
  }
}
