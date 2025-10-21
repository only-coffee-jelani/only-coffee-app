"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PaymentService_1.name);
        const secretKey = this.configService.get('stripe.secretKey');
        if (!secretKey) {
            this.logger.warn('Stripe secret key not configured');
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2024-06-20',
            typescript: true,
        });
    }
    async createPaymentIntent(data) {
        try {
            const { amount, currency = 'usd', customerId, metadata = {}, description, orderId, userId, } = data;
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
        }
        catch (error) {
            this.logger.error(`Failed to create PaymentIntent: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to create payment intent');
        }
    }
    async confirmPaymentIntent(data) {
        try {
            const { paymentIntentId, paymentMethodId } = data;
            this.logger.log(`Confirming PaymentIntent: ${paymentIntentId}`);
            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, paymentMethodId ? { payment_method: paymentMethodId } : undefined);
            this.logger.log(`PaymentIntent confirmed: ${paymentIntent.id}, status: ${paymentIntent.status}`);
            return paymentIntent;
        }
        catch (error) {
            this.logger.error(`Failed to confirm PaymentIntent: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to confirm payment');
        }
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            this.logger.error(`Failed to retrieve PaymentIntent: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Payment intent not found');
        }
    }
    async cancelPaymentIntent(paymentIntentId) {
        try {
            this.logger.log(`Cancelling PaymentIntent: ${paymentIntentId}`);
            const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
            this.logger.log(`PaymentIntent cancelled: ${paymentIntent.id}`);
            return paymentIntent;
        }
        catch (error) {
            this.logger.error(`Failed to cancel PaymentIntent: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to cancel payment');
        }
    }
    async refundPayment(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to create refund: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to process refund');
        }
    }
    async createCustomer(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to create Stripe customer: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to create customer');
        }
    }
    async getCustomer(customerId) {
        try {
            return await this.stripe.customers.retrieve(customerId);
        }
        catch (error) {
            this.logger.error(`Failed to retrieve Stripe customer: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Customer not found');
        }
    }
    async updateCustomer(customerId, data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to update Stripe customer: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to update customer');
        }
    }
    async attachPaymentMethod(paymentMethodId, customerId) {
        try {
            this.logger.log(`Attaching payment method ${paymentMethodId} to customer ${customerId}`);
            const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
            this.logger.log(`Payment method attached: ${paymentMethod.id}`);
            return paymentMethod;
        }
        catch (error) {
            this.logger.error(`Failed to attach payment method: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to attach payment method');
        }
    }
    async listPaymentMethods(customerId, type = 'card') {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: type,
            });
            return paymentMethods.data;
        }
        catch (error) {
            this.logger.error(`Failed to list payment methods: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to retrieve payment methods');
        }
    }
    async detachPaymentMethod(paymentMethodId) {
        try {
            this.logger.log(`Detaching payment method: ${paymentMethodId}`);
            const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
            this.logger.log(`Payment method detached: ${paymentMethod.id}`);
            return paymentMethod;
        }
        catch (error) {
            this.logger.error(`Failed to detach payment method: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to detach payment method');
        }
    }
    constructWebhookEvent(payload, signature) {
        try {
            const webhookSecret = this.configService.get('stripe.webhookSecret');
            if (!webhookSecret) {
                throw new Error('Webhook secret not configured');
            }
            return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (error) {
            this.logger.error(`Webhook signature verification failed: ${error.message}`);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
    }
    getStripeInstance() {
        return this.stripe;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map