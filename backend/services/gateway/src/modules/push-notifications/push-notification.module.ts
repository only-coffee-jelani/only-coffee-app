import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@shared/database/entities';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';
import { NotificationDecisionModule } from '../notification-decision/notification-decision.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationDecisionModule,
  ],
  controllers: [PushNotificationController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
