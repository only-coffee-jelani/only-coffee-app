import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  User,
  Order,
  OrderStatus as OrderStatusEntity,
  PaymentMethod as PaymentMethodEntity,
  PaymentProvider,
} from '@shared/database/entities';
import { PaymentService } from '@shared/services';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { ConfirmPaymentResponseDto, OrderSummaryDto } from './dto/confirm-payment-response.dto';
import { RewardsService } from '../rewards/rewards.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(PaymentProvider)
    private readonly paymentProviderRepository: Repository<PaymentProvider>,
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => RewardsService))
    private readonly rewardsService: RewardsService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create payment intent for an order
   * Enterprise-level: Supports both guest and authenticated users
   */
  async createPaymentIntent(
    userId: string | null,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string; paymentIntentId: string; publishableKey: string }> {
    const { orderId, amount, description } = createPaymentIntentDto;

    // Verify order exists
    // For guest orders, userId will be null, so we only check orderId
    const whereClause = userId ? { orderId, userId } : { orderId };
    const order = await this.orderRepository.findOne({
      where: whereClause,
      relations: ['orderStatus'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // For guest orders, skip status check (they start as 'confirmed')
    // For authenticated orders, verify order is in correct state
    const validStatuses = ['pending', 'confirmed', 'slot_reserved', 'initiated'];
    if (!validStatuses.includes(order.orderStatus?.code)) {
      throw new BadRequestException(
        `Cannot create payment for order in status: ${order.orderStatus?.code}`,
      );
    }

    // Get or create Stripe customer using PaymentProvider (only for authenticated users)
    let stripeCustomerId: string | undefined;

    if (userId) {
      const user = await this.userRepository.findOne({ where: { userId } });

      // Check if user already has a Stripe payment provider
      let paymentProvider = await this.paymentProviderRepository.findOne({
        where: { userId, providerName: 'stripe' },
      });

      if (!paymentProvider) {
        // Create new Stripe customer
        const customer = await this.paymentService.createCustomer({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          metadata: { userId: user.userId },
        });
        stripeCustomerId = customer.id;

        // Save payment provider record
        paymentProvider = this.paymentProviderRepository.create({
          userId,
          providerName: 'stripe',
          providerCustomerId: customer.id,
          isDefault: true,
          metadata: {
            email: user.email,
            createdAt: new Date().toISOString(),
          },
        });
        await this.paymentProviderRepository.save(paymentProvider);
      } else {
        stripeCustomerId = paymentProvider.providerCustomerId;
      }
    }

    // Create PaymentIntent
    const paymentIntent = await this.paymentService.createPaymentIntent({
      amount,
      currency: 'usd',
      customerId: stripeCustomerId, // Will be undefined for guest users
      orderId,
      userId: userId || 'guest',
      description:
        description || `Only Coffee Order #${orderId.substring(0, 8)}`,
      metadata: {
        orderId,
        userId: userId || 'guest',
        storeName: 'Store', // TODO: Add store name from order relation
      },
    });

    // Note: Payment intent ID should be stored in Payment entity, not Order
    // TODO: Create Payment record with payment intent ID
    // await this.orderRepository.update(orderId, {
    //   stripePaymentIntentId: paymentIntent.id,
    // });

    this.logger.log(
      `Created PaymentIntent ${paymentIntent.id} for order ${orderId}`,
    );

    const publishableKey = this.configService.get<string>('stripe.publishableKey');

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey,
    };
  }

  /**
   * Confirm payment (for manual confirmation flow)
   * Enterprise-level: Supports both guest and authenticated users with comprehensive error handling
   */
  async confirmPayment(
    userId: string | null,
    confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<ConfirmPaymentResponseDto> {
    try {
      const { paymentIntentId, orderId, paymentMethodId } = confirmPaymentDto;

      console.log('='.repeat(80));
      console.log('[confirmPayment] CALLED - Starting payment confirmation');
      console.log(`[confirmPayment] orderId: ${orderId}`);
      console.log(`[confirmPayment] paymentIntentId: ${paymentIntentId}`);
      console.log(`[confirmPayment] userId: ${userId || 'guest'}`);
      console.log('='.repeat(80));

      this.logger.log(`[confirmPayment] Starting payment confirmation for order ${orderId}, paymentIntent ${paymentIntentId}, userId: ${userId || 'guest'}`);

      // Retrieve PaymentIntent to verify it's successful
      this.logger.log(`[confirmPayment] Retrieving payment intent from Stripe...`);
      const paymentIntent =
        await this.paymentService.getPaymentIntent(paymentIntentId);
      this.logger.log(`[confirmPayment] Payment intent status: ${paymentIntent.status}`);

      // Verify order exists (for guest orders, userId will be null)
      const whereClause = userId ? { orderId, userId } : { orderId };
      this.logger.log(`[confirmPayment] Finding order with whereClause: ${JSON.stringify(whereClause)}`);
      const order = await this.orderRepository.findOne({
        where: whereClause,
        relations: ['orderStatus', 'store', 'orderItems', 'orderItems.menuItem'],
      });

      if (!order) {
        this.logger.error(`[confirmPayment] Order not found: ${orderId}`);
        throw new NotFoundException('Order not found');
      }
      this.logger.log(`[confirmPayment] Order found: ${orderId}, userId: ${order.userId}`);

      // Verify payment intent matches order
      if (paymentIntent.metadata.orderId !== orderId) {
        this.logger.error(`[confirmPayment] Payment intent orderId mismatch. Expected: ${orderId}, Got: ${paymentIntent.metadata.orderId}`);
        throw new BadRequestException('Payment intent does not match order');
      }

      // Check if payment is already successful
      if (paymentIntent.status !== 'succeeded') {
        this.logger.error(`[confirmPayment] Payment not successful. Status: ${paymentIntent.status}`);
        throw new BadRequestException(
          `Payment is not successful. Status: ${paymentIntent.status}`,
        );
      }

      // Update order status to confirmed
      this.logger.log(`[confirmPayment] Looking up 'confirmed' order status...`);
      const confirmedStatus = await this.dataSource
        .getRepository(OrderStatusEntity)
        .findOne({ where: { code: 'confirmed' } });

      if (!confirmedStatus) {
        this.logger.error(`[confirmPayment] Confirmed status not found in database`);
        throw new BadRequestException('Confirmed status not found');
      }
      this.logger.log(`[confirmPayment] Found confirmed status: ${confirmedStatus.orderStatusId}`);

      order.orderStatusId = confirmedStatus.orderStatusId;
      this.logger.log(`[confirmPayment] Saving order with new status...`);
      await this.orderRepository.save(order);
      this.logger.log(`[confirmPayment] Order saved successfully`);

      this.logger.log(
        `Payment confirmed for order ${orderId}, PaymentIntent: ${paymentIntentId}`,
      );

      // Award loyalty points for the order (only for authenticated users)
      // Enterprise-level: Guest orders don't earn loyalty points
      if (order.userId) {
        this.logger.log(`[confirmPayment] Awarding loyalty points for authenticated user...`);
        try {
          const orderAmount = Number(order.total);
          await this.rewardsService.awardPointsForOrder(
            order.userId,
            orderId,
            orderAmount,
          );
          this.logger.log(`Awarded loyalty points for order ${orderId}`);
        } catch (error) {
          this.logger.error(
            `Failed to award loyalty points for order ${orderId}: ${error.message}`,
          );
          // Don't fail the payment if loyalty points fail
        }
      } else {
        this.logger.log(
          `Skipping loyalty points for guest order ${orderId}`,
        );
      }

      this.logger.log(`[confirmPayment] Payment confirmation complete, returning response`);

      // Enterprise-level: Return clean DTO without circular references
      // Map entity to DTO to avoid serialization issues
      const orderSummary: OrderSummaryDto = {
        orderId: order.orderId,
        userId: order.userId,
        storeId: order.storeId,
        orderStatusId: order.orderStatusId,
        subtotal: order.subtotal,
        tax: order.tax,
        discountTotal: order.discountTotal,
        total: order.total,
        pickupTime: order.pickupTime,
        placedAt: order.placedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      const response: ConfirmPaymentResponseDto = {
        orderId,
        paymentIntentId,
        status: 'succeeded',
        order: orderSummary,
      };

      return response;
    } catch (error) {
      this.logger.error(`[confirmPayment] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment intent details
   * Enterprise-level: Supports both guest and authenticated users
   */
  async getPaymentIntent(
    userId: string | null,
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent =
      await this.paymentService.getPaymentIntent(paymentIntentId);

    // Verify order exists (for guest orders, userId will be null)
    const orderId = paymentIntent.metadata.orderId;
    const whereClause = userId ? { orderId, userId } : { orderId };
    const order = await this.orderRepository.findOne({
      where: whereClause,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return paymentIntent;
  }

  /**
   * Cancel payment intent
   * Enterprise-level: Supports both guest and authenticated users
   */
  async cancelPaymentIntent(
    userId: string | null,
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent =
      await this.paymentService.getPaymentIntent(paymentIntentId);

    // Verify order exists (for guest orders, userId will be null)
    const orderId = paymentIntent.metadata.orderId;
    const whereClause = userId ? { orderId, userId } : { orderId };
    const order = await this.orderRepository.findOne({
      where: whereClause,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return await this.paymentService.cancelPaymentIntent(paymentIntentId);
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    // Get or create payment provider
    let paymentProvider = await this.paymentProviderRepository.findOne({
      where: { userId, providerName: 'stripe' },
    });

    if (!paymentProvider) {
      throw new BadRequestException('User does not have a Stripe customer. Please create a payment intent first.');
    }

    return await this.paymentService.attachPaymentMethod(
      paymentMethodId,
      paymentProvider.providerCustomerId,
    );
  }

  /**
   * List user's payment methods
   */
  async listPaymentMethods(userId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentProvider = await this.paymentProviderRepository.findOne({
      where: { userId, providerName: 'stripe' },
    });

    if (!paymentProvider) {
      return [];
    }

    return await this.paymentService.listPaymentMethods(paymentProvider.providerCustomerId);
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    // First verify the payment method belongs to the user's customer
    const paymentProvider = await this.paymentProviderRepository.findOne({
      where: { userId, providerName: 'stripe' },
    });

    if (!paymentProvider) {
      throw new BadRequestException('User does not have a Stripe customer ID');
    }

    const paymentMethods = await this.paymentService.listPaymentMethods(
      paymentProvider.providerCustomerId,
    );
    const paymentMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return await this.paymentService.detachPaymentMethod(paymentMethodId);
  }

  /**
   * Handle webhook event from Stripe
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    this.logger.log(
      `Payment succeeded for order ${orderId}: ${paymentIntent.id}`,
    );

    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { orderId },
        relations: ['orderStatus', 'paymentMethod'],
      });

      if (!order) {
        this.logger.error(`Order not found: ${orderId}`);
        return;
      }

      // Update order status to confirmed
      // Note: Order no longer has direct status/paymentMethod/stripePaymentIntentId fields
      // These are now in the Payment entity or related tables
      // TODO: Create Payment record and update order status via orderStatusId

      // For now, just log the success
      this.logger.log(`Payment successful for order ${orderId}, payment intent: ${paymentIntent.id}`);

      this.logger.log(`Order ${orderId} confirmed after successful payment`);

      // Award loyalty points for the order (only for authenticated users)
      // Enterprise-level: Guest orders don't earn loyalty points
      if (order.userId) {
        try {
          const orderAmount = Number(order.total);
          await this.rewardsService.awardPointsForOrder(
            order.userId,
            orderId,
            orderAmount,
          );
          this.logger.log(`Awarded loyalty points for order ${orderId}`);
        } catch (error) {
          this.logger.error(
            `Failed to award loyalty points for order ${orderId}: ${error.message}`,
          );
          // Don't fail the payment if loyalty points fail
        }
      } else {
        this.logger.log(
          `Skipping loyalty points for guest order ${orderId}`,
        );
      }

      // TODO: Send confirmation email/push notification
      // TODO: Send order to Toast POS
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    this.logger.warn(`Payment failed for order ${orderId}: ${paymentIntent.id}`);

    // TODO: Notify user of payment failure
    // TODO: Consider releasing slot if payment fails after timeout
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    this.logger.log(
      `Payment canceled for order ${orderId}: ${paymentIntent.id}`,
    );

    // Order cancellation is handled by the orders module
    // No additional action needed here
  }

  /**
   * Extract payment method type from PaymentIntent
   * Returns payment method code string for lookup in payment_methods table
   */
  private getPaymentMethodType(paymentIntent: any): string {
    const charges = paymentIntent.charges?.data;
    if (charges && charges.length > 0) {
      const paymentMethodDetails = charges[0].payment_method_details;
      if (paymentMethodDetails?.card?.wallet?.type === 'apple_pay') {
        return 'apple_pay';
      }
      if (paymentMethodDetails?.card?.wallet?.type === 'google_pay') {
        return 'google_pay';
      }
      if (paymentMethodDetails?.card) {
        return 'credit_card';
      }
    }
    return 'credit_card';
  }
}
