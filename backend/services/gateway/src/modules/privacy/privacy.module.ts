import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { User, UserEvent, Order } from '@shared/database/entities';
import { PrivacyRequest } from './entities/privacy-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserEvent,
      Order,
      PrivacyRequest,
    ]),
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
