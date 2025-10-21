import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StreakTrackingService } from './streak-tracking.service';
import { StreakRewardService } from './streak-reward.service';
import { StreakSaverService } from './streak-saver.service';
import { TierManagementService } from './tier-management.service';
import { AnniversaryService } from './anniversary.service';
import { UseTokenDto } from './dto/use-token.dto';

@Controller('api/v1/loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(
    private readonly streakTrackingService: StreakTrackingService,
    private readonly streakRewardService: StreakRewardService,
    private readonly streakSaverService: StreakSaverService,
    private readonly tierManagementService: TierManagementService,
    private readonly anniversaryService: AnniversaryService,
  ) {}

  // ============================================
  // STREAK ENDPOINTS
  // ============================================

  /**
   * Get current user's streak data
   * GET /api/v1/loyalty/streak
   */
  @Get('streak')
  async getMyStreak(@Request() req) {
    const userId = req.user.userId;
    return await this.streakTrackingService.getUserStreak(userId);
  }

  /**
   * Get current user's visit history
   * GET /api/v1/loyalty/visits?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('visits')
  async getMyVisits(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.streakTrackingService.getUserVisits(userId, start, end);
  }

  /**
   * Check if user visited today
   * GET /api/v1/loyalty/visited-today
   */
  @Get('visited-today')
  async hasVisitedToday(@Request() req) {
    const userId = req.user.userId;
    const visited = await this.streakTrackingService.hasVisitedToday(userId);
    return { visited };
  }

  // ============================================
  // REWARDS ENDPOINTS
  // ============================================

  /**
   * Get all streak rewards (milestone rewards)
   * GET /api/v1/loyalty/rewards
   */
  @Get('rewards')
  async getStreakRewards() {
    return await this.streakRewardService.getStreakRewards(true);
  }

  /**
   * Get next milestone reward for current user
   * GET /api/v1/loyalty/rewards/next-milestone
   */
  @Get('rewards/next-milestone')
  async getNextMilestone(@Request() req) {
    const userId = req.user.userId;
    return await this.streakRewardService.getNextMilestone(userId);
  }

  /**
   * Get user's granted streak rewards
   * GET /api/v1/loyalty/rewards/mine
   */
  @Get('rewards/mine')
  async getMyStreakRewards(@Request() req) {
    const userId = req.user.userId;
    return await this.streakRewardService.getUserStreakRewards(userId);
  }

  // ============================================
  // STREAK SAVER TOKEN ENDPOINTS
  // ============================================

  /**
   * Get current user's tokens
   * GET /api/v1/loyalty/tokens?status=available
   */
  @Get('tokens')
  async getMyTokens(@Request() req, @Query('status') status?: string) {
    const userId = req.user.userId;
    return await this.streakSaverService.getUserTokens(userId, status as any);
  }

  /**
   * Get available token count
   * GET /api/v1/loyalty/tokens/available-count
   */
  @Get('tokens/available-count')
  async getAvailableTokenCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.streakSaverService.getAvailableTokenCount(userId);
    return { count };
  }

  /**
   * Check if user can use a token
   * GET /api/v1/loyalty/tokens/can-use
   */
  @Get('tokens/can-use')
  async canUseToken(@Request() req) {
    const userId = req.user.userId;
    return await this.streakSaverService.canUseToken(userId);
  }

  /**
   * Use a streak saver token
   * POST /api/v1/loyalty/tokens/use
   */
  @Post('tokens/use')
  async useToken(@Request() req, @Body() useTokenDto: UseTokenDto) {
    const userId = req.user.userId;
    const missedDate = new Date(useTokenDto.missedDate);

    return await this.streakSaverService.useToken(userId, missedDate);
  }

  // ============================================
  // TIER ENDPOINTS
  // ============================================

  /**
   * Get current user's tier info
   * GET /api/v1/loyalty/tier
   */
  @Get('tier')
  async getMyTier(@Request() req) {
    const userId = req.user.userId;
    return await this.tierManagementService.getUserTierProgress(userId);
  }

  /**
   * Get tier requirements
   * GET /api/v1/loyalty/tier/requirements
   */
  @Get('tier/requirements')
  getTierRequirements() {
    return this.tierManagementService.getTierRequirements();
  }

  /**
   * Get perks for current user's tier
   * GET /api/v1/loyalty/tier/perks
   */
  @Get('tier/perks')
  async getMyTierPerks(@Request() req) {
    const userId = req.user.userId;

    // Get user to find their tier
    const progress = await this.tierManagementService.getUserTierProgress(userId);
    return await this.tierManagementService.getTierPerks(progress.currentTier);
  }

  /**
   * Get tier history for current user
   * GET /api/v1/loyalty/tier/history
   */
  @Get('tier/history')
  async getMyTierHistory(@Request() req) {
    const userId = req.user.userId;
    return await this.tierManagementService.getUserTierHistory(userId);
  }

  // ============================================
  // ANNIVERSARY ENDPOINTS
  // ============================================

  /**
   * Get current user's anniversaries
   * GET /api/v1/loyalty/anniversaries
   */
  @Get('anniversaries')
  async getMyAnniversaries(@Request() req) {
    const userId = req.user.userId;
    return await this.anniversaryService.getUserAnniversaries(userId);
  }

  /**
   * Get next anniversary info
   * GET /api/v1/loyalty/anniversaries/next
   */
  @Get('anniversaries/next')
  async getNextAnniversary(@Request() req) {
    const userId = req.user.userId;
    return await this.anniversaryService.getNextAnniversary(userId);
  }

  /**
   * Check for upcoming anniversary
   * GET /api/v1/loyalty/anniversaries/upcoming
   */
  @Get('anniversaries/upcoming')
  async hasUpcomingAnniversary(@Request() req) {
    const userId = req.user.userId;
    return await this.anniversaryService.hasUpcomingAnniversary(userId);
  }

  // ============================================
  // DASHBOARD ENDPOINT
  // ============================================

  /**
   * Get complete loyalty dashboard for current user
   * GET /api/v1/loyalty/dashboard
   */
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const userId = req.user.userId;

    // Fetch all relevant data in parallel
    const [
      streak,
      tierProgress,
      nextMilestone,
      availableTokens,
      nextAnniversary,
      tierPerks,
    ] = await Promise.all([
      this.streakTrackingService.getUserStreak(userId),
      this.tierManagementService.getUserTierProgress(userId),
      this.streakRewardService.getNextMilestone(userId),
      this.streakSaverService.getAvailableTokenCount(userId),
      this.anniversaryService.getNextAnniversary(userId),
      this.tierManagementService.getUserTierProgress(userId).then(progress =>
        this.tierManagementService.getTierPerks(progress.currentTier)
      ),
    ]);

    return {
      streak: {
        consecutiveDays: streak.consecutiveDays,
        longestStreak: streak.longestStreak,
        monthlyPoints: streak.monthlyPoints,
        tierXP: streak.tierXP,
        monthlyVisits: streak.monthlyVisits,
      },
      tier: tierProgress,
      nextMilestone,
      streakSaverTokens: availableTokens,
      nextAnniversary,
      perks: tierPerks,
    };
  }
}
