import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PromotionDiscountType } from './promotion-discount-type.entity';
import { AdminUser } from './admin-user.entity';
import { PromotionRedemption } from './promotion-redemption.entity';

/**
 * Promotion Entity
 * Represents promotional offers and discounts
 */
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid', { name: 'promotion_id' })
  promotionId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'discount_type_id' })
  discountTypeId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'discount_value' })
  discountValue: number;

  @Column({ type: 'timestamptz', name: 'start_at' })
  startAt: Date;

  @Column({ type: 'timestamptz', name: 'end_at' })
  endAt: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Aliases for backward compatibility
  get id(): string {
    return this.promotionId;
  }

  get title(): string {
    return this.name;
  }

  // Relations
  @ManyToOne(() => PromotionDiscountType, (discountType) => discountType.promotions)
  @JoinColumn({ name: 'discount_type_id' })
  discountType: PromotionDiscountType;

  @ManyToOne(() => AdminUser, (adminUser) => adminUser.promotions)
  @JoinColumn({ name: 'created_by' })
  createdByAdmin: AdminUser;

  @OneToMany(() => PromotionRedemption, (redemption) => redemption.promotion)
  promotionRedemptions: PromotionRedemption[];
}
