import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
  ) {}

  /**
   * Create payment intent for an order
   */
  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const { orderId, amount, description } = createPaymentIntentDto;

    // Verify order exists and belongs to user
    const order = await this.orderRepository.findOne({
      where: { orderId, userId },
      relations: ['orderStatus'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order is in correct state (slot_reserved or initiated)
    // Note: order.status is now order.orderStatus.code
    if (
      order.orderStatus?.code !== 'slot_reserved' &&
      order.orderStatus?.code !== 'initiated'
    ) {
      throw new BadRequestException(
        `Cannot create payment for order in status: ${order.orderStatus?.code}`,
      );
    }

    // Get or create Stripe customer using PaymentProvider
    const user = await this.userRepository.findOne({ where: { userId } });

    // Check if user already has a Stripe payment provider
    let paymentProvider = await this.paymentProviderRepository.findOne({
      where: { userId, providerName: 'stripe' },
    });

    let stripeCustomerId: string;

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

    // Create PaymentIntent
    const paymentIntent = await this.paymentService.createPaymentIntent({
      amount,
      currency: 'usd',
      customerId: stripeCustomerId,
      orderId,
      userId,
      description:
        description || `Only Coffee Order #${orderId.substring(0, 8)}`,
      metadata: {
        orderId,
        userId,
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

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Confirm payment (for manual confirmation flow)
   */
  async confirmPayment(
    userId: string,
    confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    const { paymentIntentId, paymentMethodId } = confirmPaymentDto;

    // Retrieve PaymentIntent to get order ID
    const paymentIntent =
      await this.paymentService.getPaymentIntent(paymentIntentId);
    const orderId = paymentIntent.metadata.orderId;

    // Verify order belongs to user
    const order = await this.orderRepository.findOne({
      where: { orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Confirm payment
    const confirmedPayment = await this.paymentService.confirmPaymentIntent({
      paymentIntentId,
      paymentMethodId,
    });

    return confirmedPayment;
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(
    userId: string,
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent =
      await this.paymentService.getPaymentIntent(paymentIntentId);

    // Verify order belongs to user
    const orderId = paymentIntent.metadata.orderId;
    const order = await this.orderRepository.findOne({
      where: { orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return paymentIntent;
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(
    userId: string,
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent =
      await this.paymentService.getPaymentIntent(paymentIntentId);

    // Verify order belongs to user
    const orderId = paymentIntent.metadata.orderId;
    const order = await this.orderRepository.findOne({
      where: { orderId, userId },
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

      // Award loyalty points for the order
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
