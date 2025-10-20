import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@shared/database/entities';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 'uuid',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        birthDate: '1990-01-01',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@CurrentUser() user: User, @Body() updates: Partial<User>) {
    return this.usersService.updateProfile(user.id, updates);
  }

  @Get('me/loyalty')
  @ApiOperation({
    summary: 'Get loyalty points and tier information',
    description: 'Retrieve loyalty points balance and tier status for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Loyalty information retrieved successfully',
    schema: {
      example: {
        currentPoints: 1250,
        currentTier: 'GOLD',
        nextTier: 'PLATINUM',
        pointsToNextTier: 750,
        expiringPointsNext30Days: 50,
        redemptionValue: 12.50,
        tierBenefits: ['Free drink on birthday', '10% discount'],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLoyalty(@CurrentUser() user: User) {
    return this.usersService.getLoyaltyInfo(user.id);
  }
}
