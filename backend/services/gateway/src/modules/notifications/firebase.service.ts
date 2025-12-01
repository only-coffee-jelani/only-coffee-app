import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Message, MulticastMessage } from 'firebase-admin/messaging';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Firebase Service
 * Handles Firebase Admin SDK initialization and push notification sending
 * Enterprise-level implementation with proper error handling and logging
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK on module initialization
   */
  async onModuleInit() {
    try {
      // Check if already initialized
      if (admin.apps.length > 0) {
        this.logger.log('Firebase Admin SDK already initialized');
        this.initialized = true;
        return;
      }

      // Path to service account key
      const serviceAccountPath = path.join(
        process.cwd(),
        '..',
        '..',
        'only-coffee-us-firebase-adminsdk-fbsvc-9780c09fd4.json',
      );

      // Check if service account file exists
      if (!fs.existsSync(serviceAccountPath)) {
        this.logger.warn(
          `Firebase service account file not found at: ${serviceAccountPath}`,
        );
        this.logger.warn(
          'Push notifications will not work. Please add the Firebase service account JSON file.',
        );
        return;
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        projectId: 'only-coffee-us',
      });

      this.initialized = true;
      this.logger.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Firebase not initialized',
      };
    }

    try {
      const message: Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'order_updates',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      this.logger.log(
        `✅ Push notification sent successfully. Message ID: ${response}`,
      );

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send push notification:`, error);

      // Handle specific error cases
      if (error.code === 'messaging/invalid-registration-token') {
        return {
          success: false,
          error: 'Invalid or expired token',
        };
      } else if (error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'Token not registered',
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>,
  ): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    responses?: any[];
  }> {
    if (!this.initialized) {
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
      };
    }

    if (tokens.length === 0) {
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
      };
    }

    try {
      const message: MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'order_updates',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `✅ Multicast notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send multicast notification:`, error);

      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
      };
    }
  }
}

