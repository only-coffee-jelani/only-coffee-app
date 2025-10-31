import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ABTest } from './ab-test.entity';
import { User } from '@shared/database/entities/user.entity';

@Entity('ab_test_assignments')
@Index(['userId', 'testId'], { unique: true })
export class ABTestAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'test_id',
    type: 'uuid',
  })
  testId: string;

  @ManyToOne(() => ABTest, (test) => test.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: ABTest;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'variant_id',
    type: 'varchar',
    length: 100,
  })
  variantId: string;

  @Column({
    name: 'assigned_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
