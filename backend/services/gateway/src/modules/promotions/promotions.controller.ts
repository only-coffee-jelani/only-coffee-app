import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PromotionsService } from './promotions.service';
import { PromotionType } from '@shared/database/entities';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('active')
  @Public()
  @ApiOperation({
    summary: 'Get all active promotions',
    description: 'Retrieve all currently active promotions, optionally filtered by type',
  })
  @ApiQuery({
    name: 'type',
    enum: PromotionType,
    required: false,
    description: 'Filter promotions by type (CARD, BANNER, LAUNCH_MODAL, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active promotions',
    schema: {
      example: [
        {
          id: 'uuid',
          title: 'Invite a friend',
          description: 'Get a free coffee',
          promotionType: 'CARD',
          isActive: true,
        },
      ],
    },
  })
  async getActivePromotions(@Query('type') type?: PromotionType) {
    return this.promotionsService.getActivePromotions(type);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get promotion by ID',
    description: 'Retrieve a specific promotion by its ID',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion details',
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new promotion',
    description: 'Create a new promotion (admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async create(@Body() data: any) {
    return this.promotionsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update promotion',
    description: 'Update an existing promotion (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.promotionsService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete promotion',
    description: 'Delete a promotion (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion deleted successfully',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(@Param('id') id: string) {
    const deleted = await this.promotionsService.delete(id);
    return { success: deleted };
  }
}
