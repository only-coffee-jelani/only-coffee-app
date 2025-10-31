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

@Entity('ab_test_metrics')
@Index(['testId', 'variantId', 'metricName'])
export class ABTestMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'test_id',
    type: 'uuid',
  })
  testId: string;

  @ManyToOne(() => ABTest, (test) => test.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: ABTest;

  @Column({
    name: 'variant_id',
    type: 'varchar',
    length: 100,
  })
  variantId: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
  })
  userId: string;

  @Column({
    name: 'metric_name',
    type: 'varchar',
    length: 100,
  })
  metricName: string; // e.g., "conversion", "revenue", "engagement"

  @Column({
    name: 'metric_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  metricValue: number;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
