import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ABTestService } from './ab-test.service';
import { ABTest } from './entities/ab-test.entity';
import { ABTestAssignment } from './entities/ab-test-assignment.entity';
import { ABTestMetric } from './entities/ab-test-metric.entity';
import { SystemMetric } from './entities/system-metric.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ABTest,
      ABTestAssignment,
      ABTestMetric,
      SystemMetric,
    ]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, ABTestService],
  exports: [MonitoringService, ABTestService],
})
export class MonitoringModule {}
