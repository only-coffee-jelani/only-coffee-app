import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem, MenuCategory } from '@shared/database/entities';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
  ) {}

  async findByStore(storeId: string, category?: MenuCategory) {
    const query = this.menuItemRepository
      .createQueryBuilder('item')
      .where('item.storeId = :storeId', { storeId })
      .andWhere('item.isActive = :isActive', { isActive: true })
      .andWhere('item.isAvailable = :isAvailable', { isAvailable: true })
      .orderBy('item.sortOrder', 'ASC')
      .addOrderBy('item.name', 'ASC');

    if (category) {
      query.andWhere('item.category = :category', { category });
    }

    return query.getMany();
  }

  async findById(id: string) {
    const item = await this.menuItemRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  async calculatePrice(
    itemId: string,
    selectedModifiers: Array<{ id: string; value: string }>,
  ): Promise<number> {
    const item = await this.findById(itemId);
    let totalPrice = Number(item.basePrice);

    // Calculate modifier prices
    for (const selectedMod of selectedModifiers) {
      const modifier = item.availableModifiers.find((m) => m.id === selectedMod.id);
      if (modifier) {
        const option = modifier.options.find((o) => o.value === selectedMod.value);
        if (option && option.price) {
          totalPrice += Number(option.price);
        }
      }
    }

    return totalPrice;
  }

  async searchMenu(storeId: string, searchTerm: string) {
    return this.menuItemRepository
      .createQueryBuilder('item')
      .where('item.storeId = :storeId', { storeId })
      .andWhere('item.isActive = :isActive', { isActive: true })
      .andWhere('item.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere(
        '(LOWER(item.name) LIKE LOWER(:searchTerm) OR LOWER(item.description) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` },
      )
      .orderBy('item.sortOrder', 'ASC')
      .getMany();
  }

  async getCategories(storeId: string): Promise<MenuCategory[]> {
    const items = await this.menuItemRepository.find({
      where: { storeId, isActive: true, isAvailable: true },
      select: ['category'],
    });

    return [...new Set(items.map((item) => item.category))];
  }
}
