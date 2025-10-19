import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreakTrackingService } from './streak-tracking.service';
import { StreakRewardService } from './streak-reward.service';
import { StreakSaverService } from './streak-saver.service';
import { TierManagementService } from './tier-management.service';
import { AnniversaryService } from './anniversary.service';

@Injectable()
export class LoyaltyTasksService {
  private readonly logger = new Logger(LoyaltyTasksService.name);

  constructor(
    private readonly streakTrackingService: StreakTrackingService,
    private readonly streakRewardService: StreakRewardService,
    private readonly streakSaverService: StreakSaverService,
    private readonly tierManagementService: TierManagementService,
    private readonly anniversaryService: AnniversaryService,
  ) {}

  /**
   * Reset monthly counters (monthly visits, monthly points)
   * Runs on 1st of every month at 1:00 AM CST
   */
  @Cron('0 1 1 * *', {
    timeZone: 'America/Chicago',
  })
  async handleMonthlyReset() {
    this.logger.log('Starting monthly reset task...');

    try {
      const resetCount = await this.streakTrackingService.resetMonthlyCounters();
      this.logger.log(`Monthly reset complete: ${resetCount} users reset`);
    } catch (error) {
      this.logger.error('Error during monthly reset:', error);
    }
  }

  /**
   * Grant monthly streak saver tokens
   * Runs on 1st of every month at 2:00 AM CST (after monthly reset)
   */
  @Cron('0 2 1 * *', {
    timeZone: 'America/Chicago',
  })
  async handleMonthlyTokenGrants() {
    this.logger.log('Starting monthly token grant task...');

    try {
      const grantedCount = await this.streakSaverService.grantMonthlyTokensToAllUsers();
      this.logger.log(`Monthly token grants complete: ${grantedCount} tokens granted`);
    } catch (error) {
      this.logger.error('Error during monthly token grants:', error);
    }
  }

  /**
   * Expire old streak saver tokens
   * Runs on last day of every month at 11:00 PM CST
   */
  @Cron('0 23 28-31 * *', {
    timeZone: 'America/Chicago',
  })
  async handleTokenExpiry() {
    this.logger.log('Starting token expiry task...');

    try {
      const expiredCount = await this.streakSaverService.expireTokens();
      this.logger.log(`Token expiry complete: ${expiredCount} tokens expired`);
    } catch (error) {
      this.logger.error('Error during token expiry:', error);
    }
  }

  /**
   * Evaluate all user tiers
   * Runs daily at 3:00 AM CST
   */
  @Cron('0 3 * * *', {
    timeZone: 'America/Chicago',
  })
  async handleDailyTierEvaluation() {
    this.logger.log('Starting daily tier evaluation task...');

    try {
      const results = await this.tierManagementService.evaluateAllUserTiers();
      this.logger.log(
        `Tier evaluation complete: ${results.totalEvaluated} evaluated, ` +
        `${results.totalChanged} changed (${results.upgrades} upgrades, ${results.downgrades} downgrades)`,
      );
    } catch (error) {
      this.logger.error('Error during tier evaluation:', error);
    }
  }

  /**
   * Check and grant anniversary rewards
   * Runs daily at 6:00 AM CST
   */
  @Cron('0 6 * * *', {
    timeZone: 'America/Chicago',
  })
  async handleDailyAnniversaryCheck() {
    this.logger.log('Starting daily anniversary check task...');

    try {
      const grantedCount = await this.anniversaryService.checkAndGrantAnniversaryRewards();
      this.logger.log(`Anniversary check complete: ${grantedCount} rewards granted`);
    } catch (error) {
      this.logger.error('Error during anniversary check:', error);
    }
  }

  /**
   * Seed default rewards on app startup (run once)
   * This ensures default rewards and perks exist
   */
  async onModuleInit() {
    this.logger.log('Initializing loyalty system...');

    try {
      // Seed default streak rewards
      await this.streakRewardService.seedDefaultRewards();
      this.logger.log('Default streak rewards seeded');

      // Seed default tier perks
      await this.tierManagementService.seedDefaultTierPerks();
      this.logger.log('Default tier perks seeded');

      this.logger.log('Loyalty system initialization complete');
    } catch (error) {
      this.logger.error('Error during loyalty system initialization:', error);
    }
  }

  /**
   * Manual trigger for monthly reset (admin tool)
   */
  async triggerMonthlyReset(): Promise<number> {
    this.logger.log('Manually triggered monthly reset');
    return await this.streakTrackingService.resetMonthlyCounters();
  }

  /**
   * Manual trigger for token grants (admin tool)
   */
  async triggerTokenGrants(): Promise<number> {
    this.logger.log('Manually triggered token grants');
    return await this.streakSaverService.grantMonthlyTokensToAllUsers();
  }

  /**
   * Manual trigger for tier evaluation (admin tool)
   */
  async triggerTierEvaluation(): Promise<any> {
    this.logger.log('Manually triggered tier evaluation');
    return await this.tierManagementService.evaluateAllUserTiers();
  }

  /**
   * Manual trigger for anniversary check (admin tool)
   */
  async triggerAnniversaryCheck(): Promise<number> {
    this.logger.log('Manually triggered anniversary check');
    return await this.anniversaryService.checkAndGrantAnniversaryRewards();
  }

  /**
   * Get task execution status
   */
  getTaskStatus() {
    return {
      tasks: [
        {
          name: 'Monthly Reset',
          schedule: '1st of month, 1:00 AM CST',
          description: 'Reset monthly visits and points',
        },
        {
          name: 'Monthly Token Grants',
          schedule: '1st of month, 2:00 AM CST',
          description: 'Grant streak saver tokens',
        },
        {
          name: 'Token Expiry',
          schedule: 'Last day of month, 11:00 PM CST',
          description: 'Expire unused tokens',
        },
        {
          name: 'Daily Tier Evaluation',
          schedule: 'Daily, 3:00 AM CST',
          description: 'Evaluate and update user tiers',
        },
        {
          name: 'Daily Anniversary Check',
          schedule: 'Daily, 6:00 AM CST',
          description: 'Grant anniversary rewards',
        },
      ],
    };
  }
}
