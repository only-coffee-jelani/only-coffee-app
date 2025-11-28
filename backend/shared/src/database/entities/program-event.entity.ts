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

/**
 * ProgramEventType Enum
 * Types of program events that can be tracked
 */
export enum ProgramEventType {
  COUPON_GRANTED = 'COUPON_GRANTED',
  COUPON_REDEEMED = 'COUPON_REDEEMED',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  PROMO_CODE_REDEEMED = 'PROMO_CODE_REDEEMED',
  PROMO_CODE_USED = 'PROMO_CODE_USED',
  ORDER_PLACED = 'ORDER_PLACED',
}

/**
 * ProgramEvent Entity
 * Tracks loyalty program events for analytics and auditing
 * Enterprise-grade event tracking system
 */
@Entity('program_events')
@Index(['userId', 'eventType', 'createdAt'])
@Index(['couponId'])
@Index(['orderId'])
export class ProgramEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'event_id' })
  eventId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: ProgramEventType,
    name: 'event_type',
  })
  eventType: ProgramEventType;

  @Column({ type: 'uuid', name: 'coupon_id', nullable: true })
  couponId: string | null;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ type: 'uuid', name: 'promo_code_id', nullable: true })
  promoCodeId: string | null;

  @Column({ type: 'jsonb', name: 'event_data', nullable: true })
  eventData: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}

