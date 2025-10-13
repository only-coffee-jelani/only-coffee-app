import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { StoresService } from './stores.service';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find stores near a location' })
  @ApiQuery({ name: 'latitude', type: Number, required: true })
  @ApiQuery({ name: 'longitude', type: Number, required: true })
  @ApiQuery({ name: 'radius', type: Number, required: false, description: 'Radius in miles (default: 10)' })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.storesService.findNearby(
      Number(latitude),
      Number(longitude),
      radius ? Number(radius) : 10,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get store details by ID' })
  async findById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }
}
