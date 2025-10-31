import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureStoreService } from './feature-store.service';
import { FeatureComputationOptions, UserFeatureVector } from './interfaces/user-features.interface';

@Controller('features')
export class FeatureStoreController {
  constructor(private readonly featureStoreService: FeatureStoreService) {}

  /**
   * Get user features (with caching)
   * GET /api/v1/features/user
   */
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserFeatures(
    @Req() req: any,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('sessionId') sessionId?: string,
  ): Promise<{ success: boolean; features: UserFeatureVector }> {
    const userId = req.user.userId;

    const options: FeatureComputationOptions = {
      userId,
      forceRefresh: forceRefresh === 'true',
      currentLocation:
        latitude && longitude
          ? {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }
          : undefined,
      sessionId,
    };

    const features = await this.featureStoreService.getUserFeatures(options);

    return {
      success: true,
      features,
    };
  }

  /**
   * Get specific feature group for a user
   * GET /api/v1/features/user/rfm
   * GET /api/v1/features/user/engagement
   * GET /api/v1/features/user/behavioral
   * GET /api/v1/features/user/contextual
   * GET /api/v1/features/user/churn
   */
  @Get('user/:featureGroup')
  @UseGuards(JwtAuthGuard)
  async getFeatureGroup(
    @Req() req: any,
    @Query('featureGroup') featureGroup: string,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('sessionId') sessionId?: string,
  ): Promise<{ success: boolean; features: any }> {
    const userId = req.user.userId;

    const options: FeatureComputationOptions = {
      userId,
      forceRefresh: forceRefresh === 'true',
      currentLocation:
        latitude && longitude
          ? {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }
          : undefined,
      sessionId,
      includeRFM: featureGroup === 'rfm',
      includeEngagement: featureGroup === 'engagement',
      includeBehavioral: featureGroup === 'behavioral',
      includeContextual: featureGroup === 'contextual',
      includeChurn: featureGroup === 'churn',
    };

    const allFeatures = await this.featureStoreService.getUserFeatures(options);

    // Return only requested feature group
    const featureData = (allFeatures as any)[featureGroup];

    return {
      success: true,
      features: featureData || null,
    };
  }

  /**
   * Invalidate feature cache for current user
   * POST /api/v1/features/invalidate-cache
   */
  @Post('invalidate-cache')
  @UseGuards(JwtAuthGuard)
  async invalidateCache(@Req() req: any): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    await this.featureStoreService.invalidateUserCache(userId);

    return {
      success: true,
      message: 'Feature cache invalidated successfully',
    };
  }

  /**
   * Get RFM scores for personalization (lightweight endpoint)
   * GET /api/v1/features/rfm-scores
   */
  @Get('rfm-scores')
  @UseGuards(JwtAuthGuard)
  async getRFMScores(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    rfm: {
      recencyScore: number;
      frequencyScore: number;
      monetaryScore: number;
      rfmScore: number;
      daysSinceLastPurchase: number;
      totalPurchases: number;
      lifetimeValue: number;
    };
  }> {
    const userId = req.user.userId;

    const features = await this.featureStoreService.getUserFeatures({
      userId,
      includeRFM: true,
      includeEngagement: false,
      includeBehavioral: false,
      includeContextual: false,
      includeChurn: false,
    });

    return {
      success: true,
      rfm: {
        recencyScore: features.rfm.recencyScore,
        frequencyScore: features.rfm.frequencyScore,
        monetaryScore: features.rfm.monetaryScore,
        rfmScore: features.rfm.rfmScore,
        daysSinceLastPurchase: features.rfm.daysSinceLastPurchase,
        totalPurchases: features.rfm.totalPurchases,
        lifetimeValue: features.rfm.lifetimeValue,
      },
    };
  }

  /**
   * Get contextual features for real-time personalization
   * GET /api/v1/features/contextual?lat=X&lon=Y&sessionId=Z
   */
  @Get('contextual')
  @UseGuards(JwtAuthGuard)
  async getContextualFeatures(
    @Req() req: any,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('sessionId') sessionId?: string,
  ): Promise<{ success: boolean; contextual: any }> {
    const userId = req.user.userId;

    const features = await this.featureStoreService.getUserFeatures({
      userId,
      includeRFM: false,
      includeEngagement: false,
      includeBehavioral: false,
      includeContextual: true,
      includeChurn: false,
      currentLocation:
        latitude && longitude
          ? {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }
          : undefined,
      sessionId,
      forceRefresh: true, // Always fresh for contextual
    });

    return {
      success: true,
      contextual: features.contextual,
    };
  }

  /**
   * Get churn risk for user
   * GET /api/v1/features/churn-risk
   */
  @Get('churn-risk')
  @UseGuards(JwtAuthGuard)
  async getChurnRisk(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    churn: {
      riskSegment: string | null;
      daysSinceLastActivity: number;
      activityTrend: string;
      churnProbability: number | null;
    };
  }> {
    const userId = req.user.userId;

    const features = await this.featureStoreService.getUserFeatures({
      userId,
      includeRFM: false,
      includeEngagement: false,
      includeBehavioral: false,
      includeContextual: false,
      includeChurn: true,
    });

    return {
      success: true,
      churn: {
        riskSegment: features.churn.churnRiskSegment,
        daysSinceLastActivity: features.churn.daysSinceLastActivity,
        activityTrend: features.churn.activityTrend,
        churnProbability: features.churn.churnProbability,
      },
    };
  }

  /**
   * Get feature quality metrics
   * GET /api/v1/features/quality
   */
  @Get('quality')
  @UseGuards(JwtAuthGuard)
  async getFeatureQuality(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    quality: {
      completeness: number;
      freshness: number;
      confidence: number;
    };
    computedAt: Date;
  }> {
    const userId = req.user.userId;

    const features = await this.featureStoreService.getUserFeatures({
      userId,
    });

    return {
      success: true,
      quality: features.dataQuality,
      computedAt: features.computedAt,
    };
  }

  /**
   * Batch compute features for multiple users (admin endpoint)
   * POST /api/v1/features/batch-compute
   */
  @Post('batch-compute')
  @UseGuards(JwtAuthGuard)
  async batchComputeFeatures(
    @Body() body: { userIds: string[] },
  ): Promise<{
    success: boolean;
    message: string;
    processed: number;
  }> {
    // TODO: Add admin role check
    const userIds = body.userIds || [];

    let processed = 0;
    for (const userId of userIds) {
      try {
        await this.featureStoreService.getUserFeatures({
          userId,
          forceRefresh: true,
        });
        processed++;
      } catch (error) {
        console.error(`Failed to compute features for user ${userId}:`, error);
      }
    }

    return {
      success: true,
      message: `Batch computed features for ${processed} users`,
      processed,
    };
  }
}
