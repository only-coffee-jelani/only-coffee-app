export declare enum MenuCategory {
    BEST_SELLERS = "best_sellers",
    SEASONAL_SPECIALS = "seasonal_specials",
    SIGNATURE = "signature",
    HOT_COFFEE = "hot_coffee",
    ICED_COFFEE = "iced_coffee",
    COLD_BREW = "cold_brew",
    OTHER_DRINKS = "other_drinks",
    ICE_CREAM = "ice_cream",
    ADD_ONS = "add_ons",
    CHOCOLATE = "chocolate"
}
export declare class MenuItem {
    id: string;
    storeIds: string[];
    toastItemId: string | null;
    name: string;
    description: string | null;
    category: MenuCategory;
    categories: string[];
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
export declare function getCategoryDisplayName(category: string): string;
