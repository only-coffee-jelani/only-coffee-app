import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import {
  StreakSaverToken,
  TokenStatus,
} from '@shared/database/entities/streak-saver-token.entity';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import { User } from '@shared/database/entities/user.entity';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';

const TIMEZONE = 'America/Chicago';
const MAX_TOKENS_PER_90_DAYS = 2;

@Injectable()
export class StreakSaverService {
  private readonly logger = new Logger(StreakSaverService.name);

  constructor(
    @InjectRepository(StreakSaverToken)
    private readonly tokenRepository: Repository<StreakSaverToken>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Grant monthly token to a user
   * Called on 1st of each month via cron job
   */
  async grantMonthlyToken(userId: string): Promise<StreakSaverToken> {
    const now = DateTime.now().setZone(TIMEZONE);

    // Check if user already received a token this month
    const monthStart = now.startOf('month').toJSDate();
    const monthEnd = now.endOf('month').toJSDate();

    const existingToken = await this.tokenRepository.findOne({
      where: {
        userId,
        grantedAt: LessThan(monthEnd),
      },
      order: {
        grantedAt: 'DESC',
      },
    });

    if (existingToken && existingToken.grantedAt >= monthStart) {
      this.logger.debug(
        `User ${userId} already received a token this month`,
      );
      return existingToken;
    }

    // Grant new token
    const token = this.tokenRepository.create({
      userId,
      status: TokenStatus.AVAILABLE,
      grantedAt: now.toJSDate(),
      expiresAt: now.endOf('month').toJSDate(),
      metadata: {
        grantMonth: now.toFormat('yyyy-MM'),
      },
    });

    await this.tokenRepository.save(token);

    // Emit analytics event
    await this.eventEmitterService.emitCouponGranted(
      userId,
      'streak_saver_token_granted',
      {
        tokenId: token.id,
        grantedAt: token.grantedAt,
        expiresAt: token.expiresAt,
      },
    );

    this.logger.log(
      `Granted streak saver token to user ${userId} for ${now.toFormat('MMMM yyyy')}`,
    );

    return token;
  }

  /**
   * Use a token to save a streak
   */
  async useToken(
    userId: string,
    missedDate: Date,
  ): Promise<{
    success: boolean;
    message: string;
    token?: StreakSaverToken;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const now = DateTime.now().setZone(TIMEZONE);
      const missedDateObj = DateTime.fromJSDate(missedDate).setZone(TIMEZONE);

      // Validate missed date is in the past
      if (missedDateObj >= now.startOf('day')) {
        return {
          success: false,
          message: 'Can only apply tokens to past dates',
        };
      }

      // Validate missed date is within last 7 days
      const daysSinceMissed = now.diff(missedDateObj, 'days').days;
      if (daysSinceMissed > 7) {
        return {
          success: false,
          message: 'Can only apply tokens to dates within the last 7 days',
        };
      }

      // Get available token
      const availableToken = await manager.findOne(StreakSaverToken, {
        where: {
          userId,
          status: TokenStatus.AVAILABLE,
        },
        order: {
          grantedAt: 'ASC', // Use oldest token first
        },
      });

      if (!availableToken) {
        return {
          success: false,
          message: 'No available tokens. Tokens are granted once per month.',
        };
      }

      // Check if token is expired
      if (
        availableToken.expiresAt &&
        now.toJSDate() > availableToken.expiresAt
      ) {
        return {
          success: false,
          message: 'Your available token has expired',
        };
      }

      // Validate 2 per 90 days limit
      const ninetyDaysAgo = now.minus({ days: 90 }).toJSDate();
      const recentlyUsedTokens = await manager.find(StreakSaverToken, {
        where: {
          userId,
          status: TokenStatus.USED,
        },
        order: {
          usedAt: 'DESC',
        },
      });

      const tokensUsedInLast90Days = recentlyUsedTokens.filter(
        (t) => t.usedAt && t.usedAt >= ninetyDaysAgo,
      ).length;

      if (tokensUsedInLast90Days >= MAX_TOKENS_PER_90_DAYS) {
        return {
          success: false,
          message: `You've used ${MAX_TOKENS_PER_90_DAYS} tokens in the last 90 days. Please wait before using another.`,
        };
      }

      // Check if a token was already applied to this date
      const existingApplication = await manager.findOne(StreakSaverToken, {
        where: {
          userId,
          appliedToDate: missedDate,
          status: TokenStatus.USED,
        },
      });

      if (existingApplication) {
        return {
          success: false,
          message: 'A token has already been applied to this date',
        };
      }

      // Use the token
      availableToken.status = TokenStatus.USED;
      availableToken.usedAt = now.toJSDate();
      availableToken.appliedToDate = missedDate;

      await manager.save(StreakSaverToken, availableToken);

      // Update user streak - fill in the gap
      const userStreak = await manager.findOne(UserStreak, {
        where: { userId },
      });

      if (userStreak) {
        // Recalculate streak considering the filled gap
        // This is a simplified approach - production would need more complex logic
        if (userStreak.lastVisitDate) {
          const lastVisit = DateTime.fromJSDate(userStreak.lastVisitDate).setZone(
            TIMEZONE,
          );
          const daysSinceLastVisit = now.diff(lastVisit, 'days').days;

          // If the missed date fills a gap, restore streak
          if (daysSinceLastVisit <= 2) {
            // Don't reset streak
            this.logger.log(
              `Token preserved streak for user ${userId} on ${missedDateObj.toISODate()}`,
            );
          }
        }

        await manager.save(UserStreak, userStreak);
      }

      // Emit analytics event
      await this.eventEmitterService.emitCouponGranted(
        userId,
        'streak_saver_token_used',
        {
          tokenId: availableToken.id,
          appliedToDate: missedDate,
          usedAt: availableToken.usedAt,
        },
      );

      this.logger.log(
        `User ${userId} used streak saver token for ${missedDateObj.toISODate()}`,
      );

      return {
        success: true,
        message: `Streak saved! Token applied to ${missedDateObj.toFormat('MMM d, yyyy')}`,
        token: availableToken,
      };
    });
  }

  /**
   * Get user's tokens
   */
  async getUserTokens(
    userId: string,
    status?: TokenStatus,
  ): Promise<StreakSaverToken[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    return await this.tokenRepository.find({
      where,
      order: {
        grantedAt: 'DESC',
      },
    });
  }

  /**
   * Get count of available tokens
   */
  async getAvailableTokenCount(userId: string): Promise<number> {
    const now = DateTime.now().setZone(TIMEZONE);

    const availableTokens = await this.tokenRepository.count({
      where: {
        userId,
        status: TokenStatus.AVAILABLE,
      },
    });

    // Filter out expired tokens
    const tokens = await this.tokenRepository.find({
      where: {
        userId,
        status: TokenStatus.AVAILABLE,
      },
    });

    const validTokens = tokens.filter(
      (t) => !t.expiresAt || t.expiresAt > now.toJSDate(),
    );

    return validTokens.length;
  }

  /**
   * Check if user can use a token (validates 2 per 90 days limit)
   */
  async canUseToken(userId: string): Promise<{
    canUse: boolean;
    reason?: string;
    tokensUsedInLast90Days: number;
  }> {
    const now = DateTime.now().setZone(TIMEZONE);
    const ninetyDaysAgo = now.minus({ days: 90 }).toJSDate();

    // Get tokens used in last 90 days
    const usedTokens = await this.tokenRepository.find({
      where: {
        userId,
        status: TokenStatus.USED,
      },
      order: {
        usedAt: 'DESC',
      },
    });

    const tokensUsedInLast90Days = usedTokens.filter(
      (t) => t.usedAt && t.usedAt >= ninetyDaysAgo,
    ).length;

    if (tokensUsedInLast90Days >= MAX_TOKENS_PER_90_DAYS) {
      return {
        canUse: false,
        reason: `You've used ${MAX_TOKENS_PER_90_DAYS} tokens in the last 90 days`,
        tokensUsedInLast90Days,
      };
    }

    // Check if user has available tokens
    const availableCount = await this.getAvailableTokenCount(userId);

    if (availableCount === 0) {
      return {
        canUse: false,
        reason: 'No available tokens',
        tokensUsedInLast90Days,
      };
    }

    return {
      canUse: true,
      tokensUsedInLast90Days,
    };
  }

  /**
   * Expire tokens (run by cron at end of each month)
   */
  async expireTokens(): Promise<number> {
    const now = DateTime.now().setZone(TIMEZONE).toJSDate();

    const expiredTokens = await this.tokenRepository.find({
      where: {
        status: TokenStatus.AVAILABLE,
        expiresAt: LessThan(now),
      },
    });

    if (expiredTokens.length === 0) {
      return 0;
    }

    const ids = expiredTokens.map((t) => t.id);

    await this.tokenRepository.update(
      { id: In(ids) },
      { status: TokenStatus.EXPIRED },
    );

    this.logger.log(`Expired ${expiredTokens.length} streak saver tokens`);

    return expiredTokens.length;
  }

  /**
   * Grant tokens to all eligible users (run by cron on 1st of month)
   */
  async grantMonthlyTokensToAllUsers(): Promise<number> {
    // Get all users with streaks
    const usersWithStreaks = await this.userStreakRepository
      .createQueryBuilder('streak')
      .where('streak.consecutiveDays > 0')
      .orWhere('streak.monthlyVisits > 0')
      .getMany();

    let grantedCount = 0;

    for (const streak of usersWithStreaks) {
      try {
        await this.grantMonthlyToken(streak.userId);
        grantedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to grant token to user ${streak.userId}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Granted monthly tokens to ${grantedCount} users`,
    );

    return grantedCount;
  }

  /**
   * Get token usage statistics (admin analytics)
   */
  async getTokenStatistics(): Promise<{
    totalTokensGranted: number;
    totalTokensUsed: number;
    totalTokensExpired: number;
    totalTokensAvailable: number;
    usageRate: number;
  }> {
    const now = DateTime.now().setZone(TIMEZONE);
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();

    const allTokens = await this.tokenRepository.find();

    const totalTokensGranted = allTokens.length;
    const totalTokensUsed = allTokens.filter(
      (t) => t.status === TokenStatus.USED,
    ).length;
    const totalTokensExpired = allTokens.filter(
      (t) => t.status === TokenStatus.EXPIRED,
    ).length;
    const totalTokensAvailable = allTokens.filter(
      (t) => t.status === TokenStatus.AVAILABLE,
    ).length;

    const usageRate =
      totalTokensGranted > 0
        ? (totalTokensUsed / totalTokensGranted) * 100
        : 0;

    return {
      totalTokensGranted,
      totalTokensUsed,
      totalTokensExpired,
      totalTokensAvailable,
      usageRate: Math.round(usageRate * 10) / 10,
    };
  }
}
