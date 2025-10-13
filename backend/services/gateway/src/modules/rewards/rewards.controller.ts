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
  @ApiOperation({ summary: 'Get loyalty summary for current user' })
  @ApiResponse({
    status: 200,
    description: 'Loyalty summary retrieved successfully',
  })
  async getLoyaltySummary(@CurrentUser() user: User) {
    return this.rewardsService.getLoyaltySummary(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get rewards transaction history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Rewards history retrieved successfully',
  })
  async getRewardsHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    return this.rewardsService.getRewardsHistory(
      user.id,
      limit ? Number(limit) : 50,
    );
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem points for discount' })
  @ApiResponse({
    status: 200,
    description: 'Points redeemed successfully',
  })
  async redeemPoints(
    @CurrentUser() user: User,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    return this.rewardsService.redeemPoints(user.id, redeemPointsDto);
  }

  @Post('users/:userId/adjust')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually adjust user points (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Points adjusted successfully',
  })
  async adjustPoints(
    @Param('userId') userId: string,
    @Body() adjustPointsDto: AdjustPointsDto,
  ) {
    return this.rewardsService.adjustPoints(userId, adjustPointsDto);
  }

  @Post('users/:userId/birthday-bonus')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Award birthday bonus (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Birthday bonus awarded successfully',
  })
  async awardBirthdayBonus(@Param('userId') userId: string) {
    return this.rewardsService.awardBirthdayBonus(userId);
  }
}
