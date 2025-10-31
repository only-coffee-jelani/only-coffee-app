import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MetricCategory {
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  ML_MODEL = 'ml_model',
  SYSTEM_HEALTH = 'system_health',
  ERROR = 'error',
}

@Entity('system_metrics')
@Index(['metricName', 'timestamp'])
@Index(['category', 'timestamp'])
export class SystemMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'metric_name',
    type: 'varchar',
    length: 100,
  })
  metricName: string;

  @Column({
    type: 'enum',
    enum: MetricCategory,
  })
  category: MetricCategory;

  @Column({
    name: 'metric_value',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  metricValue: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  unit: string; // e.g., "ms", "count", "percentage", "dollars"

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  dimensions: Record<string, any>; // Additional dimensions for filtering

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
