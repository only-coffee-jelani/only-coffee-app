declare const _default: (() => {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    apiVersion: "2024-10-28.acacia";
    currency: string;
    captureMethod: "automatic";
    paymentMethodTypes: string[];
    paymentTimeout: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    apiVersion: "2024-10-28.acacia";
    currency: string;
    captureMethod: "automatic";
    paymentMethodTypes: string[];
    paymentTimeout: number;
}>;
export default _default;
