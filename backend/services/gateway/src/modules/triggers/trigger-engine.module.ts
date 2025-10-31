import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserEvent } from '@shared/database/entities';
import { TriggerEngineService } from './trigger-engine.service';
import { TriggerEngineController } from './trigger-engine.controller';
import { FeatureStoreModule } from '../features/feature-store.module';
import { SegmentationModule } from '../segmentation/segmentation.module';
import { ChurnPredictionModule } from '../churn/churn-prediction.module';
import { RecommendationModule } from '../recommendations/recommendation.module';
import { ContextualBanditModule } from '../bandit/contextual-bandit.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserEvent]),
    FeatureStoreModule,
    SegmentationModule,
    ChurnPredictionModule,
    RecommendationModule,
    ContextualBanditModule,
    WeatherModule,
  ],
  controllers: [TriggerEngineController],
  providers: [TriggerEngineService],
  exports: [TriggerEngineService],
})
export class TriggerEngineModule {}
