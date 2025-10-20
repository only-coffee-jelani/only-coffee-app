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
      .where(':storeId = ANY(item.storeIds)', { storeId })
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
      .where(':storeId = ANY(item.storeIds)', { storeId })
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
    const items = await this.menuItemRepository
      .createQueryBuilder('item')
      .where(':storeId = ANY(item.storeIds)', { storeId })
      .andWhere('item.isActive = :isActive', { isActive: true })
      .andWhere('item.isAvailable = :isAvailable', { isAvailable: true })
      .select('item.category')
      .getMany();

    return [...new Set(items.map((item) => item.category))];
  }

  // Admin methods
  async findAll() {
    // Get all menu items and deduplicate by name
    const allItems = await this.menuItemRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    // Create a map to store unique items by name (keeping the first occurrence)
    const uniqueItemsMap = new Map<string, any>();

    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.name)) {
        uniqueItemsMap.set(item.name, item);
      }
    }

    // Convert map back to array and sort by creation date
    return Array.from(uniqueItemsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async create(createMenuItemDto: any) {
    const menuItem = this.menuItemRepository.create(createMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async update(id: string, updateMenuItemDto: any) {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    Object.assign(menuItem, updateMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async delete(id: string) {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.menuItemRepository.remove(menuItem);
  }
}
