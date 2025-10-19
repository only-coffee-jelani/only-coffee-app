export declare enum PromotionType {
    LAUNCH_MODAL = "launch_modal",
    BANNER = "banner",
    CARD = "card"
}
export declare class Promotion {
    id: string;
    title: string;
    description: string | null;
    promotionType: PromotionType;
    imageUrl: string;
    targetMenuItemId: string | null;
    targetUrl: string | null;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    displayDuration: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
