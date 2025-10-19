import { UserTier } from './user.entity';
export declare enum PerkType {
    BIRTHDAY_REWARD = "birthday_reward",
    EARLY_ACCESS = "early_access",
    EXCLUSIVE_DISCOUNT = "exclusive_discount",
    FREE_UPGRADE = "free_upgrade",
    PRIORITY_SUPPORT = "priority_support",
    CUSTOM_REWARD = "custom_reward"
}
export declare class TierPerk {
    id: string;
    tier: UserTier;
    perkType: PerkType;
    perkName: string;
    description: string;
    isActive: boolean;
    displayOrder: number;
    configuration: Record<string, any> | null;
    iconName: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
}
