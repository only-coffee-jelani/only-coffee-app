import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarouselItem } from './carousel-item.entity';

/**
 * Carousel Entity
 * Represents promotional carousels displayed in the app
 */
@Entity('carousels')
export class Carousel {
  @PrimaryGeneratedColumn('uuid', { name: 'carousel_id' })
  carouselId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  placement: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => CarouselItem, (carouselItem) => carouselItem.carousel)
  carouselItems: CarouselItem[];
}

