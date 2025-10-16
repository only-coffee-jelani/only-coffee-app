import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PromotionsService } from './promotions.service';
import { PromotionType } from '@shared/database/entities';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('active/launch-modal')
  @Public()
  @ApiOperation({ summary: 'Get active launch modal promotion' })
  async getActiveLaunchModal() {
    const promotion = await this.promotionsService.getActiveLaunchModal();
    return promotion || { message: 'No active launch modal' };
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get all active promotions' })
  @ApiQuery({ name: 'type', enum: PromotionType, required: false })
  async getActivePromotions(@Query('type') type?: PromotionType) {
    return this.promotionsService.getActivePromotions(type);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get promotion by ID' })
  async findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @Public()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new promotion (admin only)' })
  async create(@Body() data: any) {
    return this.promotionsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update promotion (admin only)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.promotionsService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete promotion (admin only)' })
  async delete(@Param('id') id: string) {
    const deleted = await this.promotionsService.delete(id);
    return { success: deleted };
  }
}
