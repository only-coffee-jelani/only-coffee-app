import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Promotion } from './promotion.entity';

/**
 * PromotionDiscountType Entity
 * Represents promotion discount types (percentage, fixed_amount)
 * This is a lookup/reference table
 */
@Entity('promotion_discount_types')
export class PromotionDiscountType {
  @PrimaryGeneratedColumn('uuid', { name: 'promotion_discount_type_id' })
  promotionDiscountTypeId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Promotion, (promotion) => promotion.discountType)
  promotions: Promotion[];
}

