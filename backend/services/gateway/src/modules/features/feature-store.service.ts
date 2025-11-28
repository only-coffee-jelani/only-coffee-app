import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import {
  UserEvent,
  EventType,
  UserProfile,
  Order,
  User,
  Store,
} from '@shared/database/entities';
import {
  UserFeatureVector,
  RFMFeatures,
  EngagementFeatures,
  BehavioralFeatures,
  ContextualFeatures,
  ChurnPredictionFeatures,
  FeatureComputationOptions,
} from './interfaces/user-features.interface';
import { WeatherService } from '../weather/weather.service';

const FEATURE_VERSION = '1.0.0';
const DEFAULT_CACHE_TTL = 300; // 5 minutes for online features

@Injectable()
export class FeatureStoreService {
  private readonly logger = new Logger(FeatureStoreService.name);
  private redis: Redis;

  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly weatherService: WeatherService,
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    // Connect to Redis
    this.redis.connect().catch((err) => {
      this.logger.error('Failed to connect to Redis:', err);
    });
  }

  /**
   * Get user features with caching
   * Tries Redis cache first, falls back to computation if not cached
   */
  async getUserFeatures(
    options: FeatureComputationOptions,
  ): Promise<UserFeatureVector> {
    const cacheKey = `features:${options.userId}`;

    // Try cache first unless force refresh
    if (!options.forceRefresh) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user ${options.userId}`);
        return cached;
      }
    }

    // Compute features
    this.logger.debug(`Computing features for user ${options.userId}`);
    const features = await this.computeUserFeatures(options);

    // Cache the result
    const ttl = options.cacheTTL || DEFAULT_CACHE_TTL;
    await this.setInCache(cacheKey, features, ttl);

    return features;
  }

  /**
   * Compute all user features from scratch
   */
  private async computeUserFeatures(
    options: FeatureComputationOptions,
  ): Promise<UserFeatureVector> {
    const userId = options.userId;

    // Fetch user data
    const [user, userProfile, events, orders] = await Promise.all([
      this.userRepository.findOne({ where: { userId } }),
      this.userProfileRepository.findOne({ where: { userId } }),
      this.userEventRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 1000, // Last 1000 events
      }),
      this.orderRepository.find({
        where: { userId },
        order: { placedAt: 'DESC' },
        take: 500, // Last 500 orders
      }),
    ]);

    // Compute feature groups
    const rfm = options.includeRFM !== false ? await this.computeRFMFeatures(userId, orders, events) : null;
    const engagement = options.includeEngagement !== false ? await this.computeEngagementFeatures(userId, events, orders) : null;
    const behavioral = options.includeBehavioral !== false ? await this.computeBehavioralFeatures(userId, orders, events, user) : null;
    const contextual = options.includeContextual !== false ? await this.computeContextualFeatures(userId, options, events) : null;
    const churn = options.includeChurn !== false ? await this.computeChurnFeatures(userId, events, userProfile) : null;

    // Calculate data quality
    const dataQuality = this.calculateDataQuality(events, orders);

    const featureVector: UserFeatureVector = {
      userId,
      computedAt: new Date(),
      rfm: rfm || this.getDefaultRFMFeatures(),
      engagement: engagement || this.getDefaultEngagementFeatures(),
      behavioral: behavioral || this.getDefaultBehavioralFeatures(),
      contextual: contextual || this.getDefaultContextualFeatures(),
      churn: churn || this.getDefaultChurnFeatures(),
      featureVersion: FEATURE_VERSION,
      dataQuality,
    };

    // Store in offline feature store (PostgreSQL user_profiles table)
    await this.storeOfflineFeatures(userId, featureVector);

    return featureVector;
  }

  /**
   * Compute RFM (Recency, Frequency, Monetary) features
   */
  private async computeRFMFeatures(
    userId: string,
    orders: Order[],
    events: UserEvent[],
  ): Promise<RFMFeatures> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Recency
    // Note: Order.status is now orderStatusId (FK), need to load relation or check by ID
    // For now, assume all orders are completed
    const lastPurchase = orders[0]; // Already sorted by placedAt DESC
    const daysSinceLastPurchase = lastPurchase
      ? Math.floor((now.getTime() - new Date(lastPurchase.placedAt).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    const lastAppOpen = events.find((e) => e.eventType === EventType.APP_OPENED);
    const daysSinceLastAppOpen = lastAppOpen
      ? Math.floor((now.getTime() - new Date(lastAppOpen.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    // Frequency
    // Note: Can't filter by status without loading orderStatus relation
    const completedOrders = orders; // Assume all are completed for now
    const totalPurchases = completedOrders.length;
    const purchasesLast7Days = completedOrders.filter(
      (o) => new Date(o.placedAt) >= sevenDaysAgo,
    ).length;
    const purchasesLast30Days = completedOrders.filter(
      (o) => new Date(o.placedAt) >= thirtyDaysAgo,
    ).length;
    const purchasesLast90Days = completedOrders.filter(
      (o) => new Date(o.placedAt) >= ninetyDaysAgo,
    ).length;

    const appOpens = events.filter((e) => e.eventType === EventType.APP_OPENED);
    const appOpensLast7Days = appOpens.filter(
      (e) => new Date(e.createdAt) >= sevenDaysAgo,
    ).length;
    const appOpensLast30Days = appOpens.filter(
      (e) => new Date(e.createdAt) >= thirtyDaysAgo,
    ).length;

    // Monetary
    const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
    const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    const lifetimeValue = totalSpent;

    const spentLast7Days = completedOrders
      .filter((o) => new Date(o.placedAt) >= sevenDaysAgo)
      .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
    const spentLast30Days = completedOrders
      .filter((o) => new Date(o.placedAt) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
    const spentLast90Days = completedOrders
      .filter((o) => new Date(o.placedAt) >= ninetyDaysAgo)
      .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);

    // Calculate RFM scores (1-5 scale)
    const recencyScore = this.calculateRecencyScore(daysSinceLastPurchase);
    const frequencyScore = this.calculateFrequencyScore(purchasesLast90Days);
    const monetaryScore = this.calculateMonetaryScore(spentLast90Days);
    const rfmScore = Math.round((recencyScore + frequencyScore + monetaryScore) / 3);

    return {
      daysSinceLastPurchase,
      daysSinceLastAppOpen,
      totalPurchases,
      purchasesLast7Days,
      purchasesLast30Days,
      purchasesLast90Days,
      appOpensLast7Days,
      appOpensLast30Days,
      totalSpent,
      averageOrderValue,
      lifetimeValue,
      spentLast7Days,
      spentLast30Days,
      spentLast90Days,
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmScore,
    };
  }

  /**
   * Compute engagement features
   */
  private async computeEngagementFeatures(
    userId: string,
    events: UserEvent[],
    orders: Order[],
  ): Promise<EngagementFeatures> {
    // Streaks (consecutive days with activity)
    const { currentStreak, longestStreak, lastStreakDate } = this.calculateStreaks(events);

    // Session metrics
    const sessions = this.groupEventsBySessions(events);
    const averageSessionDuration = this.calculateAverageSessionDuration(sessions);
    const averageTimeBetweenVisits = this.calculateAverageTimeBetweenVisits(sessions);

    // Menu views
    const menuViews = events.filter(
      (e) => e.eventType === EventType.MENU_VIEWED || e.eventType === EventType.ITEM_VIEWED,
    );
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const menuViewsLast7Days = menuViews.filter((e) => new Date(e.createdAt) >= sevenDaysAgo).length;
    const menuViewsLast30Days = menuViews.filter((e) => new Date(e.createdAt) >= thirtyDaysAgo).length;

    // Product interactions
    const favoriteCategories = this.extractFavoriteCategories(events, orders);
    const mostViewedItems = this.extractMostViewedItems(events);
    const mostPurchasedItems = this.extractMostPurchasedItems(orders);

    // Time patterns
    const preferredTimeOfDay = this.extractPreferredTimeOfDay(events);
    const preferredDayOfWeek = this.extractPreferredDayOfWeek(events);

    // Loyalty
    const user = await this.userRepository.findOne({ where: { userId }, relations: ['loyaltyTier'] });
    const isLoyaltyMember = (user?.loyaltyPoints || 0) > 0; // Assume loyalty member if has points
    const loyaltyPoints = user?.loyaltyPoints || 0;
    const loyaltyTier = user?.loyaltyTier?.code || null; // Get tier code from relation

    return {
      currentStreak,
      longestStreak,
      lastStreakDate,
      averageSessionDuration,
      averageTimeBetweenVisits,
      menuViewsLast7Days,
      menuViewsLast30Days,
      favoriteCategories,
      mostViewedItems,
      mostPurchasedItems,
      preferredTimeOfDay,
      preferredDayOfWeek,
      isLoyaltyMember,
      loyaltyPoints,
      loyaltyTier,
    };
  }

  /**
   * Compute behavioral features
   */
  private async computeBehavioralFeatures(
    userId: string,
    orders: Order[],
    events: UserEvent[],
    user: User | null,
  ): Promise<BehavioralFeatures> {
    // Note: Can't filter by status without loading orderStatus relation
    const completedOrders = orders; // Assume all are completed

    // Cart behavior
    const cartAbandoned = events.filter((e) => e.eventType === EventType.CART_ABANDONED).length;
    const cartCompleted = completedOrders.length;
    const cartAbandonmentRate = (cartAbandoned + cartCompleted) > 0
      ? cartAbandoned / (cartAbandoned + cartCompleted)
      : 0;

    const totalItems = completedOrders.reduce((sum, o) => {
      // Note: Order.items is now orderItems relation, not loaded here
      return sum + 1; // Assume 1 item per order for now
    }, 0);
    const averageItemsPerOrder = completedOrders.length > 0 ? totalItems / completedOrders.length : 0;
    const averageCartSize = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0) / completedOrders.length
      : 0;

    // Discount sensitivity
    // Note: Order.promoCodeId doesn't exist in new schema
    const ordersWithPromoCode = 0; // Can't determine without schema support
    const ordersWithoutPromoCode = completedOrders.length;
    const discountSensitivityScore = 0;

    // Location patterns
    // Note: UserEvent.storeId is now in payload
    const storeVisits = events.filter((e) => e.payload?.storeId);
    const storeCounts = storeVisits.reduce((acc, e) => {
      const storeId = e.payload?.storeId;
      if (storeId) {
        acc[storeId] = (acc[storeId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const favoriteStoreId = Object.keys(storeCounts).length > 0
      ? Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;
    const uniqueStoresVisited = Object.keys(storeCounts).length;

    // Average distance to store (if location data available)
    // Note: UserEvent.location is now in payload
    const eventsWithLocation = events.filter((e) => e.payload?.location);
    const averageDistanceToStore = eventsWithLocation.length > 0
      ? await this.calculateAverageDistanceToStore(eventsWithLocation)
      : null;

    // Device and platform
    // Note: UserEvent.deviceType and appVersion are now in payload
    const deviceTypes = events.map((e) => e.payload?.deviceType).filter(Boolean);
    const primaryDevice = deviceTypes.length > 0
      ? (deviceTypes.filter((d) => d === 'iOS').length > deviceTypes.length / 2 ? 'iOS' : 'Android')
      : null;
    const appVersion = events.find((e) => e.payload?.appVersion)?.payload?.appVersion || null;
    // Note: User.notificationsEnabled doesn't exist in new schema
    const hasEnabledNotifications = false;

    return {
      cartAbandonmentRate,
      averageCartSize,
      averageItemsPerOrder,
      ordersWithPromoCode,
      ordersWithoutPromoCode,
      discountSensitivityScore,
      favoriteStoreId,
      uniqueStoresVisited,
      averageDistanceToStore,
      primaryDevice,
      appVersion,
      hasEnabledNotifications,
    };
  }

  /**
   * Compute contextual features (real-time)
   */
  private async computeContextualFeatures(
    userId: string,
    options: FeatureComputationOptions,
    events: UserEvent[],
  ): Promise<ContextualFeatures> {
    const now = new Date();

    // Weather context
    let currentWeatherTemp = null;
    let currentWeatherCondition = null;
    let isHotWeather = false;
    let isColdWeather = false;
    let isRainyWeather = false;

    if (options.currentLocation) {
      const weather = await this.weatherService.getCurrentWeather(
        options.currentLocation.latitude,
        options.currentLocation.longitude,
      );
      if (weather) {
        currentWeatherTemp = weather.temperature;
        currentWeatherCondition = weather.condition;
        isHotWeather = weather.isHot;
        isColdWeather = weather.isCold;
        isRainyWeather = weather.isRaining;
      }
    }

    // Location context
    const currentLatitude = options.currentLocation?.latitude || null;
    const currentLongitude = options.currentLocation?.longitude || null;
    let distanceToNearestStore = null;
    let isNearStore = false;

    if (options.currentLocation) {
      distanceToNearestStore = await this.calculateDistanceToNearestStore(
        options.currentLocation.latitude,
        options.currentLocation.longitude,
      );
      isNearStore = distanceToNearestStore !== null && distanceToNearestStore <= 1; // Within 1km
    }

    // Temporal context
    const currentHourOfDay = now.getHours();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayOfWeek = daysOfWeek[now.getDay()];
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isHoliday = false; // TODO: Implement holiday calendar

    // Session context
    const sessionId = options.sessionId || null;
    // Note: UserEvent.sessionId is now in payload
    const sessionEvents = events.filter((e) => e.payload?.sessionId === sessionId);
    const sessionStartTime = sessionEvents.length > 0
      ? new Date(sessionEvents[sessionEvents.length - 1].createdAt)
      : null;
    const eventsInCurrentSession = sessionEvents.length;

    return {
      currentWeatherTemp,
      currentWeatherCondition,
      isHotWeather,
      isColdWeather,
      isRainyWeather,
      currentLatitude,
      currentLongitude,
      distanceToNearestStore,
      isNearStore,
      currentHourOfDay,
      currentDayOfWeek,
      isWeekend,
      isHoliday,
      sessionId,
      sessionStartTime,
      eventsInCurrentSession,
    };
  }

  /**
   * Compute churn prediction features
   */
  private async computeChurnFeatures(
    userId: string,
    events: UserEvent[],
    userProfile: UserProfile | null,
  ): Promise<ChurnPredictionFeatures> {
    const now = new Date();
    const lastEvent = events.length > 0 ? events[0] : null;
    const daysSinceLastActivity = lastEvent
      ? Math.floor((now.getTime() - new Date(lastEvent.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    // Activity trend
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentActivity = events.filter((e) => new Date(e.createdAt) >= thirtyDaysAgo).length;
    const previousActivity = events.filter(
      (e) => new Date(e.createdAt) >= sixtyDaysAgo && new Date(e.createdAt) < thirtyDaysAgo,
    ).length;

    let activityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentActivity > previousActivity * 1.2) activityTrend = 'increasing';
    else if (recentActivity < previousActivity * 0.8) activityTrend = 'decreasing';

    const engagementDeclineRate = previousActivity > 0
      ? ((previousActivity - recentActivity) / previousActivity) * 100
      : 0;

    // Churn probability (placeholder - will be replaced by ML model)
    const churnProbability = null; // TODO: Call ML model
    const churnRiskSegment = daysSinceLastActivity > 30 ? 'high' :
      daysSinceLastActivity > 14 ? 'medium' : 'low';

    // Promotion history
    // Note: UserProfile.lastPromotionDate doesn't exist in new schema
    const lastPromotionReceived = null;
    const daysSinceLastPromotion = null;
    const promotionResponseRate = 0; // TODO: Calculate from promotion_redemptions table

    return {
      daysSinceLastActivity,
      activityTrend,
      engagementDeclineRate,
      churnProbability,
      churnRiskSegment,
      lastPromotionReceived,
      daysSinceLastPromotion,
      promotionResponseRate,
    };
  }

  // Helper methods
  private calculateRecencyScore(days: number): number {
    if (days <= 7) return 5;
    if (days <= 14) return 4;
    if (days <= 30) return 3;
    if (days <= 60) return 2;
    return 1;
  }

  private calculateFrequencyScore(purchases: number): number {
    if (purchases >= 10) return 5;
    if (purchases >= 5) return 4;
    if (purchases >= 3) return 3;
    if (purchases >= 1) return 2;
    return 1;
  }

  private calculateMonetaryScore(spent: number): number {
    if (spent >= 200) return 5;
    if (spent >= 100) return 4;
    if (spent >= 50) return 3;
    if (spent >= 20) return 2;
    return 1;
  }

  private calculateStreaks(events: UserEvent[]): {
    currentStreak: number;
    longestStreak: number;
    lastStreakDate: Date | null;
  } {
    // Group events by date
    const eventDates = events.map((e) => {
      const d = new Date(e.createdAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });
    const uniqueDates = [...new Set(eventDates)].sort((a, b) => b - a);

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
    }

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const dayDiff = Math.floor((uniqueDates[i - 1] - uniqueDates[i]) / (24 * 60 * 60 * 1000));
      if (dayDiff === 1) {
        tempStreak++;
        if (i === 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastStreakDate: uniqueDates.length > 0 ? new Date(uniqueDates[0]) : null,
    };
  }

  private groupEventsBySessions(events: UserEvent[]): UserEvent[][] {
    const sessions: UserEvent[][] = [];
    const sessionMap: Record<string, UserEvent[]> = {};

    events.forEach((event) => {
      // Note: sessionId is now in payload
      const sessionId = event.payload?.sessionId || 'default';
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = [];
      }
      sessionMap[sessionId].push(event);
    });

    Object.values(sessionMap).forEach((session) => {
      if (session.length > 0) {
        sessions.push(session.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
    });

    return sessions;
  }

  private calculateAverageSessionDuration(sessions: UserEvent[][]): number {
    if (sessions.length === 0) return 0;

    const durations = sessions.map((session) => {
      if (session.length < 2) return 0;
      const start = new Date(session[0].createdAt).getTime();
      const end = new Date(session[session.length - 1].createdAt).getTime();
      return (end - start) / 1000; // seconds
    });

    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  private calculateAverageTimeBetweenVisits(sessions: UserEvent[][]): number {
    if (sessions.length < 2) return 0;

    const sessionStarts = sessions
      .map((session) => new Date(session[0].createdAt).getTime())
      .sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < sessionStarts.length; i++) {
      intervals.push((sessionStarts[i] - sessionStarts[i - 1]) / (60 * 60 * 1000)); // hours
    }

    return intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  }

  private extractFavoriteCategories(events: UserEvent[], orders: Order[]): string[] {
    const categoryCounts: Record<string, number> = {};

    // From item views
    // Note: metadata is now in payload
    events
      .filter((e) => e.eventType === EventType.ITEM_VIEWED && e.payload?.metadata?.category)
      .forEach((e) => {
        const category = e.payload!.metadata!.category as string;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

    // From orders
    // Note: Order.items is now orderItems relation, not loaded here
    orders.forEach((order) => {
      // Can't access items without loading relation
      // Skip for now
    });

    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);
  }

  private extractMostViewedItems(events: UserEvent[]): string[] {
    const itemCounts: Record<string, number> = {};

    // Note: metadata is now in payload
    events
      .filter((e) => e.eventType === EventType.ITEM_VIEWED && e.payload?.metadata?.itemId)
      .forEach((e) => {
        const itemId = e.payload!.metadata!.itemId as string;
        itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
      });

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);
  }

  private extractMostPurchasedItems(orders: Order[]): string[] {
    const itemCounts: Record<string, number> = {};

    // Note: Order.items is now orderItems relation, not loaded here
    orders.forEach((order) => {
      // Can't access items without loading relation
      // Skip for now
    });

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);
  }

  private extractPreferredTimeOfDay(events: UserEvent[]): 'morning' | 'afternoon' | 'evening' | 'night' | null {
    if (events.length === 0) return null;

    const timeCounts = {
      morning: 0, // 6-12
      afternoon: 0, // 12-17
      evening: 0, // 17-21
      night: 0, // 21-6
    };

    events.forEach((e) => {
      const hour = new Date(e.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeCounts.morning++;
      else if (hour >= 12 && hour < 17) timeCounts.afternoon++;
      else if (hour >= 17 && hour < 21) timeCounts.evening++;
      else timeCounts.night++;
    });

    const max = Math.max(...Object.values(timeCounts));
    return Object.entries(timeCounts).find(([_, count]) => count === max)?.[0] as any;
  }

  private extractPreferredDayOfWeek(events: UserEvent[]): string | null {
    if (events.length === 0) return null;

    const dayCounts: Record<string, number> = {};
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    events.forEach((e) => {
      const day = daysOfWeek[new Date(e.createdAt).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  private async calculateAverageDistanceToStore(events: UserEvent[]): Promise<number | null> {
    // Simplified distance calculation - would need actual store locations
    return null; // TODO: Implement with actual store locations
  }

  private async calculateDistanceToNearestStore(lat: number, lon: number): Promise<number | null> {
    // TODO: Implement using PostGIS distance calculation to stores table
    return null;
  }

  private calculateDataQuality(events: UserEvent[], orders: Order[]): {
    completeness: number;
    freshness: number;
    confidence: number;
  } {
    const hasEvents = events.length > 0;
    const hasOrders = orders.length > 0;
    const hasRecentEvents = events.length > 0 &&
      (Date.now() - new Date(events[0].createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

    const completeness = (hasEvents ? 0.5 : 0) + (hasOrders ? 0.5 : 0);
    const freshness = hasRecentEvents ? 1.0 : hasEvents ? 0.5 : 0;
    const confidence = events.length >= 10 ? 1.0 : events.length / 10;

    return {
      completeness: Math.min(completeness, 1.0),
      freshness: Math.min(freshness, 1.0),
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Store features in PostgreSQL for offline access
   */
  private async storeOfflineFeatures(userId: string, features: UserFeatureVector): Promise<void> {
    await this.userProfileRepository.upsert(
      {
        userId,
        // Note: UserProfile.featureVector and lastFeatureUpdate don't exist in new schema
        // Skip saving feature vector to database for now
      },
      ['userId'],
    );
  }

  /**
   * Cache operations
   */
  private async getFromCache(key: string): Promise<UserFeatureVector | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache read error: ${error}`);
    }
    return null;
  }

  private async setInCache(key: string, value: UserFeatureVector, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Cache write error: ${error}`);
    }
  }

  /**
   * Invalidate cache for a user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `features:${userId}`;
    await this.redis.del(cacheKey);
    this.logger.debug(`Invalidated cache for user ${userId}`);
  }

  /**
   * Default feature values
   */
  private getDefaultRFMFeatures(): RFMFeatures {
    return {
      daysSinceLastPurchase: 999,
      daysSinceLastAppOpen: 999,
      totalPurchases: 0,
      purchasesLast7Days: 0,
      purchasesLast30Days: 0,
      purchasesLast90Days: 0,
      appOpensLast7Days: 0,
      appOpensLast30Days: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lifetimeValue: 0,
      spentLast7Days: 0,
      spentLast30Days: 0,
      spentLast90Days: 0,
      recencyScore: 1,
      frequencyScore: 1,
      monetaryScore: 1,
      rfmScore: 1,
    };
  }

  private getDefaultEngagementFeatures(): EngagementFeatures {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      averageSessionDuration: 0,
      averageTimeBetweenVisits: 0,
      menuViewsLast7Days: 0,
      menuViewsLast30Days: 0,
      favoriteCategories: [],
      mostViewedItems: [],
      mostPurchasedItems: [],
      preferredTimeOfDay: null,
      preferredDayOfWeek: null,
      isLoyaltyMember: false,
      loyaltyPoints: 0,
      loyaltyTier: null,
    };
  }

  private getDefaultBehavioralFeatures(): BehavioralFeatures {
    return {
      cartAbandonmentRate: 0,
      averageCartSize: 0,
      averageItemsPerOrder: 0,
      ordersWithPromoCode: 0,
      ordersWithoutPromoCode: 0,
      discountSensitivityScore: 0,
      favoriteStoreId: null,
      uniqueStoresVisited: 0,
      averageDistanceToStore: null,
      primaryDevice: null,
      appVersion: null,
      hasEnabledNotifications: false,
    };
  }

  private getDefaultContextualFeatures(): ContextualFeatures {
    const now = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return {
      currentWeatherTemp: null,
      currentWeatherCondition: null,
      isHotWeather: false,
      isColdWeather: false,
      isRainyWeather: false,
      currentLatitude: null,
      currentLongitude: null,
      distanceToNearestStore: null,
      isNearStore: false,
      currentHourOfDay: now.getHours(),
      currentDayOfWeek: daysOfWeek[now.getDay()],
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: false,
      sessionId: null,
      sessionStartTime: null,
      eventsInCurrentSession: 0,
    };
  }

  private getDefaultChurnFeatures(): ChurnPredictionFeatures {
    return {
      daysSinceLastActivity: 999,
      activityTrend: 'stable',
      engagementDeclineRate: 0,
      churnProbability: null,
      churnRiskSegment: null,
      lastPromotionReceived: null,
      daysSinceLastPromotion: null,
      promotionResponseRate: 0,
    };
  }
}
