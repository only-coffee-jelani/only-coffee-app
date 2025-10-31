import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSegment, User } from '@shared/database/entities';
import { FeatureStoreService } from '../features/feature-store.service';

/**
 * RFM-based user segments
 * Based on recency, frequency, and monetary scores
 */
export enum Segment {
  CHAMPIONS = 'champions', // R:5, F:5, M:5 - Best customers
  LOYAL_CUSTOMERS = 'loyal_customers', // R:4-5, F:4-5, M:3-5
  POTENTIAL_LOYALIST = 'potential_loyalist', // R:4-5, F:2-3, M:2-3
  NEW_CUSTOMERS = 'new_customers', // R:5, F:1, M:1
  PROMISING = 'promising', // R:4-5, F:1-2, M:1-2
  NEED_ATTENTION = 'need_attention', // R:3, F:2-3, M:2-3
  ABOUT_TO_SLEEP = 'about_to_sleep', // R:2-3, F:1-2, M:1-2
  AT_RISK = 'at_risk', // R:1-2, F:3-4, M:3-4 - High value but inactive
  CANT_LOSE_THEM = 'cant_lose_them', // R:1-2, F:4-5, M:4-5 - VIP churning
  HIBERNATING = 'hibernating', // R:1-2, F:1-2, M:1-3
  LOST = 'lost', // R:1, F:1, M:1
}

export interface SegmentDefinition {
  name: Segment;
  displayName: string;
  description: string;
  rfmCriteria: {
    recencyMin: number;
    recencyMax: number;
    frequencyMin: number;
    frequencyMax: number;
    monetaryMin: number;
    monetaryMax: number;
  };
  priority: number; // Higher priority segments are checked first
  promotionStrategy: string;
}

export interface SegmentDistribution {
  segment: Segment;
  count: number;
  percentage: number;
  avgLifetimeValue: number;
  avgRecencyScore: number;
  avgFrequencyScore: number;
  avgMonetaryScore: number;
}

@Injectable()
export class SegmentationService {
  private readonly logger = new Logger(SegmentationService.name);

  // Segment definitions (ordered by priority)
  private readonly segmentDefinitions: SegmentDefinition[] = [
    {
      name: Segment.CHAMPIONS,
      displayName: 'Champions',
      description: 'Your best customers who buy frequently and spend the most',
      rfmCriteria: { recencyMin: 5, recencyMax: 5, frequencyMin: 5, frequencyMax: 5, monetaryMin: 5, monetaryMax: 5 },
      priority: 1,
      promotionStrategy: 'VIP rewards, early access to new items, exclusive perks',
    },
    {
      name: Segment.CANT_LOSE_THEM,
      displayName: "Can't Lose Them",
      description: 'High-value customers who haven\'t purchased recently',
      rfmCriteria: { recencyMin: 1, recencyMax: 2, frequencyMin: 4, frequencyMax: 5, monetaryMin: 4, monetaryMax: 5 },
      priority: 2,
      promotionStrategy: 'Win-back campaigns, personalized offers, "We miss you" discounts',
    },
    {
      name: Segment.LOYAL_CUSTOMERS,
      displayName: 'Loyal Customers',
      description: 'Consistent buyers who spend well',
      rfmCriteria: { recencyMin: 4, recencyMax: 5, frequencyMin: 4, frequencyMax: 5, monetaryMin: 3, monetaryMax: 5 },
      priority: 3,
      promotionStrategy: 'Loyalty rewards, upsell premium items, referral incentives',
    },
    {
      name: Segment.AT_RISK,
      displayName: 'At Risk',
      description: 'Previously good customers showing signs of churn',
      rfmCriteria: { recencyMin: 1, recencyMax: 2, frequencyMin: 3, frequencyMax: 4, monetaryMin: 3, monetaryMax: 4 },
      priority: 4,
      promotionStrategy: 'Limited-time offers, feedback requests, re-engagement campaigns',
    },
    {
      name: Segment.POTENTIAL_LOYALIST,
      displayName: 'Potential Loyalists',
      description: 'Recent customers with moderate frequency',
      rfmCriteria: { recencyMin: 4, recencyMax: 5, frequencyMin: 2, frequencyMax: 3, monetaryMin: 2, monetaryMax: 3 },
      priority: 5,
      promotionStrategy: 'Loyalty program enrollment, streak challenges, member benefits',
    },
    {
      name: Segment.NEW_CUSTOMERS,
      displayName: 'New Customers',
      description: 'Recently made their first purchase',
      rfmCriteria: { recencyMin: 5, recencyMax: 5, frequencyMin: 1, frequencyMax: 1, monetaryMin: 1, monetaryMax: 1 },
      priority: 6,
      promotionStrategy: 'Welcome series, second purchase incentive, onboarding guidance',
    },
    {
      name: Segment.PROMISING,
      displayName: 'Promising',
      description: 'Recent shoppers who could become loyal',
      rfmCriteria: { recencyMin: 4, recencyMax: 5, frequencyMin: 1, frequencyMax: 2, monetaryMin: 1, monetaryMax: 2 },
      priority: 7,
      promotionStrategy: 'Nurture campaigns, next purchase discount, product discovery',
    },
    {
      name: Segment.NEED_ATTENTION,
      displayName: 'Need Attention',
      description: 'Average customers at risk of becoming inactive',
      rfmCriteria: { recencyMin: 3, recencyMax: 3, frequencyMin: 2, frequencyMax: 3, monetaryMin: 2, monetaryMax: 3 },
      priority: 8,
      promotionStrategy: 'Special offers, limited-time deals, personalized recommendations',
    },
    {
      name: Segment.ABOUT_TO_SLEEP,
      displayName: 'About To Sleep',
      description: 'Low activity customers at risk of churning',
      rfmCriteria: { recencyMin: 2, recencyMax: 3, frequencyMin: 1, frequencyMax: 2, monetaryMin: 1, monetaryMax: 2 },
      priority: 9,
      promotionStrategy: 'Re-activation campaigns, steep discounts, surveys',
    },
    {
      name: Segment.HIBERNATING,
      displayName: 'Hibernating',
      description: 'Inactive customers who haven\'t engaged recently',
      rfmCriteria: { recencyMin: 1, recencyMax: 2, frequencyMin: 1, frequencyMax: 2, monetaryMin: 1, monetaryMax: 3 },
      priority: 10,
      promotionStrategy: 'Win-back last attempt, deep discounts, feedback collection',
    },
    {
      name: Segment.LOST,
      displayName: 'Lost',
      description: 'Customers who are likely gone for good',
      rfmCriteria: { recencyMin: 1, recencyMax: 1, frequencyMin: 1, frequencyMax: 1, monetaryMin: 1, monetaryMax: 1 },
      priority: 11,
      promotionStrategy: 'Final win-back attempt, survey why they left, minimal resources',
    },
  ];

  constructor(
    @InjectRepository(UserSegment)
    private readonly userSegmentRepository: Repository<UserSegment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly featureStoreService: FeatureStoreService,
  ) {}

  /**
   * Assign a user to their appropriate segment based on RFM scores
   */
  async assignUserSegment(userId: string): Promise<UserSegment> {
    // Get RFM features from feature store
    const features = await this.featureStoreService.getUserFeatures({
      userId,
      includeRFM: true,
      includeEngagement: false,
      includeBehavioral: false,
      includeContextual: false,
      includeChurn: false,
    });

    const { recencyScore, frequencyScore, monetaryScore, rfmScore } = features.rfm;

    // Determine segment based on RFM scores
    const segment = this.determineSegment(recencyScore, frequencyScore, monetaryScore);
    const segmentDef = this.segmentDefinitions.find((s) => s.name === segment)!;

    // Check if user already has a segment assignment
    let userSegment = await this.userSegmentRepository.findOne({
      where: { userId, isActive: true },
    });

    if (userSegment) {
      // Check if segment has changed
      if (userSegment.segmentName !== segment) {
        // Mark old segment as inactive
        userSegment.isActive = false;
        await this.userSegmentRepository.save(userSegment);

        // Create new segment assignment
        userSegment = this.userSegmentRepository.create({
          userId,
          segmentName: segment,
          segmentDisplayName: segmentDef.displayName,
          rfmScore,
          recencyScore,
          frequencyScore,
          monetaryScore,
          assignedAt: new Date(),
          isActive: true,
          metadata: {
            previousSegment: userSegment.segmentName,
            segmentChanged: true,
            promotionStrategy: segmentDef.promotionStrategy,
          },
        });

        this.logger.log(
          `User ${userId} segment changed: ${userSegment.segmentName} → ${segment}`,
        );
      } else {
        // Update scores but keep same segment
        userSegment.rfmScore = rfmScore;
        userSegment.recencyScore = recencyScore;
        userSegment.frequencyScore = frequencyScore;
        userSegment.monetaryScore = monetaryScore;
        userSegment.metadata = {
          ...userSegment.metadata,
          lastUpdated: new Date().toISOString(),
          promotionStrategy: segmentDef.promotionStrategy,
        };
      }
    } else {
      // Create initial segment assignment
      userSegment = this.userSegmentRepository.create({
        userId,
        segmentName: segment,
        segmentDisplayName: segmentDef.displayName,
        rfmScore,
        recencyScore,
        frequencyScore,
        monetaryScore,
        assignedAt: new Date(),
        isActive: true,
        metadata: {
          isInitialAssignment: true,
          promotionStrategy: segmentDef.promotionStrategy,
        },
      });

      this.logger.log(`User ${userId} assigned to segment: ${segment}`);
    }

    return this.userSegmentRepository.save(userSegment);
  }

  /**
   * Determine segment based on RFM scores
   */
  private determineSegment(
    recencyScore: number,
    frequencyScore: number,
    monetaryScore: number,
  ): Segment {
    // Check segments in priority order
    for (const segmentDef of this.segmentDefinitions) {
      const { rfmCriteria } = segmentDef;

      if (
        recencyScore >= rfmCriteria.recencyMin &&
        recencyScore <= rfmCriteria.recencyMax &&
        frequencyScore >= rfmCriteria.frequencyMin &&
        frequencyScore <= rfmCriteria.frequencyMax &&
        monetaryScore >= rfmCriteria.monetaryMin &&
        monetaryScore <= rfmCriteria.monetaryMax
      ) {
        return segmentDef.name;
      }
    }

    // Default to hibernating if no match
    return Segment.HIBERNATING;
  }

  /**
   * Get user's current segment
   */
  async getUserSegment(userId: string): Promise<UserSegment | null> {
    return this.userSegmentRepository.findOne({
      where: { userId, isActive: true },
    });
  }

  /**
   * Get all users in a specific segment
   */
  async getUsersInSegment(
    segment: Segment,
    limit: number = 100,
  ): Promise<UserSegment[]> {
    return this.userSegmentRepository.find({
      where: { segmentName: segment, isActive: true },
      take: limit,
      order: { rfmScore: 'DESC' },
    });
  }

  /**
   * Get segment distribution across all users
   */
  async getSegmentDistribution(): Promise<SegmentDistribution[]> {
    const results = await this.userSegmentRepository
      .createQueryBuilder('segment')
      .select('segment.segmentName', 'segment')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(segment.rfmScore)', 'avgRfmScore')
      .addSelect('AVG(segment.recencyScore)', 'avgRecencyScore')
      .addSelect('AVG(segment.frequencyScore)', 'avgFrequencyScore')
      .addSelect('AVG(segment.monetaryScore)', 'avgMonetaryScore')
      .where('segment.isActive = :isActive', { isActive: true })
      .groupBy('segment.segmentName')
      .getRawMany();

    const totalUsers = results.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    // Get avg LTV for each segment (would need to join with users/orders)
    const distribution: SegmentDistribution[] = results.map((r) => ({
      segment: r.segment as Segment,
      count: parseInt(r.count, 10),
      percentage: (parseInt(r.count, 10) / totalUsers) * 100,
      avgLifetimeValue: 0, // TODO: Calculate from orders
      avgRecencyScore: parseFloat(r.avgRecencyScore),
      avgFrequencyScore: parseFloat(r.avgFrequencyScore),
      avgMonetaryScore: parseFloat(r.avgMonetaryScore),
    }));

    // Sort by segment priority
    return distribution.sort((a, b) => {
      const priorityA = this.segmentDefinitions.find((s) => s.name === a.segment)?.priority || 999;
      const priorityB = this.segmentDefinitions.find((s) => s.name === b.segment)?.priority || 999;
      return priorityA - priorityB;
    });
  }

  /**
   * Batch assign segments for all users (for initial setup or periodic refresh)
   */
  async assignAllUserSegments(limit?: number): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get all users
    const users = await this.userRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`Starting batch segment assignment for ${users.length} users`);

    for (const user of users) {
      try {
        await this.assignUserSegment(user.id);
        results.processed++;

        // Log progress every 100 users
        if (results.processed % 100 === 0) {
          this.logger.log(`Processed ${results.processed}/${users.length} users`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`User ${user.id}: ${error.message}`);
        this.logger.error(`Failed to assign segment for user ${user.id}:`, error);
      }
    }

    this.logger.log(
      `Batch segment assignment complete: ${results.processed} succeeded, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Get segment definitions for reference
   */
  getSegmentDefinitions(): SegmentDefinition[] {
    return this.segmentDefinitions;
  }

  /**
   * Get promotion strategy for a segment
   */
  getPromotionStrategy(segment: Segment): string {
    return this.segmentDefinitions.find((s) => s.name === segment)?.promotionStrategy || '';
  }
}
