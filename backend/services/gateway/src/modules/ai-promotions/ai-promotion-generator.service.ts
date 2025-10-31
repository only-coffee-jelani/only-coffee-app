import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, User } from '@shared/database/entities';
import { SegmentationService } from '../segmentation/segmentation.service';
import { ChurnPredictionService } from '../churn/churn-prediction.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { FeatureStoreService } from '../features/feature-store.service';

/**
 * AI Promotion status
 */
export enum AIPromotionStatus {
  DRAFT = 'draft', // Generated but not submitted for review
  PENDING_REVIEW = 'pending_review', // Submitted, awaiting admin approval
  APPROVED = 'approved', // Admin approved, ready to use
  REJECTED = 'rejected', // Admin rejected
  ACTIVE = 'active', // Currently running
  PAUSED = 'paused', // Temporarily stopped
  COMPLETED = 'completed', // Ended (expired or manually stopped)
}

/**
 * AI-generated promotion
 */
export interface AIPromotion {
  id: string;
  status: AIPromotionStatus;

  // Promotion details
  title: string;
  description: string;
  offerType: 'percentage' | 'fixed_amount' | 'bogo' | 'free_item' | 'points_multiplier';
  offerValue: number; // e.g., 20 for 20% off, 5 for $5 off

  // Targeting
  targetSegments: string[];
  targetChurnRisk?: string[];
  excludeSegments?: string[];
  minPurchaseAmount?: number;

  // Validity
  validFrom?: Date;
  validUntil?: Date;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;

  // AI generation metadata
  generatedAt: Date;
  generatedBy: 'ai' | 'admin';
  generationReason: string;
  confidenceScore: number; // 0-1

  // ML inputs that led to this promotion
  mlContext: {
    topSegments: string[];
    averageChurnRisk: number;
    topRecommendedItems: string[];
    contextualFactors: string[];
  };

  // Admin review
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Performance tracking
  impressions?: number;
  redemptions?: number;
  revenue?: number;
  conversionRate?: number;
}

/**
 * Promotion generation request
 */
export interface GenerationRequest {
  goal: 'retention' | 'acquisition' | 'revenue' | 'engagement';
  targetSegments?: string[];
  budget?: number; // Max discount budget
  duration?: number; // Days
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * Promotion template
 */
interface PromotionTemplate {
  title: string;
  description: string;
  offerType: AIPromotion['offerType'];
  offerValue: number;
  targetSegments: string[];
  reason: string;
}

@Injectable()
export class AIPromotionGeneratorService {
  private readonly logger = new Logger(AIPromotionGeneratorService.name);

  // In-memory queue (would move to database)
  private promotionQueue = new Map<string, AIPromotion>();

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly segmentationService: SegmentationService,
    private readonly churnPredictionService: ChurnPredictionService,
    private readonly recommendationService: RecommendationService,
    private readonly featureStoreService: FeatureStoreService,
  ) {}

  /**
   * Generate AI promotion based on current user base and goals
   */
  async generatePromotion(request: GenerationRequest): Promise<AIPromotion> {
    this.logger.log(`Generating AI promotion for goal: ${request.goal}`);

    // Analyze user base
    const analysis = await this.analyzeUserBase(request);

    // Generate promotion template based on goal
    const template = await this.selectPromotionTemplate(request, analysis);

    // Create AI promotion
    const promotion: AIPromotion = {
      id: this.generatePromotionId(),
      status: AIPromotionStatus.DRAFT,
      title: template.title,
      description: template.description,
      offerType: template.offerType,
      offerValue: template.offerValue,
      targetSegments: template.targetSegments,
      generatedAt: new Date(),
      generatedBy: 'ai',
      generationReason: template.reason,
      confidenceScore: analysis.confidence,
      mlContext: {
        topSegments: analysis.topSegments,
        averageChurnRisk: analysis.averageChurnRisk,
        topRecommendedItems: analysis.topRecommendedItems,
        contextualFactors: analysis.contextualFactors,
      },
      validFrom: new Date(),
      validUntil: new Date(Date.now() + (request.duration || 7) * 24 * 60 * 60 * 1000),
      maxRedemptionsPerUser: 1,
    };

    // Store in queue
    this.promotionQueue.set(promotion.id, promotion);

    this.logger.log(`Generated promotion: ${promotion.title} (${promotion.id})`);

    return promotion;
  }

  /**
   * Analyze user base to inform promotion generation
   */
  private async analyzeUserBase(
    request: GenerationRequest,
  ): Promise<{
    topSegments: string[];
    averageChurnRisk: number;
    topRecommendedItems: string[];
    contextualFactors: string[];
    confidence: number;
  }> {
    // Sample recent users for analysis (limit for performance)
    const users = await this.userRepository.find({
      take: 500,
      order: { lastActivityDate: 'DESC' },
    });

    // Get segments for users
    const segmentCounts = new Map<string, number>();
    let totalChurnProbability = 0;
    let churnPredictions = 0;

    for (const user of users.slice(0, 100)) {
      try {
        // Get segment
        const userSegment = await this.segmentationService.assignUserSegment(user.id);
        segmentCounts.set(
          userSegment.segment,
          (segmentCounts.get(userSegment.segment) || 0) + 1,
        );

        // Get churn risk
        const churnPrediction = await this.churnPredictionService.predictChurn(user.id);
        totalChurnProbability += churnPrediction.churnProbability;
        churnPredictions++;
      } catch (error) {
        // Skip users with errors
      }
    }

    // Sort segments by count
    const topSegments = Array.from(segmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([segment]) => segment);

    const averageChurnRisk = churnPredictions > 0 ? totalChurnProbability / churnPredictions : 0;

    // Get popular items
    const recommendations = await this.recommendationService.getPopularItems(10);
    const topRecommendedItems = recommendations.slice(0, 3).map((r) => r.name);

    // Contextual factors
    const contextualFactors: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (hour >= 6 && hour < 11) contextualFactors.push('morning_hours');
    if (day === 1) contextualFactors.push('monday');
    if (day === 5) contextualFactors.push('friday');
    if (averageChurnRisk > 0.5) contextualFactors.push('high_churn_risk');

    // Confidence based on data completeness
    const confidence = Math.min(
      0.5 + // Base confidence
      (topSegments.length > 0 ? 0.2 : 0) +
      (churnPredictions > 10 ? 0.2 : 0) +
      (topRecommendedItems.length > 0 ? 0.1 : 0),
      1.0,
    );

    return {
      topSegments,
      averageChurnRisk,
      topRecommendedItems,
      contextualFactors,
      confidence,
    };
  }

  /**
   * Select promotion template based on goal and analysis
   */
  private async selectPromotionTemplate(
    request: GenerationRequest,
    analysis: any,
  ): Promise<PromotionTemplate> {
    const { goal, budget = 1000, urgency = 'medium' } = request;

    // Determine discount level based on urgency and churn risk
    const baseDiscount = urgency === 'high' ? 30 : urgency === 'medium' ? 20 : 15;
    const churnBoost = analysis.averageChurnRisk > 0.6 ? 10 : 0;
    const discount = Math.min(baseDiscount + churnBoost, 40); // Max 40% off

    switch (goal) {
      case 'retention':
        return this.generateRetentionPromotion(analysis, discount);

      case 'acquisition':
        return this.generateAcquisitionPromotion(analysis, discount);

      case 'revenue':
        return this.generateRevenuePromotion(analysis, discount);

      case 'engagement':
        return this.generateEngagementPromotion(analysis, discount);

      default:
        return this.generateRetentionPromotion(analysis, discount);
    }
  }

  /**
   * Generate retention-focused promotion
   */
  private generateRetentionPromotion(
    analysis: any,
    discount: number,
  ): PromotionTemplate {
    const targetSegments = analysis.topSegments.filter(
      (s: string) => s.includes('at_risk') || s.includes('hibernating'),
    );

    if (targetSegments.length === 0) {
      // Fallback to at-risk segments
      targetSegments.push('at_risk', 'hibernating');
    }

    return {
      title: `We Miss You! ${discount}% Off Your Next Order`,
      description: `Come back and enjoy ${discount}% off! We've missed having you. Valid on any menu item.`,
      offerType: 'percentage',
      offerValue: discount,
      targetSegments,
      reason: `Targeting at-risk users (avg churn: ${(analysis.averageChurnRisk * 100).toFixed(1)}%)`,
    };
  }

  /**
   * Generate acquisition-focused promotion
   */
  private generateAcquisitionPromotion(
    analysis: any,
    discount: number,
  ): PromotionTemplate {
    return {
      title: `Welcome! ${discount}% Off Your First Order`,
      description: `New to Only Coffee? Get ${discount}% off your first order. Try our ${analysis.topRecommendedItems[0] || 'specialty drinks'}!`,
      offerType: 'percentage',
      offerValue: discount,
      targetSegments: ['new_customers'],
      reason: 'Onboarding new users with welcome offer',
    };
  }

  /**
   * Generate revenue-focused promotion
   */
  private generateRevenuePromotion(
    analysis: any,
    discount: number,
  ): PromotionTemplate {
    const minPurchase = 15; // Require $15 minimum

    return {
      title: `$${discount} Off Orders Over $${minPurchase}`,
      description: `Spend $${minPurchase} or more and get $${discount} off! Stock up on your favorites.`,
      offerType: 'fixed_amount',
      offerValue: discount / 2, // Convert percentage to dollar amount
      targetSegments: ['champions', 'loyal_customers', 'potential_loyalist'],
      reason: 'Increasing basket size among high-value customers',
    };
  }

  /**
   * Generate engagement-focused promotion
   */
  private generateEngagementPromotion(
    analysis: any,
    discount: number,
  ): PromotionTemplate {
    const topItem = analysis.topRecommendedItems[0] || 'any drink';

    return {
      title: `Buy One ${topItem}, Get One 50% Off`,
      description: `Share the love! Buy one ${topItem} and get another at 50% off. Perfect for friends!`,
      offerType: 'bogo',
      offerValue: 50,
      targetSegments: ['champions', 'loyal_customers'],
      reason: 'Encouraging social engagement and referrals',
    };
  }

  /**
   * Submit promotion for admin review
   */
  async submitForReview(promotionId: string): Promise<AIPromotion> {
    const promotion = this.promotionQueue.get(promotionId);

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    if (promotion.status !== AIPromotionStatus.DRAFT) {
      throw new Error('Promotion must be in draft status');
    }

    promotion.status = AIPromotionStatus.PENDING_REVIEW;
    this.promotionQueue.set(promotionId, promotion);

    this.logger.log(`Promotion ${promotionId} submitted for review`);

    return promotion;
  }

  /**
   * Admin: Approve promotion
   */
  async approvePromotion(
    promotionId: string,
    adminId: string,
    notes?: string,
  ): Promise<AIPromotion> {
    const promotion = this.promotionQueue.get(promotionId);

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    if (promotion.status !== AIPromotionStatus.PENDING_REVIEW) {
      throw new Error('Promotion must be pending review');
    }

    promotion.status = AIPromotionStatus.APPROVED;
    promotion.reviewedBy = adminId;
    promotion.reviewedAt = new Date();
    promotion.reviewNotes = notes;

    this.promotionQueue.set(promotionId, promotion);

    this.logger.log(`Promotion ${promotionId} approved by ${adminId}`);

    // TODO: Create actual Promotion entity in database

    return promotion;
  }

  /**
   * Admin: Reject promotion
   */
  async rejectPromotion(
    promotionId: string,
    adminId: string,
    reason: string,
  ): Promise<AIPromotion> {
    const promotion = this.promotionQueue.get(promotionId);

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    if (promotion.status !== AIPromotionStatus.PENDING_REVIEW) {
      throw new Error('Promotion must be pending review');
    }

    promotion.status = AIPromotionStatus.REJECTED;
    promotion.reviewedBy = adminId;
    promotion.reviewedAt = new Date();
    promotion.reviewNotes = reason;

    this.promotionQueue.set(promotionId, promotion);

    this.logger.log(`Promotion ${promotionId} rejected by ${adminId}: ${reason}`);

    return promotion;
  }

  /**
   * Get promotions in review queue
   */
  async getReviewQueue(): Promise<AIPromotion[]> {
    return Array.from(this.promotionQueue.values())
      .filter((p) => p.status === AIPromotionStatus.PENDING_REVIEW)
      .sort((a, b) => a.generatedAt.getTime() - b.generatedAt.getTime());
  }

  /**
   * Get all AI promotions
   */
  async getAllPromotions(status?: AIPromotionStatus): Promise<AIPromotion[]> {
    const promotions = Array.from(this.promotionQueue.values());

    if (status) {
      return promotions.filter((p) => p.status === status);
    }

    return promotions.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Get promotion by ID
   */
  async getPromotion(promotionId: string): Promise<AIPromotion | undefined> {
    return this.promotionQueue.get(promotionId);
  }

  /**
   * Update promotion
   */
  async updatePromotion(
    promotionId: string,
    updates: Partial<AIPromotion>,
  ): Promise<AIPromotion> {
    const promotion = this.promotionQueue.get(promotionId);

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Only allow updates to draft promotions
    if (promotion.status !== AIPromotionStatus.DRAFT) {
      throw new Error('Can only update draft promotions');
    }

    Object.assign(promotion, updates);
    this.promotionQueue.set(promotionId, promotion);

    this.logger.log(`Promotion ${promotionId} updated`);

    return promotion;
  }

  /**
   * Delete promotion
   */
  async deletePromotion(promotionId: string): Promise<void> {
    const promotion = this.promotionQueue.get(promotionId);

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Only allow deletion of draft or rejected promotions
    if (
      promotion.status !== AIPromotionStatus.DRAFT &&
      promotion.status !== AIPromotionStatus.REJECTED
    ) {
      throw new Error('Can only delete draft or rejected promotions');
    }

    this.promotionQueue.delete(promotionId);

    this.logger.log(`Promotion ${promotionId} deleted`);
  }

  /**
   * Batch generate promotions for different goals
   */
  async batchGeneratePromotions(): Promise<AIPromotion[]> {
    this.logger.log('Starting batch promotion generation');

    const goals: GenerationRequest[] = [
      { goal: 'retention', urgency: 'high' },
      { goal: 'acquisition', urgency: 'medium' },
      { goal: 'revenue', urgency: 'low' },
      { goal: 'engagement', urgency: 'medium' },
    ];

    const promotions: AIPromotion[] = [];

    for (const request of goals) {
      try {
        const promotion = await this.generatePromotion(request);
        promotions.push(promotion);
      } catch (error) {
        this.logger.error(`Failed to generate ${request.goal} promotion:`, error);
      }
    }

    this.logger.log(`Batch generation complete: ${promotions.length} promotions created`);

    return promotions;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
    avgConfidence: number;
    oldestPending?: Date;
  }> {
    const promotions = Array.from(this.promotionQueue.values());

    const stats = {
      total: promotions.length,
      pending: promotions.filter((p) => p.status === AIPromotionStatus.PENDING_REVIEW).length,
      approved: promotions.filter((p) => p.status === AIPromotionStatus.APPROVED).length,
      rejected: promotions.filter((p) => p.status === AIPromotionStatus.REJECTED).length,
      draft: promotions.filter((p) => p.status === AIPromotionStatus.DRAFT).length,
      avgConfidence:
        promotions.reduce((sum, p) => sum + p.confidenceScore, 0) / promotions.length || 0,
      oldestPending: undefined as Date | undefined,
    };

    const pendingPromotions = promotions.filter(
      (p) => p.status === AIPromotionStatus.PENDING_REVIEW,
    );
    if (pendingPromotions.length > 0) {
      stats.oldestPending = pendingPromotions.reduce((oldest, p) =>
        p.generatedAt < oldest ? p.generatedAt : oldest,
      pendingPromotions[0].generatedAt);
    }

    return stats;
  }

  /**
   * Generate unique promotion ID
   */
  private generatePromotionId(): string {
    return `ai_promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
