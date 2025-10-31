import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Body() data: { name: string; displayName: string }) {
    return this.categoriesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(@Param('id') id: string, @Body() data: { displayName?: string; sortOrder?: number }) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
