import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CarouselModule } from '../carousel/carousel.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CouponsModule,
    NotificationsModule,
    CarouselModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
