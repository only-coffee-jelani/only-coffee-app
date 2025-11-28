import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Note: PromoCode and CouponGrant entities don't exist in new enterprise schema
// TODO: Refactor to use Promotion entity
import { PromoCodesService } from './promo-codes.service';
import { PromoCodesController } from './promo-codes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
