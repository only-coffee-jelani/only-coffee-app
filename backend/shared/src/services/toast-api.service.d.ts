import { ConfigService } from '@nestjs/config';
export interface ToastOrderItem {
    guid?: string;
    name: string;
    quantity: number;
    unitOfMeasure: 'NONE';
    price: number;
    modifiers?: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    specialRequests?: string;
}
export interface ToastCheck {
    guid?: string;
    displayNumber?: string;
    entityType: 'Check';
    checkNumber?: number;
    openedDate?: string;
    closedDate?: string;
    deletedDate?: string | null;
    deleted: boolean;
    selections: ToastOrderItem[];
    customer?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        email?: string;
    };
    promisedDate?: string;
    notes?: string;
    appliedLoyaltyInfo?: {
        loyaltyIdentifier: string;
        vendorIdentifier?: string;
        accrualFamilyGuid?: string;
    };
}
export interface ToastMenuItem {
    guid: string;
    name: string;
    description?: string;
    price: number;
    pricingStrategy: string;
    pricingRules?: any[];
    visibility: string;
    modifierGroups?: string[];
    images?: Array<{
        url: string;
    }>;
    calories?: number;
    isDiscountable: boolean;
    tags?: string[];
    sku?: string;
}
export interface ToastMenuGroup {
    guid: string;
    name: string;
    description?: string;
    items: string[];
    visibility: string;
}
export declare class ToastApiService {
    private readonly configService;
    private readonly logger;
    private readonly axiosInstance;
    private readonly config;
    private accessToken;
    private tokenExpiresAt;
    constructor(configService: ConfigService);
    private ensureValidToken;
    createCheck(check: ToastCheck): Promise<ToastCheck>;
    getCheck(checkGuid: string): Promise<ToastCheck>;
    updateCheck(checkGuid: string, check: Partial<ToastCheck>): Promise<ToastCheck>;
    getMenuItems(): Promise<ToastMenuItem[]>;
    getMenuItem(itemGuid: string): Promise<ToastMenuItem>;
    applyLoyalty(checkGuid: string, loyaltyIdentifier: string): Promise<void>;
    voidCheck(checkGuid: string): Promise<void>;
    healthCheck(): Promise<boolean>;
}
