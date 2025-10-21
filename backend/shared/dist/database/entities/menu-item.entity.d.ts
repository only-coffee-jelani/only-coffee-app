export declare enum MenuCategory {
    COFFEE = "coffee",
    ESPRESSO = "espresso",
    TEA = "tea",
    FOOD = "food",
    PASTRY = "pastry",
    MERCHANDISE = "merchandise"
}
export declare class MenuItem {
    id: string;
    storeId: string;
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
