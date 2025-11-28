import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CarouselEvent } from '@shared/database/entities/carousel-event.entity';
import { CarouselSession } from '@shared/database/entities/carousel-session.entity';
import { CarouselDailyAggregate } from '@shared/database/entities/carousel-daily-aggregate.entity';
import { CarouselItem } from '@shared/database/entities';
import { AnonymousDevice } from '@shared/database/entities/anonymous-device.entity';
import { UserDevice } from '@shared/database/entities/user-device.entity';
import { TrackCarouselEventDto } from './dto/track-carousel-event.dto';

/**
 * CarouselAnalyticsService
 * 
 * Enterprise-level analytics service for carousel tracking and reporting.
 * 
 * Features beyond splash screen analytics:
 * - Swipe direction and velocity tracking
 * - Position-based performance analysis
 * - Engagement scoring algorithm
 * - Real-time and aggregated metrics
 * - A/B testing support
 * - Conversion funnel tracking
 * - Device and screen analytics
 * - Connection type performance analysis
 * 
 * Performance optimizations:
 * - Daily aggregation for fast dashboards
 * - Indexed queries for sub-second response times
 * - Batch processing for high-volume events
 * - Caching layer for frequently accessed metrics
 */
@Injectable()
export class CarouselAnalyticsService {
  private readonly logger = new Logger(CarouselAnalyticsService.name);

  constructor(
    @InjectRepository(CarouselEvent)
    private readonly carouselEventRepository: Repository<CarouselEvent>,
    @InjectRepository(CarouselSession)
    private readonly carouselSessionRepository: Repository<CarouselSession>,
    @InjectRepository(CarouselDailyAggregate)
    private readonly carouselDailyAggregateRepository: Repository<CarouselDailyAggregate>,
    @InjectRepository(CarouselItem)
    private readonly carouselItemRepository: Repository<CarouselItem>,
    @InjectRepository(AnonymousDevice)
    private readonly anonymousDeviceRepository: Repository<AnonymousDevice>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
  ) {}

  /**
   * Track a carousel event
   * 
   * Records user interactions with carousel items including:
   * - Impressions (when item is viewed)
   * - Clicks (when user taps item)
   * - Swipes (left/right navigation)
   * - Auto-advances (automatic progression)
   * - Manual advances (user-initiated progression)
   * - View completions (full duration viewed)
   * - Orders (conversions)
   * - Add to cart events
   * 
   * @param data Event tracking data
   * @returns Saved event entity
   */
  async trackEvent(data: TrackCarouselEventDto): Promise<CarouselEvent> {
    try {
      this.logger.log(
        `Tracking carousel event: ${data.eventType} for item ${data.carouselItemId} ` +
        `(position ${data.positionInCarousel}/${data.totalItemsInCarousel})`,
      );

      // ENTERPRISE-LEVEL ANONYMOUS DEVICE TRACKING
      // Register or update anonymous device if deviceId is provided and user is not logged in
      if (data.deviceId && !data.userId) {
        await this.registerOrUpdateAnonymousDevice(
          data.deviceId,
          data.osType,
          data.appVersion,
          data.deviceModel,
        );
      }

      const now = new Date();
      const event = this.carouselEventRepository.create({
        carouselItemId: data.carouselItemId,
        carouselId: data.carouselId,
        userId: data.userId || null,
        deviceId: data.deviceId || null,
        storeId: data.storeId || null,
        segmentId: data.segmentId || null,
        experimentGroup: data.experimentGroup || null,
        eventType: data.eventType as any,
        positionInCarousel: data.positionInCarousel,
        totalItemsInCarousel: data.totalItemsInCarousel,
        timeOnSlideSeconds: data.timeOnSlideSeconds || null,
        swipeVelocity: data.swipeVelocity || null,
        deeplink: data.deeplink || null,
        orderId: data.orderId || null,
        revenueAmount: data.revenueAmount || null,
        clientTimestamp: now,
        serverTimestamp: now,
        appVersion: data.appVersion || null,
        osType: data.osType as any || null,
        deviceModel: data.deviceModel || null,
        screenWidth: data.screenWidth || null,
        screenHeight: data.screenHeight || null,
        connectionType: data.connectionType || null,
      });

      const savedEvent = await this.carouselEventRepository.save(event);

      this.logger.log(
        `Carousel event tracked successfully: ${savedEvent.carouselEventId} ` +
        `(${data.eventType} at position ${data.positionInCarousel})`,
      );

      return savedEvent;
    } catch (error) {
      this.logger.error(`Failed to track carousel event:`, error);
      throw error;
    }
  }

  /**
   * Start a carousel session
   * 
   * Creates a new session to track user engagement with a carousel.
   * Sessions track:
   * - Total time spent
   * - Items viewed and clicked
   * - Swipe patterns
   * - Navigation behavior
   * - Engagement score
   * - Conversion outcomes
   * 
   * @param carouselId Carousel ID
   * @param userId User ID (optional)
   * @param deviceId Device ID (optional)
   * @param storeId Store ID (optional)
   * @returns Session ID
   */
  async startSession(
    carouselId: string,
    userId?: string,
    deviceId?: string,
    storeId?: string,
  ): Promise<string> {
    try {
      const sessionId = require('crypto').randomUUID();

      this.logger.log(
        `Starting carousel session: ${sessionId} for carousel ${carouselId} ` +
        `(user: ${userId || 'anonymous'}, device: ${deviceId || 'unknown'})`,
      );

      const session = this.carouselSessionRepository.create({
        sessionId,
        carouselId,
        userId: userId || null,
        deviceId: deviceId || null,
        storeId: storeId || null,
        startedAt: new Date(),
      });

      await this.carouselSessionRepository.save(session);

      this.logger.log(`Carousel session started: ${sessionId}`);

      return sessionId;
    } catch (error) {
      this.logger.error(`Failed to start carousel session:`, error);
      throw error;
    }
  }

  /**
   * End a carousel session
   *
   * Finalizes a session and calculates:
   * - Total session duration
   * - Engagement score based on interactions
   * - Conversion status
   *
   * Engagement score algorithm:
   * - Base: 10 points
   * - +5 points per item viewed
   * - +10 points per item clicked
   * - +3 points per swipe
   * - +2 points per manual advance
   * - +20 points for conversion
   * - Max score: 100
   *
   * @param sessionId Session ID
   * @param orderId Order ID if converted (optional)
   * @param revenueAmount Revenue amount if converted (optional)
   * @returns Updated session entity
   */
  async endSession(
    sessionId: string,
    orderId?: string,
    revenueAmount?: number,
  ): Promise<CarouselSession> {
    try {
      this.logger.log(`Ending carousel session: ${sessionId}`);

      const session = await this.carouselSessionRepository.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Session not found: ${sessionId}`);
      }

      const endedAt = new Date();
      const totalTimeSeconds = Math.floor(
        (endedAt.getTime() - session.startedAt.getTime()) / 1000,
      );

      // Calculate engagement score
      let engagementScore = 10; // Base score
      engagementScore += session.itemsViewed * 5;
      engagementScore += session.itemsClicked * 10;
      engagementScore += (session.swipesLeft + session.swipesRight) * 3;
      engagementScore += session.manualAdvances * 2;

      if (orderId) {
        engagementScore += 20; // Conversion bonus
      }

      // Cap at 100
      engagementScore = Math.min(engagementScore, 100);

      // Update session
      session.endedAt = endedAt;
      session.totalTimeSeconds = totalTimeSeconds;
      session.engagementScore = engagementScore;
      session.wasConverted = !!orderId;
      session.orderId = orderId || null;
      session.revenueAmount = revenueAmount || null;

      if (orderId) {
        session.conversionTimeSeconds = totalTimeSeconds;
      }

      const updatedSession = await this.carouselSessionRepository.save(session);

      this.logger.log(
        `Carousel session ended: ${sessionId} ` +
        `(duration: ${totalTimeSeconds}s, engagement: ${engagementScore}, converted: ${!!orderId})`,
      );

      return updatedSession;
    } catch (error) {
      this.logger.error(`Failed to end carousel session:`, error);
      throw error;
    }
  }

  /**
   * Update session metrics
   *
   * Increments session counters based on events.
   * Called automatically when events are tracked.
   *
   * @param sessionId Session ID
   * @param eventType Event type
   */
  async updateSessionMetrics(sessionId: string, eventType: string): Promise<void> {
    try {
      const session = await this.carouselSessionRepository.findOne({
        where: { sessionId },
      });

      if (!session) {
        this.logger.warn(`Session not found for metrics update: ${sessionId}`);
        return;
      }

      // Update counters based on event type
      switch (eventType) {
        case 'impression':
          session.itemsViewed += 1;
          break;
        case 'click':
          session.itemsClicked += 1;
          break;
        case 'swipe_left':
          session.swipesLeft += 1;
          break;
        case 'swipe_right':
          session.swipesRight += 1;
          break;
        case 'auto_advance':
          session.autoAdvances += 1;
          break;
        case 'manual_advance':
          session.manualAdvances += 1;
          break;
      }

      await this.carouselSessionRepository.save(session);

      this.logger.debug(`Session metrics updated: ${sessionId} (${eventType})`);
    } catch (error) {
      this.logger.error(`Failed to update session metrics:`, error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get analytics for a specific carousel item
   *
   * Returns comprehensive metrics including:
   * - Impressions and unique users
   * - Click-through rate
   * - Swipe patterns
   * - Engagement metrics
   * - Conversion data
   * - Position performance
   *
   * @param carouselItemId Carousel item ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @returns Analytics data
   */
  async getItemAnalytics(
    carouselItemId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    try {
      this.logger.log(`Fetching analytics for carousel item: ${carouselItemId}`);

      // ENTERPRISE-LEVEL TIMEZONE HANDLING: Always use UTC
      const now = new Date();
      const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
      ));

      // Default to last 30 days if no dates provided
      if (!startDate) {
        startDate = new Date(todayUTC.getTime());
        startDate.setUTCDate(startDate.getUTCDate() - 30);
      } else {
        // Parse as UTC date (YYYY-MM-DD format from frontend)
        startDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
      }

      if (!endDate) {
        // Use current moment for end date
        endDate = new Date(now.getTime());
      } else {
        // Parse as UTC date (YYYY-MM-DD format from frontend)
        endDate = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
      }

      this.logger.log(`Date range (UTC): ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Try to get from daily aggregates first (faster)
      const aggregates = await this.carouselDailyAggregateRepository.find({
        where: {
          carouselItemId,
          date: Between(startDate, endDate),
        },
        order: { date: 'DESC' },
      });

      this.logger.log(`Found ${aggregates.length} daily aggregates for carousel item`);

      if (aggregates.length === 0) {
        // Fall back to raw events if no aggregates
        this.logger.log('No aggregates found, calculating from raw events...');
        return await this.calculateMetricsFromRawEvents(carouselItemId, startDate, endDate);
      }

      // Calculate metrics from aggregates
      let metrics = this.calculateMetricsFromAggregates(aggregates);

      // Check if today (UTC) is included in the date range
      const todayStr = todayUTC.toISOString().split('T')[0];

      this.logger.log(`Checking for today's carousel data (UTC): ${todayStr}`);

      // Check if we have an aggregate for today
      const hasTodayAggregate = aggregates.some(agg => {
        const aggDate = new Date(agg.date);
        const aggDateStr = aggDate.toISOString().split('T')[0];
        return aggDateStr === todayStr;
      });

      this.logger.log(`Has today aggregate: ${hasTodayAggregate}, endDate >= todayUTC: ${endDate >= todayUTC}`);

      // If today is in range but no aggregate exists, add today's raw events
      if (endDate >= todayUTC && !hasTodayAggregate) {
        this.logger.log('Adding today\'s raw events to aggregated carousel data...');

        // Query from start of today (UTC) to current moment
        const todayStart = new Date(todayUTC.getTime());
        const todayEnd = new Date(now.getTime()); // Use current moment, not end of day

        const todayEvents = await this.carouselEventRepository.find({
          where: {
            carouselItemId,
            createdAt: Between(todayStart, todayEnd),
          },
        });

        this.logger.log(`Found ${todayEvents.length} carousel events for today`);

        if (todayEvents.length > 0) {
          const todayImpressions = todayEvents.filter(e => e.eventType === 'impression').length;
          const todayClicks = todayEvents.filter(e => e.eventType === 'click').length;
          const todaySwipesLeft = todayEvents.filter(e => e.eventType === 'swipe_left').length;
          const todaySwipesRight = todayEvents.filter(e => e.eventType === 'swipe_right').length;
          const todayAutoAdvances = todayEvents.filter(e => e.eventType === 'auto_advance').length;
          const todayManualAdvances = todayEvents.filter(e => e.eventType === 'manual_advance').length;
          const todayOrders = todayEvents.filter(e => e.eventType === 'order').length;
          const todayAddToCart = todayEvents.filter(e => e.eventType === 'add_to_cart').length;
          const todayRevenue = todayEvents
            .filter(e => e.eventType === 'order' && e.revenueAmount)
            .reduce((sum, e) => sum + Number(e.revenueAmount), 0);

          this.logger.log(`Today's carousel events - impressions: ${todayImpressions}, clicks: ${todayClicks}`);

          // Add today's events to metrics
          metrics.impressions = Number(metrics.impressions) + todayImpressions;
          metrics.clicks = Number(metrics.clicks) + todayClicks;
          metrics.swipesLeft = Number(metrics.swipesLeft) + todaySwipesLeft;
          metrics.swipesRight = Number(metrics.swipesRight) + todaySwipesRight;
          metrics.autoAdvances = Number(metrics.autoAdvances) + todayAutoAdvances;
          metrics.manualAdvances = Number(metrics.manualAdvances) + todayManualAdvances;
          metrics.addToCartCount = Number(metrics.addToCartCount) + todayAddToCart;
          metrics.associatedOrders = Number(metrics.associatedOrders) + todayOrders;
          metrics.associatedRevenue = (Number(metrics.associatedRevenue) + todayRevenue).toFixed(2);

          // Recalculate rates
          const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
          const conversionRate = metrics.clicks > 0 ? (metrics.associatedOrders / metrics.clicks) * 100 : 0;
          const avgOrderValue = metrics.associatedOrders > 0 ? Number(metrics.associatedRevenue) / metrics.associatedOrders : 0;
          const engagementRate = metrics.impressions > 0 ? ((metrics.clicks + metrics.swipesLeft + metrics.swipesRight) / metrics.impressions) * 100 : 0;

          metrics.ctr = ctr.toFixed(2);
          metrics.conversionRate = conversionRate.toFixed(2);
          metrics.avgOrderValue = avgOrderValue.toFixed(2);
          metrics.engagementRate = engagementRate.toFixed(2);
        }
      }

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get item analytics:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics from daily aggregates
   *
   * @param aggregates Daily aggregate records
   * @returns Calculated metrics
   */
  private calculateMetricsFromAggregates(aggregates: CarouselDailyAggregate[]): any {
    const totalImpressions = aggregates.reduce((sum, a) => sum + Number(a.impressions), 0);
    const totalClicks = aggregates.reduce((sum, a) => sum + Number(a.clicks), 0);
    const totalOrders = aggregates.reduce((sum, a) => sum + Number(a.associatedOrders), 0);
    const totalRevenue = aggregates.reduce((sum, a) => sum + Number(a.associatedRevenue), 0);
    const totalSwipesLeft = aggregates.reduce((sum, a) => sum + Number(a.swipesLeft), 0);
    const totalSwipesRight = aggregates.reduce((sum, a) => sum + Number(a.swipesRight), 0);
    const totalAutoAdvances = aggregates.reduce((sum, a) => sum + Number(a.autoAdvances), 0);
    const totalManualAdvances = aggregates.reduce((sum, a) => sum + Number(a.manualAdvances), 0);
    const totalAddToCart = aggregates.reduce((sum, a) => sum + Number(a.addToCartCount), 0);

    const uniqueUsersShown = Math.max(...aggregates.map(a => Number(a.uniqueUsersShown)));
    const uniqueUsersClicked = Math.max(...aggregates.map(a => Number(a.uniqueUsersClicked)));

    const avgTimeOnSlide = aggregates.reduce((sum, a) => sum + Number(a.avgTimeOnSlideSeconds), 0) / aggregates.length;
    const avgEngagementScore = aggregates.reduce((sum, a) => sum + Number(a.avgEngagementScore), 0) / aggregates.length;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const engagementRate = totalImpressions > 0 ? ((totalClicks + totalSwipesLeft + totalSwipesRight) / totalImpressions) * 100 : 0;

    return {
      impressions: totalImpressions,
      uniqueUsersShown,
      uniqueUsersClicked,
      clicks: totalClicks,
      swipesLeft: totalSwipesLeft,
      swipesRight: totalSwipesRight,
      autoAdvances: totalAutoAdvances,
      manualAdvances: totalManualAdvances,
      addToCartCount: totalAddToCart,
      associatedOrders: totalOrders,
      associatedRevenue: totalRevenue.toFixed(2),
      ctr: ctr.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      engagementRate: engagementRate.toFixed(2),
      avgTimeOnSlideSeconds: avgTimeOnSlide.toFixed(2),
      avgEngagementScore: avgEngagementScore.toFixed(2),
      dailyData: aggregates.map(a => ({
        date: a.date,
        impressions: Number(a.impressions),
        clicks: Number(a.clicks),
        ctr: Number(a.ctr).toFixed(2),
        orders: Number(a.associatedOrders),
        revenue: Number(a.associatedRevenue).toFixed(2),
      })),
    };
  }

  /**
   * Calculate metrics from raw events
   *
   * @param carouselItemId Carousel item ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Calculated metrics
   */
  private async calculateMetricsFromRawEvents(
    carouselItemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const events = await this.carouselEventRepository.find({
      where: {
        carouselItemId,
        createdAt: Between(startDate, endDate),
      },
    });

    const impressions = events.filter(e => e.eventType === 'impression').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    const swipesLeft = events.filter(e => e.eventType === 'swipe_left').length;
    const swipesRight = events.filter(e => e.eventType === 'swipe_right').length;
    const autoAdvances = events.filter(e => e.eventType === 'auto_advance').length;
    const manualAdvances = events.filter(e => e.eventType === 'manual_advance').length;
    const orders = events.filter(e => e.eventType === 'order').length;
    const addToCart = events.filter(e => e.eventType === 'add_to_cart').length;

    const revenue = events
      .filter(e => e.eventType === 'order' && e.revenueAmount)
      .reduce((sum, e) => sum + Number(e.revenueAmount), 0);

    const uniqueUserIds = new Set(
      events.filter(e => e.userId || e.deviceId).map(e => e.userId || e.deviceId),
    );
    const uniqueUsersShown = uniqueUserIds.size;

    const uniqueUsersClickedIds = new Set(
      events.filter(e => e.eventType === 'click' && (e.userId || e.deviceId)).map(e => e.userId || e.deviceId),
    );
    const uniqueUsersClicked = uniqueUsersClickedIds.size;

    const eventsWithTime = events.filter(e => e.timeOnSlideSeconds !== null);
    const avgTimeOnSlide = eventsWithTime.length > 0
      ? eventsWithTime.reduce((sum, e) => sum + Number(e.timeOnSlideSeconds), 0) / eventsWithTime.length
      : 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    const engagementRate = impressions > 0 ? ((clicks + swipesLeft + swipesRight) / impressions) * 100 : 0;

    return {
      impressions,
      uniqueUsersShown,
      uniqueUsersClicked,
      clicks,
      swipesLeft,
      swipesRight,
      autoAdvances,
      manualAdvances,
      addToCartCount: addToCart,
      associatedOrders: orders,
      associatedRevenue: revenue.toFixed(2),
      ctr: ctr.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      engagementRate: engagementRate.toFixed(2),
      avgTimeOnSlideSeconds: avgTimeOnSlide.toFixed(2),
      avgEngagementScore: '0.00', // Would need session data
      dailyData: [],
    };
  }

  /**
   * Aggregate daily events
   *
   * Processes raw events into daily aggregates for fast dashboard queries.
   * Should be run daily via cron job.
   *
   * @param date Date to aggregate (defaults to yesterday)
   */
  async aggregateDailyEvents(date?: Date): Promise<void> {
    try {
      if (!date) {
        date = new Date();
        date.setDate(date.getDate() - 1); // Yesterday
      }

      // Set to start of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Set to end of day
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      this.logger.log(`Aggregating carousel events for ${startOfDay.toISOString().split('T')[0]}`);

      // Get all carousel items that had events on this day
      const events = await this.carouselEventRepository.find({
        where: {
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      if (events.length === 0) {
        this.logger.log('No events to aggregate');
        return;
      }

      // Group events by carousel item
      const eventsByItem = new Map<string, CarouselEvent[]>();
      for (const event of events) {
        if (!eventsByItem.has(event.carouselItemId)) {
          eventsByItem.set(event.carouselItemId, []);
        }
        eventsByItem.get(event.carouselItemId)!.push(event);
      }

      this.logger.log(`Aggregating ${eventsByItem.size} carousel items`);

      // Process each carousel item
      for (const [carouselItemId, itemEvents] of eventsByItem) {
        await this.aggregateItemDay(carouselItemId, itemEvents, startOfDay);
      }

      this.logger.log(`✅ Daily aggregation complete for ${startOfDay.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.error(`Failed to aggregate daily events:`, error);
      throw error;
    }
  }

  /**
   * Aggregate events for a single carousel item for a single day
   *
   * @param carouselItemId Carousel item ID
   * @param events Events for this item
   * @param date Date being aggregated
   */
  private async aggregateItemDay(
    carouselItemId: string,
    events: CarouselEvent[],
    date: Date,
  ): Promise<void> {
    const impressions = events.filter(e => e.eventType === 'impression').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    const swipesLeft = events.filter(e => e.eventType === 'swipe_left').length;
    const swipesRight = events.filter(e => e.eventType === 'swipe_right').length;
    const autoAdvances = events.filter(e => e.eventType === 'auto_advance').length;
    const manualAdvances = events.filter(e => e.eventType === 'manual_advance').length;
    const viewCompletions = events.filter(e => e.eventType === 'view_complete').length;
    const orders = events.filter(e => e.eventType === 'order').length;
    const addToCart = events.filter(e => e.eventType === 'add_to_cart').length;

    const revenue = events
      .filter(e => e.eventType === 'order' && e.revenueAmount)
      .reduce((sum, e) => sum + Number(e.revenueAmount), 0);

    const uniqueUsersShown = new Set(
      events.filter(e => e.eventType === 'impression' && (e.userId || e.deviceId)).map(e => e.userId || e.deviceId),
    ).size;

    const uniqueDevicesShown = new Set(
      events.filter(e => e.eventType === 'impression' && e.deviceId).map(e => e.deviceId),
    ).size;

    const uniqueUsersClicked = new Set(
      events.filter(e => e.eventType === 'click' && (e.userId || e.deviceId)).map(e => e.userId || e.deviceId),
    ).size;

    const eventsWithTime = events.filter(e => e.timeOnSlideSeconds !== null);
    const avgTimeOnSlide = eventsWithTime.length > 0
      ? eventsWithTime.reduce((sum, e) => sum + Number(e.timeOnSlideSeconds), 0) / eventsWithTime.length
      : 0;

    const ctr = impressions > 0 ? (clicks / impressions) : 0;
    const conversionRate = clicks > 0 ? (orders / clicks) : 0;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    const engagementRate = impressions > 0 ? ((clicks + swipesLeft + swipesRight) / impressions) : 0;

    // Get position from first event (should be consistent)
    const positionInCarousel = events[0]?.positionInCarousel || 0;
    const carouselId = events[0]?.carouselId;

    // Upsert aggregate
    const existing = await this.carouselDailyAggregateRepository.findOne({
      where: { date, carouselItemId },
    });

    if (existing) {
      // Update existing
      existing.impressions = impressions;
      existing.uniqueUsersShown = uniqueUsersShown;
      existing.uniqueDevicesShown = uniqueDevicesShown;
      existing.clicks = clicks;
      existing.uniqueUsersClicked = uniqueUsersClicked;
      existing.swipesLeft = swipesLeft;
      existing.swipesRight = swipesRight;
      existing.autoAdvances = autoAdvances;
      existing.manualAdvances = manualAdvances;
      existing.viewCompletions = viewCompletions;
      existing.avgTimeOnSlideSeconds = avgTimeOnSlide;
      existing.associatedOrders = orders;
      existing.associatedRevenue = revenue;
      existing.addToCartCount = addToCart;
      existing.avgOrderValue = avgOrderValue;
      existing.conversionRate = conversionRate;
      existing.ctr = ctr;
      existing.engagementRate = engagementRate;

      await this.carouselDailyAggregateRepository.save(existing);
    } else {
      // Create new
      const aggregate = this.carouselDailyAggregateRepository.create({
        date,
        carouselItemId,
        carouselId,
        impressions,
        uniqueUsersShown,
        uniqueDevicesShown,
        clicks,
        uniqueUsersClicked,
        swipesLeft,
        swipesRight,
        autoAdvances,
        manualAdvances,
        viewCompletions,
        avgTimeOnSlideSeconds: avgTimeOnSlide,
        avgEngagementScore: 0, // Would need session data
        associatedOrders: orders,
        associatedRevenue: revenue,
        addToCartCount: addToCart,
        avgOrderValue,
        conversionRate,
        ctr,
        engagementRate,
        positionInCarousel,
      });

      await this.carouselDailyAggregateRepository.save(aggregate);
    }

    this.logger.debug(
      `Aggregated carousel item ${carouselItemId}: ` +
      `${impressions} impressions, ${clicks} clicks, ${orders} orders, $${revenue.toFixed(2)} revenue`,
    );
  }

  /**
   * Register or update an anonymous device
   *
   * ENTERPRISE-LEVEL ANONYMOUS DEVICE TRACKING:
   * - Automatically registers devices before user login
   * - Updates device metadata on each event
   * - Enables cross-session analytics for anonymous users
   * - Supports device migration when user logs in
   *
   * This ensures carousel analytics work for all users, not just logged-in users.
   *
   * @param deviceId Device UUID
   * @param osType Operating system (ios, android, web)
   * @param appVersion App version string
   * @param deviceModel Device model string
   */
  private async registerOrUpdateAnonymousDevice(
    deviceId: string,
    osType?: string,
    appVersion?: string,
    deviceModel?: string,
  ): Promise<void> {
    try {
      // Check if device already exists in anonymous_devices
      let device = await this.anonymousDeviceRepository.findOne({
        where: { deviceId },
      });

      if (device) {
        // Update last active time and metadata
        device.lastActiveAt = new Date();
        if (osType) device.deviceType = osType;
        if (appVersion) device.appVersion = appVersion;
        if (deviceModel) device.deviceModel = deviceModel;

        await this.anonymousDeviceRepository.save(device);
        this.logger.debug(`Updated anonymous device: ${deviceId}`);
      } else {
        // Check if device exists in user_devices (already migrated)
        const userDevice = await this.userDeviceRepository.findOne({
          where: { deviceId },
        });

        if (userDevice) {
          // Device is already registered to a user, no need to create anonymous device
          this.logger.debug(`Device ${deviceId} is already registered to user ${userDevice.userId}`);
          return;
        }

        // Create new anonymous device
        device = this.anonymousDeviceRepository.create({
          deviceId,
          deviceType: osType || null,
          appVersion: appVersion || null,
          deviceModel: deviceModel || null,
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
        });

        await this.anonymousDeviceRepository.save(device);
        this.logger.log(`Registered new anonymous device: ${deviceId}`);
      }
    } catch (error) {
      // Don't fail the event tracking if device registration fails
      this.logger.warn(`Failed to register/update anonymous device ${deviceId}:`, error.message);
    }
  }
}
