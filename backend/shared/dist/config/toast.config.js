"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('toast', () => ({
    apiBaseUrl: process.env.TOAST_API_BASE_URL || 'https://ws-api.toasttab.com',
    clientId: process.env.TOAST_CLIENT_ID || '',
    clientSecret: process.env.TOAST_CLIENT_SECRET || '',
    restaurantGuid: process.env.TOAST_RESTAURANT_GUID || '',
    rateLimit: parseInt(process.env.TOAST_RATE_LIMIT || '1000', 10),
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
}));
//# sourceMappingURL=toast.config.js.map