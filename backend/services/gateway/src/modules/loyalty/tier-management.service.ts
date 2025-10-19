import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { User, UserTier } from '@shared/database/entities/user.entity';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import {
  UserTierHistory,
  TierChangeReason,
} from '@shared/database/entities/user-tier-history.entity';
import { TierPerk, PerkType } from '@shared/database/entities/tier-perk.entity';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';

const TIMEZONE = 'America/Chicago';

// Tier Requirements based on spec
const TIER_REQUIREMENTS = {
  [UserTier.BRONZE]: {
    name: 'Bronze',
    monthlyVisits: 0, // Default tier
    tierXP: 0,
    sevenDayStreakCount: 0,
    annualSpend: 0,
  },
  [UserTier.SILVER]: {
    name: 'Silver',
    monthlyVisits: 4, // 4 visits/month OR
    tierXP: 0,
    sevenDayStreakCount: 1, // 1x 7-day streak
    annualSpend: 0,
  },
  [UserTier.GOLD]: {
    name: 'Gold',
    monthlyVisits: 8, // 8 visits/month OR
    tierXP: 500, // 500 XP
    sevenDayStreakCount: 0,
    annualSpend: 0,
  },
  [UserTier.PLATINUM]: {
    name: 'Platinum',
    monthlyVisits: 12, // 12 visits/month OR
    tierXP: 1500, // 1500 XP
    sevenDayStreakCount: 0,
    annualSpend: 0,
  },
  [UserTier.BLACK]: {
    name: 'Black',
    monthlyVisits: 0,
    tierXP: 3000, // 3000 XP AND
    sevenDayStreakCount: 0,
    annualSpend: 1000, // $1000 annual spend
  },
};

@Injectable()
export class TierManagementService {
  private readonly logger = new Logger(TierManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(UserTierHistory)
    private readonly tierHistoryRepository: Repository<UserTierHistory>,
    @InjectRepository(TierPerk)
    private readonly tierPerkRepository: Repository<TierPerk>,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Evaluate and update a user's tier based on their metrics
   */
  async evaluateUserTier(userId: string): Promise<{
    previousTier: UserTier;
    newTier: UserTier;
    changed: boolean;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const userStreak = await manager.findOne(UserStreak, {
        where: { userId },
      });

      if (!userStreak) {
        // User has no streak data, keep at Bronze
        return {
          previousTier: user.loyaltyTier,
          newTier: user.loyaltyTier,
          changed: false,
        };
      }

      const previousTier = user.loyaltyTier;
      const newTier = this.calculateTier(userStreak);

      if (previousTier === newTier) {
        return {
          previousTier,
          newTier,
          changed: false,
        };
      }

      // Update user tier
      user.loyaltyTier = newTier;
      await manager.save(User, user);

      // Record tier change in history
      const now = DateTime.now().setZone(TIMEZONE);
      const history = manager.create(UserTierHistory, {
        userId,
        previousTier,
        newTier,
        reason: TierChangeReason.QUALIFIED,
        changedAt: now.toJSDate(),
        monthlyVisitsAtChange: userStreak.monthlyVisits,
        tierXPAtChange: userStreak.tierXP,
        annualSpendAtChange: parseFloat(userStreak.annualSpend.toString()),
        sevenDayStreakCountAtChange: userStreak.sevenDayStreakCount,
      });

      await manager.save(UserTierHistory, history);

      // Emit analytics event
      await this.eventEmitterService.emitCouponGranted(
        userId,
        'tier_changed',
        {
          previousTier,
          newTier,
          reason: TierChangeReason.QUALIFIED,
          monthlyVisits: userStreak.monthlyVisits,
          tierXP: userStreak.tierXP,
          annualSpend: userStreak.annualSpend,
        },
      );

      const direction = this.getTierLevel(newTier) > this.getTierLevel(previousTier) ? 'upgraded' : 'downgraded';

      this.logger.log(
        `User ${userId} ${direction} from ${previousTier} to ${newTier}`,
      );

      return {
        previousTier,
        newTier,
        changed: true,
      };
    });
  }

  /**
   * Calculate appropriate tier based on user metrics
   */
  private calculateTier(userStreak: UserStreak): UserTier {
    const monthlyVisits = userStreak.monthlyVisits;
    const tierXP = userStreak.tierXP;
    const sevenDayStreakCount = userStreak.sevenDayStreakCount;
    const annualSpend = parseFloat(userStreak.annualSpend.toString());

    // BLACK: 3000 XP AND $1000 annual spend
    if (tierXP >= TIER_REQUIREMENTS[UserTier.BLACK].tierXP && annualSpend >= TIER_REQUIREMENTS[UserTier.BLACK].annualSpend) {
      return UserTier.BLACK;
    }

    // PLATINUM: 12 visits/month OR 1500 XP
    if (monthlyVisits >= TIER_REQUIREMENTS[UserTier.PLATINUM].monthlyVisits || tierXP >= TIER_REQUIREMENTS[UserTier.PLATINUM].tierXP) {
      return UserTier.PLATINUM;
    }

    // GOLD: 8 visits/month OR 500 XP
    if (monthlyVisits >= TIER_REQUIREMENTS[UserTier.GOLD].monthlyVisits || tierXP >= TIER_REQUIREMENTS[UserTier.GOLD].tierXP) {
      return UserTier.GOLD;
    }

    // SILVER: 4 visits/month OR 1x 7-day streak
    if (monthlyVisits >= TIER_REQUIREMENTS[UserTier.SILVER].monthlyVisits || sevenDayStreakCount >= TIER_REQUIREMENTS[UserTier.SILVER].sevenDayStreakCount) {
      return UserTier.SILVER;
    }

    // Default: BRONZE
    return UserTier.BRONZE;
  }

  /**
   * Get numeric tier level for comparison
   */
  private getTierLevel(tier: UserTier): number {
    const levels = {
      [UserTier.BRONZE]: 1,
      [UserTier.SILVER]: 2,
      [UserTier.GOLD]: 3,
      [UserTier.PLATINUM]: 4,
      [UserTier.BLACK]: 5,
    };
    return levels[tier] || 0;
  }

  /**
   * Evaluate all users' tiers (run by nightly cron job)
   */
  async evaluateAllUserTiers(): Promise<{
    totalEvaluated: number;
    totalChanged: number;
    upgrades: number;
    downgrades: number;
  }> {
    const usersWithStreaks = await this.userStreakRepository.find();

    let totalEvaluated = 0;
    let totalChanged = 0;
    let upgrades = 0;
    let downgrades = 0;

    for (const streak of usersWithStreaks) {
      try {
        const result = await this.evaluateUserTier(streak.userId);
        totalEvaluated++;

        if (result.changed) {
          totalChanged++;
          if (this.getTierLevel(result.newTier) > this.getTierLevel(result.previousTier)) {
            upgrades++;
          } else {
            downgrades++;
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to evaluate tier for user ${streak.userId}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Tier evaluation complete: ${totalEvaluated} evaluated, ${totalChanged} changed (${upgrades} upgrades, ${downgrades} downgrades)`,
    );

    return {
      totalEvaluated,
      totalChanged,
      upgrades,
      downgrades,
    };
  }

  /**
   * Manually set user tier (admin)
   */
  async manuallySetTier(
    userId: string,
    newTier: UserTier,
    adminNotes?: string,
  ): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const previousTier = user.loyaltyTier;

      if (previousTier === newTier) {
        return user;
      }

      user.loyaltyTier = newTier;
      await manager.save(User, user);

      // Record in history
      const now = DateTime.now().setZone(TIMEZONE);
      const userStreak = await manager.findOne(UserStreak, {
        where: { userId },
      });

      const history = manager.create(UserTierHistory, {
        userId,
        previousTier,
        newTier,
        reason: TierChangeReason.MANUAL_OVERRIDE,
        changedAt: now.toJSDate(),
        monthlyVisitsAtChange: userStreak?.monthlyVisits || 0,
        tierXPAtChange: userStreak?.tierXP || 0,
        annualSpendAtChange: userStreak ? parseFloat(userStreak.annualSpend.toString()) : 0,
        sevenDayStreakCountAtChange: userStreak?.sevenDayStreakCount || 0,
        adminNotes,
      });

      await manager.save(UserTierHistory, history);

      this.logger.log(
        `Admin manually changed user ${userId} tier from ${previousTier} to ${newTier}`,
      );

      return user;
    });
  }

  /**
   * Get user's tier history
   */
  async getUserTierHistory(userId: string): Promise<UserTierHistory[]> {
    return await this.tierHistoryRepository.find({
      where: { userId },
      order: {
        changedAt: 'DESC',
      },
    });
  }

  /**
   * Get perks for a specific tier
   */
  async getTierPerks(tier: UserTier): Promise<TierPerk[]> {
    return await this.tierPerkRepository.find({
      where: {
        tier,
        isActive: true,
      },
      order: {
        displayOrder: 'ASC',
      },
    });
  }

  /**
   * Get all perks for all tiers (admin)
   */
  async getAllTierPerks(): Promise<TierPerk[]> {
    return await this.tierPerkRepository.find({
      order: {
        tier: 'ASC',
        displayOrder: 'ASC',
      },
    });
  }

  /**
   * Create a tier perk (admin)
   */
  async createTierPerk(data: {
    tier: UserTier;
    perkType: PerkType;
    perkName: string;
    description: string;
    configuration?: any;
    iconName?: string;
    displayOrder?: number;
  }): Promise<TierPerk> {
    const perk = this.tierPerkRepository.create({
      ...data,
      isActive: true,
      displayOrder: data.displayOrder || 0,
    });

    await this.tierPerkRepository.save(perk);

    this.logger.log(
      `Created tier perk for ${data.tier}: ${data.perkName}`,
    );

    return perk;
  }

  /**
   * Update a tier perk (admin)
   */
  async updateTierPerk(
    perkId: string,
    updates: Partial<TierPerk>,
  ): Promise<TierPerk> {
    const perk = await this.tierPerkRepository.findOne({
      where: { id: perkId },
    });

    if (!perk) {
      throw new NotFoundException('Tier perk not found');
    }

    Object.assign(perk, updates);

    await this.tierPerkRepository.save(perk);

    this.logger.log(`Updated tier perk ${perkId}`);

    return perk;
  }

  /**
   * Get tier requirements
   */
  getTierRequirements(): typeof TIER_REQUIREMENTS {
    return TIER_REQUIREMENTS;
  }

  /**
   * Get user's progress toward next tier
   */
  async getUserTierProgress(userId: string): Promise<{
    currentTier: UserTier;
    nextTier: UserTier | null;
    progress: {
      monthlyVisits: { current: number; required: number };
      tierXP: { current: number; required: number };
      sevenDayStreaks: { current: number; required: number };
      annualSpend: { current: number; required: number };
    };
    meetsRequirements: boolean;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userStreak = await this.userStreakRepository.findOne({
      where: { userId },
    });

    const currentTier = user.loyaltyTier;
    const currentLevel = this.getTierLevel(currentTier);

    // Determine next tier
    const tierOrder = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM, UserTier.BLACK];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

    if (!nextTier || !userStreak) {
      return {
        currentTier,
        nextTier: null,
        progress: {
          monthlyVisits: { current: 0, required: 0 },
          tierXP: { current: 0, required: 0 },
          sevenDayStreaks: { current: 0, required: 0 },
          annualSpend: { current: 0, required: 0 },
        },
        meetsRequirements: false,
      };
    }

    const requirements = TIER_REQUIREMENTS[nextTier];

    const progress = {
      monthlyVisits: {
        current: userStreak.monthlyVisits,
        required: requirements.monthlyVisits,
      },
      tierXP: {
        current: userStreak.tierXP,
        required: requirements.tierXP,
      },
      sevenDayStreaks: {
        current: userStreak.sevenDayStreakCount,
        required: requirements.sevenDayStreakCount,
      },
      annualSpend: {
        current: parseFloat(userStreak.annualSpend.toString()),
        required: requirements.annualSpend,
      },
    };

    // Check if user meets requirements for next tier
    let meetsRequirements = false;

    if (nextTier === UserTier.BLACK) {
      // BLACK requires BOTH XP AND spend
      meetsRequirements = progress.tierXP.current >= progress.tierXP.required && progress.annualSpend.current >= progress.annualSpend.required;
    } else if (nextTier === UserTier.SILVER) {
      // SILVER requires visits OR streaks
      meetsRequirements = progress.monthlyVisits.current >= progress.monthlyVisits.required || progress.sevenDayStreaks.current >= progress.sevenDayStreaks.required;
    } else {
      // GOLD and PLATINUM require visits OR XP
      meetsRequirements = progress.monthlyVisits.current >= progress.monthlyVisits.required || progress.tierXP.current >= progress.tierXP.required;
    }

    return {
      currentTier,
      nextTier,
      progress,
      meetsRequirements,
    };
  }

  /**
   * Get tier distribution statistics (admin analytics)
   */
  async getTierDistribution(): Promise<{
    [key in UserTier]: number;
  }> {
    const distribution = {
      [UserTier.BRONZE]: 0,
      [UserTier.SILVER]: 0,
      [UserTier.GOLD]: 0,
      [UserTier.PLATINUM]: 0,
      [UserTier.BLACK]: 0,
    };

    const users = await this.userRepository.find();

    for (const user of users) {
      distribution[user.loyaltyTier]++;
    }

    return distribution;
  }

  /**
   * Seed default tier perks (run on startup or migration)
   */
  async seedDefaultTierPerks(): Promise<void> {
    const defaultPerks = [
      // Bronze perks
      {
        tier: UserTier.BRONZE,
        perkType: PerkType.BIRTHDAY_REWARD,
        perkName: 'Birthday Reward',
        description: 'Free small beverage on your birthday',
        configuration: { maxValueCents: 500, expiryDays: 7 },
        iconName: 'gift',
        displayOrder: 1,
      },
      // Silver perks
      {
        tier: UserTier.SILVER,
        perkType: PerkType.BIRTHDAY_REWARD,
        perkName: 'Birthday Reward',
        description: 'Free medium beverage on your birthday',
        configuration: { maxValueCents: 700, expiryDays: 7 },
        iconName: 'gift',
        displayOrder: 1,
      },
      {
        tier: UserTier.SILVER,
        perkType: PerkType.EARLY_ACCESS,
        perkName: 'Early Access',
        description: 'Early access to new seasonal drinks',
        configuration: {},
        iconName: 'star',
        displayOrder: 2,
      },
      // Gold perks
      {
        tier: UserTier.GOLD,
        perkType: PerkType.BIRTHDAY_REWARD,
        perkName: 'Birthday Reward',
        description: 'Free large beverage on your birthday',
        configuration: { maxValueCents: 900, expiryDays: 7 },
        iconName: 'gift',
        displayOrder: 1,
      },
      {
        tier: UserTier.GOLD,
        perkType: PerkType.EARLY_ACCESS,
        perkName: 'Early Access',
        description: 'Early access to new products and promos',
        configuration: {},
        iconName: 'star',
        displayOrder: 2,
      },
      {
        tier: UserTier.GOLD,
        perkType: PerkType.FREE_UPGRADE,
        perkName: 'Free Size Upgrade',
        description: 'Free size upgrade once per month',
        configuration: { frequency: 'monthly' },
        iconName: 'arrow-up',
        displayOrder: 3,
      },
      // Platinum perks
      {
        tier: UserTier.PLATINUM,
        perkType: PerkType.BIRTHDAY_REWARD,
        perkName: 'Birthday Reward',
        description: 'Any free beverage on your birthday',
        configuration: { maxValueCents: null, expiryDays: 14 },
        iconName: 'gift',
        displayOrder: 1,
      },
      {
        tier: UserTier.PLATINUM,
        perkType: PerkType.EARLY_ACCESS,
        perkName: 'VIP Early Access',
        description: 'First access to all new launches',
        configuration: {},
        iconName: 'star',
        displayOrder: 2,
      },
      {
        tier: UserTier.PLATINUM,
        perkType: PerkType.FREE_UPGRADE,
        perkName: 'Unlimited Free Upgrades',
        description: 'Free size upgrades anytime',
        configuration: { frequency: 'unlimited' },
        iconName: 'arrow-up',
        displayOrder: 3,
      },
      {
        tier: UserTier.PLATINUM,
        perkType: PerkType.PRIORITY_SUPPORT,
        perkName: 'Priority Support',
        description: 'Dedicated customer service line',
        configuration: {},
        iconName: 'headset',
        displayOrder: 4,
      },
      // Black perks
      {
        tier: UserTier.BLACK,
        perkType: PerkType.BIRTHDAY_REWARD,
        perkName: 'Black Card Birthday',
        description: 'Any beverage + pastry on your birthday',
        configuration: { maxValueCents: null, expiryDays: 30 },
        iconName: 'gift',
        displayOrder: 1,
      },
      {
        tier: UserTier.BLACK,
        perkType: PerkType.EARLY_ACCESS,
        perkName: 'Black Card VIP Access',
        description: 'Exclusive access to limited releases',
        configuration: {},
        iconName: 'crown',
        displayOrder: 2,
      },
      {
        tier: UserTier.BLACK,
        perkType: PerkType.FREE_UPGRADE,
        perkName: 'Black Card Upgrades',
        description: 'Free upgrades on everything, always',
        configuration: { frequency: 'unlimited' },
        iconName: 'arrow-up',
        displayOrder: 3,
      },
      {
        tier: UserTier.BLACK,
        perkType: PerkType.PRIORITY_SUPPORT,
        perkName: 'Concierge Support',
        description: 'Personal account manager',
        configuration: {},
        iconName: 'headset',
        displayOrder: 4,
      },
      {
        tier: UserTier.BLACK,
        perkType: PerkType.EXCLUSIVE_DISCOUNT,
        perkName: 'Black Card Discount',
        description: '10% off all purchases',
        configuration: { percentOff: 10 },
        iconName: 'percent',
        displayOrder: 5,
      },
    ];

    for (const perkData of defaultPerks) {
      const existing = await this.tierPerkRepository.findOne({
        where: {
          tier: perkData.tier,
          perkType: perkData.perkType,
        },
      });

      if (!existing) {
        const perk = this.tierPerkRepository.create({
          ...perkData,
          isActive: true,
        });
        await this.tierPerkRepository.save(perk);
        this.logger.log(`Seeded ${perkData.tier} perk: ${perkData.perkName}`);
      }
    }

    this.logger.log('Default tier perks seeded');
  }
}
