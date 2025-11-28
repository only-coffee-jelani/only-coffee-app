import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { UserSegment } from './user-segment.entity';

/**
 * UserSegmentAssignment Entity
 * Junction table for user-segment many-to-many relationship
 */
@Entity('user_segment_assignments')
@Index(['userId', 'segmentId'], { unique: true })
export class UserSegmentAssignment {
  @PrimaryGeneratedColumn('uuid', { name: 'assignment_id' })
  assignmentId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'segment_id' })
  segmentId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'assigned_at' })
  assignedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.segmentAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSegment, (segment) => segment.segmentAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: UserSegment;
}
