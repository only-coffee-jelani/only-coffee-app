import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DeliveryProvider {
  DOORDASH = 'doordash',
  UBER_DIRECT = 'uber_direct',
  GRUBHUB = 'grubhub',
}

export enum DeliveryStatus {
  QUOTE_REQUESTED = 'quote_requested',
  QUOTE_RECEIVED = 'quote_received',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKUP_ASSIGNED = 'pickup_assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('delivery_orders')
@Index(['orderId'])
@Index(['provider'])
@Index(['status'])
export class DeliveryOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'enum', enum: DeliveryProvider })
  provider: DeliveryProvider;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalDeliveryId: string | null;

  @Column({ type: 'varchar', length: 500 })
  pickupAddress: string;

  @Column({ type: 'varchar', length: 500 })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLongitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedFee: number | null;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  estimatedDeliveryTime: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  courierName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  courierPhone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  trackingUrl: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryInstructions: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickedUpAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
