import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserEvent, Order } from '@shared/database/entities';
import { ChurnPredictionService } from './churn-prediction.service';
import { ChurnPredictionController } from './churn-prediction.controller';
import { FeatureStoreModule } from '../features/feature-store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserEvent, Order]),
    FeatureStoreModule,
  ],
  controllers: [ChurnPredictionController],
  providers: [ChurnPredictionService],
  exports: [ChurnPredictionService],
})
export class ChurnPredictionModule {}
