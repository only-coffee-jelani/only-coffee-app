import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemMetric, MetricCategory } from './entities/system-metric.entity';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(SystemMetric)
    private readonly systemMetricRepository: Repository<SystemMetric>,
  ) {}

  /**
   * Record a system metric
   */
  async recordMetric(params: {
    metricName: string;
    category: MetricCategory;
    metricValue: number;
    unit?: string;
    dimensions?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<SystemMetric> {
    const metric = this.systemMetricRepository.create({
      metricName: params.metricName,
      category: params.category,
      metricValue: params.metricValue,
      unit: params.unit,
      dimensions: params.dimensions,
      metadata: params.metadata,
    });

    return this.systemMetricRepository.save(metric);
  }

  /**
   * Get metrics by name and time range
   */
  async getMetrics(
    metricName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SystemMetric[]> {
    return this.systemMetricRepository.find({
      where: {
        metricName,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get metrics by category
   */
  async getMetricsByCategory(
    category: MetricCategory,
    startDate: Date,
    endDate: Date,
  ): Promise<SystemMetric[]> {
    return this.systemMetricRepository.find({
      where: {
        category,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get aggregated metrics (average, min, max, count)
   */
  async getAggregatedMetrics(
    metricName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
    stdDev: number;
  }> {
    const result = await this.systemMetricRepository
      .createQueryBuilder('metric')
      .select('AVG(metric.metric_value)', 'avg')
      .addSelect('MIN(metric.metric_value)', 'min')
      .addSelect('MAX(metric.metric_value)', 'max')
      .addSelect('COUNT(*)', 'count')
      .addSelect('STDDEV(metric.metric_value)', 'stdDev')
      .where('metric.metric_name = :metricName', { metricName })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      avg: parseFloat(result.avg) || 0,
      min: parseFloat(result.min) || 0,
      max: parseFloat(result.max) || 0,
      count: parseInt(result.count) || 0,
      stdDev: parseFloat(result.stdDev) || 0,
    };
  }

  /**
   * Record ML model performance metric
   */
  async recordModelMetric(
    modelName: string,
    metricType: string, // e.g., "accuracy", "precision", "recall", "f1_score", "auc_roc"
    value: number,
    metadata?: Record<string, any>,
  ): Promise<SystemMetric> {
    return this.recordMetric({
      metricName: `model.${modelName}.${metricType}`,
      category: MetricCategory.ML_MODEL,
      metricValue: value,
      unit: 'score',
      dimensions: { model: modelName, metric_type: metricType },
      metadata,
    });
  }

  /**
   * Check if model needs retraining based on performance degradation
   */
  async checkModelHealth(
    modelName: string,
    metricType: string = 'accuracy',
    thresholdPercentage: number = 0.05, // 5% degradation threshold
  ): Promise<{
    needsRetraining: boolean;
    currentPerformance: number;
    baselinePerformance: number;
    degradationPercentage: number;
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metricName = `model.${modelName}.${metricType}`;

    // Get recent performance (last 24 hours)
    const recentMetrics = await this.getAggregatedMetrics(
      metricName,
      last24Hours,
      now,
    );

    // Get baseline performance (30 days ago to 7 days ago)
    const baselineStart = last30Days;
    const baselineEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const baselineMetrics = await this.getAggregatedMetrics(
      metricName,
      baselineStart,
      baselineEnd,
    );

    const currentPerformance = recentMetrics.avg;
    const baselinePerformance = baselineMetrics.avg;

    // Calculate degradation
    const degradationPercentage =
      baselinePerformance > 0
        ? (baselinePerformance - currentPerformance) / baselinePerformance
        : 0;

    const needsRetraining = degradationPercentage > thresholdPercentage;

    if (needsRetraining) {
      this.logger.warn(
        `Model ${modelName} performance degraded by ${(degradationPercentage * 100).toFixed(2)}% - retraining recommended`,
      );
    }

    return {
      needsRetraining,
      currentPerformance,
      baselinePerformance,
      degradationPercentage,
    };
  }

  /**
   * Record business metric (conversion, revenue, etc.)
   */
  async recordBusinessMetric(
    metricName: string,
    value: number,
    unit: string,
    dimensions?: Record<string, any>,
  ): Promise<SystemMetric> {
    return this.recordMetric({
      metricName,
      category: MetricCategory.BUSINESS,
      metricValue: value,
      unit,
      dimensions,
    });
  }

  /**
   * Record performance metric (API latency, throughput, etc.)
   */
  async recordPerformanceMetric(
    metricName: string,
    value: number,
    unit: string = 'ms',
    dimensions?: Record<string, any>,
  ): Promise<SystemMetric> {
    return this.recordMetric({
      metricName,
      category: MetricCategory.PERFORMANCE,
      metricValue: value,
      unit,
      dimensions,
    });
  }

  /**
   * Record error metric
   */
  async recordError(
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>,
  ): Promise<SystemMetric> {
    return this.recordMetric({
      metricName: `error.${errorType}`,
      category: MetricCategory.ERROR,
      metricValue: 1,
      unit: 'count',
      metadata: {
        error_message: errorMessage,
        ...metadata,
      },
    });
  }

  /**
   * Get system health summary
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      modelHealth: Record<string, boolean>;
    };
    alerts: string[];
  }> {
    const now = new Date();
    const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

    // Check error rate
    const errors = await this.systemMetricRepository.count({
      where: {
        category: MetricCategory.ERROR,
        timestamp: MoreThan(last1Hour),
      },
    });

    const totalRequests = await this.systemMetricRepository.count({
      where: {
        metricName: 'api.request',
        timestamp: MoreThan(last1Hour),
      },
    });

    const errorRate = totalRequests > 0 ? errors / totalRequests : 0;

    // Check average response time
    const responseTimeMetrics = await this.getAggregatedMetrics(
      'api.response_time',
      last1Hour,
      now,
    );

    const avgResponseTime = responseTimeMetrics.avg;

    // Check model health
    const models = ['churn_prediction', 'recommender', 'segmentation'];
    const modelHealth: Record<string, boolean> = {};

    for (const model of models) {
      const health = await this.checkModelHealth(model);
      modelHealth[model] = !health.needsRetraining;
    }

    // Determine overall status and alerts
    const alerts: string[] = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (errorRate > 0.05) {
      // >5% error rate
      alerts.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      status = 'degraded';
    }

    if (errorRate > 0.1) {
      // >10% error rate
      status = 'critical';
    }

    if (avgResponseTime > 1000) {
      // >1s average response time
      alerts.push(`Slow response time: ${avgResponseTime.toFixed(0)}ms`);
      status = status === 'critical' ? 'critical' : 'degraded';
    }

    Object.entries(modelHealth).forEach(([model, isHealthy]) => {
      if (!isHealthy) {
        alerts.push(`Model ${model} needs retraining`);
        status = status === 'critical' ? 'critical' : 'degraded';
      }
    });

    return {
      status,
      metrics: {
        errorRate,
        avgResponseTime,
        modelHealth,
      },
      alerts,
    };
  }

  /**
   * Scheduled job: Check system health every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledHealthCheck() {
    this.logger.log('Running scheduled system health check...');

    try {
      const health = await this.getSystemHealth();

      // Record health status metric
      await this.recordMetric({
        metricName: 'system.health_status',
        category: MetricCategory.SYSTEM_HEALTH,
        metricValue: health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0,
        unit: 'score',
        metadata: {
          status: health.status,
          alerts: health.alerts,
        },
      });

      if (health.status !== 'healthy') {
        this.logger.warn(
          `System health: ${health.status.toUpperCase()} - Alerts: ${health.alerts.join(', ')}`,
        );

        // In production, send alerts to Slack/PagerDuty/email
        if (health.status === 'critical') {
          this.logger.error('CRITICAL: System health is critical!');
          // await this.sendCriticalAlert(health);
        }
      } else {
        this.logger.log('System health: HEALTHY');
      }
    } catch (error) {
      this.logger.error('Failed to run health check', error);
    }
  }

  /**
   * Scheduled job: Check model health daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledModelHealthCheck() {
    this.logger.log('Running scheduled model health check...');

    const models = [
      { name: 'churn_prediction', metric: 'auc_roc', threshold: 0.05 },
      { name: 'recommender', metric: 'ndcg', threshold: 0.1 },
      { name: 'segmentation', metric: 'silhouette_score', threshold: 0.1 },
    ];

    for (const model of models) {
      try {
        const health = await this.checkModelHealth(
          model.name,
          model.metric,
          model.threshold,
        );

        if (health.needsRetraining) {
          this.logger.warn(
            `Model ${model.name} needs retraining: ${(health.degradationPercentage * 100).toFixed(2)}% degradation`,
          );

          // In production, trigger model retraining pipeline
          // await this.triggerModelRetraining(model.name);

          // Record retraining trigger
          await this.recordMetric({
            metricName: `model.${model.name}.retraining_triggered`,
            category: MetricCategory.ML_MODEL,
            metricValue: 1,
            unit: 'count',
            metadata: {
              degradation_percentage: health.degradationPercentage,
              current_performance: health.currentPerformance,
              baseline_performance: health.baselinePerformance,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to check health for model ${model.name}`, error);
      }
    }
  }

  /**
   * Clean up old metrics (keep last 90 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldMetrics() {
    this.logger.log('Cleaning up old metrics...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

    try {
      const result = await this.systemMetricRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Deleted ${result.affected} old metrics`);
    } catch (error) {
      this.logger.error('Failed to clean up old metrics', error);
    }
  }
}
