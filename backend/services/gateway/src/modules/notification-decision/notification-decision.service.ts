import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/database/entities';
import { FeatureStoreService } from '../features/feature-store.service';

/**
 * Notification channels
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

/**
 * Notification priority
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification delivery decision
 */
export interface DeliveryDecision {
  shouldSend: boolean;
  reason: string;

  // If shouldSend = true
  channel?: NotificationChannel;
  scheduledTime?: Date; // When to send (now or later)
  priority?: NotificationPriority;

  // If shouldSend = false
  suppressionReason?: string;
  retryAfter?: Date; // When to retry
}

/**
 * Notification request
 */
export interface NotificationRequest {
  userId: string;
  type: string; // e.g., 'promotion', 'order_update', 'streak_reminder'
  title: string;
  message: string;
  data?: any; // Additional payload

  // Preferences
  preferredChannel?: NotificationChannel;
  priority?: NotificationPriority;
  expiresAt?: Date;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;

  // Channel opt-ins
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;

  // Category preferences
  marketingEnabled: boolean;
  transactionalEnabled: boolean; // Order updates, etc.
  reminderEnabled: boolean; // Streaks, cart reminders

  // Quiet hours (UTC)
  quietHoursStart?: number; // Hour 0-23
  quietHoursEnd?: number; // Hour 0-23

  // Frequency preferences
  maxPerDay?: number;
  maxPerWeek?: number;

  // Timezone
  timezone?: string; // e.g., 'America/New_York'
}

/**
 * Notification delivery record
 */
interface DeliveryRecord {
  userId: string;
  channel: NotificationChannel;
  type: string;
  sentAt: Date;
  opened?: boolean;
  clicked?: boolean;
}

@Injectable()
export class NotificationDecisionService {
  private readonly logger = new Logger(NotificationDecisionService.name);

  // In-memory storage (would move to Redis/DB)
  private deliveryHistory = new Map<string, DeliveryRecord[]>();
  private userPreferences = new Map<string, NotificationPreferences>();

  // Global rate limits
  private readonly MAX_PUSH_PER_DAY = 5;
  private readonly MAX_PUSH_PER_WEEK = 20;
  private readonly MAX_EMAIL_PER_DAY = 3;
  private readonly MAX_EMAIL_PER_WEEK = 10;
  private readonly MAX_SMS_PER_DAY = 1;
  private readonly MAX_SMS_PER_WEEK = 3;

  // Cooldown between notifications (minutes)
  private readonly MIN_COOLDOWN_MINUTES = 60; // 1 hour between notifications

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Initialize with default preferences
    this.initializeDefaultPreferences();
  }

  /**
   * Decide if and how to send a notification
   */
  async decideDelivery(request: NotificationRequest): Promise<DeliveryDecision> {
    const { userId, type, priority = NotificationPriority.MEDIUM } = request;

    // Get user preferences
    const preferences = this.getUserPreferences(userId);

    // Check if user has opted out of this notification type
    if (!this.isNotificationTypeAllowed(type, preferences)) {
      return {
        shouldSend: false,
        reason: 'User opted out of this notification type',
        suppressionReason: 'user_opt_out',
      };
    }

    // Check frequency caps
    const frequencyCheck = this.checkFrequencyCaps(userId, request);
    if (!frequencyCheck.allowed) {
      return {
        shouldSend: false,
        reason: frequencyCheck.reason || 'Frequency cap exceeded',
        suppressionReason: 'frequency_cap',
        retryAfter: frequencyCheck.retryAfter,
      };
    }

    // Check cooldown period
    const cooldownCheck = this.checkCooldown(userId);
    if (!cooldownCheck.allowed) {
      return {
        shouldSend: false,
        reason: 'Too soon since last notification',
        suppressionReason: 'cooldown',
        retryAfter: cooldownCheck.retryAfter,
      };
    }

    // Select best channel
    const channel = this.selectChannel(request, preferences);

    if (!channel) {
      return {
        shouldSend: false,
        reason: 'No available channels',
        suppressionReason: 'no_channels',
      };
    }

    // Determine optimal send time
    const sendTime = this.determineOptimalSendTime(userId, preferences, priority);

    // If in quiet hours, schedule for later
    if (this.isInQuietHours(preferences)) {
      const nextAvailableTime = this.getNextAvailableTime(preferences);

      return {
        shouldSend: true,
        reason: 'Scheduled for after quiet hours',
        channel,
        scheduledTime: nextAvailableTime,
        priority,
      };
    }

    return {
      shouldSend: true,
      reason: 'All checks passed',
      channel,
      scheduledTime: sendTime,
      priority,
    };
  }

  /**
   * Check if notification type is allowed based on preferences
   */
  private isNotificationTypeAllowed(
    type: string,
    preferences: NotificationPreferences,
  ): boolean {
    // Transactional notifications (order updates) always allowed
    if (type.includes('order') || type.includes('payment')) {
      return preferences.transactionalEnabled;
    }

    // Marketing notifications (promotions, offers)
    if (type.includes('promotion') || type.includes('offer')) {
      return preferences.marketingEnabled;
    }

    // Reminders (streaks, cart)
    if (type.includes('reminder') || type.includes('streak')) {
      return preferences.reminderEnabled;
    }

    return true; // Default: allow
  }

  /**
   * Check frequency caps for user
   */
  private checkFrequencyCaps(
    userId: string,
    request: NotificationRequest,
  ): { allowed: boolean; reason?: string; retryAfter?: Date } {
    const channel = request.preferredChannel || NotificationChannel.PUSH;
    const history = this.getDeliveryHistory(userId, channel);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count recent deliveries
    const last24Hours = history.filter((r) => r.sentAt >= oneDayAgo);
    const last7Days = history.filter((r) => r.sentAt >= oneWeekAgo);

    // Get user preferences
    const preferences = this.getUserPreferences(userId);
    const maxPerDay = preferences.maxPerDay || this.getDefaultDailyLimit(channel);
    const maxPerWeek = preferences.maxPerWeek || this.getDefaultWeeklyLimit(channel);

    // Check daily limit
    if (last24Hours.length >= maxPerDay) {
      // Find oldest notification and calculate retry time
      const oldestInDay = last24Hours.reduce((oldest, current) =>
        current.sentAt < oldest.sentAt ? current : oldest
      );
      const retryAfter = new Date(oldestInDay.sentAt.getTime() + 24 * 60 * 60 * 1000);

      return {
        allowed: false,
        reason: `Daily limit reached (${last24Hours.length}/${maxPerDay})`,
        retryAfter,
      };
    }

    // Check weekly limit
    if (last7Days.length >= maxPerWeek) {
      const oldestInWeek = last7Days.reduce((oldest, current) =>
        current.sentAt < oldest.sentAt ? current : oldest
      );
      const retryAfter = new Date(oldestInWeek.sentAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        allowed: false,
        reason: `Weekly limit reached (${last7Days.length}/${maxPerWeek})`,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Check cooldown period between notifications
   */
  private checkCooldown(userId: string): {
    allowed: boolean;
    retryAfter?: Date;
  } {
    const history = this.deliveryHistory.get(userId) || [];

    if (history.length === 0) {
      return { allowed: true };
    }

    // Get most recent notification
    const mostRecent = history.reduce((latest, current) =>
      current.sentAt > latest.sentAt ? current : latest
    );

    const now = new Date();
    const minutesSince = (now.getTime() - mostRecent.sentAt.getTime()) / 1000 / 60;

    if (minutesSince < this.MIN_COOLDOWN_MINUTES) {
      const retryAfter = new Date(
        mostRecent.sentAt.getTime() + this.MIN_COOLDOWN_MINUTES * 60 * 1000
      );

      return {
        allowed: false,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Select best notification channel
   */
  private selectChannel(
    request: NotificationRequest,
    preferences: NotificationPreferences,
  ): NotificationChannel | null {
    const { preferredChannel, priority } = request;

    // If preferred channel is specified and available, use it
    if (preferredChannel && this.isChannelAvailable(preferredChannel, preferences)) {
      return preferredChannel;
    }

    // Priority-based channel selection
    if (priority === NotificationPriority.URGENT) {
      // Urgent: Try SMS > Push > Email
      if (preferences.smsEnabled) return NotificationChannel.SMS;
      if (preferences.pushEnabled) return NotificationChannel.PUSH;
      if (preferences.emailEnabled) return NotificationChannel.EMAIL;
    }

    if (priority === NotificationPriority.HIGH) {
      // High: Try Push > SMS > Email
      if (preferences.pushEnabled) return NotificationChannel.PUSH;
      if (preferences.smsEnabled) return NotificationChannel.SMS;
      if (preferences.emailEnabled) return NotificationChannel.EMAIL;
    }

    // Medium/Low: Push > Email > In-app
    if (preferences.pushEnabled) return NotificationChannel.PUSH;
    if (preferences.emailEnabled) return NotificationChannel.EMAIL;
    return NotificationChannel.IN_APP; // Always available

    return null;
  }

  /**
   * Check if channel is available for user
   */
  private isChannelAvailable(
    channel: NotificationChannel,
    preferences: NotificationPreferences,
  ): boolean {
    switch (channel) {
      case NotificationChannel.PUSH:
        return preferences.pushEnabled;
      case NotificationChannel.EMAIL:
        return preferences.emailEnabled;
      case NotificationChannel.SMS:
        return preferences.smsEnabled;
      case NotificationChannel.IN_APP:
        return true; // Always available
      default:
        return false;
    }
  }

  /**
   * Determine optimal send time based on user behavior
   */
  private determineOptimalSendTime(
    userId: string,
    preferences: NotificationPreferences,
    priority: NotificationPriority,
  ): Date {
    // Urgent notifications: send immediately
    if (priority === NotificationPriority.URGENT || priority === NotificationPriority.HIGH) {
      return new Date();
    }

    // Check if in quiet hours
    if (this.isInQuietHours(preferences)) {
      return this.getNextAvailableTime(preferences);
    }

    // TODO: Use ML to predict optimal send time based on user engagement patterns
    // For now, send immediately
    return new Date();
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getUTCHours(); // Use UTC for consistency

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentHour >= start || currentHour < end;
    }

    return currentHour >= start && currentHour < end;
  }

  /**
   * Get next available time after quiet hours
   */
  private getNextAvailableTime(preferences: NotificationPreferences): Date {
    if (!preferences.quietHoursEnd) {
      return new Date();
    }

    const now = new Date();
    const nextAvailable = new Date(now);

    // Set to end of quiet hours
    nextAvailable.setUTCHours(preferences.quietHoursEnd, 0, 0, 0);

    // If that's in the past, add a day
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }

    return nextAvailable;
  }

  /**
   * Record notification delivery
   */
  async recordDelivery(
    userId: string,
    channel: NotificationChannel,
    type: string,
  ): Promise<void> {
    const record: DeliveryRecord = {
      userId,
      channel,
      type,
      sentAt: new Date(),
    };

    const history = this.deliveryHistory.get(userId) || [];
    history.push(record);

    // Keep only last 100 records per user
    if (history.length > 100) {
      history.shift();
    }

    this.deliveryHistory.set(userId, history);

    this.logger.log(`Recorded delivery: ${type} via ${channel} to user ${userId}`);
  }

  /**
   * Record notification interaction (open, click)
   */
  async recordInteraction(
    userId: string,
    notificationId: string,
    action: 'opened' | 'clicked',
  ): Promise<void> {
    // TODO: Find notification and update interaction
    this.logger.log(`User ${userId} ${action} notification ${notificationId}`);
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): NotificationPreferences {
    if (!this.userPreferences.has(userId)) {
      // Return default preferences
      return {
        userId,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        marketingEnabled: true,
        transactionalEnabled: true,
        reminderEnabled: true,
        quietHoursStart: 22, // 10 PM
        quietHoursEnd: 8, // 8 AM
        maxPerDay: this.MAX_PUSH_PER_DAY,
        maxPerWeek: this.MAX_PUSH_PER_WEEK,
      };
    }

    return this.userPreferences.get(userId)!;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...updates, userId };

    this.userPreferences.set(userId, updated);

    this.logger.log(`Updated preferences for user ${userId}`);

    return updated;
  }

  /**
   * Get delivery history for user
   */
  private getDeliveryHistory(
    userId: string,
    channel?: NotificationChannel,
  ): DeliveryRecord[] {
    const history = this.deliveryHistory.get(userId) || [];

    if (channel) {
      return history.filter((r) => r.channel === channel);
    }

    return history;
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(userId: string): Promise<{
    totalSent: number;
    last24Hours: number;
    last7Days: number;
    byChannel: Record<NotificationChannel, number>;
    openRate: number;
    clickRate: number;
  }> {
    const history = this.deliveryHistory.get(userId) || [];

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last24Hours = history.filter((r) => r.sentAt >= oneDayAgo);
    const last7Days = history.filter((r) => r.sentAt >= oneWeekAgo);

    const byChannel: Record<NotificationChannel, number> = {
      [NotificationChannel.PUSH]: 0,
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.IN_APP]: 0,
    };

    history.forEach((r) => {
      byChannel[r.channel]++;
    });

    const opened = history.filter((r) => r.opened).length;
    const clicked = history.filter((r) => r.clicked).length;

    return {
      totalSent: history.length,
      last24Hours: last24Hours.length,
      last7Days: last7Days.length,
      byChannel,
      openRate: history.length > 0 ? opened / history.length : 0,
      clickRate: history.length > 0 ? clicked / history.length : 0,
    };
  }

  /**
   * Get default daily limit for channel
   */
  private getDefaultDailyLimit(channel: NotificationChannel): number {
    switch (channel) {
      case NotificationChannel.PUSH:
        return this.MAX_PUSH_PER_DAY;
      case NotificationChannel.EMAIL:
        return this.MAX_EMAIL_PER_DAY;
      case NotificationChannel.SMS:
        return this.MAX_SMS_PER_DAY;
      case NotificationChannel.IN_APP:
        return 999; // Unlimited
      default:
        return this.MAX_PUSH_PER_DAY;
    }
  }

  /**
   * Get default weekly limit for channel
   */
  private getDefaultWeeklyLimit(channel: NotificationChannel): number {
    switch (channel) {
      case NotificationChannel.PUSH:
        return this.MAX_PUSH_PER_WEEK;
      case NotificationChannel.EMAIL:
        return this.MAX_EMAIL_PER_WEEK;
      case NotificationChannel.SMS:
        return this.MAX_SMS_PER_WEEK;
      case NotificationChannel.IN_APP:
        return 999; // Unlimited
      default:
        return this.MAX_PUSH_PER_WEEK;
    }
  }

  /**
   * Initialize default preferences
   */
  private initializeDefaultPreferences(): void {
    this.logger.log('Notification Decision Engine initialized');
  }

  /**
   * Clear delivery history for user (testing)
   */
  async clearHistory(userId: string): Promise<void> {
    this.deliveryHistory.delete(userId);
    this.logger.log(`Cleared delivery history for user ${userId}`);
  }
}
