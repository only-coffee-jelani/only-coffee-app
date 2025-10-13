import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, OrderStatus } from '@shared/database/entities';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get user order history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyOrders(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.ordersService.findByUser(user.id, limit ? Number(limit) : 20);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active orders' })
  async getActiveOrders(@CurrentUser() user: User) {
    return this.ordersService.getActiveOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(@CurrentUser() user: User, @Param('id') orderId: string) {
    return this.ordersService.findById(orderId, user.id);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirm order after successful payment' })
  async confirmOrder(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
    @Body() confirmOrderDto: ConfirmOrderDto,
  ) {
    return this.ordersService.confirmOrder(user.id, orderId, confirmOrderDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(@CurrentUser() user: User, @Param('id') orderId: string) {
    // Verify ownership
    await this.ordersService.findById(orderId, user.id);
    return this.ordersService.updateStatus(orderId, OrderStatus.CANCELLED);
  }
}
