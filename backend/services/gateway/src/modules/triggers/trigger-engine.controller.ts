import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  TriggerEngineService,
  TriggerResult,
  TriggerCondition,
  TriggerType,
} from './trigger-engine.service';

@Controller('triggers')
export class TriggerEngineController {
  constructor(
    private readonly triggerEngineService: TriggerEngineService,
  ) {}

  /**
   * Evaluate triggers for current user
   * POST /api/v1/triggers/evaluate
   */
  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluateTriggers(
    @Req() req: any,
    @Body() body: {
      eventType?: string;
      location?: { latitude: number; longitude: number };
      timestamp?: string;
    },
  ): Promise<{
    success: boolean;
    triggers: TriggerResult[];
    count: number;
  }> {
    const userId = req.user.userId;

    const triggers = await this.triggerEngineService.evaluateTriggers(userId, {
      eventType: body.eventType,
      location: body.location,
      timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
    });

    return {
      success: true,
      triggers,
      count: triggers.length,
    };
  }

  /**
   * Get all configured triggers (admin)
   * GET /api/v1/triggers
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllTriggers(): Promise<{
    success: boolean;
    triggers: TriggerCondition[];
  }> {
    // TODO: Add admin role check

    const triggers = await this.triggerEngineService.getAllTriggers();

    return {
      success: true,
      triggers,
    };
  }

  /**
   * Create or update trigger (admin)
   * POST /api/v1/triggers
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async upsertTrigger(
    @Body() trigger: TriggerCondition,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.triggerEngineService.upsertTrigger(trigger);

    return {
      success: true,
      message: 'Trigger updated successfully',
    };
  }

  /**
   * Remove trigger (admin)
   * DELETE /api/v1/triggers/:type (using POST for now)
   */
  @Post(':type/remove')
  @UseGuards(JwtAuthGuard)
  async removeTrigger(
    @Param('type') type: TriggerType,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.triggerEngineService.removeTrigger(type);

    return {
      success: true,
      message: 'Trigger removed successfully',
    };
  }

  /**
   * Clear trigger history for user (testing)
   * POST /api/v1/triggers/clear-history
   */
  @Post('clear-history')
  @UseGuards(JwtAuthGuard)
  async clearTriggerHistory(
    @Req() req: any,
    @Query('userId') userId?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Use current user if no userId provided (admin can specify)
    const targetUserId = userId || req.user.userId;

    await this.triggerEngineService.clearTriggerHistory(targetUserId);

    return {
      success: true,
      message: 'Trigger history cleared',
    };
  }

  /**
   * Test trigger evaluation (admin)
   * POST /api/v1/triggers/test
   */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  async testTriggers(
    @Body() body: {
      userId: string;
      triggerType?: TriggerType;
      context?: any;
    },
  ): Promise<{
    success: boolean;
    results: TriggerResult[];
    message: string;
  }> {
    // TODO: Add admin role check

    const results = await this.triggerEngineService.evaluateTriggers(
      body.userId,
      body.context,
    );

    const filtered = body.triggerType
      ? results.filter((r) => r.triggerType === body.triggerType)
      : results;

    return {
      success: true,
      results: filtered,
      message: `Evaluated ${filtered.length} triggers`,
    };
  }

  /**
   * Simulate trigger for user (bypass rate limiting for testing)
   * POST /api/v1/triggers/simulate
   */
  @Post('simulate')
  @UseGuards(JwtAuthGuard)
  async simulateTrigger(
    @Body() body: {
      userId: string;
      triggerType: TriggerType;
      mockContext?: any;
    },
  ): Promise<{
    success: boolean;
    result: TriggerResult | null;
    message: string;
  }> {
    // TODO: Add admin role check

    // Clear history to bypass rate limiting
    await this.triggerEngineService.clearTriggerHistory(body.userId);

    const results = await this.triggerEngineService.evaluateTriggers(
      body.userId,
      body.mockContext,
    );

    const result = results.find((r) => r.triggerType === body.triggerType) || null;

    return {
      success: true,
      result,
      message: result
        ? `Trigger ${body.triggerType} fired successfully`
        : `Trigger ${body.triggerType} did not fire`,
    };
  }

  /**
   * Batch evaluate triggers for multiple users (scheduled job)
   * POST /api/v1/triggers/batch-evaluate
   */
  @Post('batch-evaluate')
  @UseGuards(JwtAuthGuard)
  async batchEvaluateTriggers(
    @Body() body: {
      userIds: string[];
      triggerTypes?: TriggerType[];
    },
  ): Promise<{
    success: boolean;
    results: {
      userId: string;
      triggersCount: number;
      triggers: TriggerResult[];
    }[];
    summary: {
      totalUsers: number;
      totalTriggers: number;
      triggersByType: Record<string, number>;
    };
  }> {
    // TODO: Add admin role check
    // TODO: Add rate limiting for batch operations

    const results = [];
    const triggersByType: Record<string, number> = {};

    for (const userId of body.userIds) {
      const triggers = await this.triggerEngineService.evaluateTriggers(userId);

      // Filter by trigger types if specified
      const filtered = body.triggerTypes
        ? triggers.filter((t) => body.triggerTypes!.includes(t.triggerType))
        : triggers;

      // Count triggers by type
      filtered.forEach((trigger) => {
        triggersByType[trigger.triggerType] =
          (triggersByType[trigger.triggerType] || 0) + 1;
      });

      results.push({
        userId,
        triggersCount: filtered.length,
        triggers: filtered,
      });
    }

    return {
      success: true,
      results,
      summary: {
        totalUsers: body.userIds.length,
        totalTriggers: results.reduce((sum, r) => sum + r.triggersCount, 0),
        triggersByType,
      },
    };
  }

  /**
   * Get trigger statistics (admin dashboard)
   * GET /api/v1/triggers/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getTriggerStats(
    @Query('days') days?: string,
  ): Promise<{
    success: boolean;
    stats: {
      totalTriggers: number;
      enabledTriggers: number;
      triggersByPriority: Record<number, number>;
      triggersByStrategy: Record<string, number>;
    };
  }> {
    // TODO: Add admin role check

    const triggers = await this.triggerEngineService.getAllTriggers();

    const enabledTriggers = triggers.filter((t) => t.enabled).length;

    const triggersByPriority: Record<number, number> = {};
    const triggersByStrategy: Record<string, number> = {};

    triggers.forEach((trigger) => {
      // Count by priority
      triggersByPriority[trigger.priority] =
        (triggersByPriority[trigger.priority] || 0) + 1;

      // Count by strategy
      const strategy = trigger.promotionStrategy || 'bandit';
      triggersByStrategy[strategy] = (triggersByStrategy[strategy] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        totalTriggers: triggers.length,
        enabledTriggers,
        triggersByPriority,
        triggersByStrategy,
      },
    };
  }
}
