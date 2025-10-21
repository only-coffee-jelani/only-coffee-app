import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, Between } from 'typeorm';
import {
  AnniversaryReward,
  AnniversaryBadge,
} from '@shared/database/entities/anniversary-reward.entity';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import { User } from '@shared/database/entities/user.entity';
import { CouponGrant, CouponType } from '@shared/database/entities/coupon-grant.entity';
import { CouponGrantService } from '../coupons/coupon-grant.service';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';

const TIMEZONE = 'America/Chicago';

@Injectable()
export class AnniversaryService {
  private readonly logger = new Logger(AnniversaryService.name);

  constructor(
    @InjectRepository(AnniversaryReward)
    private readonly anniversaryRewardRepository: Repository<AnniversaryReward>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly couponGrantService: CouponGrantService,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Check and grant anniversary rewards (run by daily cron)
   */
  async checkAndGrantAnniversaryRewards(): Promise<number> {
    const now = DateTime.now().setZone(TIMEZONE);
    const today = now.toISODate();

    // Get all users with qualifying purchase dates
    const streaks = await this.userStreakRepository
      .createQueryBuilder('streak')
      .where('streak.firstQualifyingPurchaseDate IS NOT NULL')
      .getMany();

    let rewardsGranted = 0;

    for (const streak of streaks) {
      try {
        const firstPurchaseDate = DateTime.fromJSDate(
          streak.firstQualifyingPurchaseDate!,
        ).setZone(TIMEZONE);

        const yearsSince = now.diff(firstPurchaseDate, 'years').years;
        const anniversaryYear = Math.floor(yearsSince);

        // Check if anniversary is today
        const anniversaryDate = firstPurchaseDate.plus({ years: anniversaryYear });

        if (anniversaryDate.toISODate() === today && anniversaryYear > 0) {
          const granted = await this.grantAnniversaryReward(
            streak.userId,
            anniversaryYear,
            anniversaryDate.toJSDate(),
          );

          if (granted) {
            rewardsGranted++;
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to check anniversary for user ${streak.userId}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Anniversary check complete: ${rewardsGranted} rewards granted`,
    );

    return rewardsGranted;
  }

  /**
   * Grant anniversary reward to a user
   */
  async grantAnniversaryReward(
    userId: string,
    anniversaryYear: number,
    anniversaryDate: Date,
  ): Promise<AnniversaryReward | null> {
    return await this.dataSource.transaction(async (manager) => {
      // Check if reward already exists
      const existing = await manager.findOne(AnniversaryReward, {
        where: {
          userId,
          anniversaryYear,
        },
      });

      if (existing) {
        this.logger.debug(
          `Anniversary reward for year ${anniversaryYear} already exists for user ${userId}`,
        );
        return null;
      }

      const now = DateTime.now().setZone(TIMEZONE);

      // Determine badge for special years
      const badge = this.getBadgeForYear(anniversaryYear);

      // Determine custom message
      const customMessage = this.getCustomMessage(anniversaryYear);

      // Create anniversary reward record
      const anniversaryReward = manager.create(AnniversaryReward, {
        userId,
        anniversaryYear,
        anniversaryDate,
        isGranted: false,
        badgeAwarded: badge,
        customMessage,
      });

      await manager.save(AnniversaryReward, anniversaryReward);

      // Grant free drink coupon
      const coupon = await this.couponGrantService.grantCoupon({
        userId,
        type: CouponType.FREE_ITEM,
        label: `${anniversaryYear} Year Anniversary Reward!`,
        description: `Celebrate ${anniversaryYear} year${anniversaryYear > 1 ? 's' : ''} with us! Enjoy any free drink.`,
        channels: 'both',
        expiresInDays: 30, // 30 days to use
        source: `anniversary_year_${anniversaryYear}`,
        metadata: {
          anniversaryYear,
          anniversaryDate: anniversaryDate.toISOString(),
          badge: badge || 'none',
        },
      });

      // Update anniversary reward with coupon ID
      anniversaryReward.isGranted = true;
      anniversaryReward.grantedAt = now.toJSDate();
      anniversaryReward.couponId = coupon.id;

      await manager.save(AnniversaryReward, anniversaryReward);

      // Emit analytics event
      await this.eventEmitterService.emitCouponGranted(
        userId,
        coupon.id,
        {
          source: 'anniversary',
          anniversaryYear,
          badge: badge || 'none',
        },
      );

      this.logger.log(
        `Granted ${anniversaryYear} year anniversary reward to user ${userId}${badge ? ` with ${badge} badge` : ''}`,
      );

      return anniversaryReward;
    });
  }

  /**
   * Get badge for special anniversary years
   */
  private getBadgeForYear(year: number): AnniversaryBadge | null {
    switch (year) {
      case 1:
        return AnniversaryBadge.YEAR_1;
      case 2:
        return AnniversaryBadge.YEAR_2;
      case 3:
        return AnniversaryBadge.YEAR_3;
      case 5:
        return AnniversaryBadge.YEAR_5;
      case 10:
        return AnniversaryBadge.YEAR_10;
      default:
        return null;
    }
  }

  /**
   * Get custom message for milestone years
   */
  private getCustomMessage(year: number): string | null {
    switch (year) {
      case 1:
        return "It's been an amazing year! Here's to many more.";
      case 2:
        return 'Two years of great coffee together!';
      case 3:
        return 'Three years strong! Thanks for being with us.';
      case 5:
        return "Five years! You're a true coffee connoisseur.";
      case 10:
        return "A decade of coffee excellence! You're legendary!";
      default:
        if (year % 5 === 0) {
          return `${year} years of coffee loyalty! Thank you!`;
        }
        return null;
    }
  }

  /**
   * Get user's anniversary rewards
   */
  async getUserAnniversaries(userId: string): Promise<AnniversaryReward[]> {
    return await this.anniversaryRewardRepository.find({
      where: { userId },
      order: {
        anniversaryYear: 'DESC',
      },
      relations: ['coupon'],
    });
  }

  /**
   * Get next anniversary info for a user
   */
  async getNextAnniversary(userId: string): Promise<{
    nextAnniversaryYear: number | null;
    nextAnniversaryDate: Date | null;
    daysUntilAnniversary: number | null;
    badge: AnniversaryBadge | null;
  }> {
    const userStreak = await this.userStreakRepository.findOne({
      where: { userId },
    });

    if (!userStreak || !userStreak.firstQualifyingPurchaseDate) {
      return {
        nextAnniversaryYear: null,
        nextAnniversaryDate: null,
        daysUntilAnniversary: null,
        badge: null,
      };
    }

    const now = DateTime.now().setZone(TIMEZONE);
    const firstPurchaseDate = DateTime.fromJSDate(
      userStreak.firstQualifyingPurchaseDate,
    ).setZone(TIMEZONE);

    const yearsSince = now.diff(firstPurchaseDate, 'years').years;
    const nextAnniversaryYear = Math.ceil(yearsSince);

    const nextAnniversaryDate = firstPurchaseDate.plus({
      years: nextAnniversaryYear,
    });

    const daysUntilAnniversary = Math.ceil(
      nextAnniversaryDate.diff(now, 'days').days,
    );

    const badge = this.getBadgeForYear(nextAnniversaryYear);

    return {
      nextAnniversaryYear,
      nextAnniversaryDate: nextAnniversaryDate.toJSDate(),
      daysUntilAnniversary,
      badge,
    };
  }

  /**
   * Check if user has upcoming anniversary (within 7 days)
   */
  async hasUpcomingAnniversary(userId: string): Promise<{
    hasUpcoming: boolean;
    year?: number;
    date?: Date;
    daysUntil?: number;
  }> {
    const nextInfo = await this.getNextAnniversary(userId);

    if (
      !nextInfo.nextAnniversaryDate ||
      !nextInfo.daysUntilAnniversary ||
      nextInfo.daysUntilAnniversary > 7
    ) {
      return { hasUpcoming: false };
    }

    return {
      hasUpcoming: true,
      year: nextInfo.nextAnniversaryYear!,
      date: nextInfo.nextAnniversaryDate,
      daysUntil: nextInfo.daysUntilAnniversary,
    };
  }

  /**
   * Mark anniversary as redeemed
   */
  async markAsRedeemed(
    anniversaryId: string,
    userId?: string,
  ): Promise<AnniversaryReward> {
    const where: any = { id: anniversaryId };

    if (userId) {
      where.userId = userId;
    }

    const anniversary = await this.anniversaryRewardRepository.findOne({
      where,
    });

    if (!anniversary) {
      throw new NotFoundException('Anniversary reward not found');
    }

    const now = DateTime.now().setZone(TIMEZONE);

    anniversary.isRedeemed = true;
    anniversary.redeemedAt = now.toJSDate();

    await this.anniversaryRewardRepository.save(anniversary);

    this.logger.log(
      `Anniversary reward ${anniversaryId} marked as redeemed`,
    );

    return anniversary;
  }

  /**
   * Get upcoming anniversaries (for notifications)
   */
  async getUpcomingAnniversaries(
    daysAhead: number = 7,
  ): Promise<AnniversaryReward[]> {
    const now = DateTime.now().setZone(TIMEZONE);
    const startDate = now.toJSDate();
    const endDate = now.plus({ days: daysAhead }).toJSDate();

    // This is a simplified query - in production, would need more complex logic
    // to handle anniversary dates across years
    const upcoming = await this.anniversaryRewardRepository
      .createQueryBuilder('anniversary')
      .where('anniversary.anniversaryDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('anniversary.isGranted = :granted', { granted: false })
      .leftJoinAndSelect('anniversary.user', 'user')
      .getMany();

    return upcoming;
  }

  /**
   * Get anniversary statistics (admin analytics)
   */
  async getAnniversaryStatistics(): Promise<{
    totalAnniversariesGranted: number;
    totalRedeemed: number;
    redemptionRate: number;
    anniversariesByYear: { [key: number]: number };
    upcomingThisMonth: number;
  }> {
    const allAnniversaries = await this.anniversaryRewardRepository.find();

    const totalAnniversariesGranted = allAnniversaries.filter(
      (a) => a.isGranted,
    ).length;

    const totalRedeemed = allAnniversaries.filter((a) => a.isRedeemed).length;

    const redemptionRate =
      totalAnniversariesGranted > 0
        ? (totalRedeemed / totalAnniversariesGranted) * 100
        : 0;

    const anniversariesByYear: { [key: number]: number } = {};
    allAnniversaries.forEach((a) => {
      anniversariesByYear[a.anniversaryYear] =
        (anniversariesByYear[a.anniversaryYear] || 0) + 1;
    });

    const now = DateTime.now().setZone(TIMEZONE);
    const monthStart = now.startOf('month').toJSDate();
    const monthEnd = now.endOf('month').toJSDate();

    const upcomingThisMonth = await this.anniversaryRewardRepository
      .createQueryBuilder('anniversary')
      .where('anniversary.anniversaryDate BETWEEN :monthStart AND :monthEnd', {
        monthStart,
        monthEnd,
      })
      .andWhere('anniversary.isGranted = :granted', { granted: false })
      .getCount();

    return {
      totalAnniversariesGranted,
      totalRedeemed,
      redemptionRate: Math.round(redemptionRate * 10) / 10,
      anniversariesByYear,
      upcomingThisMonth,
    };
  }

  /**
   * Get users celebrating anniversaries today (for admin dashboard)
   */
  async getTodaysAnniversaries(): Promise<
    Array<{
      userId: string;
      user: User;
      year: number;
      isGranted: boolean;
    }>
  > {
    const now = DateTime.now().setZone(TIMEZONE);
    const today = now.toISODate();

    const anniversaries = await this.anniversaryRewardRepository
      .createQueryBuilder('anniversary')
      .leftJoinAndSelect('anniversary.user', 'user')
      .where('DATE(anniversary.anniversaryDate) = :today', {
        today: new Date(today),
      })
      .getMany();

    return anniversaries.map((a) => ({
      userId: a.userId,
      user: a.user,
      year: a.anniversaryYear,
      isGranted: a.isGranted,
    }));
  }

  /**
   * Manually grant anniversary reward (admin)
   */
  async manuallyGrantAnniversary(
    userId: string,
    anniversaryYear: number,
  ): Promise<AnniversaryReward> {
    const userStreak = await this.userStreakRepository.findOne({
      where: { userId },
    });

    if (!userStreak || !userStreak.firstQualifyingPurchaseDate) {
      throw new NotFoundException(
        'User does not have a qualifying purchase date',
      );
    }

    const firstPurchaseDate = DateTime.fromJSDate(
      userStreak.firstQualifyingPurchaseDate,
    ).setZone(TIMEZONE);

    const anniversaryDate = firstPurchaseDate.plus({
      years: anniversaryYear,
    });

    const reward = await this.grantAnniversaryReward(
      userId,
      anniversaryYear,
      anniversaryDate.toJSDate(),
    );

    if (!reward) {
      throw new Error('Failed to grant anniversary reward');
    }

    this.logger.log(
      `Admin manually granted ${anniversaryYear} year anniversary to user ${userId}`,
    );

    return reward;
  }
}
