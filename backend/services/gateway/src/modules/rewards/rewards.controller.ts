import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@shared/database/entities';
import { RewardsService } from './rewards.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get loyalty summary for current user',
    description: 'Retrieve loyalty points, tier information, and benefits',
  })
  @ApiResponse({
    status: 200,
    description: 'Loyalty summary retrieved successfully',
    schema: {
      example: {
        currentPoints: 1250,
        currentTier: 'GOLD',
        nextTier: 'PLATINUM',
        pointsToNextTier: 750,
        expiringPointsNext30Days: 50,
        redemptionValue: 12.5,
        tierBenefits: ['Free drink on birthday', '10% discount'],
      },
    },
  })
  async getLoyaltySummary(@CurrentUser() user: User) {
    return this.rewardsService.getLoyaltySummary(user.userId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get rewards transaction history',
    description: 'Retrieve a history of all rewards transactions',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of records to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rewards history retrieved successfully',
    schema: {
      example: [
        {
          id: 'uuid',
          userId: 'uuid',
          points: 100,
          type: 'PURCHASE',
          description: 'Purchase at Downtown Store',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  async getRewardsHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    return this.rewardsService.getRewardsHistory(
      user.userId,
      limit ? Number(limit) : 50,
    );
  }

  @Post('redeem')
  @ApiOperation({
    summary: 'Redeem points for discount',
    description: 'Convert loyalty points into a discount code',
  })
  @ApiResponse({
    status: 200,
    description: 'Points redeemed successfully',
    schema: {
      example: {
        discountCode: 'REWARD123',
        pointsRedeemed: 500,
        discountAmount: 5.0,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient points' })
  async redeemPoints(
    @CurrentUser() user: User,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    return this.rewardsService.redeemPoints(user.userId, redeemPointsDto);
  }

  @Post('users/:userId/adjust')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually adjust user points',
    description: 'Manually add or subtract points from a user account (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Points adjusted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async adjustPoints(
    @Param('userId') userId: string,
    @Body() adjustPointsDto: AdjustPointsDto,
  ) {
    return this.rewardsService.adjustPoints(userId, adjustPointsDto);
  }

  @Post('users/:userId/birthday-bonus')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Award birthday bonus',
    description: 'Award birthday bonus points to a user (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Birthday bonus awarded successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async awardBirthdayBonus(@Param('userId') userId: string) {
    return this.rewardsService.awardBirthdayBonus(userId);
  }
}
