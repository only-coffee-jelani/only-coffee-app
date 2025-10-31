import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ABTestAssignment } from './ab-test-assignment.entity';
import { ABTestMetric } from './ab-test-metric.entity';

export enum ABTestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum ABTestType {
  PROMOTION_DESIGN = 'promotion_design',
  NOTIFICATION_TIMING = 'notification_timing',
  PERSONALIZATION_ALGORITHM = 'personalization_algorithm',
  OFFER_COPY = 'offer_copy',
  OTHER = 'other',
}

@Entity('ab_tests')
export class ABTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ABTestType,
    name: 'test_type',
  })
  testType: ABTestType;

  @Column({
    type: 'enum',
    enum: ABTestStatus,
    default: ABTestStatus.DRAFT,
  })
  status: ABTestStatus;

  @Column({ type: 'jsonb' })
  variants: {
    id: string;
    name: string;
    description?: string;
    config: Record<string, any>;
    trafficPercentage: number;
  }[];

  @Column({ name: 'control_variant_id', type: 'varchar', length: 100 })
  controlVariantId: string;

  @Column({
    name: 'target_metric',
    type: 'varchar',
    length: 100,
  })
  targetMetric: string; // e.g., "conversion_rate", "revenue_per_user", "engagement_rate"

  @Column({
    name: 'sample_size_target',
    type: 'integer',
    nullable: true,
  })
  sampleSizeTarget: number;

  @Column({
    name: 'confidence_level',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0.95,
  })
  confidenceLevel: number; // e.g., 0.95 for 95% confidence

  @Column({
    name: 'minimum_detectable_effect',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  minimumDetectableEffect: number; // e.g., 0.05 for 5% lift

  @Column({
    name: 'started_at',
    type: 'timestamp',
    nullable: true,
  })
  startedAt: Date;

  @Column({
    name: 'ended_at',
    type: 'timestamp',
    nullable: true,
  })
  endedAt: Date;

  @Column({
    name: 'winning_variant_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  winningVariantId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  results: {
    variantId: string;
    sampleSize: number;
    conversionRate: number;
    averageValue: number;
    pValue: number;
    confidenceInterval: [number, number];
  }[];

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
  })
  createdBy: string;

  @OneToMany(() => ABTestAssignment, (assignment) => assignment.test)
  assignments: ABTestAssignment[];

  @OneToMany(() => ABTestMetric, (metric) => metric.test)
  metrics: ABTestMetric[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
