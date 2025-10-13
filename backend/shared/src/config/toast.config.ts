import { registerAs } from '@nestjs/config';

export default registerAs('toast', () => ({
  apiBaseUrl: process.env.TOAST_API_BASE_URL || 'https://ws-api.toasttab.com',
  clientId: process.env.TOAST_CLIENT_ID || '',
  clientSecret: process.env.TOAST_CLIENT_SECRET || '',
  restaurantGuid: process.env.TOAST_RESTAURANT_GUID || '',
  // Rate limiting
  rateLimit: parseInt(process.env.TOAST_RATE_LIMIT || '1000', 10),
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // ms
  // Timeout
  timeout: 10000, // 10 seconds
}));
