import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/database/entities/user.entity';

// For now, we'll use a simple in-memory storage for device tokens
// In production, you'd want to store these in the database
interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  createdAt: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private deviceTokens: Map<string, DeviceToken> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    this.deviceTokens.set(userId, {
      userId,
      token,
      platform,
      createdAt: new Date(),
    });

    this.logger.log(
      `Device token registered for user ${userId} (${platform}): ${token.substring(0, 10)}...`,
    );

    // TODO: Save to database
    // await this.deviceTokenRepository.save({ userId, token, platform });
  }

  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(
    userId: string,
    notification: NotificationPayload,
  ): Promise<boolean> {
    const deviceToken = this.deviceTokens.get(userId);

    if (!deviceToken) {
      this.logger.warn(`No device token found for user ${userId}`);
      return false;
    }

    try {
      if (deviceToken.platform === 'ios') {
        await this.sendAPNSNotification(deviceToken.token, notification);
      } else {
        await this.sendFCMNotification(deviceToken.token, notification);
      }

      this.logger.log(
        `Push notification sent to user ${userId}: ${notification.title}`,
      );
      return true;
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

  // MARK: - Platform-specific implementations

  /**
   * Send notification via Apple Push Notification Service (APNS)
   */
  private async sendAPNSNotification(
    deviceToken: string,
    notification: NotificationPayload,
  ): Promise<void> {
    // TODO: Implement APNS integration
    // This would use the apn package or AWS SNS
    this.logger.debug(
      `[APNS] Would send notification to ${deviceToken.substring(0, 10)}...: ${notification.title}`,
    );

    /*
    Example implementation with apn package:

    const apnProvider = new apn.Provider({
      token: {
        key: process.env.APNS_KEY,
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    });

    const notification = new apn.Notification({
      alert: {
        title: notification.title,
        body: notification.body,
      },
      topic: 'com.onlycoffee.app',
      payload: notification.data,
      sound: 'default',
    });

    await apnProvider.send(notification, deviceToken);
    */
  }

  /**
   * Send notification via Firebase Cloud Messaging (FCM)
   */
  private async sendFCMNotification(
    deviceToken: string,
    notification: NotificationPayload,
  ): Promise<void> {
    // TODO: Implement FCM integration
    // This would use the firebase-admin package or AWS SNS
    this.logger.debug(
      `[FCM] Would send notification to ${deviceToken.substring(0, 10)}...: ${notification.title}`,
    );

    /*
    Example implementation with firebase-admin:

    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    });
    */
  }
}
