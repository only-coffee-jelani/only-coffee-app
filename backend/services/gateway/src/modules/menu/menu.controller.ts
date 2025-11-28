import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Get menu items for a store',
    description: 'Retrieve all menu items available at a specific store, optionally filtered by category',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'category',
    type: String,
    required: false,
    description: 'Filter by menu category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of menu items',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Cappuccino',
          category: 'COFFEE',
          description: 'Espresso with steamed milk',
          price: 4.5,
          imageUrl: 'https://...',
          available: true,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreMenu(
    @Param('storeId') storeId: string,
    @Query('category') category?: MenuCategory,
  ) {
    return this.menuService.findByStore(storeId, category);
  }

  @Get('store/:storeId/categories')
  @Public()
  @ApiOperation({
    summary: 'Get available categories for a store',
    description: 'Retrieve all menu categories available at a specific store',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'List of available categories',
    schema: {
      example: ['COFFEE', 'PASTRIES', 'SANDWICHES', 'DRINKS'],
    },
  })
  async getCategories(@Param('storeId') storeId: string) {
    return this.menuService.getCategories(storeId);
  }

  @Get('store/:storeId/search')
  @Public()
  @ApiOperation({
    summary: 'Search menu items',
    description: 'Search for menu items by name or description',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'q',
    type: String,
    required: true,
    description: 'Search query',
    example: 'cappuccino',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  async searchMenu(@Param('storeId') storeId: string, @Query('q') searchTerm: string) {
    return this.menuService.searchMenu(storeId, searchTerm);
  }

  @Get('item/:id')
  @Public()
  @ApiOperation({
    summary: 'Get menu item details',
    description: 'Retrieve detailed information about a specific menu item',
  })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({
    status: 200,
    description: 'Menu item details',
    schema: {
      example: {
        id: 'uuid',
        name: 'Cappuccino',
        category: 'COFFEE',
        description: 'Espresso with steamed milk',
        price: 4.5,
        imageUrl: 'https://...',
        modifiers: [
          {
            id: 'uuid',
            name: 'Size',
            options: ['Small', 'Medium', 'Large'],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async getMenuItem(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post('calculate-price')
  @Public()
  @ApiOperation({
    summary: 'Calculate price with modifiers',
    description: 'Calculate the final price of a menu item with selected modifiers',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated price',
    schema: {
      example: {
        itemId: 'uuid',
        price: 5.5,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid item or modifiers' })
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    const price = await this.menuService.calculatePrice(dto.itemId, dto.modifiers);
    return { itemId: dto.itemId, price };
  }
}
