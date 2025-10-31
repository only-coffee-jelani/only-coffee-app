import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PushNotificationService,
  PushNotification,
  DeviceToken,
  DevicePlatform,
  PushResult,
} from './push-notification.service';

@Controller('push')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Register device for push notifications
   * POST /api/v1/push/register
   */
  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerDevice(
    @Req() req: any,
    @Body() body: {
      token: string;
      platform: DevicePlatform;
      appVersion?: string;
      deviceModel?: string;
      osVersion?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const userId = req.user.userId;

    await this.pushNotificationService.registerDevice({
      userId,
      token: body.token,
      platform: body.platform,
      appVersion: body.appVersion,
      deviceModel: body.deviceModel,
      osVersion: body.osVersion,
    });

    return {
      success: true,
      message: 'Device registered for push notifications',
    };
  }

  /**
   * Unregister device
   * DELETE /api/v1/push/register (using POST for now)
   */
  @Post('unregister')
  @UseGuards(JwtAuthGuard)
  async unregisterDevice(
    @Req() req: any,
    @Body() body: { token: string },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const userId = req.user.userId;

    await this.pushNotificationService.unregisterDevice(userId, body.token);

    return {
      success: true,
      message: 'Device unregistered',
    };
  }

  /**
   * Get user's registered devices
   * GET /api/v1/push/devices
   */
  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getDevices(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    devices: DeviceToken[];
    count: number;
  }> {
    const userId = req.user.userId;

    const devices = this.pushNotificationService.getDeviceTokens(userId);

    return {
      success: true,
      devices,
      count: devices.length,
    };
  }

  /**
   * Send push notification (admin)
   * POST /api/v1/push/send
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendNotification(
    @Body() notification: PushNotification,
  ): Promise<{
    success: boolean;
    result: PushResult;
  }> {
    // TODO: Add admin role check

    const result = await this.pushNotificationService.sendNotification(notification);

    return {
      success: result.success,
      result,
    };
  }

  /**
   * Send bulk notifications (admin)
   * POST /api/v1/push/send-bulk
   */
  @Post('send-bulk')
  @UseGuards(JwtAuthGuard)
  async sendBulkNotifications(
    @Body() body: {
      notifications: PushNotification[];
    },
  ): Promise<{
    success: boolean;
    results: PushResult[];
    summary: {
      total: number;
      sent: number;
      failed: number;
    };
  }> {
    // TODO: Add admin role check

    const results = await this.pushNotificationService.sendBulkNotifications(
      body.notifications,
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        sent,
        failed,
      },
    };
  }

  /**
   * Send to user segment (admin)
   * POST /api/v1/push/send-to-segment
   */
  @Post('send-to-segment')
  @UseGuards(JwtAuthGuard)
  async sendToSegment(
    @Body() body: {
      segment: string;
      title: string;
      message: string;
      data?: any;
      deepLink?: string;
      imageUrl?: string;
    },
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
  }> {
    // TODO: Add admin role check

    const result = await this.pushNotificationService.sendToSegment(body.segment, {
      title: body.title,
      message: body.message,
      data: body.data,
      deepLink: body.deepLink,
      imageUrl: body.imageUrl,
    });

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
    };
  }

  /**
   * Get push notification statistics (admin)
   * GET /api/v1/push/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(): Promise<{
    success: boolean;
    stats: {
      totalDevices: number;
      devicesByPlatform: Record<DevicePlatform, number>;
      activeDevices: number;
    };
  }> {
    // TODO: Add admin role check

    const stats = await this.pushNotificationService.getStats();

    return {
      success: true,
      stats,
    };
  }

  /**
   * Send test notification
   * POST /api/v1/push/test
   */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTestNotification(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    result: PushResult;
  }> {
    const userId = req.user.userId;

    const result = await this.pushNotificationService.sendTestNotification(userId);

    return {
      success: result.success,
      result,
    };
  }

  /**
   * Send notification immediately (bypass decision engine)
   * POST /api/v1/push/send-immediate
   */
  @Post('send-immediate')
  @UseGuards(JwtAuthGuard)
  async sendImmediate(
    @Body() notification: PushNotification,
  ): Promise<{
    success: boolean;
    result: PushResult;
  }> {
    // TODO: Add admin role check

    const result = await this.pushNotificationService.sendImmediately(notification);

    return {
      success: result.success,
      result,
    };
  }
}
