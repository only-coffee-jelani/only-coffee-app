import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Note: ProgramEvent and CouponGrant don't exist in new schema
// import { ProgramEvent, CouponGrant } from '@shared/database/entities';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
