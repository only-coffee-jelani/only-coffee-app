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

export enum ProgramEventType {
  COUPON_GRANTED = 'coupon_granted',
  COUPON_REDEEMED = 'coupon_redeemed',
  COUPON_EXPIRED = 'coupon_expired',
  PROMO_CODE_REDEEMED = 'promo_code_redeemed',
}

@Entity('program_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['couponId'])
export class ProgramEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: ProgramEventType })
  eventType: ProgramEventType;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'uuid', nullable: true })
  promoCodeId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  eventData: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}
