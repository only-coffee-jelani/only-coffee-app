import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto';
import { EventType } from '@shared/database/entities';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Track a single event
   * POST /api/v1/events/track
   */
  @Post('track')
  @HttpCode(HttpStatus.CREATED)
  async trackEvent(@CurrentUser() user: any, @Body() trackEventDto: TrackEventDto) {
    const event = await this.eventsService.trackEvent(user.id, trackEventDto);
    return {
      success: true,
      event: {
        id: event.id,
        type: event.eventType,
        timestamp: event.timestamp,
      },
    };
  }

  /**
   * Track multiple events in a batch
   * POST /api/v1/events/track/batch
   */
  @Post('track/batch')
  @HttpCode(HttpStatus.CREATED)
  async trackEventsBatch(@CurrentUser() user: any, @Body() events: TrackEventDto[]) {
    const trackedEvents = await this.eventsService.trackEventsBatch(user.id, events);
    return {
      success: true,
      count: trackedEvents.length,
      events: trackedEvents.map((e) => ({
        id: e.id,
        type: e.eventType,
        timestamp: e.timestamp,
      })),
    };
  }

  /**
   * Get user's event history
   * GET /api/v1/events/history
   */
  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { events, total } = await this.eventsService.getUserEventHistory(
      user.id,
      limit ? parseInt(limit.toString(), 10) : 50,
      offset ? parseInt(offset.toString(), 10) : 0,
    );

    return {
      success: true,
      total,
      events: events.map((e) => ({
        id: e.id,
        type: e.eventType,
        timestamp: e.timestamp,
        metadata: e.metadata,
        sessionId: e.sessionId,
      })),
    };
  }

  /**
   * Get event count by type for current user
   * GET /api/v1/events/count/:eventType
   */
  @Get('count/:eventType')
  async getEventCount(@CurrentUser() user: any, @Param('eventType') eventType: EventType) {
    const count = await this.eventsService.getUserEventCount(user.id, eventType);
    return {
      success: true,
      eventType,
      count,
    };
  }

  /**
   * Get session activity
   * GET /api/v1/events/session/:sessionId
   */
  @Get('session/:sessionId')
  async getSessionActivity(@Param('sessionId') sessionId: string) {
    const events = await this.eventsService.getSessionActivity(sessionId);
    return {
      success: true,
      sessionId,
      events: events.map((e) => ({
        id: e.id,
        type: e.eventType,
        timestamp: e.timestamp,
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Get event statistics (admin only - TODO: add admin guard)
   * GET /api/v1/events/stats
   */
  @Get('stats')
  async getEventStats(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const stats = await this.eventsService.getEventStats(new Date(startDate), new Date(endDate));
    return {
      success: true,
      period: {
        start: startDate,
        end: endDate,
      },
      stats,
    };
  }
}
