import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MenuService } from './menu.service';
import { MenuCategory } from '@shared/database/entities';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('store/:storeId')
  @Public()
  @ApiOperation({ summary: 'Get menu items for a store' })
  @ApiQuery({ name: 'category', enum: MenuCategory, required: false })
  async getStoreMenu(
    @Param('storeId') storeId: string,
    @Query('category') category?: MenuCategory,
  ) {
    return this.menuService.findByStore(storeId, category);
  }

  @Get('store/:storeId/categories')
  @Public()
  @ApiOperation({ summary: 'Get available categories for a store' })
  async getCategories(@Param('storeId') storeId: string) {
    return this.menuService.getCategories(storeId);
  }

  @Get('store/:storeId/search')
  @Public()
  @ApiOperation({ summary: 'Search menu items' })
  @ApiQuery({ name: 'q', type: String, required: true })
  async searchMenu(@Param('storeId') storeId: string, @Query('q') searchTerm: string) {
    return this.menuService.searchMenu(storeId, searchTerm);
  }

  @Get('item/:id')
  @Public()
  @ApiOperation({ summary: 'Get menu item details' })
  async getMenuItem(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post('calculate-price')
  @Public()
  @ApiOperation({ summary: 'Calculate price with modifiers' })
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    const price = await this.menuService.calculatePrice(dto.itemId, dto.modifiers);
    return { itemId: dto.itemId, price };
  }
}
