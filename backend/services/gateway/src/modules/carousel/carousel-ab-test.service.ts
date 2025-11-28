import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarouselABTest } from '@shared/database/entities/carousel-ab-test.entity';

/**
 * Enterprise-level Carousel A/B Testing Service
 *
 * Features:
 * - Test creation and management
 * - Traffic allocation
 * - Statistical analysis
 * - Winner determination
 * - Test lifecycle management
 */

@Injectable()
export class CarouselABTestService {
  private readonly logger = new Logger(CarouselABTestService.name);

  constructor(
    @InjectRepository(CarouselABTest)
    private readonly abTestRepository: Repository<CarouselABTest>,
  ) {}

  /**
   * Get all A/B tests
   */
  async getAllTests(): Promise<CarouselABTest[]> {
    try {
      return await this.abTestRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch A/B tests', error.stack);
      throw error;
    }
  }

  /**
   * Get a specific A/B test by ID
   */
  async getTestById(testId: string): Promise<CarouselABTest> {
    const test = await this.abTestRepository.findOne({
      where: { carouselAbTestId: testId },
    });

    if (!test) {
      throw new NotFoundException(`A/B test with ID ${testId} not found`);
    }

    return test;
  }

  /**
   * Create a new A/B test
   */
  async createTest(data: {
    test_name: string;
    description?: string;
    carousel_id: string;
    variant_a_item_id: string;
    variant_b_item_id: string;
    traffic_split?: number;
    primary_metric?: 'ctr' | 'conversion_rate' | 'engagement_score' | 'revenue';
    created_by?: string;
  }): Promise<CarouselABTest> {
    try {
      // Validate traffic split
      const trafficSplit = data.traffic_split || 0.5;
      if (trafficSplit < 0 || trafficSplit > 1) {
        throw new BadRequestException('Traffic split must be between 0 and 1');
      }

      // Validate variants are different
      if (data.variant_a_item_id === data.variant_b_item_id) {
        throw new BadRequestException('Variant A and Variant B must be different carousel items');
      }

      const test = this.abTestRepository.create({
        testName: data.test_name,
        description: data.description || null,
        carouselId: data.carousel_id,
        variantAItemId: data.variant_a_item_id,
        variantBItemId: data.variant_b_item_id,
        trafficSplit: trafficSplit,
        status: 'draft',
        primaryMetric: data.primary_metric || 'ctr',
        startedAt: null,
        endedAt: null,
        winnerVariant: null,
        confidenceLevel: null,
        variantAImpressions: 0,
        variantAClicks: 0,
        variantAConversions: 0,
        variantARevenue: 0,
        variantBImpressions: 0,
        variantBClicks: 0,
        variantBConversions: 0,
        variantBRevenue: 0,
        createdBy: data.created_by || null,
      });

      const savedTest = await this.abTestRepository.save(test);
      this.logger.log(`Created A/B test: ${savedTest.testName} (ID: ${savedTest.carouselAbTestId})`);

      return savedTest;
    } catch (error) {
      this.logger.error('Failed to create A/B test', error.stack);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<CarouselABTest> {
    const test = await this.getTestById(testId);

    if (test.status !== 'draft' && test.status !== 'paused') {
      throw new BadRequestException(`Cannot start test with status: ${test.status}`);
    }

    test.status = 'running';
    if (!test.startedAt) {
      test.startedAt = new Date();
    }

    const updatedTest = await this.abTestRepository.save(test);
    this.logger.log(`Started A/B test: ${updatedTest.testName} (ID: ${testId})`);

    return updatedTest;
  }

  /**
   * Pause an A/B test
   */
  async pauseTest(testId: string): Promise<CarouselABTest> {
    const test = await this.getTestById(testId);

    if (test.status !== 'running') {
      throw new BadRequestException(`Cannot pause test with status: ${test.status}`);
    }

    test.status = 'paused';

    const updatedTest = await this.abTestRepository.save(test);
    this.logger.log(`Paused A/B test: ${updatedTest.testName} (ID: ${testId})`);

    return updatedTest;
  }

  /**
   * Complete an A/B test and determine winner
   */
  async completeTest(testId: string): Promise<CarouselABTest> {
    const test = await this.getTestById(testId);

    if (test.status !== 'running' && test.status !== 'paused') {
      throw new BadRequestException(`Cannot complete test with status: ${test.status}`);
    }

    // Calculate winner based on primary metric
    const winner = this.determineWinner(test);

    test.status = 'completed';
    test.endedAt = new Date();
    test.winnerVariant = winner;
    test.confidenceLevel = this.calculateConfidenceLevel(test);

    const updatedTest = await this.abTestRepository.save(test);
    this.logger.log(
      `Completed A/B test: ${updatedTest.testName} (ID: ${testId}), Winner: ${winner || 'No clear winner'}`,
    );

    return updatedTest;
  }

  /**
   * Delete an A/B test
   */
  async deleteTest(testId: string): Promise<void> {
    const test = await this.getTestById(testId);

    if (test.status === 'running') {
      throw new BadRequestException('Cannot delete a running test. Please pause it first.');
    }

    await this.abTestRepository.delete(testId);
    this.logger.log(`Deleted A/B test: ${test.testName} (ID: ${testId})`);
  }

  /**
   * Update test metrics (called by analytics tracking)
   */
  async updateTestMetrics(
    carouselItemId: string,
    eventType: 'impression' | 'click' | 'conversion',
    revenue?: number,
  ): Promise<void> {
    try {
      // Find active tests for this carousel item
      const tests = await this.abTestRepository.find({
        where: [
          { variantAItemId: carouselItemId, status: 'running' },
          { variantBItemId: carouselItemId, status: 'running' },
        ],
      });

      for (const test of tests) {
        const isVariantA = test.variantAItemId === carouselItemId;

        if (eventType === 'impression') {
          if (isVariantA) {
            test.variantAImpressions += 1;
          } else {
            test.variantBImpressions += 1;
          }
        } else if (eventType === 'click') {
          if (isVariantA) {
            test.variantAClicks += 1;
          } else {
            test.variantBClicks += 1;
          }
        } else if (eventType === 'conversion') {
          if (isVariantA) {
            test.variantAConversions += 1;
            if (revenue) test.variantARevenue += revenue;
          } else {
            test.variantBConversions += 1;
            if (revenue) test.variantBRevenue += revenue;
          }
        }

        await this.abTestRepository.save(test);
      }
    } catch (error) {
      this.logger.error('Failed to update test metrics', error.stack);
      // Don't throw - analytics tracking should not fail the main request
    }
  }

  /**
   * Determine winner based on primary metric
   */
  private determineWinner(test: CarouselABTest): 'A' | 'B' | null {
    const metricA = this.calculateMetric(test, 'A');
    const metricB = this.calculateMetric(test, 'B');

    // Require minimum sample size
    const minSampleSize = 100;
    if (test.variantAImpressions < minSampleSize || test.variantBImpressions < minSampleSize) {
      return null; // Not enough data
    }

    // Require at least 5% difference
    const minDifference = 0.05;
    const difference = Math.abs(metricA - metricB) / Math.max(metricA, metricB);

    if (difference < minDifference) {
      return null; // No significant difference
    }

    return metricA > metricB ? 'A' : 'B';
  }

  /**
   * Calculate metric value for a variant
   */
  private calculateMetric(test: CarouselABTest, variant: 'A' | 'B'): number {
    const impressions = variant === 'A' ? test.variantAImpressions : test.variantBImpressions;
    const clicks = variant === 'A' ? test.variantAClicks : test.variantBClicks;
    const conversions = variant === 'A' ? test.variantAConversions : test.variantBConversions;
    const revenue = variant === 'A' ? test.variantARevenue : test.variantBRevenue;

    if (impressions === 0) return 0;

    switch (test.primaryMetric) {
      case 'ctr':
        return (clicks / impressions) * 100;
      case 'conversion_rate':
        return (conversions / impressions) * 100;
      case 'revenue':
        return revenue;
      case 'engagement_score':
        return (clicks * 10 + conversions * 20) / impressions;
      default:
        return 0;
    }
  }

  /**
   * Calculate confidence level (simplified z-test)
   */
  private calculateConfidenceLevel(test: CarouselABTest): number {
    const n1 = test.variantAImpressions;
    const n2 = test.variantBImpressions;

    if (n1 < 30 || n2 < 30) {
      return 0; // Not enough data for statistical significance
    }

    const p1 = test.variantAClicks / n1;
    const p2 = test.variantBClicks / n2;

    const pooledP = (test.variantAClicks + test.variantBClicks) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    const z = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence level (approximate)
    if (z > 2.58) return 99; // 99% confidence
    if (z > 1.96) return 95; // 95% confidence
    if (z > 1.65) return 90; // 90% confidence
    if (z > 1.28) return 80; // 80% confidence

    return Math.round(50 + (z / 2.58) * 49); // Scale to 50-99%
  }
}
