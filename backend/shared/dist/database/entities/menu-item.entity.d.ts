import { MenuCategory } from './menu-category.entity';
import { MediaAsset } from './media-asset.entity';
import { OrderItem } from './order-item.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';
import { AIRecommendation } from './ai-recommendation.entity';
import { Allergen } from './allergen.entity';
export declare class MenuItem {
    menuItemId: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    basePrice: number;
    calories: number | null;
    imageAssetId: string | null;
    toastItemId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: MenuCategory;
    imageAsset: MediaAsset;
    orderItems: OrderItem[];
    menuItemModifierGroups: MenuItemModifierGroup[];
    aiRecommendations: AIRecommendation[];
    allergens: Allergen[];
}
