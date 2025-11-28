import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SegmentationService, Segment, SegmentDefinition, SegmentDistribution } from './segmentation.service';
import { UserSegment } from '@shared/database/entities';

@Controller('segmentation')
export class SegmentationController {
  constructor(private readonly segmentationService: SegmentationService) {}

  /**
   * Get current user's segment
   * GET /api/v1/segmentation/my-segment
   */
  @Get('my-segment')
  @UseGuards(JwtAuthGuard)
  async getMySegment(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    segment: UserSegment | null;
    promotionStrategy?: string;
  }> {
    const userId = req.user.userId;
    const segment = await this.segmentationService.getUserSegment(userId);

    let promotionStrategy: string | undefined;
    if (segment) {
      promotionStrategy = this.segmentationService.getPromotionStrategy(
        segment.segment as Segment,
      );
    }

    return {
      success: true,
      segment,
      promotionStrategy,
    };
  }

  /**
   * Assign/update segment for current user
   * POST /api/v1/segmentation/assign
   */
  @Post('assign')
  @UseGuards(JwtAuthGuard)
  async assignMySegment(
    @Req() req: any,
  ): Promise<{
    success: boolean;
    segment: any;
    message: string;
  }> {
    const userId = req.user.userId;
    const segment = await this.segmentationService.assignUserSegment(userId);

    return {
      success: true,
      segment,
      message: `Assigned to segment: ${segment.segmentDisplayName || segment.segment}`,
    };
  }

  /**
   * Get segment distribution (analytics)
   * GET /api/v1/segmentation/distribution
   */
  @Get('distribution')
  @UseGuards(JwtAuthGuard)
  async getDistribution(): Promise<{
    success: boolean;
    distribution: SegmentDistribution[];
    totalUsers: number;
  }> {
    const distribution = await this.segmentationService.getSegmentDistribution();
    const totalUsers = distribution.reduce((sum, d) => sum + d.count, 0);

    return {
      success: true,
      distribution,
      totalUsers,
    };
  }

  /**
   * Get all segment definitions
   * GET /api/v1/segmentation/definitions
   */
  @Get('definitions')
  async getDefinitions(): Promise<{
    success: boolean;
    segments: SegmentDefinition[];
  }> {
    const segments = this.segmentationService.getSegmentDefinitions();

    return {
      success: true,
      segments,
    };
  }

  /**
   * Get users in a specific segment (admin)
   * GET /api/v1/segmentation/segment/:segmentName/users
   */
  @Get('segment/:segmentName/users')
  @UseGuards(JwtAuthGuard)
  async getUsersInSegment(
    @Param('segmentName') segmentName: string,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    segment: string;
    users: string[];
    count: number;
  }> {
    // TODO: Add admin role check

    const users = await this.segmentationService.getUsersInSegment(
      segmentName as Segment,
      limit ? parseInt(limit, 10) : 100,
    );

    return {
      success: true,
      segment: segmentName,
      users,
      count: users.length,
    };
  }

  /**
   * Batch assign segments for all users (admin)
   * POST /api/v1/segmentation/batch-assign
   */
  @Post('batch-assign')
  @UseGuards(JwtAuthGuard)
  async batchAssignSegments(
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    results: {
      processed: number;
      failed: number;
      errors: string[];
    };
  }> {
    // TODO: Add admin role check

    const results = await this.segmentationService.assignAllUserSegments(
      limit ? parseInt(limit, 10) : undefined,
    );

    return {
      success: true,
      results,
    };
  }

  /**
   * Get segment for a specific user (admin)
   * GET /api/v1/segmentation/user/:userId
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserSegment(
    @Param('userId') userId: string,
  ): Promise<{
    success: boolean;
    segment: UserSegment | null;
  }> {
    // TODO: Add admin role check

    const segment = await this.segmentationService.getUserSegment(userId);

    return {
      success: true,
      segment,
    };
  }

  /**
   * Assign segment for a specific user (admin)
   * POST /api/v1/segmentation/user/:userId/assign
   */
  @Post('user/:userId/assign')
  @UseGuards(JwtAuthGuard)
  async assignUserSegment(
    @Param('userId') userId: string,
  ): Promise<{
    success: boolean;
    segment: UserSegment;
  }> {
    // TODO: Add admin role check

    const segment = await this.segmentationService.assignUserSegment(userId);

    return {
      success: true,
      segment,
    };
  }
}
