import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  apiVersion: '2024-10-28.acacia' as const,
  currency: 'usd',
  // Payment configuration
  captureMethod: 'automatic' as const,
  // Apple Pay and Google Pay domain verification
  paymentMethodTypes: [
    'card',
    'apple_pay',
    'google_pay',
  ],
  // Timeout for payment processing (5 minutes)
  paymentTimeout: 300000,
}));
