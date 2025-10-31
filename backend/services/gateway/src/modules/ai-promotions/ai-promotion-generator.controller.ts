import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AIPromotionGeneratorService,
  AIPromotion,
  AIPromotionStatus,
  GenerationRequest,
} from './ai-promotion-generator.service';

@Controller('ai-promotions')
export class AIPromotionGeneratorController {
  constructor(
    private readonly aiPromotionService: AIPromotionGeneratorService,
  ) {}

  /**
   * Generate new AI promotion
   * POST /api/v1/ai-promotions/generate
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generatePromotion(
    @Body() request: GenerationRequest,
  ): Promise<{
    success: boolean;
    promotion: AIPromotion;
  }> {
    // TODO: Add admin role check

    const promotion = await this.aiPromotionService.generatePromotion(request);

    return {
      success: true,
      promotion,
    };
  }

  /**
   * Batch generate promotions for all goals
   * POST /api/v1/ai-promotions/batch-generate
   */
  @Post('batch-generate')
  @UseGuards(JwtAuthGuard)
  async batchGeneratePromotions(): Promise<{
    success: boolean;
    promotions: AIPromotion[];
    count: number;
  }> {
    // TODO: Add admin role check

    const promotions = await this.aiPromotionService.batchGeneratePromotions();

    return {
      success: true,
      promotions,
      count: promotions.length,
    };
  }

  /**
   * Submit promotion for review
   * POST /api/v1/ai-promotions/:id/submit
   */
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForReview(
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    promotion: AIPromotion;
  }> {
    // TODO: Add admin role check

    const promotion = await this.aiPromotionService.submitForReview(id);

    return {
      success: true,
      promotion,
    };
  }

  /**
   * Approve promotion (admin)
   * POST /api/v1/ai-promotions/:id/approve
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approvePromotion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ): Promise<{
    success: boolean;
    promotion: AIPromotion;
  }> {
    // TODO: Add admin role check
    const adminId = req.user.userId;

    const promotion = await this.aiPromotionService.approvePromotion(
      id,
      adminId,
      body.notes,
    );

    return {
      success: true,
      promotion,
    };
  }

  /**
   * Reject promotion (admin)
   * POST /api/v1/ai-promotions/:id/reject
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectPromotion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<{
    success: boolean;
    promotion: AIPromotion;
  }> {
    // TODO: Add admin role check
    const adminId = req.user.userId;

    if (!body.reason) {
      throw new Error('Rejection reason is required');
    }

    const promotion = await this.aiPromotionService.rejectPromotion(
      id,
      adminId,
      body.reason,
    );

    return {
      success: true,
      promotion,
    };
  }

  /**
   * Get review queue
   * GET /api/v1/ai-promotions/review-queue
   */
  @Get('review-queue')
  @UseGuards(JwtAuthGuard)
  async getReviewQueue(): Promise<{
    success: boolean;
    promotions: AIPromotion[];
    count: number;
  }> {
    // TODO: Add admin role check

    const promotions = await this.aiPromotionService.getReviewQueue();

    return {
      success: true,
      promotions,
      count: promotions.length,
    };
  }

  /**
   * Get all promotions
   * GET /api/v1/ai-promotions?status=pending_review
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPromotions(
    @Query('status') status?: AIPromotionStatus,
  ): Promise<{
    success: boolean;
    promotions: AIPromotion[];
    count: number;
  }> {
    // TODO: Add admin role check

    const promotions = await this.aiPromotionService.getAllPromotions(status);

    return {
      success: true,
      promotions,
      count: promotions.length,
    };
  }

  /**
   * Get promotion by ID
   * GET /api/v1/ai-promotions/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPromotion(
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    promotion: AIPromotion | null;
  }> {
    // TODO: Add admin role check

    const promotion = await this.aiPromotionService.getPromotion(id);

    return {
      success: true,
      promotion: promotion || null,
    };
  }

  /**
   * Update promotion
   * PUT /api/v1/ai-promotions/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePromotion(
    @Param('id') id: string,
    @Body() updates: Partial<AIPromotion>,
  ): Promise<{
    success: boolean;
    promotion: AIPromotion;
  }> {
    // TODO: Add admin role check

    const promotion = await this.aiPromotionService.updatePromotion(id, updates);

    return {
      success: true,
      promotion,
    };
  }

  /**
   * Delete promotion
   * DELETE /api/v1/ai-promotions/:id (using POST for now)
   */
  @Post(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deletePromotion(
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.aiPromotionService.deletePromotion(id);

    return {
      success: true,
      message: 'Promotion deleted successfully',
    };
  }

  /**
   * Get queue statistics
   * GET /api/v1/ai-promotions/stats/queue
   */
  @Get('stats/queue')
  @UseGuards(JwtAuthGuard)
  async getQueueStats(): Promise<{
    success: boolean;
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      draft: number;
      avgConfidence: number;
      oldestPending?: Date;
    };
  }> {
    // TODO: Add admin role check

    const stats = await this.aiPromotionService.getQueueStats();

    return {
      success: true,
      stats,
    };
  }

  /**
   * Simulate promotion generation (testing)
   * POST /api/v1/ai-promotions/simulate
   */
  @Post('simulate')
  @UseGuards(JwtAuthGuard)
  async simulateGeneration(
    @Body() body: {
      goal: 'retention' | 'acquisition' | 'revenue' | 'engagement';
      mockAnalysis?: any;
    },
  ): Promise<{
    success: boolean;
    preview: {
      title: string;
      description: string;
      targetSegments: string[];
      estimatedReach: number;
      estimatedCost: number;
    };
  }> {
    // TODO: Add admin role check

    // Generate promotion without saving
    const promotion = await this.aiPromotionService.generatePromotion({
      goal: body.goal,
      urgency: 'medium',
    });

    return {
      success: true,
      preview: {
        title: promotion.title,
        description: promotion.description,
        targetSegments: promotion.targetSegments,
        estimatedReach: 1000, // Placeholder
        estimatedCost: 500, // Placeholder
      },
    };
  }
}
