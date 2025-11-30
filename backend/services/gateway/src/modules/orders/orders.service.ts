import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Order,
  OrderItem,
  Store,
} from '@shared/database/entities';
import { OrderStatus as OrderStatusEntity } from '@shared/database/entities/order-status.entity';
import { PaymentMethod as PaymentMethodEntity } from '@shared/database/entities/payment-method.entity';
import { OrderStatus as OrderStatusEnum } from '@shared/enums/order-status.enum';
import { SlotManagementService, PaymentService, ToastApiService } from '@shared/services';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CouponsService } from '../coupons/coupons.service';
import { CouponApplicationService } from '../coupons/coupon-application.service';
// import { StreakTrackingService } from '../loyalty/streak-tracking.service'; // Disabled - loyalty module removed
// import { StreakRewardService } from '../loyalty/streak-reward.service'; // Disabled - loyalty module removed

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(OrderStatusEntity)
    private readonly orderStatusRepository: Repository<OrderStatusEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodRepository: Repository<PaymentMethodEntity>,
    private readonly slotManagementService: SlotManagementService,
    private readonly paymentService: PaymentService,
    private readonly toastApiService: ToastApiService,
    private readonly couponsService: CouponsService,
    private readonly couponApplicationService: CouponApplicationService,
    // private readonly streakTrackingService: StreakTrackingService, // Disabled - loyalty module removed
    // private readonly streakRewardService: StreakRewardService, // Disabled - loyalty module removed
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create order - supports both authenticated users and guests
   * @param userId - User ID if authenticated, null for guest orders
   * @param createOrderDto - Order details
   */
  async create(userId: string | null, createOrderDto: CreateOrderDto) {
    try {
      const { storeId, items, orderType, pickupTime, specialInstructions, couponId } = createOrderDto;

      // Log whether this is a guest or authenticated order
      if (userId) {
        this.logger.log(`Creating order for authenticated user: ${userId}`);
      } else {
        this.logger.log(`Creating guest order (no user authentication)`);
      }

      this.logger.log(`Order request: storeId=${storeId}, items=${items.length}, pickupTime=${pickupTime}`);

    // Validate store
    const store = await this.storeRepository.findOne({ where: { storeId } });
    if (!store) {
      this.logger.error(`Store not found: ${storeId}`);
      throw new NotFoundException('Store not found');
    }

    if (!store.isActive) {
      this.logger.error(`Store is not active: ${storeId}`);
      throw new BadRequestException('Store is not accepting orders');
    }

    this.logger.log(`Store validated: ${store.name}`);

    // Calculate subtotal (totalPrice is already per-item total, not per-unit)
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.logger.log(`Calculated subtotal: ${subtotal}`);

    // Apply coupon if provided
    let discountAmount = 0;

    if (couponId) {
      // Note: Coupon functionality is stubbed out in new schema
      this.logger.warn(`Coupon ${couponId} requested but coupon system is not implemented in new schema`);
    }

    // Calculate tax on discounted subtotal
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.0875; // 8.75% tax (California)
    const total = taxableAmount + tax;

    // Handle pickup time
    let finalPickupTime: Date;
    if (pickupTime === 'ASAP') {
      // Note: Store.capacity doesn't exist in new schema, using default capacity
      const asapTime = await this.slotManagementService.getAsapPickupTime(
        storeId,
        100, // Default capacity
      );
      if (!asapTime) {
        throw new BadRequestException('No slots available in the next hour');
      }
      finalPickupTime = asapTime;
    } else {
      finalPickupTime = new Date(pickupTime);
    }

    // Get order status IDs
    this.logger.log(`Getting order status IDs...`);
    const pendingStatusId = await this.getOrderStatusId(OrderStatusEnum.PENDING);
    this.logger.log(`Pending status ID: ${pendingStatusId}`);
    const confirmedStatusId = await this.getOrderStatusId(OrderStatusEnum.CONFIRMED);
    this.logger.log(`Confirmed status ID: ${confirmedStatusId}`);

    // Start transaction
    return await this.dataSource.transaction(async (manager) => {
      // Create order
      const order = manager.create(Order, {
        userId,
        storeId,
        orderStatusId: pendingStatusId, // Start as pending
        subtotal,
        tax,
        discountTotal: discountAmount || 0,
        total,
        pickupTime: finalPickupTime,
      });

      const savedOrder = await manager.save(Order, order);

      // Reserve slot
      const slotReserved = await this.slotManagementService.reserveSlot(
        savedOrder.orderId,
        storeId,
        finalPickupTime,
        100, // Default capacity (Store.capacity doesn't exist in new schema)
      );

      if (!slotReserved) {
        throw new BadRequestException('Selected time slot is no longer available');
      }

      // Update order status to confirmed
      savedOrder.orderStatusId = confirmedStatusId;
      await manager.save(Order, savedOrder);

      // Create order items
      const orderItems = items.map((item) =>
        manager.create(OrderItem, {
          orderId: savedOrder.orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.basePrice || item.totalPrice / item.quantity,
        }),
      );

      await manager.save(OrderItem, orderItems);

      // Return complete order with items
      return {
        ...savedOrder,
        orderItems,
      };
    });
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUser(userId: string, limit: number = 20) {
    return this.orderRepository.find({
      where: { userId },
      order: { placedAt: 'DESC' },
      take: limit,
      relations: ['orderItems', 'store', 'orderStatus'],
    });
  }

  /**
   * Find order by ID
   * If userId is provided, verifies ownership
   * If userId is null (guest), returns order without ownership check
   */
  async findById(orderId: string, userId: string | null) {
    // Build where clause - if userId is provided, verify ownership
    const whereClause: any = { orderId };
    if (userId) {
      whereClause.userId = userId;
    }

    const order = await this.orderRepository.findOne({
      where: whereClause,
      relations: ['orderItems', 'store', 'orderStatus'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatusEnum) {
    const order = await this.orderRepository.findOne({ where: { orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get status ID from enum
    const statusId = await this.getOrderStatusId(status);
    order.orderStatusId = statusId;

    if (status === OrderStatusEnum.COMPLETED) {
      // Note: completedAt doesn't exist in new schema
      // Process loyalty streak tracking (async, don't block order completion)
      this.processLoyaltyForCompletedOrder(order.orderId, order.userId).catch((error) => {
        this.logger.error(
          `Failed to process loyalty for order ${order.orderId}:`,
          error,
        );
        // Don't fail the order completion if loyalty processing fails
      });
    } else if (status === OrderStatusEnum.CANCELLED) {
      // Note: cancelledAt doesn't exist in new schema

      // Release the slot
      if (order.pickupTime) {
        await this.slotManagementService.releaseSlot(
          orderId,
          order.storeId,
          order.pickupTime,
        );
      }

      // Note: appliedCouponId doesn't exist in new schema (coupon system not implemented)
    }

    return this.orderRepository.save(order);
  }

  async getActiveOrders(userId: string) {
    // Get status IDs for active statuses
    const confirmedStatusId = await this.getOrderStatusId(OrderStatusEnum.CONFIRMED);
    const preparingStatusId = await this.getOrderStatusId(OrderStatusEnum.PREPARING);
    const readyStatusId = await this.getOrderStatusId(OrderStatusEnum.READY);

    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere('order.orderStatusId IN (:...statusIds)', {
        statusIds: [confirmedStatusId, preparingStatusId, readyStatusId],
      })
      .orderBy('order.createdAt', 'DESC')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.orderStatus', 'orderStatus')
      .getMany();
  }

  /**
   * Confirm order after successful payment
   * This should be called after payment is successful
   * Supports both authenticated users and guests
   */
  async confirmOrder(userId: string | null, orderId: string, confirmOrderDto: ConfirmOrderDto) {
    const { paymentIntentId } = confirmOrderDto;

    // Build where clause - if userId is provided, verify ownership
    const whereClause: any = { orderId };
    if (userId) {
      whereClause.userId = userId;
    }

    // Verify order exists (and belongs to user if authenticated)
    const order = await this.orderRepository.findOne({
      where: whereClause,
      relations: ['orderItems', 'store', 'orderStatus'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get status IDs
    const pendingStatusId = await this.getOrderStatusId(OrderStatusEnum.PENDING);
    const confirmedStatusId = await this.getOrderStatusId(OrderStatusEnum.CONFIRMED);

    // Verify order is in correct state (pending or initiated)
    if (order.orderStatusId !== pendingStatusId) {
      throw new BadRequestException(
        `Cannot confirm order in current status`,
      );
    }

    // Verify payment intent
    const paymentIntent = await this.paymentService.getPaymentIntent(paymentIntentId);

    if (paymentIntent.metadata.orderId !== orderId) {
      throw new BadRequestException('Payment intent does not match order');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        `Payment has not succeeded. Status: ${paymentIntent.status}`,
      );
    }

    // Update order with payment info
    return await this.dataSource.transaction(async (manager) => {
      // Update order status to confirmed
      order.orderStatusId = confirmedStatusId;

      // Extract payment method from payment intent
      const paymentMethodId = await this.extractPaymentMethodId(paymentIntent);
      if (paymentMethodId) {
        order.paymentMethodId = paymentMethodId;
      }

      // Confirm the slot reservation permanently
      await this.slotManagementService.confirmSlot(orderId);

      // Note: Coupon redemption not implemented in new schema

      const confirmedOrder = await manager.save(Order, order);

      this.logger.log(`Order ${orderId} confirmed with payment ${paymentIntentId}`);

      // Send order to Toast POS asynchronously
      this.sendOrderToToast(confirmedOrder, order.orderItems, order.store).catch((error) => {
        this.logger.error(`Failed to send order ${orderId} to Toast POS`, error);
        // Don't fail the order confirmation, but log for manual intervention
      });

      // TODO: Send confirmation email/push notification

      return {
        ...confirmedOrder,
        orderItems: order.orderItems,
        store: order.store,
      };
    });
  }

  /**
   * Send order to Toast POS system
   */
  private async sendOrderToToast(order: Order, items: OrderItem[], store: Store): Promise<void> {
    try {
      this.logger.log(`Sending order ${order.orderId} to Toast POS`);

      // Map order items to Toast format
      // Note: OrderItem doesn't have itemName, modifiers, specialInstructions in new schema
      // We need to load the MenuItem relation to get the name
      const toastSelections = items.map((item) => ({
        name: item.menuItem?.name || 'Unknown Item',
        quantity: item.quantity,
        unitOfMeasure: 'NONE' as const,
        price: parseFloat(item.unitPrice.toString()),
        modifiers: [], // Modifiers are in separate table (order_item_modifiers)
        specialRequests: undefined,
      }));

      // Create Toast check
      const toastCheck = {
        entityType: 'Check' as const,
        deleted: false,
        selections: toastSelections,
        customer: {
          firstName: '', // Would come from user entity
          lastName: '',
          phone: '',
          email: '',
        },
        promisedDate: order.pickupTime?.toISOString() || new Date().toISOString(),
        notes: `Order #${order.orderId.substring(0, 8)}`,
      };

      const createdCheck = await this.toastApiService.createCheck(toastCheck);

      // Note: toastCheckId doesn't exist in new Order schema
      this.logger.log(`Successfully sent order ${order.orderId} to Toast POS. Check GUID: ${createdCheck.guid}`);
    } catch (error) {
      this.logger.error(`Failed to send order ${order.orderId} to Toast POS:`, error);
      throw error;
    }
  }

  /**
   * Extract payment method ID from PaymentIntent
   * Returns the payment_method_id from the payment_methods lookup table
   */
  private async extractPaymentMethodId(paymentIntent: any): Promise<string | null> {
    const charges = paymentIntent.charges?.data;
    let code = 'credit_card'; // Default

    if (charges && charges.length > 0) {
      const paymentMethodDetails = charges[0].payment_method_details;
      if (paymentMethodDetails?.card?.wallet?.type === 'apple_pay') {
        code = 'apple_pay';
      } else if (paymentMethodDetails?.card?.wallet?.type === 'google_pay') {
        code = 'google_pay';
      } else if (paymentMethodDetails?.card) {
        code = 'credit_card';
      }
    }

    // Look up payment method ID from lookup table
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { code },
    });

    return paymentMethod?.paymentMethodId || null;
  }

  /**
   * Process loyalty tracking for completed order
   * This handles streak tracking and milestone rewards
   */
  private async processLoyaltyForCompletedOrder(
    orderId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing loyalty for completed order ${orderId}`);

      // TODO: Loyalty module removed - needs to be refactored
      // Process the order for streak tracking
      // const result = await this.streakTrackingService.processOrderForStreak(orderId);

      // if (!result.qualified) {
      //   this.logger.debug(
      //     `Order ${orderId} did not qualify for streak tracking`,
      //   );
      //   return;
      // }

      // this.logger.log(
      //   `Streak visit logged for user ${userId}: Day ${result.streak?.consecutiveDays}`,
      // );

      // // Check and grant milestone reward if reached
      // if (result.milestoneReached) {
      //   const reward = await this.streakRewardService.checkAndGrantMilestoneReward(
      //     userId,
      //     result.milestoneReached,
      //   );

      //   if (reward) {
      //     this.logger.log(
      //       `Milestone reward granted for user ${userId}: Day ${result.milestoneReached}`,
      //     );
      //   }
      // }
    } catch (error) {
      this.logger.error(
        `Error processing loyalty for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Helper method to get order status ID by code
   */
  private async getOrderStatusId(code: string): Promise<string> {
    this.logger.log(`Looking for order status with code: ${code}`);
    const status = await this.orderStatusRepository.findOne({ where: { code } });
    if (!status) {
      this.logger.error(`Order status not found: ${code}`);
      // List all available statuses for debugging
      const allStatuses = await this.orderStatusRepository.find();
      this.logger.error(`Available statuses: ${JSON.stringify(allStatuses.map(s => s.code))}`);
      throw new Error(`Order status not found: ${code}`);
    }
    this.logger.log(`Found order status: ${status.orderStatusId}`);
    return status.orderStatusId;
  }

  /**
   * Helper method to get payment method ID by code
   */
  private async getPaymentMethodId(code: string): Promise<string> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { code } });
    if (!paymentMethod) {
      throw new Error(`Payment method not found: ${code}`);
    }
    return paymentMethod.paymentMethodId;
  }

  /**
   * Debug method to test database connectivity and data
   */
  async debugTest() {
    try {
      // Test 1: Check order statuses
      const statuses = await this.orderStatusRepository.find();
      console.log(`Found ${statuses.length} order statuses:`, statuses.map(s => s.code));

      // Test 2: Check stores
      const stores = await this.storeRepository.find({ take: 1 });
      console.log(`Found ${stores.length} stores`);

      // Test 3: Check payment methods
      const paymentMethods = await this.paymentMethodRepository.find();
      console.log(`Found ${paymentMethods.length} payment methods:`, paymentMethods.map(p => p.code));

      return {
        orderStatuses: statuses.map(s => ({ id: s.orderStatusId, code: s.code, name: s.name })),
        storesCount: stores.length,
        paymentMethods: paymentMethods.map(p => ({ id: p.paymentMethodId, code: p.code, name: p.name })),
      };
    } catch (error) {
      console.error(`Debug test error:`, error);
      throw error;
    }
  }
}
