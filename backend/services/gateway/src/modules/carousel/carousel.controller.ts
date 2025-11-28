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
import { CreateCarouselImageDto, UpdateCarouselImageDto } from './dto';

@ApiTags('carousel')
@Controller('carousel')
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

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
   * Record a view event for analytics
   */
  @Post(':id/view')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image view',
    description: 'Record that a carousel image was viewed (for analytics)',
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
   * Record a click event for analytics
   */
  @Post(':id/click')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image click',
    description: 'Record that a carousel image was clicked (for analytics)',
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
   * Record a conversion event for analytics
   */
  @Post(':id/conversion')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record carousel image conversion',
    description: 'Record that a carousel image led to a conversion (for analytics)',
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
}
