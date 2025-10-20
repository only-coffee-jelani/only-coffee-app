import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/database/entities';
import { MenuService } from './menu.service';

@ApiTags('menu-items')
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all menu items',
    description: 'Retrieve all menu items across all stores. Used by admin dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all menu items',
  })
  async findAll() {
    return this.menuService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get menu item by ID',
    description: 'Retrieve a specific menu item by its ID',
  })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({
    status: 200,
    description: 'Menu item details',
  })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findById(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new menu item',
    description: 'Create a new menu item for a specific store. Requires admin authentication.',
  })
  @ApiBody({
    description: 'Menu item creation data',
    schema: {
      example: {
        storeId: 'uuid',
        name: 'Cappuccino',
        category: 'hot_coffee',
        description: 'Espresso with steamed milk',
        basePrice: 4.50,
        imageUrl: 'https://s3.amazonaws.com/...',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Menu item created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(@Body() createMenuItemDto: any) {
    return this.menuService.create(createMenuItemDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a menu item',
    description: 'Update an existing menu item. Requires admin authentication. All fields are optional.',
  })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiBody({
    description: 'Menu item update data (all fields optional)',
    schema: {
      example: {
        name: 'Cappuccino - Updated',
        basePrice: 5.00,
        description: 'Updated description',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Menu item updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async update(@Param('id') id: string, @Body() updateMenuItemDto: any) {
    return this.menuService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a menu item',
    description: 'Delete a menu item. Requires admin authentication. This action is permanent.',
  })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({
    status: 204,
    description: 'Menu item deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async delete(@Param('id') id: string) {
    return this.menuService.delete(id);
  }
}

