import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PromotionType {
  LAUNCH_MODAL = 'launch_modal',
  BANNER = 'banner',
  CARD = 'card',
}

@Entity('promotions')
@Index(['isActive', 'startDate', 'endDate'])
@Index(['promotionType'])
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'promotion_type', type: 'enum', enum: PromotionType })
  promotionType: PromotionType;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ name: 'target_menu_item_id', type: 'uuid', nullable: true })
  targetMenuItemId: string | null;

  @Column({ name: 'target_url', type: 'varchar', length: 500, nullable: true })
  targetUrl: string | null;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_duration', type: 'int', default: 0 })
  displayDuration: number; // in seconds (for launch modals)

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
