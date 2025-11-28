import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SplashScreen,
  SplashEvent,
  SplashSession,
  SplashDailyAggregate,
  AnonymousDevice,
  UserDevice,
} from '@shared/database/entities';
import { SplashScreenController } from './splash-screen.controller';
import { SplashScreenService } from './splash-screen.service';
import { SplashAnalyticsService } from './splash-analytics.service';
import { AnonymousDeviceService } from './anonymous-device.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SplashScreen,
      SplashEvent,
      SplashSession,
      SplashDailyAggregate,
      AnonymousDevice,
      UserDevice,
    ]),
  ],
  controllers: [SplashScreenController],
  providers: [SplashScreenService, SplashAnalyticsService, AnonymousDeviceService],
  exports: [SplashScreenService, SplashAnalyticsService, AnonymousDeviceService],
})
export class SplashScreenModule {}

