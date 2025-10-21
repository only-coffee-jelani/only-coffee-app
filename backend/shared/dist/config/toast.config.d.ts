declare const _default: (() => {
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    restaurantGuid: string;
    rateLimit: number;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    restaurantGuid: string;
    rateLimit: number;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
}>;
export default _default;
