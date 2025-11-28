import { PromotionDiscountType } from './promotion-discount-type.entity';
import { AdminUser } from './admin-user.entity';
import { PromotionRedemption } from './promotion-redemption.entity';
export declare class Promotion {
    promotionId: string;
    name: string;
    description: string | null;
    discountTypeId: string;
    discountValue: number;
    startAt: Date;
    endAt: Date;
    isActive: boolean;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    get id(): string;
    get title(): string;
    discountType: PromotionDiscountType;
    createdByAdmin: AdminUser;
    promotionRedemptions: PromotionRedemption[];
}
