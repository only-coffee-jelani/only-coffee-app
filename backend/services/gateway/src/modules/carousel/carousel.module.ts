import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CarouselItem,
  Carousel,
  CarouselEvent,
  CarouselSession,
  CarouselDailyAggregate,
  CarouselABTest,
  AnonymousDevice,
  UserDevice,
} from '@shared/database/entities';
import { CarouselService } from './carousel.service';
import { CarouselAnalyticsService } from './carousel-analytics.service';
import { CarouselABTestService } from './carousel-ab-test.service';
import { CarouselController } from './carousel.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarouselItem,
      Carousel,
      CarouselEvent,
      CarouselSession,
      CarouselDailyAggregate,
      CarouselABTest,
      AnonymousDevice,
      UserDevice,
    ]),
    UploadModule,
  ],
  controllers: [CarouselController],
  providers: [CarouselService, CarouselAnalyticsService, CarouselABTestService],
  exports: [CarouselService, CarouselAnalyticsService, CarouselABTestService],
})
export class CarouselModule {}

