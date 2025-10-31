import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ContextualBanditService,
  BanditContext,
  BanditSelection,
  BanditMetrics,
  BanditArm,
} from './contextual-bandit.service';

@Controller('bandit')
export class ContextualBanditController {
  constructor(
    private readonly banditService: ContextualBanditService,
  ) {}

  /**
   * Select best promotion for user using Thompson Sampling
   * POST /api/v1/bandit/select
   */
  @Post('select')
  @UseGuards(JwtAuthGuard)
  async selectPromotion(
    @Req() req: any,
    @Body() body: {
      context?: Partial<BanditContext>;
      algorithm?: 'thompson' | 'ucb' | 'epsilon-greedy';
      epsilon?: number;
    },
  ): Promise<{
    success: boolean;
    selection: BanditSelection;
  }> {
    const userId = req.user.userId;

    const context: BanditContext = {
      userId,
      ...body.context,
    };

    let selection: BanditSelection;

    switch (body.algorithm || 'thompson') {
      case 'ucb':
        selection = await this.banditService.selectArmUCB(context);
        break;
      case 'epsilon-greedy':
        selection = await this.banditService.selectArmEpsilonGreedy(
          context,
          body.epsilon || 0.1,
        );
        break;
      case 'thompson':
      default:
        selection = await this.banditService.selectArm(context);
        break;
    }

    return {
      success: true,
      selection,
    };
  }

  /**
   * Record reward for a selection (conversion)
   * POST /api/v1/bandit/reward
   */
  @Post('reward')
  @UseGuards(JwtAuthGuard)
  async recordReward(
    @Body() body: {
      selectionId: string;
      reward: number; // 0 or 1
      rewardValue?: number; // Optional monetary value
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.banditService.recordReward(
      body.selectionId,
      body.reward,
      body.rewardValue,
    );

    return {
      success: true,
      message: 'Reward recorded successfully',
    };
  }

  /**
   * Get bandit performance metrics
   * GET /api/v1/bandit/metrics
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(): Promise<{
    success: boolean;
    metrics: BanditMetrics;
  }> {
    // TODO: Add admin role check

    const metrics = await this.banditService.getMetrics();

    return {
      success: true,
      metrics,
    };
  }

  /**
   * Get all arms (promotions)
   * GET /api/v1/bandit/arms
   */
  @Get('arms')
  @UseGuards(JwtAuthGuard)
  async getAllArms(): Promise<{
    success: boolean;
    arms: BanditArm[];
  }> {
    // TODO: Add admin role check

    const arms = await this.banditService.getAllArms();

    return {
      success: true,
      arms,
    };
  }

  /**
   * Get specific arm details
   * GET /api/v1/bandit/arms/:armId
   */
  @Get('arms/:armId')
  @UseGuards(JwtAuthGuard)
  async getArm(
    @Param('armId') armId: string,
  ): Promise<{
    success: boolean;
    arm: BanditArm | null;
  }> {
    // TODO: Add admin role check

    const arm = await this.banditService.getArm(armId);

    return {
      success: true,
      arm: arm || null,
    };
  }

  /**
   * Add new arm (promotion)
   * POST /api/v1/bandit/arms
   */
  @Post('arms')
  @UseGuards(JwtAuthGuard)
  async addArm(
    @Body() body: {
      promotionId: string;
      name: string;
    },
  ): Promise<{
    success: boolean;
    arm: BanditArm;
  }> {
    // TODO: Add admin role check

    const arm = await this.banditService.addArm(body.promotionId, body.name);

    return {
      success: true,
      arm,
    };
  }

  /**
   * Reset arm statistics
   * POST /api/v1/bandit/arms/:armId/reset
   */
  @Post('arms/:armId/reset')
  @UseGuards(JwtAuthGuard)
  async resetArm(
    @Param('armId') armId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.banditService.resetArm(armId);

    return {
      success: true,
      message: 'Arm statistics reset successfully',
    };
  }

  /**
   * Remove arm
   * DELETE /api/v1/bandit/arms/:armId (using POST for now)
   */
  @Post('arms/:armId/remove')
  @UseGuards(JwtAuthGuard)
  async removeArm(
    @Param('armId') armId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // TODO: Add admin role check

    await this.banditService.removeArm(armId);

    return {
      success: true,
      message: 'Arm removed successfully',
    };
  }

  /**
   * Compare algorithms (A/B test endpoint)
   * POST /api/v1/bandit/compare
   */
  @Post('compare')
  @UseGuards(JwtAuthGuard)
  async compareAlgorithms(
    @Req() req: any,
    @Body() body: {
      context?: Partial<BanditContext>;
    },
  ): Promise<{
    success: boolean;
    results: {
      thompson: BanditSelection;
      ucb: BanditSelection;
      epsilonGreedy: BanditSelection;
    };
  }> {
    // TODO: Add admin role check

    const userId = req.user.userId;

    const context: BanditContext = {
      userId,
      ...body.context,
    };

    const [thompson, ucb, epsilonGreedy] = await Promise.all([
      this.banditService.selectArm(context),
      this.banditService.selectArmUCB(context),
      this.banditService.selectArmEpsilonGreedy(context, 0.1),
    ]);

    return {
      success: true,
      results: {
        thompson,
        ucb,
        epsilonGreedy,
      },
    };
  }

  /**
   * Simulate bandit performance (testing endpoint)
   * POST /api/v1/bandit/simulate
   */
  @Post('simulate')
  @UseGuards(JwtAuthGuard)
  async simulateBandit(
    @Body() body: {
      numTrials: number;
      trueConversionRates: Record<string, number>; // armId -> true CVR
    },
  ): Promise<{
    success: boolean;
    results: {
      totalReward: number;
      averageReward: number;
      regret: number; // How much worse than optimal
      armPulls: Record<string, number>;
    };
  }> {
    // TODO: Add admin role check
    // TODO: Implement simulation logic

    return {
      success: true,
      results: {
        totalReward: 0,
        averageReward: 0,
        regret: 0,
        armPulls: {},
      },
    };
  }
}
