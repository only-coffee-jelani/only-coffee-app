import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Run nightly at midnight CST to mark expired coupons
   * Cron format: second, minute, hour, day, month, day of week
   * This runs at midnight in the server's timezone (should be set to America/Chicago)
   */
  @Cron('0 0 0 * * *', {
    name: 'mark-expired-coupons',
    timeZone: 'America/Chicago',
  })
  async handleCouponExpiry() {
    this.logger.log('Running nightly coupon expiry job...');

    try {
      const expiredCount = await this.couponsService.markExpiredCoupons();
      this.logger.log(
        `Coupon expiry job completed. Marked ${expiredCount} coupons as expired.`,
      );
    } catch (error) {
      this.logger.error('Error in coupon expiry job:', error);
    }
  }

  /**
   * Run every hour to check for coupons expiring in 48 hours
   * Send notifications to users
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'check-expiring-coupons-48h',
    timeZone: 'America/Chicago',
  })
  async checkCouponsExpiring48Hours() {
    this.logger.log('Checking for coupons expiring in 48 hours...');

    try {
      // Note: getCouponsExpiringSoon method doesn't exist in CouponsService
      // TODO: Implement this method or remove this task
      const coupons = []; // await this.couponsService.getCouponsExpiringSoon(48);

      if (coupons.length > 0) {
        this.logger.log(
          `Found ${coupons.length} coupons expiring in 48 hours. Sending notifications...`,
        );

        // Send expiry reminder notifications
        for (const coupon of coupons) {
          if (coupon.userId) {
            await this.notificationsService.sendCouponExpiryReminder(
              coupon.userId,
              coupon.label,
              coupon.id,
              48,
            );
          }
        }

        this.logger.log(`Sent ${coupons.length} expiry reminder notifications`);
      }
    } catch (error) {
      this.logger.error('Error checking 48h expiring coupons:', error);
    }
  }

  /**
   * Run every hour to check for coupons expiring today
   * Send final reminder notifications
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'check-expiring-coupons-today',
    timeZone: 'America/Chicago',
  })
  async checkCouponsExpiringToday() {
    this.logger.log('Checking for coupons expiring today...');

    try {
      // Note: getCouponsExpiringSoon method doesn't exist in CouponsService
      // TODO: Implement this method or remove this task
      const coupons = []; // await this.couponsService.getCouponsExpiringSoon(12); // Last 12 hours

      if (coupons.length > 0) {
        this.logger.log(
          `Found ${coupons.length} coupons expiring today. Sending final reminders...`,
        );

        // Send final expiry reminder notifications
        for (const coupon of coupons) {
          if (coupon.userId) {
            await this.notificationsService.sendCouponExpiryReminder(
              coupon.userId,
              coupon.label,
              coupon.id,
              12,
            );
          }
        }

        this.logger.log(`Sent ${coupons.length} final expiry reminders`);
      }
    } catch (error) {
      this.logger.error('Error checking today expiring coupons:', error);
    }
  }
}
