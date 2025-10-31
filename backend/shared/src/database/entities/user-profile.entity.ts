import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Store } from './store.entity';
import { MenuItem } from './menu-item.entity';

export enum UserSegment {
  MORNING_REGULAR = 'morning_regular',
  WEEKEND_WARRIOR = 'weekend_warrior',
  DAILY_DEPENDENT = 'daily_dependent',
  OCCASIONAL_VISITOR = 'occasional_visitor',
  PRICE_SENSITIVE = 'price_sensitive',
  LOYALIST = 'loyalist',
  AT_RISK = 'at_risk',
  LAPSED = 'lapsed',
  NEW_USER = 'new_user',
}

@Entity('user_profiles')
@Index(['segment'])
@Index(['churnRiskScore'])
@Index(['lastPurchaseDate'])
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'enum', enum: UserSegment, nullable: true })
  segment: UserSegment | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  churnRiskScore: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  lifetimeValue: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avgPurchaseInterval: number | null;

  @Column({ type: 'uuid', nullable: true })
  preferredStoreId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  favoriteCategory: string | null;

  @Column({ type: 'uuid', nullable: true })
  favoriteDrinkId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgOrderValue: number | null;

  @Column({ type: 'int', default: 0 })
  totalPurchases: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastPurchaseDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  firstPurchaseDate: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  notificationOpenRate: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  notificationFatigueScore: number | null;

  @Column({ type: 'int', nullable: true })
  preferredNotificationTime: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeZone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  featureVector: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastPromotionDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSegmentUpdate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastFeatureUpdate: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Store, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'preferredStoreId' })
  preferredStore: Store | null;

  @ManyToOne(() => MenuItem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'favoriteDrinkId' })
  favoriteDrink: MenuItem | null;
}
