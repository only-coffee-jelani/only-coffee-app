import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/database/entities';
import { StoresService } from './stores.service';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby')
  @Public()
  @ApiOperation({
    summary: 'Find stores near a location',
    description: 'Search for Only Coffee stores within a specified radius of coordinates',
  })
  @ApiQuery({
    name: 'latitude',
    type: Number,
    required: true,
    description: 'Latitude coordinate',
    example: 29.9511,
  })
  @ApiQuery({
    name: 'longitude',
    type: Number,
    required: true,
    description: 'Longitude coordinate',
    example: -90.2623,
  })
  @ApiQuery({
    name: 'radius',
    type: Number,
    required: false,
    description: 'Search radius in miles (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby stores',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Downtown Store',
          address: '123 Main St',
          city: 'New Orleans',
          state: 'LA',
          zipCode: '70112',
          phone: '(504) 123-4567',
          distance: 2.5,
          isOpen: true,
          hours: {
            monday: '6:00 AM - 10:00 PM',
            tuesday: '6:00 AM - 10:00 PM',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
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

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all stores',
    description: 'Retrieve all Only Coffee store locations. Returns stores ordered by creation date (newest first). Includes all store details such as address, contact information, and status.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all stores retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Downtown Store',
          type: 'store',
          address: '123 Main St',
          city: 'New Orleans',
          state: 'LA',
          zipCode: '70112',
          latitude: 29.9511,
          longitude: -90.2623,
          phone: '(504) 123-4567',
          email: 'downtown@onlycoffee.us',
          storeImageUrl: 'https://s3.amazonaws.com/...',
          isActive: true,
          acceptingOrders: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  async findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get store details by ID',
    description: 'Retrieve detailed information about a specific store',
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Store details',
    schema: {
      example: {
        id: 'uuid',
        name: 'Downtown Store',
        address: '123 Main St',
        city: 'New Orleans',
        state: 'LA',
        zipCode: '70112',
        phone: '(504) 123-4567',
        email: 'downtown@onlycoffee.us',
        imageUrl: 'https://...',
        isActive: true,
        hours: {
          monday: '6:00 AM - 10:00 PM',
          tuesday: '6:00 AM - 10:00 PM',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new store',
    description: 'Create a new Only Coffee store location. Requires admin authentication. Returns the created store with generated ID and timestamps.',
  })
  @ApiBody({
    description: 'Store creation data',
    schema: {
      example: {
        name: 'Downtown Store',
        type: 'store',
        address: '123 Main St',
        city: 'New Orleans',
        state: 'LA',
        zipCode: '70112',
        latitude: 29.9511,
        longitude: -90.2623,
        phone: '(504) 123-4567',
        email: 'downtown@onlycoffee.us',
        storeImageUrl: 'https://s3.amazonaws.com/...',
        isActive: true,
        acceptingOrders: true,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Downtown Store',
        type: 'store',
        address: '123 Main St',
        city: 'New Orleans',
        state: 'LA',
        zipCode: '70112',
        latitude: 29.9511,
        longitude: -90.2623,
        phone: '(504) 123-4567',
        email: 'downtown@onlycoffee.us',
        storeImageUrl: 'https://s3.amazonaws.com/...',
        isActive: true,
        acceptingOrders: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required fields (name, address, city)' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(@Body() createStoreDto: any) {
    return this.storesService.create(createStoreDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a store',
    description: 'Update an existing Only Coffee store location. Requires admin authentication. All fields are optional - only provide fields you want to update.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    description: 'Store update data (all fields optional)',
    schema: {
      example: {
        name: 'Downtown Store - Updated',
        phone: '(504) 999-9999',
        email: 'newemail@onlycoffee.us',
        storeImageUrl: 'https://s3.amazonaws.com/...',
        isActive: true,
        acceptingOrders: false,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Downtown Store - Updated',
        type: 'store',
        address: '123 Main St',
        city: 'New Orleans',
        state: 'LA',
        zipCode: '70112',
        latitude: 29.9511,
        longitude: -90.2623,
        phone: '(504) 999-9999',
        email: 'newemail@onlycoffee.us',
        storeImageUrl: 'https://s3.amazonaws.com/...',
        isActive: true,
        acceptingOrders: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(@Param('id') id: string, @Body() updateStoreDto: any) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a store',
    description: 'Delete an Only Coffee store location. Requires admin authentication. This action is permanent and cannot be undone. Returns 204 No Content on success.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 204,
    description: 'Store deleted successfully (no content returned)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async delete(@Param('id') id: string) {
    return this.storesService.delete(id);
  }
}
