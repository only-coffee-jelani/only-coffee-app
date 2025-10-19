import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('admin/analytics')
@Controller('api/v1/admin/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get overall coupon metrics
   */
  @Get('coupon-metrics')
  @ApiOperation({ summary: 'Get overall coupon metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getCouponMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const metrics = await this.analyticsService.getCouponMetrics(start, end);

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get coupon breakdown by type
   */
  @Get('coupon-breakdown')
  @ApiOperation({ summary: 'Get coupon statistics breakdown by type' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getCouponBreakdown(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const breakdown = await this.analyticsService.getCouponBreakdown(start, end);

    return {
      success: true,
      data: breakdown,
    };
  }

  /**
   * Get channel split (app vs in-store)
   */
  @Get('channel-split')
  @ApiOperation({ summary: 'Get redemption channel distribution' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getChannelSplit(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const split = await this.analyticsService.getChannelSplit(start, end);

    return {
      success: true,
      data: split,
    };
  }

  /**
   * Get breakage metrics (expiry rate)
   */
  @Get('breakage')
  @ApiOperation({ summary: 'Get coupon breakage/expiry metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getBreakage(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const breakage = await this.analyticsService.getBreakageMetrics(start, end);

    return {
      success: true,
      data: breakage,
    };
  }
}
