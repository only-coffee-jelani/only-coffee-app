import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SplashEvent,
  SplashSession,
  SplashDailyAggregate,
  SplashScreen,
  AnonymousDevice,
} from '@shared/database/entities';
import {
  TrackSplashEventDto,
  StartSplashSessionDto,
  EndSplashSessionDto,
  GetSplashAnalyticsDto,
  AnalyticsTimeRange,
} from './dto';
import { AnonymousDeviceService } from './anonymous-device.service';

@Injectable()
export class SplashAnalyticsService {
  private readonly logger = new Logger(SplashAnalyticsService.name);

  constructor(
    @InjectRepository(SplashEvent)
    private readonly splashEventRepository: Repository<SplashEvent>,
    @InjectRepository(SplashSession)
    private readonly splashSessionRepository: Repository<SplashSession>,
    @InjectRepository(SplashDailyAggregate)
    private readonly splashDailyAggregateRepository: Repository<SplashDailyAggregate>,
    @InjectRepository(SplashScreen)
    private readonly splashScreenRepository: Repository<SplashScreen>,
    @InjectRepository(AnonymousDevice)
    private readonly anonymousDeviceRepository: Repository<AnonymousDevice>,
    private readonly anonymousDeviceService: AnonymousDeviceService,
  ) {}

  /**
   * Track a splash event (impression, click, skip, complete, order)
   */
  async trackEvent(data: TrackSplashEventDto): Promise<SplashEvent> {
    try {
      this.logger.log(`Received trackEvent with deviceId: ${data.deviceId}, userId: ${data.userId}`);

      // Register or update anonymous device if deviceId is provided and user is not logged in
      if (data.deviceId && !data.userId) {
        await this.anonymousDeviceService.registerAnonymousDevice(
          data.deviceId,
          data.osType,
          data.appVersion,
          undefined, // osVersion not in DTO
          data.deviceModel,
        );
      }

      const now = new Date();
      const event = this.splashEventRepository.create({
        splashId: data.splashId,
        userId: data.userId || null,
        deviceId: data.deviceId || null,
        storeId: data.storeId || null,
        segmentId: data.segmentId || null,
        orderId: data.orderId || null,
        eventType: data.eventType,
        viewTimeSeconds: data.viewTimeSeconds || null,
        revenueAmount: data.revenueAmount || null,
        experimentGroup: data.experimentGroup || null,
        appVersion: data.appVersion || null,
        osType: data.osType as any || null,
        deviceModel: data.deviceModel || null,
        clientTimestamp: now,
        serverTimestamp: now,
      });

      const savedEvent = await this.splashEventRepository.save(event);

      this.logger.log(
        `Splash event tracked: ${data.eventType} for splash ${data.splashId} (deviceId: ${savedEvent.deviceId})`,
      );

      return savedEvent;
    } catch (error) {
      this.logger.error(`Failed to track splash event:`, error);
      throw error;
    }
  }

  /**
   * Start a splash session
   */
  async startSession(data: StartSplashSessionDto): Promise<SplashSession> {
    try {
      // Generate a UUID for sessionId
      const sessionId = require('crypto').randomUUID();

      this.logger.log(`Creating splash session with data: ${JSON.stringify({
        splashId: data.splashId,
        sessionId: sessionId,
        userId: data.userId,
        deviceId: data.deviceId,
        storeId: data.storeId,
      })}`);

      const session = this.splashSessionRepository.create({
        splashId: data.splashId,
        sessionId: sessionId,
        userId: data.userId || null,
        deviceId: data.deviceId || null,
        storeId: data.storeId || null,
        segmentId: null, // Set to null for now
        experimentGroup: data.experimentGroup || null,
        appVersion: data.appVersion || null,
        osType: data.osType || null,
        deviceModel: data.deviceModel || null,
        startedAt: new Date(),
      });

      this.logger.log(`Saving splash session...`);
      const savedSession = await this.splashSessionRepository.save(session);

      this.logger.log(`Splash session started: ${savedSession.sessionId} for splash ${data.splashId}`);

      return savedSession;
    } catch (error) {
      this.logger.error(`Failed to start splash session:`, error);
      this.logger.error(`Error stack:`, error.stack);
      this.logger.error(`Error message:`, error.message);
      throw error;
    }
  }

  /**
   * End a splash session
   */
  async endSession(data: EndSplashSessionDto): Promise<SplashSession> {
    try {
      const session = await this.splashSessionRepository.findOne({
        where: { splashSessionId: data.sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Splash session ${data.sessionId} not found`);
      }

      session.endedAt = new Date();
      session.wasSkipped = data.wasSkipped ?? false;
      session.wasClicked = data.wasClicked ?? false;
      session.autoCompleted = data.autoCompleted ?? false;
      session.wasConverted = data.wasConverted ?? false;
      session.orderId = data.orderId || null;

      // Calculate total time in seconds
      if (session.startedAt && session.endedAt) {
        session.totalTimeSeconds = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
      }

      const updatedSession = await this.splashSessionRepository.save(session);

      this.logger.log(`Splash session ended: ${data.sessionId}`);

      return updatedSession;
    } catch (error) {
      this.logger.error(`Failed to end splash session:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for splash screens
   */
  async getAnalytics(query: GetSplashAnalyticsDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(query.timeRange, query.startDate, query.endDate);

      // Build where clause
      const where: any = {
        date: Between(startDate, endDate),
      };

      if (query.splashId) {
        where.splashId = query.splashId;
      }

      // Fetch daily aggregates
      const aggregates = await this.splashDailyAggregateRepository.find({
        where,
        order: { date: 'DESC' },
      });

      // If no aggregates found, calculate from raw events
      if (aggregates.length === 0) {
        this.logger.log('No daily aggregates found, calculating from raw events...');
        return await this.getAnalyticsFromRawEvents(startDate, endDate, query.splashId);
      }

      // Calculate totals
      const totals = aggregates.reduce(
        (acc, agg) => ({
          impressions: acc.impressions + Number(agg.impressions),
          clicks: acc.clicks + Number(agg.clicks),
          skips: acc.skips + Number(agg.skips),
          completions: acc.completions + Number(agg.completions),
          orders: acc.orders + Number(agg.associatedOrders),
          revenue: acc.revenue + Number(agg.associatedRevenue),
          uniqueUsers: Math.max(acc.uniqueUsers, Number(agg.uniqueUsersShown)),
          totalViewTime: acc.totalViewTime + Number(agg.avgViewTimeSeconds || 0) * Number(agg.impressions),
        }),
        { impressions: 0, clicks: 0, skips: 0, completions: 0, orders: 0, revenue: 0, uniqueUsers: 0, totalViewTime: 0 },
      );

      // Calculate rates
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const skipRate = totals.impressions > 0 ? (totals.skips / totals.impressions) * 100 : 0;
      const conversionRate = totals.clicks > 0 ? (totals.orders / totals.clicks) * 100 : 0;
      const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;
      const avgViewTime = totals.impressions > 0 ? totals.totalViewTime / totals.impressions : 0;

      // Get unique users who clicked (from raw events since aggregates don't track this)
      const uniqueUsersClicked = await this.getUniqueUsersClicked(startDate, endDate, query.splashId);

      return {
        summary: {
          impressions: totals.impressions,
          clicks: totals.clicks,
          skips: totals.skips,
          completions: totals.completions,
          orders: totals.orders,
          revenue: totals.revenue.toFixed(2),
          uniqueUsers: totals.uniqueUsers,
          uniqueUsersClicked,
          ctr: ctr.toFixed(2),
          skipRate: skipRate.toFixed(2),
          conversionRate: conversionRate.toFixed(2),
          avgOrderValue: avgOrderValue.toFixed(2),
          avgViewTime: avgViewTime.toFixed(1),
        },
        daily: aggregates.map((agg) => ({
          date: agg.date,
          impressions: Number(agg.impressions),
          clicks: Number(agg.clicks),
          skips: Number(agg.skips),
          completions: Number(agg.completions),
          orders: Number(agg.associatedOrders),
          revenue: Number(agg.associatedRevenue).toFixed(2),
          ctr: Number(agg.ctr).toFixed(2),
          skipRate: Number(agg.skipRate).toFixed(2),
          conversionRate: Number(agg.conversionRate).toFixed(2),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get splash analytics:`, error);
      throw error;
    }
  }

  /**
   * Get date range based on time range enum
   */
  private getDateRange(
    timeRange?: AnalyticsTimeRange,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
      case AnalyticsTimeRange.TODAY:
        return { startDate: today, endDate: now };

      case AnalyticsTimeRange.YESTERDAY:
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { startDate: yesterday, endDate: today };

      case AnalyticsTimeRange.LAST_7_DAYS:
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return { startDate: last7Days, endDate: now };

      case AnalyticsTimeRange.LAST_30_DAYS:
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        return { startDate: last30Days, endDate: now };

      case AnalyticsTimeRange.LAST_90_DAYS:
        const last90Days = new Date(today);
        last90Days.setDate(last90Days.getDate() - 90);
        return { startDate: last90Days, endDate: now };

      case AnalyticsTimeRange.CUSTOM:
        if (customStart && customEnd) {
          return { startDate: new Date(customStart), endDate: new Date(customEnd) };
        }
        // Fall through to default if no custom dates provided
        break;

      default:
        // Default to last 30 days
        const defaultStart = new Date(today);
        defaultStart.setDate(defaultStart.getDate() - 30);
        return { startDate: defaultStart, endDate: now };
    }
  }

  /**
   * Get analytics from raw events (fallback when no aggregates exist)
   */
  private async getAnalyticsFromRawEvents(
    startDate: Date,
    endDate: Date,
    splashId?: string,
  ): Promise<any> {
    try {
      const where: any = {
        serverTimestamp: Between(startDate, endDate),
      };

      if (splashId) {
        where.splashId = splashId;
      }

      // Fetch all events in the date range
      const events = await this.splashEventRepository.find({ where });

      if (events.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate metrics from raw events
      const impressions = events.filter((e) => e.eventType === 'impression').length;
      const clicks = events.filter((e) => e.eventType === 'click').length;
      const skips = events.filter((e) => e.eventType === 'skip').length;
      const completions = events.filter((e) => e.eventType === 'complete').length;
      const orders = events.filter((e) => e.eventType === 'order').length;
      const revenue = events
        .filter((e) => e.eventType === 'order' && e.revenueAmount)
        .reduce((sum, e) => sum + Number(e.revenueAmount), 0);

      // Get unique users (use deviceId if userId is not available)
      const uniqueUserIds = new Set(
        events
          .filter((e) => e.userId || e.deviceId)
          .map((e) => e.userId || e.deviceId)
      );
      const uniqueUsers = uniqueUserIds.size;

      // Get unique users who clicked
      const uniqueUsersClickedIds = new Set(
        events
          .filter((e) => e.eventType === 'click' && (e.userId || e.deviceId))
          .map((e) => e.userId || e.deviceId)
      );
      const uniqueUsersClicked = uniqueUsersClickedIds.size;

      // Calculate average view time
      const eventsWithViewTime = events.filter((e) => e.viewTimeSeconds !== null && e.viewTimeSeconds !== undefined);
      const totalViewTime = eventsWithViewTime.reduce((sum, e) => sum + Number(e.viewTimeSeconds), 0);
      const avgViewTime = eventsWithViewTime.length > 0 ? totalViewTime / eventsWithViewTime.length : 0;

      // Calculate rates
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const skipRate = impressions > 0 ? (skips / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
      const avgOrderValue = orders > 0 ? revenue / orders : 0;

      return {
        summary: {
          impressions,
          clicks,
          skips,
          completions,
          orders,
          revenue: revenue.toFixed(2),
          uniqueUsers,
          uniqueUsersClicked,
          ctr: ctr.toFixed(2),
          skipRate: skipRate.toFixed(2),
          conversionRate: conversionRate.toFixed(2),
          avgOrderValue: avgOrderValue.toFixed(2),
          avgViewTime: avgViewTime.toFixed(1),
        },
        daily: [], // Raw events don't have daily breakdown
      };
    } catch (error) {
      this.logger.error('Failed to get analytics from raw events:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Get unique users who clicked from raw events
   */
  private async getUniqueUsersClicked(
    startDate: Date,
    endDate: Date,
    splashId?: string,
  ): Promise<number> {
    try {
      const query = this.splashEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT COALESCE(event.userId, event.deviceId))', 'count')
        .where('event.eventType = :eventType', { eventType: 'click' })
        .andWhere('event.createdAt >= :startDate', { startDate })
        .andWhere('event.createdAt < :endDate', { endDate });

      if (splashId) {
        query.andWhere('event.splashId = :splashId', { splashId });
      }

      const result = await query.getRawOne();
      return parseInt(result.count, 10) || 0;
    } catch (error) {
      this.logger.error('Failed to get unique users clicked:', error);
      return 0;
    }
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(): any {
    return {
      summary: {
        impressions: 0,
        clicks: 0,
        skips: 0,
        completions: 0,
        orders: 0,
        revenue: '0.00',
        uniqueUsers: 0,
        uniqueUsersClicked: 0,
        ctr: '0.00',
        skipRate: '0.00',
        conversionRate: '0.00',
        avgOrderValue: '0.00',
        avgViewTime: '0.0',
      },
      daily: [],
    };
  }

  /**
   * Daily aggregation cron job - runs at 2 AM CST every day
   * Aggregates yesterday's splash events into daily aggregates table
   */
  @Cron('0 0 2 * * *', {
    name: 'aggregate-splash-events-daily',
    timeZone: 'America/Chicago',
  })
  async aggregateDailyEvents(): Promise<void> {
    this.logger.log('Running daily splash events aggregation job...');

    try {
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all unique splash IDs from yesterday's events
      const splashIds = await this.splashEventRepository
        .createQueryBuilder('event')
        .select('DISTINCT event.splashId', 'splashId')
        .where('event.createdAt >= :yesterday', { yesterday })
        .andWhere('event.createdAt < :today', { today })
        .getRawMany();

      this.logger.log(`Found ${splashIds.length} splash screens with events yesterday`);

      // Aggregate events for each splash screen
      for (const { splashId } of splashIds) {
        await this.aggregateEventsForSplash(splashId, yesterday);
      }

      this.logger.log(`Daily aggregation completed for ${splashIds.length} splash screens`);
    } catch (error) {
      this.logger.error('Error in daily splash events aggregation:', error);
    }
  }

  /**
   * Aggregate events for a specific splash screen and date
   */
  private async aggregateEventsForSplash(splashId: string, date: Date): Promise<void> {
    try {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Count events by type
      const events = await this.splashEventRepository
        .createQueryBuilder('event')
        .select('event.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COUNT(DISTINCT event.userId)', 'uniqueUsers')
        .addSelect('SUM(event.viewTimeSeconds)', 'totalViewTime')
        .addSelect('SUM(event.revenueAmount)', 'totalRevenue')
        .where('event.splashId = :splashId', { splashId })
        .andWhere('event.createdAt >= :date', { date })
        .andWhere('event.createdAt < :nextDay', { nextDay })
        .groupBy('event.eventType')
        .getRawMany();

      // Parse event counts
      let impressions = 0;
      let clicks = 0;
      let skips = 0;
      let completions = 0;
      let orders = 0;
      let totalRevenue = 0;
      let totalViewTime = 0;
      let uniqueUsers = 0;

      for (const event of events) {
        const count = parseInt(event.count, 10);
        uniqueUsers = Math.max(uniqueUsers, parseInt(event.uniqueUsers, 10));

        switch (event.eventType) {
          case 'impression':
            impressions = count;
            break;
          case 'click':
            clicks = count;
            break;
          case 'skip':
            skips = count;
            break;
          case 'complete':
            completions = count;
            break;
          case 'order':
            orders = count;
            totalRevenue = parseFloat(event.totalRevenue || '0');
            break;
        }

        if (event.totalViewTime) {
          totalViewTime += parseFloat(event.totalViewTime);
        }
      }

      // Calculate rates
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const skipRate = impressions > 0 ? skips / impressions : 0;
      const conversionRate = clicks > 0 ? orders / clicks : 0;
      const avgOrderValue = orders > 0 ? totalRevenue / orders : 0;
      const avgViewTime = impressions > 0 ? totalViewTime / impressions : 0;

      // Check if aggregate already exists
      const existing = await this.splashDailyAggregateRepository.findOne({
        where: { splashId, date },
      });

      if (existing) {
        // Update existing aggregate
        existing.impressions = impressions;
        existing.clicks = clicks;
        existing.skips = skips;
        existing.completions = completions;
        existing.associatedOrders = orders;
        existing.uniqueUsersShown = uniqueUsers;
        existing.associatedRevenue = totalRevenue;
        existing.avgOrderValue = avgOrderValue;
        existing.conversionRate = conversionRate;
        existing.ctr = ctr;
        existing.skipRate = skipRate;
        existing.avgViewTimeSeconds = avgViewTime;

        await this.splashDailyAggregateRepository.save(existing);
        this.logger.log(`Updated daily aggregate for splash ${splashId} on ${date.toISOString().split('T')[0]}`);
      } else {
        // Create new aggregate
        const aggregate = this.splashDailyAggregateRepository.create({
          splashId,
          date,
          impressions,
          clicks,
          skips,
          completions,
          associatedOrders: orders,
          uniqueUsersShown: uniqueUsers,
          associatedRevenue: totalRevenue,
          avgOrderValue,
          conversionRate,
          ctr,
          skipRate,
          avgViewTimeSeconds: avgViewTime,
        });

        await this.splashDailyAggregateRepository.save(aggregate);
        this.logger.log(`Created daily aggregate for splash ${splashId} on ${date.toISOString().split('T')[0]}`);
      }
    } catch (error) {
      this.logger.error(`Error aggregating events for splash ${splashId}:`, error);
    }
  }
}

