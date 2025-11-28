import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  Order,
  OrderItem,
  Store,
} from '@shared/database/entities';
import { OrderStatus as OrderStatusEntity } from '@shared/database/entities/order-status.entity';
import { PaymentMethod as PaymentMethodEntity } from '@shared/database/entities/payment-method.entity';
import { SlotManagementService, PaymentService, ToastApiService } from '@shared/services';
import stripeConfig from '@shared/config/stripe.config';
import toastConfig from '@shared/config/toast.config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CouponsModule } from '../coupons/coupons.module';
// import { LoyaltyModule } from '../loyalty/loyalty.module'; // Disabled - loyalty module removed

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Store, OrderStatusEntity, PaymentMethodEntity]),
    ConfigModule.forFeature(stripeConfig),
    ConfigModule.forFeature(toastConfig),
    CouponsModule,
    // LoyaltyModule, // Disabled - loyalty module removed
  ],
  controllers: [OrdersController],
  providers: [OrdersService, SlotManagementService, PaymentService, ToastApiService],
  exports: [OrdersService],
})
export class OrdersModule {}
