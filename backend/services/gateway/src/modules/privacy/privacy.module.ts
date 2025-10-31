import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { User, Event, Order } from '@shared/database/entities';
import { PrivacyRequest } from './entities/privacy-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Event,
      Order,
      PrivacyRequest,
    ]),
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
