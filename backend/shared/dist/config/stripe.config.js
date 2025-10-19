"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('stripe', () => ({
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2024-10-28.acacia',
    currency: 'usd',
    captureMethod: 'automatic',
    paymentMethodTypes: [
        'card',
        'apple_pay',
        'google_pay',
    ],
    paymentTimeout: 300000,
}));
//# sourceMappingURL=stripe.config.js.map