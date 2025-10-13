import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order, OrderItem, Store } from '@shared/database/entities';
import { SlotManagementService, PaymentService } from '@shared/services';
import stripeConfig from '@shared/config/stripe.config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Store]),
    ConfigModule.forFeature(stripeConfig),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, SlotManagementService, PaymentService],
  exports: [OrdersService],
})
export class OrdersModule {}
