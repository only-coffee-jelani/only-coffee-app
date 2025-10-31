import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { ABTestService } from './ab-test.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetricCategory } from './entities/system-metric.entity';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly abTestService: ABTestService,
  ) {}

  // =====================
  // System Metrics
  // =====================

  /**
   * Get system health
   * GET /api/v1/monitoring/health
   */
  @Get('health')
  async getSystemHealth() {
    const health = await this.monitoringService.getSystemHealth();
    return {
      success: true,
      ...health,
    };
  }

  /**
   * Record a custom metric
   * POST /api/v1/monitoring/metrics
   */
  @Post('metrics')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async recordMetric(
    @Body()
    body: {
      metricName: string;
      category: MetricCategory;
      metricValue: number;
      unit?: string;
      dimensions?: Record<string, any>;
      metadata?: Record<string, any>;
    },
  ) {
    const metric = await this.monitoringService.recordMetric(body);
    return {
      success: true,
      metric: {
        id: metric.id,
        metric_name: metric.metricName,
        category: metric.category,
        metric_value: metric.metricValue,
        unit: metric.unit,
        timestamp: metric.timestamp,
      },
    };
  }

  /**
   * Get metrics by name
   * GET /api/v1/monitoring/metrics/:metricName
   */
  @Get('metrics/:metricName')
  @UseGuards(JwtAuthGuard)
  async getMetrics(
    @Param('metricName') metricName: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const metrics = await this.monitoringService.getMetrics(
      metricName,
      start,
      end,
    );

    return {
      success: true,
      count: metrics.length,
      metrics: metrics.map((m) => ({
        id: m.id,
        metric_name: m.metricName,
        category: m.category,
        metric_value: m.metricValue,
        unit: m.unit,
        dimensions: m.dimensions,
        timestamp: m.timestamp,
      })),
    };
  }

  /**
   * Get aggregated metrics
   * GET /api/v1/monitoring/metrics/:metricName/aggregate
   */
  @Get('metrics/:metricName/aggregate')
  @UseGuards(JwtAuthGuard)
  async getAggregatedMetrics(
    @Param('metricName') metricName: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const aggregated = await this.monitoringService.getAggregatedMetrics(
      metricName,
      start,
      end,
    );

    return {
      success: true,
      metric_name: metricName,
      start_date: start,
      end_date: end,
      ...aggregated,
    };
  }

  // =====================
  // A/B Testing
  // =====================

  /**
   * Create a new A/B test
   * POST /api/v1/monitoring/ab-tests
   */
  @Post('ab-tests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTest(
    @Request() req,
    @Body()
    body: {
      name: string;
      description?: string;
      test_type: string;
      variants: {
        id: string;
        name: string;
        description?: string;
        config: Record<string, any>;
        traffic_percentage: number;
      }[];
      control_variant_id: string;
      target_metric: string;
      sample_size_target?: number;
      confidence_level?: number;
      minimum_detectable_effect?: number;
    },
  ) {
    const test = await this.abTestService.createTest({
      name: body.name,
      description: body.description,
      testType: body.test_type,
      variants: body.variants.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        config: v.config,
        trafficPercentage: v.traffic_percentage,
      })),
      controlVariantId: body.control_variant_id,
      targetMetric: body.target_metric,
      sampleSizeTarget: body.sample_size_target,
      confidenceLevel: body.confidence_level,
      minimumDetectableEffect: body.minimum_detectable_effect,
      createdBy: req.user.userId,
    });

    return {
      success: true,
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        test_type: test.testType,
        status: test.status,
        variants: test.variants,
        control_variant_id: test.controlVariantId,
        target_metric: test.targetMetric,
        created_at: test.createdAt,
      },
    };
  }

  /**
   * Start an A/B test
   * POST /api/v1/monitoring/ab-tests/:testId/start
   */
  @Post('ab-tests/:testId/start')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async startTest(@Param('testId') testId: string) {
    const test = await this.abTestService.startTest(testId);
    return {
      success: true,
      test: {
        id: test.id,
        status: test.status,
        started_at: test.startedAt,
      },
    };
  }

  /**
   * Pause an A/B test
   * POST /api/v1/monitoring/ab-tests/:testId/pause
   */
  @Post('ab-tests/:testId/pause')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pauseTest(@Param('testId') testId: string) {
    const test = await this.abTestService.pauseTest(testId);
    return {
      success: true,
      test: {
        id: test.id,
        status: test.status,
      },
    };
  }

  /**
   * Complete an A/B test and select winner
   * POST /api/v1/monitoring/ab-tests/:testId/complete
   */
  @Post('ab-tests/:testId/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeTest(@Param('testId') testId: string) {
    const test = await this.abTestService.completeTest(testId);
    return {
      success: true,
      test: {
        id: test.id,
        status: test.status,
        ended_at: test.endedAt,
        winning_variant_id: test.winningVariantId,
        results: test.results,
      },
    };
  }

  /**
   * Get variant assignment for user
   * POST /api/v1/monitoring/ab-tests/:testId/assign
   */
  @Post('ab-tests/:testId/assign')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async assignVariant(@Request() req, @Param('testId') testId: string) {
    const variantId = await this.abTestService.assignVariant(
      testId,
      req.user.userId,
    );
    return {
      success: true,
      test_id: testId,
      user_id: req.user.userId,
      variant_id: variantId,
    };
  }

  /**
   * Record metric for A/B test
   * POST /api/v1/monitoring/ab-tests/:testId/metrics
   */
  @Post('ab-tests/:testId/metrics')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async recordABTestMetric(
    @Request() req,
    @Param('testId') testId: string,
    @Body()
    body: {
      metric_name: string;
      metric_value: number;
      metadata?: Record<string, any>;
    },
  ) {
    const metric = await this.abTestService.recordMetric({
      testId,
      userId: req.user.userId,
      metricName: body.metric_name,
      metricValue: body.metric_value,
      metadata: body.metadata,
    });

    return {
      success: true,
      metric: {
        id: metric.id,
        test_id: metric.testId,
        variant_id: metric.variantId,
        metric_name: metric.metricName,
        metric_value: metric.metricValue,
        timestamp: metric.timestamp,
      },
    };
  }

  /**
   * Get test results
   * GET /api/v1/monitoring/ab-tests/:testId/results
   */
  @Get('ab-tests/:testId/results')
  @UseGuards(JwtAuthGuard)
  async getTestResults(@Param('testId') testId: string) {
    const { test, results } = await this.abTestService.getTest(testId);

    return {
      success: true,
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        test_type: test.testType,
        status: test.status,
        target_metric: test.targetMetric,
        confidence_level: test.confidenceLevel,
        started_at: test.startedAt,
        ended_at: test.endedAt,
        winning_variant_id: test.winningVariantId,
      },
      results,
    };
  }

  /**
   * Get test by ID
   * GET /api/v1/monitoring/ab-tests/:testId
   */
  @Get('ab-tests/:testId')
  @UseGuards(JwtAuthGuard)
  async getTest(@Param('testId') testId: string) {
    const { test, results } = await this.abTestService.getTest(testId);

    return {
      success: true,
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        test_type: test.testType,
        status: test.status,
        variants: test.variants,
        control_variant_id: test.controlVariantId,
        target_metric: test.targetMetric,
        sample_size_target: test.sampleSizeTarget,
        confidence_level: test.confidenceLevel,
        minimum_detectable_effect: test.minimumDetectableEffect,
        started_at: test.startedAt,
        ended_at: test.endedAt,
        winning_variant_id: test.winningVariantId,
        created_at: test.createdAt,
        updated_at: test.updatedAt,
      },
      results,
    };
  }

  /**
   * Get all tests
   * GET /api/v1/monitoring/ab-tests
   */
  @Get('ab-tests')
  @UseGuards(JwtAuthGuard)
  async getAllTests(@Query('status') status?: string) {
    const tests =
      status === 'active'
        ? await this.abTestService.getActiveTests()
        : await this.abTestService.getAllTests();

    return {
      success: true,
      count: tests.length,
      tests: tests.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        test_type: t.testType,
        status: t.status,
        target_metric: t.targetMetric,
        started_at: t.startedAt,
        ended_at: t.endedAt,
        winning_variant_id: t.winningVariantId,
        created_at: t.createdAt,
      })),
    };
  }
}
