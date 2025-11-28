import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@shared/database/entities';
import { Public } from '../auth/decorators/public.decorator';
import { CarouselService } from './carousel.service';
import { CarouselAnalyticsService } from './carousel-analytics.service';
import { CarouselABTestService } from './carousel-ab-test.service';
import { CreateCarouselImageDto, UpdateCarouselImageDto } from './dto';
import { TrackCarouselEventDto } from './dto/track-carousel-event.dto';

@ApiTags('carousel')
@Controller('carousel')
export class CarouselController {
  constructor(
    private readonly carouselService: CarouselService,
    private readonly carouselAnalyticsService: CarouselAnalyticsService,
    private readonly carouselABTestService: CarouselABTestService,
  ) {}

  /**
   * Get all active carousel images (public)
   */
  @Get('active')
  @Public()
  @ApiOperation({
    summary: 'Get active carousel images',
    description: 'Retrieve all currently active carousel images for display on the home screen',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active carousel images',
    schema: {
      example: [
        {
          id: 'uuid',
          title: 'Summer Promotion',
          description: 'Get 20% off all summer drinks',
          imageUrl: 'https://...',
          position: 0,
          isActive: true,
          displayDuration: 3,
        },
      ],
    },
  })
  async getActive() {
    return this.carouselService.getActive();
  }

  /**
   * Get all carousel images with pagination (admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all carousel images',
    description: 'Retrieve all carousel images with pagination (admin only)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of images per page (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of images to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of carousel images',
  })
  async getAll(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.carouselService.getAll(limit, offset);
  }

  /**
   * Get a single carousel image by ID
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get carousel image by ID',
    description: 'Retrieve a specific carousel image by its ID',
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 200,
    description: 'Carousel image details',
  })
  @ApiResponse({ status: 404, description: 'Carousel image not found' })
  async findById(@Param('id') id: string) {
    return this.carouselService.findById(id);
  }

  /**
   * Create a new carousel image (admin)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new carousel image',
    description: 'Create a new carousel image (admin only). Maximum 5 active images allowed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Carousel image created successfully',
  })
  @ApiResponse({ status: 400, description: 'Maximum 5 active images allowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async create(
    @Body() createDto: CreateCarouselImageDto,
    @CurrentUser() user: User,
  ) {
    return this.carouselService.create(createDto, user.userId);
  }

  /**
   * Update a carousel image (admin)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a carousel image',
    description: 'Update an existing carousel image (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 200,
    description: 'Carousel image updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Carousel image not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCarouselImageDto,
    @CurrentUser() user: User,
  ) {
    return this.carouselService.update(id, updateDto, user.userId);
  }

  /**
   * Delete a carousel image (admin)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a carousel image',
    description: 'Delete a carousel image and remove it from S3 (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 204,
    description: 'Carousel image deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Carousel image not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async delete(@Param('id') id: string) {
    await this.carouselService.delete(id);
  }

  /**
   * Track carousel event (enterprise analytics)
   */
  @Post('events/track')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track carousel event',
    description: 'Track comprehensive carousel events including impressions, clicks, swipes, and conversions',
  })
  @ApiResponse({
    status: 200,
    description: 'Event tracked successfully',
  })
  async trackEvent(@Body() trackEventDto: TrackCarouselEventDto) {
    await this.carouselAnalyticsService.trackEvent(trackEventDto);
    return { success: true };
  }

  /**
   * Start carousel session
   */
  @Post('sessions/start')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start carousel session',
    description: 'Start a new carousel viewing session for engagement tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Session started successfully',
    schema: {
      example: {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  async startSession(
    @Body() body: { carouselId: string; userId?: string; deviceId?: string; storeId?: string },
  ) {
    const sessionId = await this.carouselAnalyticsService.startSession(
      body.carouselId,
      body.userId,
      body.deviceId,
      body.storeId,
    );
    return { sessionId };
  }

  /**
   * End carousel session
   */
  @Post('sessions/end')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End carousel session',
    description: 'End a carousel viewing session and calculate engagement metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Session ended successfully',
  })
  async endSession(
    @Body() body: { sessionId: string; orderId?: string; revenueAmount?: number },
  ) {
    await this.carouselAnalyticsService.endSession(
      body.sessionId,
      body.orderId,
      body.revenueAmount,
    );
    return { success: true };
  }

  /**
   * Get analytics for a specific carousel item
   */
  @Get('items/:id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get carousel item analytics',
    description: 'Get comprehensive analytics for a specific carousel item (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Carousel item ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousel item analytics',
    schema: {
      example: {
        impressions: 10000,
        uniqueUsersShown: 5000,
        uniqueUsersClicked: 500,
        clicks: 750,
        swipesLeft: 200,
        swipesRight: 300,
        autoAdvances: 1000,
        manualAdvances: 500,
        addToCartCount: 100,
        associatedOrders: 50,
        associatedRevenue: '1250.00',
        ctr: '7.50',
        conversionRate: '6.67',
        avgOrderValue: '25.00',
        engagementRate: '12.50',
        avgTimeOnSlideSeconds: '3.50',
        avgEngagementScore: '45.00',
        dailyData: [],
      },
    },
  })
  async getItemAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.carouselAnalyticsService.getItemAnalytics(id, start, end);
  }

  /**
   * Record a view event for analytics (deprecated - use /events/track instead)
   */
  @Post(':id/view')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image view (deprecated)',
    description: 'Record that a carousel image was viewed (for analytics). Use /events/track instead.',
    deprecated: true,
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 200,
    description: 'View recorded successfully',
  })
  async recordView(@Param('id') id: string) {
    await this.carouselService.recordView(id);
    return { success: true };
  }

  /**
   * Record a click event for analytics (deprecated - use /events/track instead)
   */
  @Post(':id/click')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image click (deprecated)',
    description: 'Record that a carousel image was clicked (for analytics). Use /events/track instead.',
    deprecated: true,
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 200,
    description: 'Click recorded successfully',
  })
  async recordClick(@Param('id') id: string) {
    await this.carouselService.recordClick(id);
    return { success: true };
  }

  /**
   * Record a conversion event for analytics (deprecated - use /events/track instead)
   */
  @Post(':id/conversion')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image conversion (deprecated)',
    description: 'Record that a carousel image led to a conversion (for analytics). Use /events/track instead.',
    deprecated: true,
  })
  @ApiParam({ name: 'id', description: 'Carousel image ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversion recorded successfully',
  })
  async recordConversion(@Param('id') id: string) {
    await this.carouselService.recordConversion(id);
    return { success: true };
  }

  /**
   * Get analytics for all carousel images
   */
  @Get('analytics/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get carousel analytics',
    description: 'Get analytics data for all carousel images (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousel analytics data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getAnalytics() {
    return this.carouselService.getAnalytics();
  }

  /**
   * Reorder carousel images
   */
  @Put('reorder/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder carousel images',
    description: 'Reorder carousel images by providing an array of image IDs in the desired order (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousel images reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async reorder(@Body() body: { imageIds: string[] }) {
    return this.carouselService.reorder(body.imageIds);
  }

  /**
   * Get all A/B tests
   */
  @Get('ab-tests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all A/B tests' })
  async getAllABTests() {
    return this.carouselABTestService.getAllTests();
  }

  /**
   * Get specific A/B test
   */
  @Get('ab-tests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get A/B test by ID' })
  async getABTest(@Param('id') id: string) {
    return this.carouselABTestService.getTestById(id);
  }

  /**
   * Create new A/B test
   */
  @Post('ab-tests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new A/B test' })
  async createABTest(
    @Body()
    body: {
      test_name: string;
      description?: string;
      carousel_id: string;
      variant_a_item_id: string;
      variant_b_item_id: string;
      traffic_split?: number;
      primary_metric?: 'ctr' | 'conversion_rate' | 'engagement_score' | 'revenue';
    },
    @CurrentUser() user: User,
  ) {
    return this.carouselABTestService.createTest({
      ...body,
      created_by: user.userId,
    });
  }

  /**
   * Start A/B test
   */
  @Post('ab-tests/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start A/B test' })
  async startABTest(@Param('id') id: string) {
    return this.carouselABTestService.startTest(id);
  }

  /**
   * Pause A/B test
   */
  @Post('ab-tests/:id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause A/B test' })
  async pauseABTest(@Param('id') id: string) {
    return this.carouselABTestService.pauseTest(id);
  }

  /**
   * Complete A/B test
   */
  @Post('ab-tests/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete A/B test and determine winner' })
  async completeABTest(@Param('id') id: string) {
    return this.carouselABTestService.completeTest(id);
  }

  /**
   * Delete A/B test
   */
  @Delete('ab-tests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete A/B test' })
  async deleteABTest(@Param('id') id: string) {
    await this.carouselABTestService.deleteTest(id);
  }
}
