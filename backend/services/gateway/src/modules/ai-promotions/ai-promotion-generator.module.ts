import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion, User } from '@shared/database/entities';
import { AIPromotionGeneratorService } from './ai-promotion-generator.service';
import { AIPromotionGeneratorController } from './ai-promotion-generator.controller';
import { SegmentationModule } from '../segmentation/segmentation.module';
import { ChurnPredictionModule } from '../churn/churn-prediction.module';
import { RecommendationModule } from '../recommendations/recommendation.module';
import { FeatureStoreModule } from '../features/feature-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion, User]),
    SegmentationModule,
    ChurnPredictionModule,
    RecommendationModule,
    FeatureStoreModule,
  ],
  controllers: [AIPromotionGeneratorController],
  providers: [AIPromotionGeneratorService],
  exports: [AIPromotionGeneratorService],
})
export class AIPromotionGeneratorModule {}
