import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, MenuItem, User } from '@shared/database/entities';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { FeatureStoreModule } from '../features/feature-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, MenuItem, User]),
    FeatureStoreModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
