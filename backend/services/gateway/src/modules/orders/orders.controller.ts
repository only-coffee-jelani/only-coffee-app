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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@shared/database/entities';
import { OrderStatus } from '@shared/enums/order-status.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create Order - Supports both guest and authenticated users
   * If user is authenticated, order is linked to their account
   * If guest, order is created without user association
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Create a new order (guest or authenticated)',
    description: 'Create a new order with items and delivery details. Authentication is optional - guests can place orders.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        id: 'uuid',
        userId: 'uuid or null for guest',
        storeId: 'uuid',
        items: [{ itemId: 'uuid', quantity: 2, price: 5.99 }],
        totalPrice: 11.98,
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createOrder(@CurrentUser() user: User | null, @Body() createOrderDto: CreateOrderDto) {
    try {
      // Support both authenticated and guest users
      const userId = user?.userId || null;
      console.log(`[OrdersController] Creating order - userId: ${userId}, storeId: ${createOrderDto.storeId}`);
      console.log(`[OrdersController] Request body:`, JSON.stringify(createOrderDto));
      const result = await this.ordersService.create(userId, createOrderDto);
      console.log(`[OrdersController] Order created successfully: ${result.orderId}`);
      return result;
    } catch (error) {
      console.error(`[OrdersController] Error creating order:`, error.message);
      console.error(`[OrdersController] Stack trace:`, error.stack);
      throw error;
    }
  }

  /**
   * Debug endpoint to test database connectivity
   */
  @Get('debug/test')
  async debugTest() {
    try {
      const result = await this.ordersService.debugTest();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message, stack: error.stack };
    }
  }

  /**
   * Get My Orders - Requires authentication
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyOrders(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.ordersService.findByUser(user.userId, limit ? Number(limit) : 20);
  }

  /**
   * Get Active Orders - Requires authentication
   */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get active orders',
    description: 'Retrieve all active (non-completed) orders for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active orders',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveOrders(@CurrentUser() user: User) {
    return this.ordersService.getActiveOrders(user.userId);
  }

  /**
   * Get Order Details - Supports both guest and authenticated users
   * Guests can view orders by ID, authenticated users have ownership verification
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
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
  async getOrder(@CurrentUser() user: User | null, @Param('id') orderId: string) {
    // If authenticated, verify ownership; if guest, just return order
    const userId = user?.userId || null;
    return this.ordersService.findById(orderId, userId);
  }

  /**
   * Confirm Order - Supports both guest and authenticated users
   */
  @Put(':id/confirm')
  @UseGuards(OptionalJwtAuthGuard)
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
    @CurrentUser() user: User | null,
    @Param('id') orderId: string,
    @Body() confirmOrderDto: ConfirmOrderDto,
  ) {
    const userId = user?.userId || null;
    return this.ordersService.confirmOrder(userId, orderId, confirmOrderDto);
  }

  /**
   * Cancel Order - Supports both guest and authenticated users
   */
  @Patch(':id/cancel')
  @UseGuards(OptionalJwtAuthGuard)
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
  async cancelOrder(@CurrentUser() user: User | null, @Param('id') orderId: string) {
    const userId = user?.userId || null;
    // Verify ownership if authenticated
    await this.ordersService.findById(orderId, userId);
    return this.ordersService.updateStatus(orderId, OrderStatus.CANCELLED);
  }
}
