import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from '@shared/database/entities';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepository: Repository<MenuCategory>,
  ) {}

  async findAll() {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC' },
    });
  }

  async create(data: { name: string; displayName: string }) {
    // Check if category with this name already exists
    const existing = await this.categoryRepository.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Category "${data.name}" already exists`);
    }

    // Get the highest sort order and add 1
    const highestOrder = await this.categoryRepository
      .createQueryBuilder('category')
      .select('MAX(category.sortOrder)', 'max')
      .getRawOne();

    const sortOrder = (highestOrder?.max || 0) + 1;

    const category = this.categoryRepository.create({
      ...data,
      sortOrder,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, data: { displayName?: string; sortOrder?: number }) {
    const category = await this.categoryRepository.findOne({ where: { categoryId: id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async delete(id: string) {
    const category = await this.categoryRepository.findOne({ where: { categoryId: id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
