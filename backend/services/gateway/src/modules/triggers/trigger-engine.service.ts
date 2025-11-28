import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserEvent } from '@shared/database/entities';
import { FeatureStoreService } from '../features/feature-store.service';
import { SegmentationService } from '../segmentation/segmentation.service';
import { ChurnPredictionService } from '../churn/churn-prediction.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { ContextualBanditService, BanditContext } from '../bandit/contextual-bandit.service';
import { WeatherService } from '../weather/weather.service';

/**
 * Trigger types
 */
export enum TriggerType {
  // Streak-based
  STREAK_MILESTONE = 'streak_milestone', // Hit 3, 7, 14, 30 day streak
  STREAK_BROKEN = 'streak_broken', // Lost streak, win them back
  STREAK_AT_RISK = 'streak_at_risk', // Haven't ordered today, might break streak

  // Location-based
  GEOFENCE_ENTER = 'geofence_enter', // User enters store radius
  GEOFENCE_DWELL = 'geofence_dwell', // User near store for X minutes
  GEOFENCE_EXIT = 'geofence_exit', // User leaving without purchase

  // Time-based
  TIME_OF_DAY = 'time_of_day', // Morning, lunch, afternoon coffee break
  DAY_OF_WEEK = 'day_of_week', // Friday treat, Monday motivation
  SPECIAL_DATE = 'special_date', // Birthday, anniversary, holiday

  // Weather-based
  WEATHER_COLD = 'weather_cold', // Cold day → hot drinks
  WEATHER_HOT = 'weather_hot', // Hot day → iced drinks
  WEATHER_RAINY = 'weather_rainy', // Rainy day comfort

  // Behavior-based
  FIRST_PURCHASE = 'first_purchase', // Just made first order
  BROWSE_NO_PURCHASE = 'browse_no_purchase', // Viewed menu, didn't buy
  CART_ABANDONED = 'cart_abandoned', // Added items, didn't checkout
  HIGH_VALUE_BEHAVIOR = 'high_value_behavior', // VIP user pattern

  // Churn prevention
  CHURN_RISK_HIGH = 'churn_risk_high', // Predicted high churn risk
  DORMANT_REACTIVATION = 'dormant_reactivation', // 30+ days inactive
  WIN_BACK = 'win_back', // 60+ days inactive

  // Engagement
  LOYALTY_MILESTONE = 'loyalty_milestone', // Points milestone
  REFERRAL_OPPORTUNITY = 'referral_opportunity', // Happy customer, ask for referral
  REVIEW_REQUEST = 'review_request', // After positive experience
}

/**
 * Trigger condition
 */
export interface TriggerCondition {
  type: TriggerType;
  enabled: boolean;
  priority: number; // 1-10 (10 = highest)

  // Condition parameters
  params?: {
    // Streak
    streakDays?: number[];
    hoursUntilStreakBreak?: number;

    // Location
    radiusMeters?: number;
    dwellMinutes?: number;
    storeIds?: string[];

    // Time
    hourStart?: number;
    hourEnd?: number;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)

    // Weather
    temperatureBelow?: number;
    temperatureAbove?: number;
    conditions?: string[];

    // Behavior
    minutesSinceBrowse?: number;
    minutesSinceCartAdd?: number;

    // Churn
    minChurnProbability?: number;
    daysSinceLastActivity?: number;
  };

  // Frequency capping
  maxFiresPerDay?: number;
  maxFiresPerWeek?: number;
  cooldownMinutes?: number; // Min time between fires

  // Targeting
  targetSegments?: string[];
  excludeSegments?: string[];

  // Promotion strategy
  promotionStrategy?: 'bandit' | 'fixed' | 'contextual';
  fixedPromotionId?: string;
}

/**
 * Trigger evaluation result
 */
export interface TriggerResult {
  triggered: boolean;
  triggerType: TriggerType;
  reason: string;
  userId: string;

  // Recommended action
  promotionId?: string;
  promotionName?: string;
  message?: string;

  // Context
  userSegment?: string;
  churnRisk?: string;
  context?: any;

  // Tracking
  triggerId: string;
  timestamp: Date;
}

/**
 * Trigger fire history (for frequency capping)
 */
interface TriggerFire {
  userId: string;
  triggerType: TriggerType;
  timestamp: Date;
  promotionId?: string;
}

@Injectable()
export class TriggerEngineService {
  private readonly logger = new Logger(TriggerEngineService.name);

  // In-memory cache of trigger fires (could move to Redis)
  private triggerHistory = new Map<string, TriggerFire[]>();

  // Active trigger conditions
  private triggers: TriggerCondition[] = [];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    private readonly featureStoreService: FeatureStoreService,
    private readonly segmentationService: SegmentationService,
    private readonly churnPredictionService: ChurnPredictionService,
    private readonly recommendationService: RecommendationService,
    private readonly banditService: ContextualBanditService,
    private readonly weatherService: WeatherService,
  ) {
    // Initialize default triggers
    this.initializeDefaultTriggers();
  }

  /**
   * Evaluate all triggers for a user
   * Called when user performs an action or on scheduled check
   */
  async evaluateTriggers(
    userId: string,
    context?: {
      eventType?: string;
      location?: { latitude: number; longitude: number };
      timestamp?: Date;
    },
  ): Promise<TriggerResult[]> {
    const results: TriggerResult[] = [];
    const now = context?.timestamp || new Date();

    // Get user data
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      return results;
    }

    // Get user features, segment, churn risk
    const [features, userSegment, churnPrediction] = await Promise.all([
      this.featureStoreService.getUserFeatures({ userId }),
      this.segmentationService.assignUserSegment(userId),
      this.churnPredictionService.predictChurn(userId),
    ]);

    // Get weather if location provided
    let weather;
    if (context?.location) {
      weather = await this.weatherService.getCurrentWeather(
        context.location.latitude,
        context.location.longitude,
      );
    }

    // Evaluate each trigger in priority order
    const sortedTriggers = [...this.triggers].sort((a, b) => b.priority - a.priority);

    for (const trigger of sortedTriggers) {
      if (!trigger.enabled) continue;

      // Check if trigger applies to this user's segment
      if (!this.isUserEligible(trigger, userSegment.segment)) {
        continue;
      }

      // Check frequency capping
      if (this.isRateLimited(userId, trigger)) {
        continue;
      }

      // Evaluate trigger condition
      const triggered = await this.evaluateTriggerCondition(trigger, {
        user,
        features,
        userSegment: userSegment.segment,
        churnPrediction,
        weather,
        eventType: context?.eventType,
        location: context?.location,
        timestamp: now,
      });

      if (triggered) {
        // Select promotion using configured strategy
        const promotion = await this.selectPromotion(trigger, {
          userId,
          segment: userSegment.segment,
          churnRisk: churnPrediction.riskLevel,
          weather,
          timeOfDay: this.getTimeOfDay(now),
        });

        const result: TriggerResult = {
          triggered: true,
          triggerType: trigger.type,
          reason: this.getTriggerReason(trigger, features),
          userId,
          promotionId: promotion?.promotionId,
          promotionName: promotion?.name,
          message: promotion?.message,
          userSegment: userSegment.segment,
          churnRisk: churnPrediction.riskLevel,
          context: {
            features: {
              streak: features.engagement.currentStreak,
              daysSinceLastPurchase: features.rfm.daysSinceLastPurchase,
            },
            weather: weather?.temperature,
          },
          triggerId: this.generateTriggerId(),
          timestamp: now,
        };

        results.push(result);

        // Record trigger fire
        this.recordTriggerFire(userId, trigger.type, promotion?.promotionId);

        // Log trigger
        this.logger.log(
          `Trigger fired: ${trigger.type} for user ${userId} (${userSegment.segment})`,
        );
      }
    }

    return results;
  }

  /**
   * Evaluate a specific trigger condition
   */
  private async evaluateTriggerCondition(
    trigger: TriggerCondition,
    context: any,
  ): Promise<boolean> {
    const { type, params = {} } = trigger;
    const { features, churnPrediction, weather, timestamp, location } = context;

    switch (type) {
      // Streak triggers
      case TriggerType.STREAK_MILESTONE:
        return params.streakDays?.includes(features.engagement.currentStreak) || false;

      case TriggerType.STREAK_BROKEN:
        return (
          features.engagement.currentStreak === 0 &&
          features.engagement.longestStreak >= 3
        );

      case TriggerType.STREAK_AT_RISK:
        // Check if user hasn't ordered today and has active streak
        if (features.engagement.currentStreak === 0) return false;
        const hoursSinceLastOrder = features.rfm.daysSinceLastPurchase * 24;
        return hoursSinceLastOrder > (params.hoursUntilStreakBreak || 18);

      // Location triggers
      case TriggerType.GEOFENCE_ENTER:
      case TriggerType.GEOFENCE_DWELL:
        // Would check if user location is within store radius
        // Requires store locations and distance calculation
        return false; // Placeholder

      // Time triggers
      case TriggerType.TIME_OF_DAY:
        const hour = timestamp.getHours();
        return (
          hour >= (params.hourStart || 0) &&
          hour <= (params.hourEnd || 23)
        );

      case TriggerType.DAY_OF_WEEK:
        const dayOfWeek = timestamp.getDay();
        return params.daysOfWeek?.includes(dayOfWeek) || false;

      // Weather triggers
      case TriggerType.WEATHER_COLD:
        return weather && weather.temperature < (params.temperatureBelow || 50);

      case TriggerType.WEATHER_HOT:
        return weather && weather.temperature > (params.temperatureAbove || 75);

      case TriggerType.WEATHER_RAINY:
        return (
          weather &&
          (weather.condition.toLowerCase().includes('rain') ||
            weather.condition.toLowerCase().includes('storm'))
        );

      // Behavior triggers
      case TriggerType.BROWSE_NO_PURCHASE:
        // Check if user browsed menu recently without purchasing
        const menuViews = features.engagement.menuViewsLast30Days;
        const recentPurchases = features.rfm.purchasesLast7Days;
        return menuViews > 0 && recentPurchases === 0;

      // Churn triggers
      case TriggerType.CHURN_RISK_HIGH:
        return churnPrediction.churnProbability >= (params.minChurnProbability || 0.5);

      case TriggerType.DORMANT_REACTIVATION:
        return (
          features.rfm.daysSinceLastPurchase >= (params.daysSinceLastActivity || 30) &&
          features.rfm.daysSinceLastPurchase < 60
        );

      case TriggerType.WIN_BACK:
        return features.rfm.daysSinceLastPurchase >= 60;

      // Engagement triggers
      case TriggerType.LOYALTY_MILESTONE:
        // Check if user hit loyalty points milestone
        return false; // Placeholder

      case TriggerType.FIRST_PURCHASE:
        return features.rfm.totalPurchases === 1;

      default:
        return false;
    }
  }

  /**
   * Select promotion using configured strategy
   */
  private async selectPromotion(
    trigger: TriggerCondition,
    context: BanditContext,
  ): Promise<{ promotionId: string; name: string; message: string } | null> {
    const { promotionStrategy = 'bandit', fixedPromotionId } = trigger;

    try {
      if (promotionStrategy === 'fixed' && fixedPromotionId) {
        // Use fixed promotion
        return {
          promotionId: fixedPromotionId,
          name: 'Special Offer',
          message: 'We have a special offer for you!',
        };
      }

      if (promotionStrategy === 'bandit') {
        // Use contextual bandit to select best promotion
        const selection = await this.banditService.selectArm(context);
        return {
          promotionId: selection.promotionId,
          name: selection.name,
          message: selection.reason,
        };
      }

      // Fallback: Use recommendation system
      const recommendations = await this.recommendationService.getPersonalizedRecommendations({
        userId: context.userId,
        weather: context.weather,
        limit: 1,
      });

      if (recommendations.length > 0) {
        return {
          promotionId: recommendations[0].menuItemId,
          name: recommendations[0].name,
          message: recommendations[0].reason,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error selecting promotion:', error);
      return null;
    }
  }

  /**
   * Check if user is eligible for trigger based on targeting rules
   */
  private isUserEligible(trigger: TriggerCondition, userSegment: string): boolean {
    const { targetSegments, excludeSegments } = trigger;

    if (excludeSegments && excludeSegments.includes(userSegment)) {
      return false;
    }

    if (targetSegments && targetSegments.length > 0) {
      return targetSegments.includes(userSegment);
    }

    return true;
  }

  /**
   * Check if trigger is rate limited for this user
   */
  private isRateLimited(userId: string, trigger: TriggerCondition): boolean {
    const key = `${userId}:${trigger.type}`;
    const history = this.triggerHistory.get(key) || [];

    const now = new Date();

    // Check cooldown
    if (trigger.cooldownMinutes) {
      const lastFire = history[history.length - 1];
      if (lastFire) {
        const minutesSince = (now.getTime() - lastFire.timestamp.getTime()) / 1000 / 60;
        if (minutesSince < trigger.cooldownMinutes) {
          return true;
        }
      }
    }

    // Check daily limit
    if (trigger.maxFiresPerDay) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayFires = history.filter((fire) => fire.timestamp >= today);
      if (todayFires.length >= trigger.maxFiresPerDay) {
        return true;
      }
    }

    // Check weekly limit
    if (trigger.maxFiresPerWeek) {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekFires = history.filter((fire) => fire.timestamp >= weekAgo);
      if (weekFires.length >= trigger.maxFiresPerWeek) {
        return true;
      }
    }

    return false;
  }

  /**
   * Record trigger fire for frequency capping
   */
  private recordTriggerFire(
    userId: string,
    triggerType: TriggerType,
    promotionId?: string,
  ): void {
    const key = `${userId}:${triggerType}`;
    const history = this.triggerHistory.get(key) || [];

    history.push({
      userId,
      triggerType,
      timestamp: new Date(),
      promotionId,
    });

    // Keep only last 100 fires per user/trigger
    if (history.length > 100) {
      history.shift();
    }

    this.triggerHistory.set(key, history);
  }

  /**
   * Get human-readable reason for trigger
   */
  private getTriggerReason(trigger: TriggerCondition, features: any): string {
    const { type, params = {} } = trigger;

    switch (type) {
      case TriggerType.STREAK_MILESTONE:
        return `Congrats on ${features.engagement.currentStreak} day streak!`;
      case TriggerType.STREAK_BROKEN:
        return "We miss you! Let's restart your streak";
      case TriggerType.STREAK_AT_RISK:
        return "Don't break your streak! Order today";
      case TriggerType.WEATHER_COLD:
        return 'Warm up with a hot drink on this cold day';
      case TriggerType.WEATHER_HOT:
        return 'Cool down with an iced drink on this hot day';
      case TriggerType.CHURN_RISK_HIGH:
        return 'We miss you! Here is a special offer';
      case TriggerType.DORMANT_REACTIVATION:
        return 'Welcome back! We have something special for you';
      case TriggerType.FIRST_PURCHASE:
        return 'Thanks for your first order! Here is a welcome offer';
      default:
        return 'Special offer just for you';
    }
  }

  /**
   * Get time of day category
   */
  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Generate unique trigger ID
   */
  private generateTriggerId(): string {
    return `trig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize default trigger conditions
   */
  private initializeDefaultTriggers(): void {
    this.triggers = [
      // Streak milestones (high priority)
      {
        type: TriggerType.STREAK_MILESTONE,
        enabled: true,
        priority: 10,
        params: { streakDays: [3, 7, 14, 30, 60, 90] },
        maxFiresPerDay: 1,
        promotionStrategy: 'bandit',
      },

      // Streak at risk (high priority)
      {
        type: TriggerType.STREAK_AT_RISK,
        enabled: true,
        priority: 9,
        params: { hoursUntilStreakBreak: 18 },
        maxFiresPerDay: 1,
        cooldownMinutes: 360, // Once per 6 hours
        promotionStrategy: 'bandit',
      },

      // High churn risk (high priority)
      {
        type: TriggerType.CHURN_RISK_HIGH,
        enabled: true,
        priority: 9,
        params: { minChurnProbability: 0.7 },
        maxFiresPerWeek: 2,
        cooldownMinutes: 1440, // Once per day
        promotionStrategy: 'bandit',
      },

      // Weather-based (medium priority)
      {
        type: TriggerType.WEATHER_COLD,
        enabled: true,
        priority: 6,
        params: { temperatureBelow: 50 },
        maxFiresPerDay: 1,
        cooldownMinutes: 720, // Once per 12 hours
        promotionStrategy: 'contextual',
      },

      {
        type: TriggerType.WEATHER_HOT,
        enabled: true,
        priority: 6,
        params: { temperatureAbove: 75 },
        maxFiresPerDay: 1,
        cooldownMinutes: 720,
        promotionStrategy: 'contextual',
      },

      // Dormant reactivation (medium priority)
      {
        type: TriggerType.DORMANT_REACTIVATION,
        enabled: true,
        priority: 7,
        params: { daysSinceLastActivity: 30 },
        maxFiresPerWeek: 1,
        promotionStrategy: 'bandit',
      },

      // Win-back (medium priority)
      {
        type: TriggerType.WIN_BACK,
        enabled: true,
        priority: 8,
        params: { daysSinceLastActivity: 60 },
        maxFiresPerWeek: 1,
        promotionStrategy: 'bandit',
      },

      // First purchase (medium priority)
      {
        type: TriggerType.FIRST_PURCHASE,
        enabled: true,
        priority: 7,
        maxFiresPerDay: 1,
        promotionStrategy: 'fixed',
      },

      // Time of day (lower priority)
      {
        type: TriggerType.TIME_OF_DAY,
        enabled: false, // Disabled by default (can be spammy)
        priority: 4,
        params: { hourStart: 7, hourEnd: 10 }, // Morning coffee
        maxFiresPerDay: 1,
        promotionStrategy: 'contextual',
      },
    ];

    this.logger.log(`Initialized ${this.triggers.length} default triggers`);
  }

  /**
   * Get all triggers
   */
  async getAllTriggers(): Promise<TriggerCondition[]> {
    return this.triggers;
  }

  /**
   * Add or update trigger
   */
  async upsertTrigger(trigger: TriggerCondition): Promise<void> {
    const index = this.triggers.findIndex((t) => t.type === trigger.type);
    if (index >= 0) {
      this.triggers[index] = trigger;
    } else {
      this.triggers.push(trigger);
    }
    this.logger.log(`Trigger ${trigger.type} updated`);
  }

  /**
   * Remove trigger
   */
  async removeTrigger(triggerType: TriggerType): Promise<void> {
    this.triggers = this.triggers.filter((t) => t.type !== triggerType);
    this.logger.log(`Trigger ${triggerType} removed`);
  }

  /**
   * Clear trigger history for user (testing)
   */
  async clearTriggerHistory(userId: string): Promise<void> {
    const keysToDelete: string[] = [];
    this.triggerHistory.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.triggerHistory.delete(key));
    this.logger.log(`Cleared trigger history for user ${userId}`);
  }
}
