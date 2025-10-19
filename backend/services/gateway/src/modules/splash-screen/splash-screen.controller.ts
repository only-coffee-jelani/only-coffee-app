import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SplashScreenService } from './splash-screen.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SplashScreen } from '@shared/database/entities';

@ApiTags('splash-screen')
@Controller('splash-screen')
export class SplashScreenController {
  constructor(private readonly splashScreenService: SplashScreenService) {}

  /**
   * Get the current active splash screen (public endpoint for mobile app)
   */
  @Get('current')
  @Public()
  @ApiOperation({ summary: 'Get current active splash screen' })
  @ApiResponse({ status: 200, description: 'Current splash screen' })
  @ApiResponse({ status: 404, description: 'No active splash screen' })
  async getCurrentSplashScreen(): Promise<SplashScreen | null> {
    return this.splashScreenService.getCurrentSplashScreen();
  }

  /**
   * Get all splash screens (admin only)
   */
  @Get()
  @ApiOperation({ summary: 'Get all splash screens' })
  @ApiResponse({ status: 200, description: 'List of splash screens' })
  async getAllSplashScreens(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<{ data: SplashScreen[]; total: number }> {
    const [data, total] = await this.splashScreenService.getAllSplashScreens(skip, take);
    return { data, total };
  }

  /**
   * Get a specific splash screen by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get splash screen by ID' })
  @ApiResponse({ status: 200, description: 'Splash screen details' })
  @ApiResponse({ status: 404, description: 'Splash screen not found' })
  async getSplashScreenById(@Param('id') id: string): Promise<SplashScreen> {
    return this.splashScreenService.getSplashScreenById(id);
  }

  /**
   * Create a new splash screen (admin only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new splash screen' })
  @ApiResponse({ status: 201, description: 'Splash screen created' })
  async createSplashScreen(
    @Body() data: Partial<SplashScreen>,
    @CurrentUser() user: any,
  ): Promise<SplashScreen> {
    return this.splashScreenService.createSplashScreen(data, user?.id);
  }

  /**
   * Update a splash screen (admin only)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a splash screen' })
  @ApiResponse({ status: 200, description: 'Splash screen updated' })
  @ApiResponse({ status: 404, description: 'Splash screen not found' })
  async updateSplashScreen(
    @Param('id') id: string,
    @Body() data: Partial<SplashScreen>,
  ): Promise<SplashScreen> {
    return this.splashScreenService.updateSplashScreen(id, data);
  }

  /**
   * Delete a splash screen (admin only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a splash screen' })
  @ApiResponse({ status: 204, description: 'Splash screen deleted' })
  @ApiResponse({ status: 404, description: 'Splash screen not found' })
  async deleteSplashScreen(@Param('id') id: string): Promise<void> {
    return this.splashScreenService.deleteSplashScreen(id);
  }

  /**
   * Record an impression (view) - called by mobile app
   */
  @Post(':id/impression')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a splash screen impression' })
  async recordImpression(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.splashScreenService.recordImpression(id);
    return { success: true };
  }

  /**
   * Record a click - called by mobile app
   */
  @Post(':id/click')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a splash screen click' })
  async recordClick(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.splashScreenService.recordClick(id);
    return { success: true };
  }

  /**
   * Record a skip - called by mobile app
   */
  @Post(':id/skip')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a splash screen skip' })
  async recordSkip(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.splashScreenService.recordSkip(id);
    return { success: true };
  }

  /**
   * Get analytics for a splash screen
   */
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get analytics for a splash screen' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  @ApiResponse({ status: 404, description: 'Splash screen not found' })
  async getAnalytics(@Param('id') id: string): Promise<any> {
    return this.splashScreenService.getAnalytics(id);
  }
}

