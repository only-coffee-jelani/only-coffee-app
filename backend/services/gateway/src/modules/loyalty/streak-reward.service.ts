import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StreakReward, RewardType } from '@shared/database/entities/streak-reward.entity';
import { CouponGrant } from '@shared/database/entities/coupon-grant.entity';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import { CouponGrantService } from '../coupons/coupon-grant.service';
import { EventEmitterService } from '../../common/services/event-emitter.service';
import { DateTime } from 'luxon';

const TIMEZONE = 'America/Chicago';

@Injectable()
export class StreakRewardService {
  private readonly logger = new Logger(StreakRewardService.name);

  constructor(
    @InjectRepository(StreakReward)
    private readonly streakRewardRepository: Repository<StreakReward>,
    @InjectRepository(CouponGrant)
    private readonly couponGrantRepository: Repository<CouponGrant>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    private readonly couponGrantService: CouponGrantService,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Check and grant milestone rewards for a user
   * Called after streak is updated
   */
  async checkAndGrantMilestoneReward(
    userId: string,
    streakDay: number,
  ): Promise<CouponGrant | null> {
    // Check if this streak day has a reward configured
    const reward = await this.streakRewardRepository.findOne({
      where: {
        streakDay,
        isActive: true,
      },
    });

    if (!reward) {
      this.logger.debug(
        `No active reward configured for streak day ${streakDay}`,
      );
      return null;
    }

    // Check if user already received this reward recently (prevent duplicates)
    const now = DateTime.now().setZone(TIMEZONE);
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();

    const existingReward = await this.couponGrantRepository.findOne({
      where: {
        userId,
        source: `streak_day_${streakDay}`,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // If reward was granted in last 30 days, skip (prevent duplicate grants on same milestone)
    if (
      existingReward &&
      existingReward.createdAt >= thirtyDaysAgo
    ) {
      this.logger.warn(
        `User ${userId} already received streak day ${streakDay} reward recently`,
      );
      return null;
    }

    // Grant the reward
    const coupon = await this.couponGrantService.grantCoupon({
      userId,
      type: reward.couponType,
      label: reward.label,
      description: reward.description || undefined,
      valueCents: reward.valueCents || undefined,
      eligibleItems: reward.eligibleItems || undefined,
      channels: reward.channels,
      expiresInDays: reward.expiryDays,
      source: `streak_day_${streakDay}`,
      metadata: {
        streakDay,
        rewardId: reward.id,
        grantedAt: now.toISO(),
      },
    });

    // Emit analytics event
    await this.eventEmitterService.emitCouponGranted(
      userId,
      coupon.id,
      {
        source: 'streak_milestone',
        streakDay,
        rewardId: reward.id,
        label: reward.label,
      },
    );

    this.logger.log(
      `Granted streak day ${streakDay} reward to user ${userId}: ${reward.label}`,
    );

    return coupon;
  }

  /**
   * Get all configured streak rewards
   */
  async getStreakRewards(activeOnly: boolean = false): Promise<StreakReward[]> {
    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
    }

    return await this.streakRewardRepository.find({
      where,
      order: {
        displayOrder: 'ASC',
        streakDay: 'ASC',
      },
    });
  }

  /**
   * Get a specific streak reward
   */
  async getStreakReward(streakDay: number): Promise<StreakReward> {
    const reward = await this.streakRewardRepository.findOne({
      where: { streakDay },
    });

    if (!reward) {
      throw new NotFoundException(`Reward for streak day ${streakDay} not found`);
    }

    return reward;
  }

  /**
   * Create a new streak reward (admin)
   */
  async createStreakReward(data: {
    streakDay: number;
    couponType: any;
    label: string;
    description?: string;
    valueCents?: number;
    maxValueCents?: number;
    expiryDays?: number;
    channels?: string;
    eligibleItems?: any;
    displayOrder?: number;
  }): Promise<StreakReward> {
    // Check if reward already exists for this streak day
    const existing = await this.streakRewardRepository.findOne({
      where: { streakDay: data.streakDay },
    });

    if (existing) {
      throw new BadRequestException(
        `Reward for streak day ${data.streakDay} already exists`,
      );
    }

    const reward = this.streakRewardRepository.create({
      ...data,
      rewardType: RewardType.COUPON_GRANT,
      channels: data.channels || 'both',
      expiryDays: data.expiryDays || 7,
      displayOrder: data.displayOrder || 0,
    });

    await this.streakRewardRepository.save(reward);

    this.logger.log(
      `Created streak reward for day ${data.streakDay}: ${data.label}`,
    );

    return reward;
  }

  /**
   * Update a streak reward (admin)
   */
  async updateStreakReward(
    streakDay: number,
    updates: Partial<StreakReward>,
  ): Promise<StreakReward> {
    const reward = await this.getStreakReward(streakDay);

    Object.assign(reward, updates);

    await this.streakRewardRepository.save(reward);

    this.logger.log(`Updated streak reward for day ${streakDay}`);

    return reward;
  }

  /**
   * Toggle reward active status (admin)
   */
  async toggleRewardStatus(
    streakDay: number,
    isActive: boolean,
  ): Promise<StreakReward> {
    const reward = await this.getStreakReward(streakDay);

    reward.isActive = isActive;

    await this.streakRewardRepository.save(reward);

    this.logger.log(
      `Set streak day ${streakDay} reward to ${isActive ? 'active' : 'inactive'}`,
    );

    return reward;
  }

  /**
   * Get user's granted streak rewards
   */
  async getUserStreakRewards(userId: string): Promise<CouponGrant[]> {
    const rewards = await this.couponGrantRepository
      .createQueryBuilder('coupon')
      .where('coupon.userId = :userId', { userId })
      .andWhere("coupon.source LIKE 'streak_day_%'")
      .orderBy('coupon.createdAt', 'DESC')
      .getMany();

    return rewards;
  }

  /**
   * Get user's next reward milestone
   */
  async getNextMilestone(userId: string): Promise<{
    nextMilestone: number | null;
    daysUntilMilestone: number | null;
    reward: StreakReward | null;
  }> {
    const userStreak = await this.userStreakRepository.findOne({
      where: { userId },
    });

    const currentStreak = userStreak?.consecutiveDays || 0;

    // Get all active rewards
    const rewards = await this.getStreakRewards(true);

    // Find next milestone
    const nextReward = rewards.find((r) => r.streakDay > currentStreak);

    if (!nextReward) {
      return {
        nextMilestone: null,
        daysUntilMilestone: null,
        reward: null,
      };
    }

    return {
      nextMilestone: nextReward.streakDay,
      daysUntilMilestone: nextReward.streakDay - currentStreak,
      reward: nextReward,
    };
  }

  /**
   * Seed default streak rewards (run on app startup or migration)
   */
  async seedDefaultRewards(): Promise<void> {
    const defaults = [
      {
        streakDay: 2,
        couponType: 'fixed_amount',
        label: 'Day 2 Reward',
        description: '$1 off any beverage',
        valueCents: 100,
        maxValueCents: null,
        expiryDays: 7,
        channels: 'both',
        displayOrder: 1,
      },
      {
        streakDay: 7,
        couponType: 'free_item',
        label: 'Day 7 Reward: Free Drink!',
        description: 'Free drink up to $8',
        valueCents: null,
        maxValueCents: 800,
        expiryDays: 7,
        channels: 'both',
        displayOrder: 2,
      },
      {
        streakDay: 14,
        couponType: 'fixed_amount',
        label: 'Day 14 Reward',
        description: '$2 off any beverage',
        valueCents: 200,
        maxValueCents: null,
        expiryDays: 7,
        channels: 'both',
        displayOrder: 3,
      },
      {
        streakDay: 30,
        couponType: 'free_item',
        label: 'Day 30 Reward: Free Drink!',
        description: 'Free drink up to $10',
        valueCents: null,
        maxValueCents: 1000,
        expiryDays: 14,
        channels: 'both',
        displayOrder: 4,
      },
      {
        streakDay: 90,
        couponType: 'free_item',
        label: 'Day 90 Reward: Any Free Drink!',
        description: 'Free drink, no limit!',
        valueCents: null,
        maxValueCents: null,
        expiryDays: 30,
        channels: 'both',
        displayOrder: 5,
      },
    ];

    for (const data of defaults) {
      const existing = await this.streakRewardRepository.findOne({
        where: { streakDay: data.streakDay },
      });

      if (!existing) {
        const reward = this.streakRewardRepository.create({
          ...data,
          rewardType: RewardType.COUPON_GRANT,
          isActive: true,
        } as any);
        await this.streakRewardRepository.save(reward);
        this.logger.log(`Seeded default reward for day ${data.streakDay}`);
      }
    }

    this.logger.log('Default streak rewards seeded');
  }
}
