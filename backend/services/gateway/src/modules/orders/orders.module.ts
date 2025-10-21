import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order, OrderItem, Store } from '@shared/database/entities';
import { SlotManagementService, PaymentService, ToastApiService } from '@shared/services';
import stripeConfig from '@shared/config/stripe.config';
import toastConfig from '@shared/config/toast.config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CouponsModule } from '../coupons/coupons.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Store]),
    ConfigModule.forFeature(stripeConfig),
    ConfigModule.forFeature(toastConfig),
    CouponsModule,
    LoyaltyModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, SlotManagementService, PaymentService, ToastApiService],
  exports: [OrdersService],
})
export class OrdersModule {}
