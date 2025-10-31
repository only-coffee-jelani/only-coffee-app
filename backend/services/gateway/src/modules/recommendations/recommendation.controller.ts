import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  RecommendationService,
  RecommendedItem,
  RecommendationContext,
} from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * Get personalized recommendations for current user
   * GET /api/v1/recommendations/for-me?limit=10
   */
  @Get('for-me')
  @UseGuards(JwtAuthGuard)
  async getMyRecommendations(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const userId = req.user.userId;
    const maxLimit = limit ? parseInt(limit, 10) : 10;

    const context: RecommendationContext = {
      userId,
      currentTime: new Date(),
      limit: maxLimit,
    };

    const recommendations = await this.recommendationService.getPersonalizedRecommendations(
      context,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Get personalized recommendations with context (weather, location)
   * POST /api/v1/recommendations/for-me/contextual
   */
  @Post('for-me/contextual')
  @UseGuards(JwtAuthGuard)
  async getContextualRecommendations(
    @Req() req: any,
    @Body() body: {
      weather?: { temperature: number; condition: string };
      location?: { latitude: number; longitude: number };
      limit?: number;
    },
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const userId = req.user.userId;

    const context: RecommendationContext = {
      userId,
      currentTime: new Date(),
      weather: body.weather,
      location: body.location,
      limit: body.limit || 10,
    };

    const recommendations = await this.recommendationService.getPersonalizedRecommendations(
      context,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Get items similar to a specific menu item
   * GET /api/v1/recommendations/similar/:itemId?limit=5
   */
  @Get('similar/:itemId')
  async getSimilarItems(
    @Param('itemId') itemId: string,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const maxLimit = limit ? parseInt(limit, 10) : 5;

    const recommendations = await this.recommendationService.findSimilarItems(
      itemId,
      maxLimit,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Get popular/best-selling items
   * GET /api/v1/recommendations/popular?limit=10
   */
  @Get('popular')
  async getPopularItems(
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const maxLimit = limit ? parseInt(limit, 10) : 10;

    const recommendations = await this.recommendationService.getPopularItems(
      maxLimit,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Get trending items (rapid growth in popularity)
   * GET /api/v1/recommendations/trending?limit=10
   */
  @Get('trending')
  async getTrendingItems(
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const maxLimit = limit ? parseInt(limit, 10) : 10;

    const recommendations = await this.recommendationService.getTrendingItems(
      maxLimit,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Get recommendations based on collaborative filtering
   * GET /api/v1/recommendations/collaborative?userId=xyz&limit=10
   */
  @Get('collaborative')
  @UseGuards(JwtAuthGuard)
  async getCollaborativeRecommendations(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
    description: string;
  }> {
    const userId = req.user.userId;
    const maxLimit = limit ? parseInt(limit, 10) : 10;

    const recommendations = await this.recommendationService.getCollaborativeFilteringRecs(
      userId,
      maxLimit,
    );

    return {
      success: true,
      recommendations,
      description: 'Based on users with similar tastes',
    };
  }

  /**
   * Get contextual recommendations (time, weather)
   * POST /api/v1/recommendations/contextual
   */
  @Post('contextual')
  async getContextualOnly(
    @Body() body: {
      weather?: { temperature: number; condition: string };
      location?: { latitude: number; longitude: number };
      limit?: number;
    },
  ): Promise<{
    success: boolean;
    recommendations: RecommendedItem[];
  }> {
    const context: RecommendationContext = {
      currentTime: new Date(),
      weather: body.weather,
      location: body.location,
      limit: body.limit || 10,
    };

    const recommendations = await this.recommendationService.getContextualRecs(
      context,
      body.limit || 10,
    );

    return {
      success: true,
      recommendations,
    };
  }

  /**
   * Rebuild item similarity matrix (admin)
   * POST /api/v1/recommendations/rebuild-matrix
   */
  @Post('rebuild-matrix')
  @UseGuards(JwtAuthGuard)
  async rebuildSimilarityMatrix(): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.recommendationService.buildItemSimilarityMatrix();

    return {
      success: true,
      message: 'Item similarity matrix rebuilt successfully',
    };
  }
}
