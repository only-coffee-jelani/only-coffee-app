import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, RespondReviewDto } from './dto';
import { UserRole } from '@shared/database/entities';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Store or order not found' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all reviews for a store' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'verifiedOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  async findByStore(
    @Param('storeId') storeId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('minRating', new ParseIntPipe({ optional: true })) minRating?: number,
    @Query('verifiedOnly', new ParseBoolPipe({ optional: true })) verifiedOnly?: boolean,
  ) {
    return this.reviewsService.findByStore(storeId, {
      limit,
      offset,
      minRating,
      verifiedOnly,
    });
  }

  @Get('store/:storeId/stats')
  @ApiOperation({ summary: 'Get rating statistics for a store' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStoreStats(@Param('storeId') storeId: string) {
    return this.reviewsService.getStoreStats(storeId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  async findByUser(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.findByUser(userId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({
    status: 200,
    description: 'Review found',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findById(@Param('id') reviewId: string) {
    return this.reviewsService.findById(reviewId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, reviewId, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async delete(
    @CurrentUser('sub') userId: string,
    @Param('id') reviewId: string,
  ) {
    return this.reviewsService.delete(userId, reviewId);
  }

  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark review as helpful' })
  @ApiResponse({
    status: 200,
    description: 'Review marked as helpful',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async markHelpful(@Param('id') reviewId: string) {
    return this.reviewsService.markHelpful(reviewId);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to a review (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Response added successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async respond(
    @CurrentUser('sub') adminUserId: string,
    @Param('id') reviewId: string,
    @Body() respondReviewDto: RespondReviewDto,
  ) {
    return this.reviewsService.respond(reviewId, respondReviewDto, adminUserId);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a review (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Review hidden successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async hide(
    @CurrentUser('sub') adminUserId: string,
    @Param('id') reviewId: string,
  ) {
    return this.reviewsService.hide(reviewId, adminUserId);
  }

  @Patch(':id/show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Show a hidden review (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Review made visible successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async show(
    @CurrentUser('sub') adminUserId: string,
    @Param('id') reviewId: string,
  ) {
    return this.reviewsService.show(reviewId, adminUserId);
  }
}
