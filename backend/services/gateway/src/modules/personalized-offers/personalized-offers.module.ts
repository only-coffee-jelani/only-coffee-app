import { Module } from '@nestjs/common';
import { PersonalizedOffersController } from './personalized-offers.controller';
import { PersonalizedOffersService } from './personalized-offers.service';

@Module({
  imports: [
    // TODO: Re-add AI service modules once type issues are resolved:
    // - AIPromotionGeneratorModule
    // - SegmentationModule
    // - ChurnPredictionModule
    // - ContextualBanditModule
  ],
  controllers: [PersonalizedOffersController],
  providers: [PersonalizedOffersService],
  exports: [PersonalizedOffersService],
})
export class PersonalizedOffersModule {}
