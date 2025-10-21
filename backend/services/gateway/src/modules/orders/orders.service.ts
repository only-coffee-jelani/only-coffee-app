import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Order,
  OrderItem,
  Store,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '@shared/database/entities';
import { SlotManagementService, PaymentService, ToastApiService } from '@shared/services';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CouponsService } from '../coupons/coupons.service';
import { CouponApplicationService } from '../coupons/coupon-application.service';
import { StreakTrackingService } from '../loyalty/streak-tracking.service';
import { StreakRewardService } from '../loyalty/streak-reward.service';

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
    private readonly slotManagementService: SlotManagementService,
    private readonly paymentService: PaymentService,
    private readonly toastApiService: ToastApiService,
    private readonly couponsService: CouponsService,
    private readonly couponApplicationService: CouponApplicationService,
    private readonly streakTrackingService: StreakTrackingService,
    private readonly streakRewardService: StreakRewardService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { storeId, items, orderType, pickupTime, specialInstructions, couponId } = createOrderDto;

    // Validate store
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (!store.isActive || !store.acceptingOrders) {
      throw new BadRequestException('Store is not accepting orders');
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCouponId: string | null = null;

    if (couponId) {
      const coupon = await this.couponsService.getCouponById(couponId, userId);

      // Validate and calculate discount
      const orderChannel = orderType === OrderType.PICKUP || orderType === OrderType.DELIVERY
        ? 'app_only'
        : 'both'; // Default to app_only for non-catering orders

      const couponResult = await this.couponApplicationService.validateCouponForOrder(
        coupon,
        userId,
        items,
        orderChannel as any,
        subtotal,
      );

      if (!couponResult.valid) {
        throw new BadRequestException(
          couponResult.reason || 'Coupon cannot be applied to this order',
        );
      }

      discountAmount = couponResult.discountAmount;
      appliedCouponId = couponId;

      this.logger.log(
        `Coupon ${couponId} applied to order. Discount: $${discountAmount.toFixed(2)}`,
      );
    }

    // Calculate tax on discounted subtotal
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.0875; // 8.75% tax (California)
    const total = taxableAmount + tax;

    // Handle pickup time
    let finalPickupTime: Date;
    if (pickupTime === 'ASAP') {
      const asapTime = await this.slotManagementService.getAsapPickupTime(
        storeId,
        store.capacity,
      );
      if (!asapTime) {
        throw new BadRequestException('No slots available in the next hour');
      }
      finalPickupTime = asapTime;
    } else {
      finalPickupTime = new Date(pickupTime);
    }

    // Start transaction
    return await this.dataSource.transaction(async (manager) => {
      // Create order
      const order = manager.create(Order, {
        userId,
        storeId,
        orderType: orderType || OrderType.PICKUP,
        status: OrderStatus.INITIATED,
        subtotal,
        tax,
        discountAmount,
        appliedCouponId,
        total,
        pickupTime: finalPickupTime,
        specialInstructions,
      });

      const savedOrder = await manager.save(Order, order);

      // Reserve slot
      const slotReserved = await this.slotManagementService.reserveSlot(
        savedOrder.id,
        storeId,
        finalPickupTime,
        store.capacity,
      );

      if (!slotReserved) {
        throw new BadRequestException('Selected time slot is no longer available');
      }

      // Update order status
      savedOrder.status = OrderStatus.SLOT_RESERVED;
      await manager.save(Order, savedOrder);

      // Create order items
      const orderItems = items.map((item) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          quantity: item.quantity,
          basePrice: item.basePrice,
          modifiersPrice: item.modifiersPrice || 0,
          totalPrice: item.totalPrice,
          modifiers: item.modifiers || [],
          specialInstructions: item.specialInstructions,
        }),
      );

      await manager.save(OrderItem, orderItems);

      // Return complete order with items
      return {
        ...savedOrder,
        items: orderItems,
      };
    });
  }

  async findByUser(userId: string, limit: number = 20) {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['items', 'store'],
    });
  }

  async findById(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'store'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();

      // Process loyalty streak tracking (async, don't block order completion)
      this.processLoyaltyForCompletedOrder(order.id, order.userId).catch((error) => {
        this.logger.error(
          `Failed to process loyalty for order ${order.id}:`,
          error,
        );
        // Don't fail the order completion if loyalty processing fails
      });
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();

      // Release the slot
      if (order.pickupTime) {
        await this.slotManagementService.releaseSlot(
          orderId,
          order.storeId,
          order.pickupTime,
        );
      }

      // Cancel the coupon if it was applied but not yet redeemed
      // (If order was cancelled before payment confirmation)
      if (order.appliedCouponId) {
        try {
          await this.couponsService.cancelCoupon(order.appliedCouponId);
          this.logger.log(
            `Coupon ${order.appliedCouponId} cancelled due to order ${orderId} cancellation`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to cancel coupon ${order.appliedCouponId} for cancelled order ${orderId}`,
            error,
          );
          // Don't fail the cancellation, coupon may already be redeemed
        }
      }
    } else if (status === OrderStatus.PAYMENT_FAILED) {
      // Also release coupon if payment fails
      if (order.appliedCouponId) {
        try {
          await this.couponsService.cancelCoupon(order.appliedCouponId);
          this.logger.log(
            `Coupon ${order.appliedCouponId} cancelled due to payment failure for order ${orderId}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to cancel coupon ${order.appliedCouponId} for failed payment`,
            error,
          );
        }
      }
    }

    return this.orderRepository.save(order);
  }

  async getActiveOrders(userId: string) {
    return this.orderRepository.find({
      where: {
        userId,
        status: [
          OrderStatus.CONFIRMED,
          OrderStatus.IN_PROGRESS,
          OrderStatus.READY,
        ] as any,
      },
      order: { createdAt: 'DESC' },
      relations: ['items', 'store'],
    });
  }

  /**
   * Confirm order after successful payment
   * This should be called after payment is successful
   */
  async confirmOrder(userId: string, orderId: string, confirmOrderDto: ConfirmOrderDto) {
    const { paymentIntentId } = confirmOrderDto;

    // Verify order belongs to user
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'store'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order is in correct state
    if (order.status !== OrderStatus.SLOT_RESERVED && order.status !== OrderStatus.INITIATED) {
      throw new BadRequestException(
        `Cannot confirm order in status: ${order.status}`,
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
      order.status = OrderStatus.CONFIRMED;
      order.stripePaymentIntentId = paymentIntentId;
      order.paymentMethod = this.extractPaymentMethod(paymentIntent);

      // Confirm the slot reservation permanently
      await this.slotManagementService.confirmSlot(orderId);

      // Redeem coupon if applied
      if (order.appliedCouponId) {
        try {
          await this.couponsService.redeemCoupon(
            order.appliedCouponId,
            userId,
            orderId,
          );
          this.logger.log(`Coupon ${order.appliedCouponId} redeemed for order ${orderId}`);
        } catch (error) {
          this.logger.error(
            `Failed to redeem coupon ${order.appliedCouponId} for order ${orderId}`,
            error,
          );
          // Don't fail the order, but log for manual review
        }
      }

      const confirmedOrder = await manager.save(Order, order);

      this.logger.log(`Order ${orderId} confirmed with payment ${paymentIntentId}`);

      // Send order to Toast POS asynchronously
      this.sendOrderToToast(confirmedOrder, order.items, order.store).catch((error) => {
        this.logger.error(`Failed to send order ${orderId} to Toast POS`, error);
        // Don't fail the order confirmation, but log for manual intervention
      });

      // TODO: Send confirmation email/push notification

      return {
        ...confirmedOrder,
        items: order.items,
        store: order.store,
      };
    });
  }

  /**
   * Send order to Toast POS system
   */
  private async sendOrderToToast(order: Order, items: OrderItem[], store: Store): Promise<void> {
    try {
      this.logger.log(`Sending order ${order.id} to Toast POS`);

      // Map order items to Toast format
      const toastSelections = items.map((item) => ({
        name: item.itemName,
        quantity: item.quantity,
        unitOfMeasure: 'NONE' as const,
        price: parseFloat(item.totalPrice.toString()),
        modifiers: item.modifiers.map((mod: any) => ({
          name: mod.name,
          price: parseFloat(mod.price || '0'),
          quantity: 1,
        })),
        specialRequests: item.specialInstructions || undefined,
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
        notes: order.specialInstructions || `Order #${order.id.substring(0, 8)}`,
      };

      const createdCheck = await this.toastApiService.createCheck(toastCheck);

      // Update order with Toast check GUID
      if (createdCheck.guid) {
        order.toastCheckId = createdCheck.guid;
        await this.orderRepository.save(order);
      }

      this.logger.log(`Successfully sent order ${order.id} to Toast POS. Check GUID: ${createdCheck.guid}`);
    } catch (error) {
      this.logger.error(`Failed to send order ${order.id} to Toast POS:`, error);
      throw error;
    }
  }

  /**
   * Extract payment method type from PaymentIntent
   */
  private extractPaymentMethod(paymentIntent: any): PaymentMethod {
    const charges = paymentIntent.charges?.data;
    if (charges && charges.length > 0) {
      const paymentMethodDetails = charges[0].payment_method_details;
      if (paymentMethodDetails?.card?.wallet?.type === 'apple_pay') {
        return PaymentMethod.APPLE_PAY;
      }
      if (paymentMethodDetails?.card?.wallet?.type === 'google_pay') {
        return PaymentMethod.GOOGLE_PAY;
      }
      if (paymentMethodDetails?.card) {
        return PaymentMethod.STRIPE;
      }
    }
    return PaymentMethod.STRIPE;
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

      // Process the order for streak tracking
      const result = await this.streakTrackingService.processOrderForStreak(orderId);

      if (!result.qualified) {
        this.logger.debug(
          `Order ${orderId} did not qualify for streak tracking`,
        );
        return;
      }

      this.logger.log(
        `Streak visit logged for user ${userId}: Day ${result.streak?.consecutiveDays}`,
      );

      // Check and grant milestone reward if reached
      if (result.milestoneReached) {
        const reward = await this.streakRewardService.checkAndGrantMilestoneReward(
          userId,
          result.milestoneReached,
        );

        if (reward) {
          this.logger.log(
            `Milestone reward granted for user ${userId}: Day ${result.milestoneReached}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing loyalty for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }
}
