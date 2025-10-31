import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ChurnPredictionService,
  ChurnPrediction,
  ChurnRiskLevel,
  ChurnMetrics,
} from './churn-prediction.service';

@Controller('churn')
export class ChurnPredictionController {
  constructor(private readonly churnPredictionService: ChurnPredictionService) {}

  /**
   * Get churn prediction for current user
   * GET /api/v1/churn/my-risk
   */
  @Get('my-risk')
  @UseGuards(JwtAuthGuard)
  async getMyChurnRisk(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    prediction: ChurnPrediction;
  }> {
    const userId = req.user.userId;
    const prediction = await this.churnPredictionService.predictChurn(userId);

    return {
      success: true,
      prediction,
    };
  }

  /**
   * Get users at risk of churning (admin)
   * GET /api/v1/churn/at-risk?minRiskLevel=high&limit=50
   */
  @Get('at-risk')
  @UseGuards(JwtAuthGuard)
  async getAtRiskUsers(
    @Query('minRiskLevel') minRiskLevel?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    users: ChurnPrediction[];
    count: number;
  }> {
    // TODO: Add admin role check

    const minLevel = (minRiskLevel as ChurnRiskLevel) || ChurnRiskLevel.MEDIUM;
    const maxLimit = limit ? parseInt(limit, 10) : 100;

    const users = await this.churnPredictionService.getAtRiskUsers(minLevel, maxLimit);

    return {
      success: true,
      users,
      count: users.length,
    };
  }

  /**
   * Get churn metrics (admin dashboard)
   * GET /api/v1/churn/metrics
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getChurnMetrics(): Promise<{
    success: boolean;
    metrics: ChurnMetrics;
  }> {
    // TODO: Add admin role check

    const metrics = await this.churnPredictionService.getChurnMetrics();

    return {
      success: true,
      metrics,
    };
  }

  /**
   * Batch compute churn predictions (admin)
   * POST /api/v1/churn/batch-compute
   */
  @Post('batch-compute')
  @UseGuards(JwtAuthGuard)
  async batchComputeChurn(
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    results: {
      processed: number;
      failed: number;
      distribution: Record<ChurnRiskLevel, number>;
    };
  }> {
    // TODO: Add admin role check

    const results = await this.churnPredictionService.batchComputeChurnPredictions(
      limit ? parseInt(limit, 10) : undefined,
    );

    return {
      success: true,
      results,
    };
  }
}
