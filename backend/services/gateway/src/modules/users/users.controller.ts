import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: User, @Body() updates: Partial<User>) {
    return this.usersService.updateProfile(user.id, updates);
  }

  @Get('me/loyalty')
  @ApiOperation({ summary: 'Get loyalty points and tier information' })
  async getLoyalty(@CurrentUser() user: User) {
    return this.usersService.getLoyaltyInfo(user.id);
  }
}
