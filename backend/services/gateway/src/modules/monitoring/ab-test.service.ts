import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ABTest, ABTestStatus, ABTestType } from './entities/ab-test.entity';
import { ABTestAssignment } from './entities/ab-test-assignment.entity';
import { ABTestMetric } from './entities/ab-test-metric.entity';

@Injectable()
export class ABTestService {
  private readonly logger = new Logger(ABTestService.name);

  constructor(
    @InjectRepository(ABTest)
    private readonly abTestRepository: Repository<ABTest>,
    @InjectRepository(ABTestAssignment)
    private readonly assignmentRepository: Repository<ABTestAssignment>,
    @InjectRepository(ABTestMetric)
    private readonly metricRepository: Repository<ABTestMetric>,
  ) {}

  /**
   * Create a new A/B test
   */
  async createTest(params: {
    name: string;
    description?: string;
    testType: string;
    variants: {
      id: string;
      name: string;
      description?: string;
      config: Record<string, any>;
      trafficPercentage: number;
    }[];
    controlVariantId: string;
    targetMetric: string;
    sampleSizeTarget?: number;
    confidenceLevel?: number;
    minimumDetectableEffect?: number;
    createdBy?: string;
  }): Promise<ABTest> {
    // Validate traffic percentages sum to 100
    const totalTraffic = params.variants.reduce(
      (sum, v) => sum + v.trafficPercentage,
      0,
    );
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic percentages must sum to 100');
    }

    // Convert testType string to enum
    const testTypeEnum = params.testType as ABTestType;

    const test = this.abTestRepository.create({
      name: params.name,
      description: params.description,
      testType: testTypeEnum,
      variants: params.variants,
      controlVariantId: params.controlVariantId,
      targetMetric: params.targetMetric,
      sampleSizeTarget: params.sampleSizeTarget,
      confidenceLevel: params.confidenceLevel,
      minimumDetectableEffect: params.minimumDetectableEffect,
      createdBy: params.createdBy,
      status: ABTestStatus.DRAFT,
    });

    return this.abTestRepository.save(test);
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('A/B test not found');
    }

    test.status = ABTestStatus.ACTIVE;
    test.startedAt = new Date();

    return this.abTestRepository.save(test);
  }

  /**
   * Pause an A/B test
   */
  async pauseTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('A/B test not found');
    }

    test.status = ABTestStatus.PAUSED;
    return this.abTestRepository.save(test);
  }

  /**
   * Complete an A/B test and select winner
   */
  async completeTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('A/B test not found');
    }

    // Calculate final results
    const results = await this.calculateTestResults(testId);

    // Determine winner based on statistical significance
    const winner = this.determineWinner(results, test.confidenceLevel);

    test.status = ABTestStatus.COMPLETED;
    test.endedAt = new Date();
    test.results = results;
    test.winningVariantId = winner;

    return this.abTestRepository.save(test);
  }

  /**
   * Assign user to a variant (deterministic hashing)
   */
  async assignVariant(testId: string, userId: string): Promise<string> {
    // Check if user already assigned
    const existing = await this.assignmentRepository.findOne({
      where: { testId, userId },
    });

    if (existing) {
      return existing.variantId;
    }

    // Get test details
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test || test.status !== ABTestStatus.ACTIVE) {
      throw new Error('Test not active');
    }

    // Use deterministic hashing to assign variant
    const variantId = this.hashUserToVariant(userId, testId, test.variants);

    // Save assignment
    const assignment = this.assignmentRepository.create({
      testId,
      userId,
      variantId,
    });
    await this.assignmentRepository.save(assignment);

    return variantId;
  }

  /**
   * Deterministic hash function to assign users to variants
   */
  private hashUserToVariant(
    userId: string,
    testId: string,
    variants: any[],
  ): string {
    // Create hash from userId + testId
    const hash = createHash('md5')
      .update(`${userId}:${testId}`)
      .digest('hex');

    // Convert first 8 chars of hash to number between 0-100
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const percentage = (hashValue % 10000) / 100; // 0-100

    // Assign to variant based on traffic percentages
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficPercentage;
      if (percentage < cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1].id;
  }

  /**
   * Record a metric for a test variant
   */
  async recordMetric(params: {
    testId: string;
    userId: string;
    metricName: string;
    metricValue: number;
    metadata?: Record<string, any>;
  }): Promise<ABTestMetric> {
    // Get user's variant assignment
    const assignment = await this.assignmentRepository.findOne({
      where: { testId: params.testId, userId: params.userId },
    });

    if (!assignment) {
      throw new Error('User not assigned to this test');
    }

    const metric = this.metricRepository.create({
      testId: params.testId,
      variantId: assignment.variantId,
      userId: params.userId,
      metricName: params.metricName,
      metricValue: params.metricValue,
      metadata: params.metadata,
    });

    return this.metricRepository.save(metric);
  }

  /**
   * Calculate test results for all variants
   */
  async calculateTestResults(testId: string): Promise<any[]> {
    const test = await this.abTestRepository.findOne({
      where: { id: testId },
      relations: ['assignments', 'metrics'],
    });

    if (!test) {
      throw new NotFoundException('A/B test not found');
    }

    const results = [];

    for (const variant of test.variants) {
      // Get assignments for this variant
      const assignmentCount = await this.assignmentRepository.count({
        where: { testId, variantId: variant.id },
      });

      // Get metrics for this variant
      const metrics = await this.metricRepository.find({
        where: {
          testId,
          variantId: variant.id,
          metricName: test.targetMetric,
        },
      });

      // Calculate conversion rate (assuming binary metric: 0 or 1)
      const conversions = metrics.filter((m) => m.metricValue > 0).length;
      const conversionRate = assignmentCount > 0 ? conversions / assignmentCount : 0;

      // Calculate average value
      const totalValue = metrics.reduce((sum, m) => sum + m.metricValue, 0);
      const averageValue = metrics.length > 0 ? totalValue / metrics.length : 0;

      // Calculate p-value and confidence interval (vs control)
      let pValue = 1;
      let confidenceInterval: [number, number] = [0, 0];

      if (variant.id !== test.controlVariantId) {
        const controlMetrics = await this.metricRepository.find({
          where: {
            testId,
            variantId: test.controlVariantId,
            metricName: test.targetMetric,
          },
        });

        const controlCount = await this.assignmentRepository.count({
          where: { testId, variantId: test.controlVariantId },
        });

        const controlConversions = controlMetrics.filter(
          (m) => m.metricValue > 0,
        ).length;
        const controlRate = controlCount > 0 ? controlConversions / controlCount : 0;

        // Two-proportion z-test
        const result = this.twoProportionZTest(
          conversions,
          assignmentCount,
          controlConversions,
          controlCount,
        );

        pValue = result.pValue;
        confidenceInterval = result.confidenceInterval;
      }

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: assignmentCount,
        conversions,
        conversionRate,
        averageValue,
        pValue,
        confidenceInterval,
        isControl: variant.id === test.controlVariantId,
      });
    }

    return results;
  }

  /**
   * Two-proportion z-test for statistical significance
   */
  private twoProportionZTest(
    x1: number, // successes in variant
    n1: number, // sample size variant
    x2: number, // successes in control
    n2: number, // sample size control
  ): { pValue: number; confidenceInterval: [number, number] } {
    if (n1 === 0 || n2 === 0) {
      return { pValue: 1, confidenceInterval: [0, 0] };
    }

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pooledP = (x1 + x2) / (n1 + n2);

    // Calculate z-score
    const standardError = Math.sqrt(
      pooledP * (1 - pooledP) * (1 / n1 + 1 / n2),
    );
    const zScore = standardError > 0 ? (p1 - p2) / standardError : 0;

    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate 95% confidence interval for difference
    const se = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
    const margin = 1.96 * se; // 95% CI
    const confidenceInterval: [number, number] = [
      p1 - p2 - margin,
      p1 - p2 + margin,
    ];

    return { pValue, confidenceInterval };
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Determine winning variant based on statistical significance
   */
  private determineWinner(
    results: any[],
    confidenceLevel: number = 0.95,
  ): string | null {
    const alpha = 1 - confidenceLevel;

    // Find control
    const control = results.find((r) => r.isControl);
    if (!control) return null;

    // Find variants that beat control with statistical significance
    const winners = results.filter(
      (r) =>
        !r.isControl &&
        r.conversionRate > control.conversionRate &&
        r.pValue < alpha,
    );

    if (winners.length === 0) {
      // No statistically significant winner
      return null;
    }

    // Return variant with highest conversion rate among statistically significant winners
    winners.sort((a, b) => b.conversionRate - a.conversionRate);
    return winners[0].variantId;
  }

  /**
   * Get all active tests
   */
  async getActiveTests(): Promise<ABTest[]> {
    return this.abTestRepository.find({
      where: { status: ABTestStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get test by ID with results
   */
  async getTest(testId: string): Promise<{
    test: ABTest;
    results: any[];
  }> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('A/B test not found');
    }

    const results = await this.calculateTestResults(testId);

    return { test, results };
  }

  /**
   * Get all tests
   */
  async getAllTests(): Promise<ABTest[]> {
    return this.abTestRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
