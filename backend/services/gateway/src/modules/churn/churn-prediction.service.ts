import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserEvent, Order } from '@shared/database/entities';
import { FeatureStoreService } from '../features/feature-store.service';

export enum ChurnRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number; // 0-1
  riskLevel: ChurnRiskLevel;
  riskFactors: string[];
  recommendations: string[];
  computedAt: Date;

  // Supporting metrics
  daysSinceLastActivity: number;
  daysSinceLastPurchase: number;
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  engagementScore: number; // 0-100
  lifetimeValue: number;

  // Predictive features
  predictedChurnDate: Date | null;
  retentionPriority: number; // 1-10 (10 = highest priority)
}

export interface ChurnMetrics {
  totalUsers: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  averageChurnProbability: number;
}

@Injectable()
export class ChurnPredictionService {
  private readonly logger = new Logger(ChurnPredictionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly featureStoreService: FeatureStoreService,
  ) {}

  /**
   * Predict churn probability for a user
   * Uses rule-based scoring (can be replaced with ML model later)
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    // Get user features
    const features = await this.featureStoreService.getUserFeatures({
      userId,
    });

    const { rfm, engagement, churn } = features;

    // Calculate churn probability using weighted scoring
    const churnProbability = this.calculateChurnProbability(
      rfm,
      engagement,
      churn,
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(churnProbability);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(rfm, engagement, churn);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, riskFactors);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(engagement);

    // Predict churn date (if high risk)
    const predictedChurnDate = churnProbability > 0.5
      ? this.predictChurnDate(churn.daysSinceLastActivity, churn.activityTrend)
      : null;

    // Calculate retention priority
    const retentionPriority = this.calculateRetentionPriority(
      churnProbability,
      rfm.lifetimeValue,
      engagement.isLoyaltyMember,
    );

    return {
      userId,
      churnProbability,
      riskLevel,
      riskFactors,
      recommendations,
      computedAt: new Date(),
      daysSinceLastActivity: churn.daysSinceLastActivity,
      daysSinceLastPurchase: rfm.daysSinceLastPurchase,
      activityTrend: churn.activityTrend,
      engagementScore,
      lifetimeValue: rfm.lifetimeValue,
      predictedChurnDate,
      retentionPriority,
    };
  }

  /**
   * Calculate churn probability using weighted features
   */
  private calculateChurnProbability(
    rfm: any,
    engagement: any,
    churn: any,
  ): number {
    let score = 0;
    let weight = 0;

    // Recency (30% weight) - Most important
    const recencyDays = rfm.daysSinceLastPurchase;
    if (recencyDays > 90) {
      score += 0.9 * 0.3;
    } else if (recencyDays > 60) {
      score += 0.7 * 0.3;
    } else if (recencyDays > 30) {
      score += 0.5 * 0.3;
    } else if (recencyDays > 14) {
      score += 0.3 * 0.3;
    } else {
      score += 0.1 * 0.3;
    }
    weight += 0.3;

    // Activity trend (25% weight)
    if (churn.activityTrend === 'decreasing') {
      score += 0.8 * 0.25;
    } else if (churn.activityTrend === 'stable') {
      score += 0.4 * 0.25;
    } else {
      score += 0.1 * 0.25;
    }
    weight += 0.25;

    // Engagement decline rate (20% weight)
    const declineRate = churn.engagementDeclineRate / 100; // Normalize to 0-1
    score += Math.min(declineRate, 1) * 0.2;
    weight += 0.2;

    // Frequency (15% weight)
    if (rfm.totalPurchases === 0) {
      score += 1.0 * 0.15;
    } else if (rfm.totalPurchases === 1) {
      score += 0.7 * 0.15;
    } else if (rfm.purchasesLast90Days === 0) {
      score += 0.8 * 0.15;
    } else if (rfm.purchasesLast30Days === 0) {
      score += 0.5 * 0.15;
    } else {
      score += 0.2 * 0.15;
    }
    weight += 0.15;

    // Streak broken (10% weight)
    if (engagement.currentStreak === 0 && engagement.longestStreak > 3) {
      score += 0.7 * 0.1;
    } else if (engagement.currentStreak === 0) {
      score += 0.4 * 0.1;
    } else {
      score += 0.1 * 0.1;
    }
    weight += 0.1;

    // Normalize score
    return Math.min(score / weight, 1);
  }

  /**
   * Determine risk level from probability
   */
  private determineRiskLevel(probability: number): ChurnRiskLevel {
    if (probability >= 0.75) return ChurnRiskLevel.CRITICAL;
    if (probability >= 0.5) return ChurnRiskLevel.HIGH;
    if (probability >= 0.25) return ChurnRiskLevel.MEDIUM;
    return ChurnRiskLevel.LOW;
  }

  /**
   * Identify specific risk factors
   */
  private identifyRiskFactors(rfm: any, engagement: any, churn: any): string[] {
    const factors: string[] = [];

    if (rfm.daysSinceLastPurchase > 60) {
      factors.push(`No purchase in ${rfm.daysSinceLastPurchase} days`);
    }

    if (churn.daysSinceLastActivity > 30) {
      factors.push(`Inactive for ${churn.daysSinceLastActivity} days`);
    }

    if (churn.activityTrend === 'decreasing') {
      factors.push('Declining engagement trend');
    }

    if (churn.engagementDeclineRate > 50) {
      factors.push(`${Math.round(churn.engagementDeclineRate)}% engagement decline`);
    }

    if (engagement.currentStreak === 0 && engagement.longestStreak > 5) {
      factors.push('Lost streak (previously had strong habit)');
    }

    if (rfm.totalPurchases === 1) {
      factors.push('Single purchase customer (never returned)');
    }

    if (engagement.appOpensLast30Days === 0) {
      factors.push('No app opens in 30 days');
    }

    if (churn.promotionResponseRate < 0.2 && churn.daysSinceLastPromotion !== null) {
      factors.push('Low promotion response rate');
    }

    return factors;
  }

  /**
   * Generate retention recommendations
   */
  private generateRecommendations(
    riskLevel: ChurnRiskLevel,
    riskFactors: string[],
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case ChurnRiskLevel.CRITICAL:
        recommendations.push('URGENT: Send high-value win-back offer immediately');
        recommendations.push('Personal outreach from customer success team');
        recommendations.push('Survey: Ask why they stopped using the app');
        break;

      case ChurnRiskLevel.HIGH:
        recommendations.push('Send personalized re-engagement campaign');
        recommendations.push('Offer exclusive discount (20-30% off)');
        recommendations.push('Highlight new features or menu items');
        break;

      case ChurnRiskLevel.MEDIUM:
        recommendations.push('Send gentle reminder about benefits');
        recommendations.push('Offer moderate incentive (15% off or free item)');
        recommendations.push('Re-engage with favorite items recommendation');
        break;

      case ChurnRiskLevel.LOW:
        recommendations.push('Continue normal engagement cadence');
        recommendations.push('Nurture with value-add content');
        recommendations.push('Maintain loyalty program benefits');
        break;
    }

    // Add specific recommendations based on risk factors
    if (riskFactors.some((f) => f.includes('streak'))) {
      recommendations.push('Restart streak challenge with bonus rewards');
    }

    if (riskFactors.some((f) => f.includes('Single purchase'))) {
      recommendations.push('Second purchase incentive campaign');
    }

    return recommendations;
  }

  /**
   * Calculate overall engagement score (0-100)
   */
  private calculateEngagementScore(engagement: any): number {
    let score = 0;

    // App opens (30 points max)
    score += Math.min((engagement.appOpensLast30Days / 20) * 30, 30);

    // Purchases (25 points max)
    const purchaseFreq = engagement.totalAppOpens > 0
      ? (engagement.totalPurchases / engagement.totalAppOpens) * 100
      : 0;
    score += Math.min(purchaseFreq * 0.25, 25);

    // Current streak (20 points max)
    score += Math.min((engagement.currentStreak / 30) * 20, 20);

    // Menu views (15 points max)
    score += Math.min((engagement.menuViewsLast30Days / 50) * 15, 15);

    // Loyalty member (10 points bonus)
    if (engagement.isLoyaltyMember) {
      score += 10;
    }

    return Math.round(Math.min(score, 100));
  }

  /**
   * Predict when user might churn
   */
  private predictChurnDate(
    daysSinceLastActivity: number,
    trend: 'increasing' | 'stable' | 'decreasing',
  ): Date | null {
    if (trend !== 'decreasing') return null;

    // Simple linear prediction: if decreasing, predict churn in 30-90 days
    const daysUntilChurn = trend === 'decreasing'
      ? Math.max(30, 90 - daysSinceLastActivity)
      : 180;

    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() + daysUntilChurn);

    return churnDate;
  }

  /**
   * Calculate retention priority (1-10)
   */
  private calculateRetentionPriority(
    churnProbability: number,
    lifetimeValue: number,
    isLoyaltyMember: boolean,
  ): number {
    // Base priority from churn probability (1-6)
    let priority = Math.ceil(churnProbability * 6);

    // Add points for high LTV
    if (lifetimeValue > 500) priority += 2;
    else if (lifetimeValue > 200) priority += 1;

    // Add points for loyalty members
    if (isLoyaltyMember) priority += 1;

    // Add points for high churn + high value (critical combo)
    if (churnProbability > 0.7 && lifetimeValue > 200) {
      priority += 1;
    }

    return Math.min(priority, 10);
  }

  /**
   * Get churn predictions for all users at risk
   */
  async getAtRiskUsers(
    minRiskLevel: ChurnRiskLevel = ChurnRiskLevel.MEDIUM,
    limit: number = 100,
  ): Promise<ChurnPrediction[]> {
    // Get users who haven't been active recently
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastActivityDate < :date', {
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      })
      .orderBy('user.lastActivityDate', 'ASC')
      .limit(limit)
      .getMany();

    const predictions: ChurnPrediction[] = [];

    for (const user of users) {
      try {
        const prediction = await this.predictChurn(user.userId);

        // Filter by minimum risk level
        const riskLevels = [
          ChurnRiskLevel.LOW,
          ChurnRiskLevel.MEDIUM,
          ChurnRiskLevel.HIGH,
          ChurnRiskLevel.CRITICAL,
        ];
        const minIndex = riskLevels.indexOf(minRiskLevel);
        const userIndex = riskLevels.indexOf(prediction.riskLevel);

        if (userIndex >= minIndex) {
          predictions.push(prediction);
        }
      } catch (error) {
        this.logger.error(`Failed to predict churn for user ${user.userId}:`, error);
      }
    }

    // Sort by retention priority (highest first)
    return predictions.sort((a, b) => b.retentionPriority - a.retentionPriority);
  }

  /**
   * Get churn metrics for dashboard
   */
  async getChurnMetrics(): Promise<ChurnMetrics> {
    // This would typically query pre-computed churn predictions
    // For now, return placeholder
    const totalUsers = await this.userRepository.count();

    return {
      totalUsers,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0,
      averageChurnProbability: 0,
    };
  }

  /**
   * Batch compute churn predictions for all users
   */
  async batchComputeChurnPredictions(limit?: number): Promise<{
    processed: number;
    failed: number;
    distribution: Record<ChurnRiskLevel, number>;
  }> {
    const users = await this.userRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const results = {
      processed: 0,
      failed: 0,
      distribution: {
        [ChurnRiskLevel.LOW]: 0,
        [ChurnRiskLevel.MEDIUM]: 0,
        [ChurnRiskLevel.HIGH]: 0,
        [ChurnRiskLevel.CRITICAL]: 0,
      },
    };

    this.logger.log(`Starting batch churn prediction for ${users.length} users`);

    for (const user of users) {
      try {
        const prediction = await this.predictChurn(user.userId);
        results.distribution[prediction.riskLevel]++;
        results.processed++;

        if (results.processed % 100 === 0) {
          this.logger.log(`Processed ${results.processed}/${users.length} users`);
        }
      } catch (error: any) {
        results.failed++;
        this.logger.error(`Failed to compute churn for user ${user.userId}:`, error);
      }
    }

    this.logger.log(
      `Batch churn prediction complete: ${results.processed} succeeded, ${results.failed} failed`,
    );

    return results;
  }
}
