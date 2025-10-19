import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export interface CreatePaymentIntentDto {
    amount: number;
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
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}
export interface CreateCustomerDto {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
}
export declare class PaymentService {
    private readonly configService;
    private readonly logger;
    private readonly stripe;
    constructor(configService: ConfigService);
    createPaymentIntent(data: CreatePaymentIntentDto): Promise<Stripe.PaymentIntent>;
    confirmPaymentIntent(data: ConfirmPaymentDto): Promise<Stripe.PaymentIntent>;
    getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    refundPayment(data: RefundPaymentDto): Promise<Stripe.Refund>;
    createCustomer(data: CreateCustomerDto): Promise<Stripe.Customer>;
    getCustomer(customerId: string): Promise<Stripe.Customer>;
    updateCustomer(customerId: string, data: Partial<CreateCustomerDto>): Promise<Stripe.Customer>;
    attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod>;
    listPaymentMethods(customerId: string, type?: string): Promise<Stripe.PaymentMethod[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod>;
    constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event;
    getStripeInstance(): Stripe;
}
