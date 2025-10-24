export declare enum MenuCategory {
    HOT_COFFEE = "hot_coffee",
    ICED_COFFEE = "iced_coffee",
    COLD_BREW = "cold_brew",
    SIGNATURE = "signature",
    SEASONAL_SPECIALS = "seasonal_specials",
    CHOCOLATE = "chocolate",
    ICE_CREAM = "ice_cream",
    ADD_ONS = "add_ons"
}
export declare class MenuItem {
    id: string;
    storeIds: string[];
    toastItemId: string | null;
    name: string;
    description: string | null;
    category: MenuCategory;
    basePrice: number;
    imageUrl: string | null;
    availableModifiers: Array<{
        id: string;
        name: string;
        type: string;
        options: Array<{
            value: string;
            price: number;
        }>;
        required: boolean;
    }>;
    nutritionalInfo: Record<string, any>;
    allergens: string[];
    isAvailable: boolean;
    isActive: boolean;
    preparationTime: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    lastSyncedAt: Date | null;
}
