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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@shared/database/entities';
import { OrderStatus } from '@shared/enums/order-status.enum';
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
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Create a new order with items and delivery details',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        id: 'uuid',
        userId: 'uuid',
        storeId: 'uuid',
        items: [{ itemId: 'uuid', quantity: 2, price: 5.99 }],
        totalPrice: 11.98,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.userId, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({
    summary: 'Get user order history',
    description: 'Retrieve all orders for the current user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of orders to return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user orders',
    schema: {
      example: [
        {
          id: 'uuid',
          storeId: 'uuid',
          totalPrice: 25.50,
          status: 'COMPLETED',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  async getMyOrders(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.ordersService.findByUser(user.userId, limit ? Number(limit) : 20);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active orders',
    description: 'Retrieve all active (non-completed) orders for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active orders',
  })
  async getActiveOrders(@CurrentUser() user: User) {
    return this.ordersService.getActiveOrders(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieve detailed information about a specific order',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - order belongs to another user' })
  async getOrder(@CurrentUser() user: User, @Param('id') orderId: string) {
    return this.ordersService.findById(orderId, user.userId);
  }

  @Put(':id/confirm')
  @ApiOperation({
    summary: 'Confirm order after successful payment',
    description: 'Confirm an order after payment has been processed',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order confirmed successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order cannot be confirmed in current state' })
  async confirmOrder(
    @CurrentUser() user: User,
    @Param('id') orderId: string,
    @Body() confirmOrderDto: ConfirmOrderDto,
  ) {
    return this.ordersService.confirmOrder(user.userId, orderId, confirmOrderDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an order',
    description: 'Cancel a pending or active order',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current state' })
  async cancelOrder(@CurrentUser() user: User, @Param('id') orderId: string) {
    // Verify ownership
    await this.ordersService.findById(orderId, user.userId);
    return this.ordersService.updateStatus(orderId, OrderStatus.CANCELLED);
  }
}
