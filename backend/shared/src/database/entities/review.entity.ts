import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Store } from './store.entity';

@Entity('reviews')
@Index(['userId'])
@Index(['storeId'])
@Index(['orderId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'jsonb', default: [] })
  images: string[]; // Array of image URLs

  @Column({ type: 'boolean', default: false })
  isVerifiedPurchase: boolean;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responseText: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  responseAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Store, (store) => store.reviews)
  @JoinColumn({ name: 'storeId' })
  store: Store;
}
