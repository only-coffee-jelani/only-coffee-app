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
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SplashScreenService } from './splash-screen.service';
import { SplashAnalyticsService } from './splash-analytics.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SplashScreen } from '@shared/database/entities';
import {
  CreateSplashScreenDto,
  UpdateSplashScreenDto,
  TrackSplashEventDto,
  StartSplashSessionDto,
  EndSplashSessionDto,
  GetSplashAnalyticsDto,
} from './dto';

@ApiTags('splash-screen')
@Controller('splash-screen')
export class SplashScreenController {
  constructor(
    private readonly splashScreenService: SplashScreenService,
    private readonly splashAnalyticsService: SplashAnalyticsService,
  ) {}

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
   * Get analytics for splash screens (admin dashboard)
   * IMPORTANT: This must come before the :id route to avoid route conflicts
   */
  @Get('analytics')
  @Public()
  @ApiOperation({ summary: 'Get splash screen analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@Query() query: GetSplashAnalyticsDto): Promise<any> {
    return this.splashAnalyticsService.getAnalytics(query);
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
  @ApiResponse({ status: 400, description: 'Invalid input - imageAssetId is required' })
  @ApiBody({ type: CreateSplashScreenDto })
  async createSplashScreen(
    @Body() data: CreateSplashScreenDto,
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
  @ApiBody({ type: UpdateSplashScreenDto })
  async updateSplashScreen(
    @Param('id') id: string,
    @Body() data: UpdateSplashScreenDto,
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
   * Track a splash event (impression, click, skip, complete, order) - called by mobile app
   */
  @Post('events/track')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track a splash screen event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  @ApiBody({ type: TrackSplashEventDto })
  async trackEvent(@Body() data: TrackSplashEventDto): Promise<{ success: boolean; eventId: string }> {
    const event = await this.splashAnalyticsService.trackEvent(data);
    return { success: true, eventId: event.splashEventId };
  }

  /**
   * Start a splash session - called by mobile app when splash is shown
   */
  @Post('sessions/start')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a splash screen session' })
  @ApiResponse({ status: 201, description: 'Session started successfully' })
  @ApiBody({ type: StartSplashSessionDto })
  async startSession(@Body() data: StartSplashSessionDto): Promise<{ success: boolean; sessionId: string }> {
    const session = await this.splashAnalyticsService.startSession(data);
    return { success: true, sessionId: session.splashSessionId };
  }

  /**
   * End a splash session - called by mobile app when splash is dismissed
   */
  @Post('sessions/end')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a splash screen session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  @ApiBody({ type: EndSplashSessionDto })
  async endSession(@Body() data: EndSplashSessionDto): Promise<{ success: boolean }> {
    await this.splashAnalyticsService.endSession(data);
    return { success: true };
  }
}

