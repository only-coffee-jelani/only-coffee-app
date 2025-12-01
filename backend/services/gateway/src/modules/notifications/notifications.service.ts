import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserDevice } from '@shared/database/entities';
import { FirebaseService } from './firebase.service';

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Register a device token for push notifications
   * Saves to database with idempotency (upsert)
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    try {
      // Check if device already exists
      let device = await this.userDeviceRepository.findOne({
        where: { userId, pushToken: token },
      });

      if (device) {
        // Update existing device
        device.lastActiveAt = new Date();
        device.deviceType = platform;
        await this.userDeviceRepository.save(device);

        this.logger.log(
          `Device token updated for user ${userId} (${platform}): ${token.substring(0, 10)}...`,
        );
      } else {
        // Create new device
        device = this.userDeviceRepository.create({
          userId,
          pushToken: token,
          deviceType: platform,
          lastActiveAt: new Date(),
        });
        await this.userDeviceRepository.save(device);

        this.logger.log(
          `Device token registered for user ${userId} (${platform}): ${token.substring(0, 10)}...`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to register device token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   * Uses Firebase Admin SDK for both iOS and Android
   */
  async sendPushNotification(
    userId: string,
    notification: NotificationPayload,
  ): Promise<boolean> {
    try {
      // Get all devices for this user
      const devices = await this.userDeviceRepository.find({
        where: { userId },
      });

      if (devices.length === 0) {
        this.logger.warn(`No devices found for user ${userId}`);
        return false;
      }

      // Filter devices with valid push tokens
      const validDevices = devices.filter((d) => d.pushToken);

      if (validDevices.length === 0) {
        this.logger.warn(`No valid push tokens found for user ${userId}`);
        return false;
      }

      // Send to all devices
      let successCount = 0;
      for (const device of validDevices) {
        const result = await this.firebaseService.sendToDevice(
          device.pushToken!,
          {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
          },
          this.convertDataToStrings(notification.data),
        );

        if (result.success) {
          successCount++;
        } else if (
          result.error === 'Invalid or expired token' ||
          result.error === 'Token not registered'
        ) {
          // Remove invalid token
          await this.userDeviceRepository.remove(device);
          this.logger.log(
            `Removed invalid device token for user ${userId}: ${device.pushToken?.substring(0, 10)}...`,
          );
        }
      }

      this.logger.log(
        `Push notification sent to ${successCount}/${validDevices.length} devices for user ${userId}: ${notification.title}`,
      );

      return successCount > 0;
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendBulkPushNotifications(
    userIds: string[],
    notification: NotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendPushNotification(userId, notification)),
    );

    const success = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    const failed = results.length - success;

    this.logger.log(
      `Bulk push notification sent. Success: ${success}, Failed: ${failed}`,
    );

    return { success, failed };
  }

  /**
   * Send coupon expiry reminder notification
   */
  async sendCouponExpiryReminder(
    userId: string,
    couponLabel: string,
    couponId: string,
    hoursUntilExpiry: number,
  ): Promise<boolean> {
    const title =
      hoursUntilExpiry <= 24
        ? 'Coupon Expiring Soon!'
        : 'Reminder: Coupon Expires in 48 Hours';

    const body =
      hoursUntilExpiry <= 24
        ? `Your "${couponLabel}" expires today! Use it before it's gone.`
        : `Your "${couponLabel}" expires in 2 days. Don't miss out!`;

    return await this.sendPushNotification(userId, {
      title,
      body,
      data: {
        type: 'coupon_expiring',
        couponId,
        hoursUntilExpiry: hoursUntilExpiry.toString(),
      },
    });
  }

  /**
   * Send coupon granted notification
   */
  async sendCouponGrantedNotification(
    userId: string,
    couponLabel: string,
    couponId: string,
  ): Promise<boolean> {
    return await this.sendPushNotification(userId, {
      title: 'New Coupon Available!',
      body: `You've received a new coupon: ${couponLabel}`,
      data: {
        type: 'coupon_granted',
        couponId,
      },
    });
  }

  /**
   * Send order status update notification
   */
  async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
  ): Promise<boolean> {
    const statusMessages: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: 'Order Confirmed!',
        body: 'Your order has been confirmed and is being prepared.',
      },
      in_progress: {
        title: 'Order in Progress',
        body: 'Your order is being prepared.',
      },
      ready: {
        title: 'Order Ready!',
        body: 'Your order is ready for pickup!',
      },
      completed: {
        title: 'Order Completed',
        body: 'Thanks for your order! Enjoy your coffee.',
      },
    };

    const message = statusMessages[status];
    if (!message) {
      return false;
    }

    return await this.sendPushNotification(userId, {
      ...message,
      data: {
        type: 'order_status',
        orderId,
        status,
      },
    });
  }

  // MARK: - Helper methods

  /**
   * Convert data object to strings (Firebase requirement)
   */
  private convertDataToStrings(
    data?: Record<string, any>,
  ): Record<string, string> | undefined {
    if (!data) return undefined;

    const stringData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    return stringData;
  }
}
