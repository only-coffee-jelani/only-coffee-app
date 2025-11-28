import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserSegmentAssignment } from './user-segment-assignment.entity';
import { UserProfile } from './user-profile.entity';
import { SplashScreen } from './splash-screen.entity';
import { SplashEvent } from './splash-event.entity';
import { SplashSession } from './splash-session.entity';

/**
 * UserSegment Entity
 * Represents user segments for AI personalization (high_value, at_risk, new_user, etc.)
 * This is a lookup/reference table
 */
@Entity('user_segments')
export class UserSegment {
  @PrimaryGeneratedColumn('uuid', { name: 'segment_id' })
  segmentId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => UserSegmentAssignment, (assignment) => assignment.segment)
  segmentAssignments: UserSegmentAssignment[];

  @OneToMany(() => UserProfile, (profile) => profile.segmentPrimary)
  userProfiles: UserProfile[];

  @OneToMany(() => SplashScreen, (splash) => splash.targetSegment)
  splashScreens: SplashScreen[];

  @OneToMany(() => SplashEvent, (event) => event.segment)
  splashEvents: SplashEvent[];

  @OneToMany(() => SplashSession, (session) => session.segment)
  splashSessions: SplashSession[];
}
