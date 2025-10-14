import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreatePaymentIntentDto {
  amount: number; // Amount in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
  orderId: string;
  userId: string;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export interface RefundPaymentDto {
  paymentIntentId: string;
  amount?: number; // Amount in cents, if partial refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export interface CreateCustomerDto {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }

  /**
   * Create a PaymentIntent for processing payment
   */
  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<Stripe.PaymentIntent> {
    try {
      const {
        amount,
        currency = 'usd',
        customerId,
        metadata = {},
        description,
        orderId,
        userId,
      } = data;

      this.logger.log(`Creating PaymentIntent for order ${orderId}, amount: ${amount} cents`);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata: {
          orderId,
          userId,
          ...metadata,
        },
        description: description || `Only Coffee Order #${orderId}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        capture_method: 'automatic',
      });

      this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create PaymentIntent: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm a PaymentIntent (for manual confirmation flow)
   */
  async confirmPaymentIntent(data: ConfirmPaymentDto): Promise<Stripe.PaymentIntent> {
    try {
      const { paymentIntentId, paymentMethodId } = data;

      this.logger.log(`Confirming PaymentIntent: ${paymentIntentId}`);

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : undefined,
      );

      this.logger.log(`PaymentIntent confirmed: ${paymentIntent.id}, status: ${paymentIntent.status}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm PaymentIntent: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  /**
   * Retrieve a PaymentIntent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve PaymentIntent: ${error.message}`, error.stack);
      throw new BadRequestException('Payment intent not found');
    }
  }

  /**
   * Cancel a PaymentIntent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Cancelling PaymentIntent: ${paymentIntentId}`);

      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      this.logger.log(`PaymentIntent cancelled: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to cancel PaymentIntent: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to cancel payment');
    }
  }

  /**
   * Refund a payment (full or partial)
   */
  async refundPayment(data: RefundPaymentDto): Promise<Stripe.Refund> {
    try {
      const { paymentIntentId, amount, reason } = data;

      this.logger.log(`Creating refund for PaymentIntent: ${paymentIntentId}`);

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      this.logger.log(`Refund created: ${refund.id}, status: ${refund.status}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Create a Stripe Customer
   */
  async createCustomer(data: CreateCustomerDto): Promise<Stripe.Customer> {
    try {
      const { email, name, phone, metadata = {} } = data;

      this.logger.log(`Creating Stripe customer for email: ${email}`);

      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        metadata,
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Retrieve a Stripe Customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to retrieve Stripe customer: ${error.message}`, error.stack);
      throw new BadRequestException('Customer not found');
    }
  }

  /**
   * Update a Stripe Customer
   */
  async updateCustomer(
    customerId: string,
    data: Partial<CreateCustomerDto>,
  ): Promise<Stripe.Customer> {
    try {
      this.logger.log(`Updating Stripe customer: ${customerId}`);

      const customer = await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
      });

      this.logger.log(`Stripe customer updated: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to update Stripe customer: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update customer');
    }
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      this.logger.log(`Attaching payment method ${paymentMethodId} to customer ${customerId}`);

      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      this.logger.log(`Payment method attached: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to attach payment method');
    }
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string, type = 'card'): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as any,
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve payment methods');
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      this.logger.log(`Detaching payment method: ${paymentMethodId}`);

      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      this.logger.log(`Payment method detached: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to detach payment method: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to detach payment method');
    }
  }

  /**
   * Verify webhook signature and construct event
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    try {
      const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Get Stripe instance (for advanced operations)
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
