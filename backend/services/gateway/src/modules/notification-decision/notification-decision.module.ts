import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@shared/database/entities';
import { NotificationDecisionService } from './notification-decision.service';
import { NotificationDecisionController } from './notification-decision.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotificationDecisionController],
  providers: [NotificationDecisionService],
  exports: [NotificationDecisionService],
})
export class NotificationDecisionModule {}
