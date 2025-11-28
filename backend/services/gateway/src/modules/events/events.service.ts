import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserEvent, EventType } from '@shared/database/entities';
import { TrackEventDto } from './dto';
import { WeatherService } from '../weather/weather.service';
import { KinesisService } from '../streaming/kinesis.service';

export interface EventQueryOptions {
  userId?: string;
  eventType?: EventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    private readonly weatherService: WeatherService,
    private readonly kinesisService: KinesisService,
  ) {}

  /**
   * Track a user event
   * Stores the event in PostgreSQL and optionally queues it for streaming
   */
  async trackEvent(userId: string, eventData: TrackEventDto): Promise<UserEvent> {
    try {
      // Enrich metadata with weather data if location is provided
      let enrichedMetadata = eventData.metadata || {};

      if (eventData.latitude !== undefined && eventData.longitude !== undefined) {
        const weather = await this.weatherService.getCurrentWeather(
          eventData.latitude,
          eventData.longitude,
        );

        if (weather) {
          enrichedMetadata = {
            ...enrichedMetadata,
            weather: {
              temperature: weather.temperature,
              temperatureFahrenheit: weather.temperatureFahrenheit,
              condition: weather.condition,
              isHot: weather.isHot,
              isCold: weather.isCold,
              isRaining: weather.isRaining,
              isSunny: weather.isSunny,
            },
          };
          this.logger.debug(
            `Event enriched with weather: ${weather.temperature}°C, ${weather.condition}`,
          );
        }
      }

      // Create event with enriched data
      // Note: UserEvent now only has eventId, userId, eventType, payload, createdAt
      // All metadata, sessionId, deviceType, etc. go into payload
      const event = this.userEventRepository.create({
        userId,
        eventType: eventData.eventType,
        payload: {
          metadata: enrichedMetadata,
          sessionId: eventData.sessionId || null,
          deviceType: eventData.deviceType || null,
          appVersion: eventData.appVersion || null,
          location: this.formatLocation(eventData.latitude, eventData.longitude),
          storeId: eventData.storeId || null,
        },
      });

      // Save to PostgreSQL for immediate access
      const savedEvent = await this.userEventRepository.save(event);

      // Stream to Kinesis for real-time processing (async, non-blocking)
      this.kinesisService.pushEvent(savedEvent).catch((err) => {
        this.logger.error(`Failed to stream event ${savedEvent.eventId} to Kinesis:`, err);
      });

      this.logger.log(
        `Event tracked: ${eventData.eventType} for user ${userId} (session: ${eventData.sessionId})`,
      );

      return savedEvent;
    } catch (error) {
      this.logger.error(`Failed to track event for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Track multiple events in a batch
   * More efficient for high-volume event tracking
   */
  async trackEventsBatch(userId: string, events: TrackEventDto[]): Promise<UserEvent[]> {
    try {
      const eventEntities = events.map((eventData) =>
        this.userEventRepository.create({
          userId,
          eventType: eventData.eventType,
          payload: {
            metadata: eventData.metadata || null,
            sessionId: eventData.sessionId || null,
            deviceType: eventData.deviceType || null,
            appVersion: eventData.appVersion || null,
            location: this.formatLocation(eventData.latitude, eventData.longitude),
            storeId: eventData.storeId || null,
          },
        }),
      );

      const savedEvents = await this.userEventRepository.save(eventEntities);

      // Stream to Kinesis in batch (async, non-blocking)
      this.kinesisService.pushEventsBatch(savedEvents).catch((err) => {
        this.logger.error(`Failed to stream ${savedEvents.length} events to Kinesis:`, err);
      });

      this.logger.log(`Batch tracked ${savedEvents.length} events for user ${userId}`);

      return savedEvents;
    } catch (error) {
      this.logger.error(`Failed to batch track events for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Query events with filters
   */
  async queryEvents(options: EventQueryOptions): Promise<{ events: UserEvent[]; total: number }> {
    const queryBuilder = this.userEventRepository.createQueryBuilder('event');

    if (options.userId) {
      queryBuilder.andWhere('event.userId = :userId', { userId: options.userId });
    }

    if (options.eventType) {
      queryBuilder.andWhere('event.eventType = :eventType', { eventType: options.eventType });
    }

    if (options.startDate) {
      queryBuilder.andWhere('event.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      queryBuilder.andWhere('event.createdAt <= :endDate', { endDate: options.endDate });
    }

    // Order by createdAt descending (most recent first)
    queryBuilder.orderBy('event.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (options.limit) {
      queryBuilder.take(options.limit);
    }
    if (options.offset) {
      queryBuilder.skip(options.offset);
    }

    const events = await queryBuilder.getMany();

    return { events, total };
  }

  /**
   * Get user event history
   */
  async getUserEventHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ events: UserEvent[]; total: number }> {
    return this.queryEvents({
      userId,
      limit,
      offset,
    });
  }

  /**
   * Get events by type for analytics
   */
  async getEventsByType(
    eventType: EventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserEvent[]> {
    const { events } = await this.queryEvents({
      eventType,
      startDate,
      endDate,
    });
    return events;
  }

  /**
   * Get event count by type for a user
   */
  async getUserEventCount(userId: string, eventType?: EventType): Promise<number> {
    const queryOptions: any = {
      userId,
    };

    if (eventType) {
      queryOptions.where = { eventType };
    }

    return this.userEventRepository.count(queryOptions);
  }

  /**
   * Get recent session activity
   */
  async getSessionActivity(sessionId: string): Promise<UserEvent[]> {
    // Note: sessionId is now stored in payload, not as a separate field
    // This query won't work as expected - needs refactoring
    this.logger.warn('getSessionActivity: sessionId is now in payload, query may not work correctly');
    return this.userEventRepository.find({
      order: { createdAt: 'ASC' },
      take: 100, // Limit results since we can't filter by sessionId directly
    });
  }

  /**
   * Get user's last event of a specific type
   */
  async getLastEventOfType(userId: string, eventType: EventType): Promise<UserEvent | null> {
    return this.userEventRepository.findOne({
      where: { userId, eventType },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Helper: Format latitude/longitude as PostGIS geography point
   */
  private formatLocation(latitude?: number, longitude?: number): string | null {
    if (latitude === undefined || longitude === undefined) {
      return null;
    }

    // PostGIS POINT format: SRID=4326;POINT(longitude latitude)
    // Note: PostGIS uses (longitude, latitude) order
    return `SRID=4326;POINT(${longitude} ${latitude})`;
  }

  /**
   * Get event statistics for a time period
   */
  async getEventStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{ eventType: EventType; count: number }[]> {
    const results = await this.userEventRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.eventType')
      .getRawMany();

    return results.map((r) => ({
      eventType: r.eventType,
      count: parseInt(r.count, 10),
    }));
  }
}
