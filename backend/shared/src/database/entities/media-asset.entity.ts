import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { MenuItem } from './menu-item.entity';
import { SplashScreen } from './splash-screen.entity';
import { CarouselItem } from './carousel-item.entity';

/**
 * MediaAsset Entity
 * Centralized media asset management for images and other media
 */
@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid', { name: 'asset_id' })
  assetId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', name: 'alt_text', nullable: true })
  altText: string | null;

  @Column({ type: 'varchar', length: 50, default: 'image' })
  type: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => AdminUser, (adminUser) => adminUser.mediaAssets)
  @JoinColumn({ name: 'created_by' })
  createdByAdmin: AdminUser;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.imageAsset)
  menuItems: MenuItem[];

  @OneToMany(() => SplashScreen, (splashScreen) => splashScreen.imageAsset)
  splashScreens: SplashScreen[];

  @OneToMany(() => CarouselItem, (carouselItem) => carouselItem.imageAsset)
  carouselItems: CarouselItem[];
}

