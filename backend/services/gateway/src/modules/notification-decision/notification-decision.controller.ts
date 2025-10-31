import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotificationDecisionService,
  DeliveryDecision,
  NotificationRequest,
  NotificationPreferences,
  NotificationChannel,
} from './notification-decision.service';

@Controller('notifications')
export class NotificationDecisionController {
  constructor(
    private readonly notificationDecisionService: NotificationDecisionService,
  ) {}

  /**
   * Decide if notification should be sent
   * POST /api/v1/notifications/decide
   */
  @Post('decide')
  @UseGuards(JwtAuthGuard)
  async decideDelivery(
    @Body() request: NotificationRequest,
  ): Promise<{
    success: boolean;
    decision: DeliveryDecision;
  }> {
    // TODO: Add admin role check

    const decision = await this.notificationDecisionService.decideDelivery(request);

    return {
      success: true,
      decision,
    };
  }

  /**
   * Get user's notification preferences
   * GET /api/v1/notifications/preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    preferences: NotificationPreferences;
  }> {
    const userId = req.user.userId;

    const preferences = this.notificationDecisionService.getUserPreferences(userId);

    return {
      success: true,
      preferences,
    };
  }

  /**
   * Update user's notification preferences
   * PUT /api/v1/notifications/preferences
   */
  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Req() req: any,
    @Body() updates: Partial<NotificationPreferences>,
  ): Promise<{
    success: boolean;
    preferences: NotificationPreferences;
  }> {
    const userId = req.user.userId;

    const preferences = await this.notificationDecisionService.updatePreferences(
      userId,
      updates,
    );

    return {
      success: true,
      preferences,
    };
  }

  /**
   * Record notification delivery
   * POST /api/v1/notifications/record-delivery
   */
  @Post('record-delivery')
  @UseGuards(JwtAuthGuard)
  async recordDelivery(
    @Body() body: {
      userId: string;
      channel: NotificationChannel;
      type: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check or service authentication

    await this.notificationDecisionService.recordDelivery(
      body.userId,
      body.channel,
      body.type,
    );

    return {
      success: true,
      message: 'Delivery recorded',
    };
  }

  /**
   * Record notification interaction
   * POST /api/v1/notifications/record-interaction
   */
  @Post('record-interaction')
  @UseGuards(JwtAuthGuard)
  async recordInteraction(
    @Req() req: any,
    @Body() body: {
      notificationId: string;
      action: 'opened' | 'clicked';
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const userId = req.user.userId;

    await this.notificationDecisionService.recordInteraction(
      userId,
      body.notificationId,
      body.action,
    );

    return {
      success: true,
      message: 'Interaction recorded',
    };
  }

  /**
   * Get delivery statistics
   * GET /api/v1/notifications/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDeliveryStats(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    stats: {
      totalSent: number;
      last24Hours: number;
      last7Days: number;
      byChannel: Record<NotificationChannel, number>;
      openRate: number;
      clickRate: number;
    };
  }> {
    const userId = req.user.userId;

    const stats = await this.notificationDecisionService.getDeliveryStats(userId);

    return {
      success: true,
      stats,
    };
  }

  /**
   * Clear delivery history (testing)
   * POST /api/v1/notifications/clear-history
   */
  @Post('clear-history')
  @UseGuards(JwtAuthGuard)
  async clearHistory(
    @Req() req: any,
    @Query('userId') userId?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Use current user if no userId provided
    const targetUserId = userId || req.user.userId;

    await this.notificationDecisionService.clearHistory(targetUserId);

    return {
      success: true,
      message: 'History cleared',
    };
  }

  /**
   * Test notification decision without sending
   * POST /api/v1/notifications/test-decision
   */
  @Post('test-decision')
  @UseGuards(JwtAuthGuard)
  async testDecision(
    @Body() request: NotificationRequest,
  ): Promise<{
    success: boolean;
    decision: DeliveryDecision;
    userPreferences: NotificationPreferences;
    deliveryHistory: {
      last24Hours: number;
      last7Days: number;
    };
  }> {
    // TODO: Add admin role check

    const decision = await this.notificationDecisionService.decideDelivery(request);
    const preferences = this.notificationDecisionService.getUserPreferences(request.userId);
    const stats = await this.notificationDecisionService.getDeliveryStats(request.userId);

    return {
      success: true,
      decision,
      userPreferences: preferences,
      deliveryHistory: {
        last24Hours: stats.last24Hours,
        last7Days: stats.last7Days,
      },
    };
  }

  /**
   * Opt out of specific notification type
   * POST /api/v1/notifications/opt-out
   */
  @Post('opt-out')
  @UseGuards(JwtAuthGuard)
  async optOut(
    @Req() req: any,
    @Body() body: {
      type: 'marketing' | 'reminders' | 'all';
    },
  ): Promise<{
    success: boolean;
    preferences: NotificationPreferences;
  }> {
    const userId = req.user.userId;

    const updates: Partial<NotificationPreferences> = {};

    switch (body.type) {
      case 'marketing':
        updates.marketingEnabled = false;
        break;
      case 'reminders':
        updates.reminderEnabled = false;
        break;
      case 'all':
        updates.pushEnabled = false;
        updates.emailEnabled = false;
        updates.smsEnabled = false;
        updates.marketingEnabled = false;
        updates.reminderEnabled = false;
        break;
    }

    const preferences = await this.notificationDecisionService.updatePreferences(
      userId,
      updates,
    );

    return {
      success: true,
      preferences,
    };
  }

  /**
   * Opt in to notifications
   * POST /api/v1/notifications/opt-in
   */
  @Post('opt-in')
  @UseGuards(JwtAuthGuard)
  async optIn(
    @Req() req: any,
    @Body() body: {
      channel: NotificationChannel;
    },
  ): Promise<{
    success: boolean;
    preferences: NotificationPreferences;
  }> {
    const userId = req.user.userId;

    const updates: Partial<NotificationPreferences> = {};

    switch (body.channel) {
      case NotificationChannel.PUSH:
        updates.pushEnabled = true;
        break;
      case NotificationChannel.EMAIL:
        updates.emailEnabled = true;
        break;
      case NotificationChannel.SMS:
        updates.smsEnabled = true;
        break;
    }

    const preferences = await this.notificationDecisionService.updatePreferences(
      userId,
      updates,
    );

    return {
      success: true,
      preferences,
    };
  }

  /**
   * Set quiet hours
   * POST /api/v1/notifications/quiet-hours
   */
  @Post('quiet-hours')
  @UseGuards(JwtAuthGuard)
  async setQuietHours(
    @Req() req: any,
    @Body() body: {
      start: number; // 0-23
      end: number; // 0-23
      timezone?: string;
    },
  ): Promise<{
    success: boolean;
    preferences: NotificationPreferences;
  }> {
    const userId = req.user.userId;

    const preferences = await this.notificationDecisionService.updatePreferences(userId, {
      quietHoursStart: body.start,
      quietHoursEnd: body.end,
      timezone: body.timezone,
    });

    return {
      success: true,
      preferences,
    };
  }
}
