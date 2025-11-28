import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { MenuItem } from './menu-item.entity';

/**
 * AIRecommendation Entity
 * Stores AI-generated menu item recommendations for users
 */
@Entity('ai_recommendations')
@Index(['userId', 'createdAt'])
export class AIRecommendation {
  @PrimaryGeneratedColumn('uuid', { name: 'recommendation_id' })
  recommendationId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'menu_item_id' })
  menuItemId: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.aiRecommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.aiRecommendations)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;
}

