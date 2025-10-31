import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/database/entities';
import { NotificationDecisionService, NotificationChannel, NotificationPriority } from '../notification-decision/notification-decision.service';

/**
 * Push notification provider
 */
export enum PushProvider {
  ONESIGNAL = 'onesignal',
  FCM = 'fcm',
  APNS = 'apns', // Apple Push Notification Service
}

/**
 * Device platform
 */
export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * Push notification payload
 */
export interface PushNotification {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>; // Custom data payload

  // Behavior
  priority?: NotificationPriority;
  badge?: number; // Badge count for iOS
  sound?: string; // Sound file name

  // Navigation
  deepLink?: string; // e.g., "app://promotions/123"
  launchUrl?: string; // Web URL fallback

  // Images
  imageUrl?: string;
  iconUrl?: string;

  // Actions
  buttons?: Array<{
    id: string;
    text: string;
    action?: string;
  }>;

  // Scheduling
  sendAt?: Date; // Schedule for future
  expiresAt?: Date; // Don't send after this time
}

/**
 * Device token
 */
export interface DeviceToken {
  userId: string;
  token: string;
  platform: DevicePlatform;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  registeredAt: Date;
  lastUsed?: Date;
}

/**
 * Push notification result
 */
export interface PushResult {
  success: boolean;
  notificationId?: string;
  recipientId?: string;
  error?: string;
  provider: PushProvider;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  // In-memory storage (would move to Redis/DB)
  private deviceTokens = new Map<string, DeviceToken[]>();

  // OneSignal configuration
  private readonly ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  private readonly ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
  private readonly ONESIGNAL_API_URL = 'https://onesignal.com/api/v1';

  // FCM configuration
  private readonly FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
  private readonly FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationDecisionService: NotificationDecisionService,
  ) {}

  /**
   * Send push notification to user
   * Uses notification decision engine to determine if/when to send
   */
  async sendNotification(notification: PushNotification): Promise<PushResult> {
    const { userId, title, message, priority = NotificationPriority.MEDIUM } = notification;

    // Use notification decision engine
    const decision = await this.notificationDecisionService.decideDelivery({
      userId,
      type: 'push_notification',
      title,
      message,
      data: notification.data,
      preferredChannel: NotificationChannel.PUSH,
      priority,
      expiresAt: notification.expiresAt,
    });

    if (!decision.shouldSend) {
      this.logger.log(
        `Push notification suppressed for user ${userId}: ${decision.reason}`,
      );

      return {
        success: false,
        error: decision.suppressionReason || decision.reason,
        provider: PushProvider.ONESIGNAL,
      };
    }

    // If scheduled for later, queue it
    if (decision.scheduledTime && decision.scheduledTime > new Date()) {
      this.logger.log(
        `Push notification scheduled for ${decision.scheduledTime} (user ${userId})`,
      );

      // TODO: Add to job queue for later delivery
      return {
        success: true,
        notificationId: `scheduled_${Date.now()}`,
        recipientId: userId,
        provider: PushProvider.ONESIGNAL,
      };
    }

    // Send immediately
    const result = await this.sendImmediately(notification);

    // Record delivery
    if (result.success) {
      await this.notificationDecisionService.recordDelivery(
        userId,
        NotificationChannel.PUSH,
        'push_notification',
      );
    }

    return result;
  }

  /**
   * Send push notification immediately (bypassing decision engine)
   */
  async sendImmediately(notification: PushNotification): Promise<PushResult> {
    const { userId } = notification;

    // Get user's device tokens
    const tokens = this.getDeviceTokens(userId);

    if (tokens.length === 0) {
      return {
        success: false,
        error: 'No device tokens registered for user',
        provider: PushProvider.ONESIGNAL,
      };
    }

    // Use OneSignal by default (free tier available)
    if (this.ONESIGNAL_APP_ID && this.ONESIGNAL_REST_API_KEY) {
      return this.sendViaOneSignal(notification, tokens);
    }

    // Fallback to FCM
    if (this.FCM_SERVER_KEY) {
      return this.sendViaFCM(notification, tokens);
    }

    return {
      success: false,
      error: 'No push notification provider configured',
      provider: PushProvider.ONESIGNAL,
    };
  }

  /**
   * Send via OneSignal
   */
  private async sendViaOneSignal(
    notification: PushNotification,
    tokens: DeviceToken[],
  ): Promise<PushResult> {
    const { title, message, data, imageUrl, buttons, deepLink, badge, sound } = notification;

    try {
      // OneSignal API payload
      const payload: any = {
        app_id: this.ONESIGNAL_APP_ID,
        include_external_user_ids: [notification.userId],
        headings: { en: title },
        contents: { en: message },
        data: data || {},
      };

      // Optional fields
      if (imageUrl) payload.big_picture = imageUrl;
      if (imageUrl) payload.ios_attachments = { image: imageUrl };
      if (deepLink) payload.url = deepLink;
      if (badge !== undefined) payload.ios_badgeType = 'SetTo';
      if (badge !== undefined) payload.ios_badgeCount = badge;
      if (sound) payload.ios_sound = sound;
      if (sound) payload.android_sound = sound;

      // Buttons/actions
      if (buttons && buttons.length > 0) {
        payload.buttons = buttons.map((btn) => ({
          id: btn.id,
          text: btn.text,
          icon: 'ic_menu_share',
        }));
      }

      // Priority
      if (notification.priority === NotificationPriority.HIGH ||
          notification.priority === NotificationPriority.URGENT) {
        payload.priority = 10; // High priority
      }

      // Make API request (simulated for now)
      this.logger.log(`Sending push via OneSignal to user ${notification.userId}`);
      this.logger.debug(`OneSignal payload: ${JSON.stringify(payload, null, 2)}`);

      // TODO: Actual HTTP request
      // const response = await fetch(`${this.ONESIGNAL_API_URL}/notifications`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Basic ${this.ONESIGNAL_REST_API_KEY}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

      // Simulated success
      return {
        success: true,
        notificationId: `onesignal_${Date.now()}`,
        recipientId: notification.userId,
        provider: PushProvider.ONESIGNAL,
      };
    } catch (error: any) {
      this.logger.error(`OneSignal send failed:`, error);

      return {
        success: false,
        error: error.message,
        provider: PushProvider.ONESIGNAL,
      };
    }
  }

  /**
   * Send via FCM (Firebase Cloud Messaging)
   */
  private async sendViaFCM(
    notification: PushNotification,
    tokens: DeviceToken[],
  ): Promise<PushResult> {
    const { title, message, data, imageUrl, deepLink } = notification;

    try {
      // FCM supports sending to multiple tokens at once
      const registrationTokens = tokens.map((t) => t.token);

      const payload: any = {
        registration_ids: registrationTokens,
        notification: {
          title,
          body: message,
          image: imageUrl,
          click_action: deepLink,
        },
        data: data || {},
      };

      // Priority
      if (notification.priority === NotificationPriority.HIGH ||
          notification.priority === NotificationPriority.URGENT) {
        payload.priority = 'high';
      }

      this.logger.log(`Sending push via FCM to ${tokens.length} devices`);
      this.logger.debug(`FCM payload: ${JSON.stringify(payload, null, 2)}`);

      // TODO: Actual HTTP request
      // const response = await fetch(this.FCM_API_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `key=${this.FCM_SERVER_KEY}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

      // Simulated success
      return {
        success: true,
        notificationId: `fcm_${Date.now()}`,
        recipientId: notification.userId,
        provider: PushProvider.FCM,
      };
    } catch (error: any) {
      this.logger.error(`FCM send failed:`, error);

      return {
        success: false,
        error: error.message,
        provider: PushProvider.FCM,
      };
    }
  }

  /**
   * Register device token
   */
  async registerDevice(deviceToken: Omit<DeviceToken, 'registeredAt'>): Promise<void> {
    const { userId, token, platform } = deviceToken;

    const tokens = this.deviceTokens.get(userId) || [];

    // Check if token already exists
    const existing = tokens.find((t) => t.token === token);

    if (existing) {
      // Update last used
      existing.lastUsed = new Date();
      existing.appVersion = deviceToken.appVersion;
      existing.osVersion = deviceToken.osVersion;
    } else {
      // Add new token
      tokens.push({
        ...deviceToken,
        registeredAt: new Date(),
        lastUsed: new Date(),
      });
    }

    this.deviceTokens.set(userId, tokens);

    this.logger.log(`Registered ${platform} device token for user ${userId}`);
  }

  /**
   * Unregister device token
   */
  async unregisterDevice(userId: string, token: string): Promise<void> {
    const tokens = this.deviceTokens.get(userId) || [];
    const filtered = tokens.filter((t) => t.token !== token);

    if (filtered.length < tokens.length) {
      this.deviceTokens.set(userId, filtered);
      this.logger.log(`Unregistered device token for user ${userId}`);
    }
  }

  /**
   * Get user's device tokens
   */
  getDeviceTokens(userId: string, platform?: DevicePlatform): DeviceToken[] {
    const tokens = this.deviceTokens.get(userId) || [];

    if (platform) {
      return tokens.filter((t) => t.platform === platform);
    }

    return tokens;
  }

  /**
   * Send bulk notifications (batch)
   */
  async sendBulkNotifications(
    notifications: PushNotification[],
  ): Promise<PushResult[]> {
    this.logger.log(`Sending bulk push notifications: ${notifications.length} total`);

    const results: PushResult[] = [];

    // Send in batches of 100 to avoid rate limits
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((notification) => this.sendNotification(notification)),
      );

      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(`Bulk send complete: ${successCount}/${notifications.length} succeeded`);

    return results;
  }

  /**
   * Send to specific segment
   */
  async sendToSegment(
    segment: string,
    notification: Omit<PushNotification, 'userId'>,
  ): Promise<{
    sent: number;
    failed: number;
    results: PushResult[];
  }> {
    this.logger.log(`Sending push notification to segment: ${segment}`);

    // Get users in segment (placeholder - would query from segmentation service)
    const userIds = Array.from(this.deviceTokens.keys()).slice(0, 100);

    const notifications: PushNotification[] = userIds.map((userId) => ({
      ...notification,
      userId,
    }));

    const results = await this.sendBulkNotifications(notifications);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      sent,
      failed,
      results,
    };
  }

  /**
   * Get push notification statistics
   */
  async getStats(): Promise<{
    totalDevices: number;
    devicesByPlatform: Record<DevicePlatform, number>;
    activeDevices: number; // Used in last 30 days
  }> {
    let totalDevices = 0;
    let activeDevices = 0;

    const devicesByPlatform: Record<DevicePlatform, number> = {
      [DevicePlatform.IOS]: 0,
      [DevicePlatform.ANDROID]: 0,
      [DevicePlatform.WEB]: 0,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.deviceTokens.forEach((tokens) => {
      tokens.forEach((token) => {
        totalDevices++;
        devicesByPlatform[token.platform]++;

        if (token.lastUsed && token.lastUsed >= thirtyDaysAgo) {
          activeDevices++;
        }
      });
    });

    return {
      totalDevices,
      devicesByPlatform,
      activeDevices,
    };
  }

  /**
   * Test notification (development only)
   */
  async sendTestNotification(userId: string): Promise<PushResult> {
    return this.sendNotification({
      userId,
      title: 'Test Notification',
      message: 'This is a test notification from Only Coffee!',
      priority: NotificationPriority.LOW,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
