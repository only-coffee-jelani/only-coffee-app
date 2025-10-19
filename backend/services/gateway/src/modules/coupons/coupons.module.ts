import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponGrant, User, ProgramEvent } from '@shared/database/entities';
import { CouponsService } from './coupons.service';
import { CouponGrantService } from './coupon-grant.service';
import { CouponApplicationService } from './coupon-application.service';
import { CouponsController, AdminCouponsController } from './coupons.controller';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { EventEmitterService } from '../../common/services/event-emitter.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CouponGrant, User, ProgramEvent]),
    PromoCodesModule,
  ],
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService, CouponGrantService, CouponApplicationService, EventEmitterService],
  exports: [CouponsService, CouponGrantService, CouponApplicationService, EventEmitterService],
})
export class CouponsModule {}
