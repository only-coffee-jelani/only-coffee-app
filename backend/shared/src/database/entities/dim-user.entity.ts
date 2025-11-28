import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { FactOrders } from './fact-orders.entity';

/**
 * DimUser Entity
 * User dimension table for analytics
 */
@Entity('dim_user')
export class DimUser {
  @PrimaryColumn({ type: 'int', name: 'user_key' })
  userKey: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'loyalty_tier' })
  loyaltyTier: string;

  @Column({ type: 'varchar', length: 100, name: 'primary_segment' })
  primarySegment: string;

  // Relations
  @OneToMany(() => FactOrders, (factOrder) => factOrder.dimUser)
  factOrders: FactOrders[];
}

