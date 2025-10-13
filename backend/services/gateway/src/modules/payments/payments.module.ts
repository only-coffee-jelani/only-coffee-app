import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User, Order } from '@shared/database/entities';
import { PaymentService } from '@shared/services';
import stripeConfig from '@shared/config/stripe.config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    ConfigModule.forFeature(stripeConfig),
    forwardRef(() => RewardsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
