import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem, MenuCategory } from '@shared/database/entities';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
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
      where: { menuItemId: id, isActive: true },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Get store associations for this item
    const storeAssociations = await this.menuItemRepository.query(`
      SELECT array_agg(store_id) as store_ids
      FROM store_menu_items
      WHERE menu_item_id = $1
    `, [id]);

    // Get allergen associations for this item
    const allergenAssociations = await this.menuItemRepository.query(`
      SELECT array_agg(allergen_id) as allergen_ids
      FROM menu_item_allergens
      WHERE menu_item_id = $1
    `, [id]);

    // Transform to match frontend expectations
    return {
      id: item.menuItemId,
      menuItemId: item.menuItemId,
      name: item.name,
      description: item.description,
      basePrice: parseFloat(item.basePrice.toString()),
      calories: item.calories,
      imageUrl: item.imageAssetId ? `/api/media/${item.imageAssetId}` : null,
      categoryId: item.categoryId,
      categoryName: item.category?.name || 'Uncategorized',
      isActive: item.isActive,
      toastItemId: item.toastItemId,
      storeIds: storeAssociations[0]?.store_ids || [],
      allergenIds: allergenAssociations[0]?.allergen_ids || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async calculatePrice(
    itemId: string,
    selectedModifiers: Array<{ id: string; value: string }>,
  ): Promise<number> {
    const item = await this.findById(itemId);
    let totalPrice = Number(item.basePrice);

    // Calculate modifier prices
    // TODO: Implement modifier pricing using MenuItemModifierGroup relation
    for (const selectedMod of selectedModifiers) {
      // Stub: MenuItem doesn't have availableModifiers field in new schema
      // Need to query MenuItemModifierGroup relation
      const modifier = null; // item.menuItemModifierGroups.find((m) => m.modifierGroupId === selectedMod.id);
      if (modifier) {
        const option = null; // modifier.options.find((o) => o.value === selectedMod.value);
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

  async getAllCategories(): Promise<string[]> {
    // Query to get all unique categories from the categories array field
    const result = await this.menuItemRepository
      .createQueryBuilder('item')
      .select('DISTINCT unnest(item.categories)', 'category')
      .where('item.isActive = :isActive', { isActive: true })
      .getRawMany();

    const uniqueCategories = result.map((r) => r.category);

    // Define category order
    const categoryOrder = [
      'best_sellers',
      'seasonal_specials',
      'signature',
      'hot_coffee',
      'iced_coffee',
      'cold_brew',
      'other_drinks',
      'ice_cream',
      'add_ons',
    ];

    // Sort by predefined order, putting unknown categories at the end
    return uniqueCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);

      // If both categories are not in the order list, maintain their relative order
      if (indexA === -1 && indexB === -1) return 0;
      // If only A is not in the list, put it at the end
      if (indexA === -1) return 1;
      // If only B is not in the list, put it at the end
      if (indexB === -1) return -1;
      // Otherwise, sort by their defined order
      return indexA - indexB;
    });
  }

  // Admin methods
  async findAll() {
    // Get all menu items with their category relations
    const allItems = await this.menuItemRepository.find({
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Get store associations for all items
    const storeAssociations = await this.menuItemRepository.query(`
      SELECT menu_item_id, array_agg(store_id) as store_ids
      FROM store_menu_items
      GROUP BY menu_item_id
    `);

    // Get allergen associations for all items
    const allergenAssociations = await this.menuItemRepository.query(`
      SELECT menu_item_id, array_agg(allergen_id) as allergen_ids
      FROM menu_item_allergens
      GROUP BY menu_item_id
    `);

    // Create a map of menu_item_id -> store_ids
    const storeMap = new Map<string, string[]>();
    storeAssociations.forEach((assoc: any) => {
      storeMap.set(assoc.menu_item_id, assoc.store_ids || []);
    });

    // Create a map of menu_item_id -> allergen_ids
    const allergenMap = new Map<string, string[]>();
    allergenAssociations.forEach((assoc: any) => {
      allergenMap.set(assoc.menu_item_id, assoc.allergen_ids || []);
    });

    // Transform to match frontend expectations
    return allItems.map(item => ({
      id: item.menuItemId,
      menuItemId: item.menuItemId,
      name: item.name,
      description: item.description,
      basePrice: parseFloat(item.basePrice.toString()),
      calories: item.calories,
      imageUrl: item.imageAssetId ? `/api/media/${item.imageAssetId}` : null,
      categoryId: item.categoryId,
      categoryName: item.category?.name || 'Uncategorized',
      isActive: item.isActive,
      toastItemId: item.toastItemId,
      storeIds: storeMap.get(item.menuItemId) || [],
      allergenIds: allergenMap.get(item.menuItemId) || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async create(createMenuItemDto: any) {
    // Extract storeIds and allergenIds if provided
    const { storeIds, allergenIds, ...createData } = createMenuItemDto;

    // Create the menu item
    const menuItem = this.menuItemRepository.create(createData);
    const savedItem = await this.menuItemRepository.save(menuItem) as unknown as MenuItem;

    // Create store associations if storeIds provided
    if (storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
      for (const storeId of storeIds) {
        await this.menuItemRepository.query(
          `INSERT INTO store_menu_items (store_id, menu_item_id, is_available, created_at, updated_at)
           VALUES ($1, $2, true, NOW(), NOW())
           ON CONFLICT (store_id, menu_item_id) DO NOTHING`,
          [storeId, savedItem.menuItemId]
        );
      }
    }

    // Create allergen associations if allergenIds provided
    if (allergenIds && Array.isArray(allergenIds) && allergenIds.length > 0) {
      for (const allergenId of allergenIds) {
        await this.menuItemRepository.query(
          `INSERT INTO menu_item_allergens (menu_item_id, allergen_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (menu_item_id, allergen_id) DO NOTHING`,
          [savedItem.menuItemId, allergenId]
        );
      }
    }

    // Return the created item with store associations and allergens
    const storeAssociations = await this.menuItemRepository.query(
      `SELECT array_agg(store_id) as store_ids FROM store_menu_items WHERE menu_item_id = $1`,
      [savedItem.menuItemId]
    );

    const allergenAssociations = await this.menuItemRepository.query(
      `SELECT array_agg(allergen_id) as allergen_ids FROM menu_item_allergens WHERE menu_item_id = $1`,
      [savedItem.menuItemId]
    );

    // Load category relation
    const itemWithCategory = await this.menuItemRepository.findOne({
      where: { menuItemId: savedItem.menuItemId },
      relations: ['category'],
    });

    return {
      id: savedItem.menuItemId,
      menuItemId: savedItem.menuItemId,
      name: savedItem.name,
      description: savedItem.description,
      basePrice: parseFloat(savedItem.basePrice.toString()),
      calories: savedItem.calories,
      imageUrl: savedItem.imageAssetId ? `/api/media/${savedItem.imageAssetId}` : null,
      categoryId: savedItem.categoryId,
      categoryName: itemWithCategory?.category?.name || 'Uncategorized',
      isActive: savedItem.isActive,
      toastItemId: savedItem.toastItemId,
      storeIds: storeAssociations[0]?.store_ids || [],
      allergenIds: allergenAssociations[0]?.allergen_ids || [],
      createdAt: savedItem.createdAt,
      updatedAt: savedItem.updatedAt,
    };
  }

  async update(id: string, updateMenuItemDto: any) {
    // Enterprise-level: Input validation and logging
    if (!id) {
      throw new NotFoundException('Menu item ID is required');
    }

    // Enterprise-level: Validate categoryId if provided
    if (updateMenuItemDto.categoryId) {
      const categoryExists = await this.menuCategoryRepository.findOne({
        where: { categoryId: updateMenuItemDto.categoryId },
      });

      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${updateMenuItemDto.categoryId} not found`);
      }
    }

    const menuItem = await this.menuItemRepository.findOne({
      where: { menuItemId: id },
      relations: ['category'],
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    // Enterprise-level: Store the original values for audit logging
    const originalCategoryId = menuItem.categoryId;
    const originalName = menuItem.name;

    // Extract storeIds and allergenIds if provided
    const { storeIds, allergenIds, ...updateData } = updateMenuItemDto;

    // Enterprise-level: Direct field assignment for critical fields
    // This ensures TypeORM properly tracks the changes
    if (updateData.name !== undefined) menuItem.name = updateData.name;
    if (updateData.description !== undefined) menuItem.description = updateData.description;
    if (updateData.basePrice !== undefined) menuItem.basePrice = updateData.basePrice;
    if (updateData.categoryId !== undefined) {
      menuItem.categoryId = updateData.categoryId;
      // Clear the category relation so TypeORM reloads it
      menuItem.category = null as any;
    }
    if (updateData.calories !== undefined) menuItem.calories = updateData.calories;
    if (updateData.imageAssetId !== undefined) menuItem.imageAssetId = updateData.imageAssetId;
    if (updateData.toastItemId !== undefined) menuItem.toastItemId = updateData.toastItemId;
    if (updateData.isActive !== undefined) menuItem.isActive = updateData.isActive;

    // Save the updated item
    const savedItem = await this.menuItemRepository.save(menuItem) as unknown as MenuItem;

    // Enterprise-level: Verify the save was successful
    if (!savedItem) {
      throw new Error('Failed to save menu item');
    }

    // Enterprise-level: ALWAYS reload the item with fresh relations after save
    // This ensures we have the correct category relation loaded from the database
    const reloadedItem = await this.menuItemRepository.findOne({
      where: { menuItemId: id },
      relations: ['category'],
    }) as unknown as MenuItem;

    if (!reloadedItem) {
      throw new NotFoundException('Menu item not found after save');
    }

    // Enterprise-level: Verify the category was actually updated in the database
    if (updateData.categoryId && reloadedItem.categoryId !== updateData.categoryId) {
      throw new Error(`Category update failed: Expected ${updateData.categoryId}, got ${reloadedItem.categoryId}`);
    }

    // Update store associations if storeIds provided
    if (storeIds && Array.isArray(storeIds)) {
      // Delete existing associations
      await this.menuItemRepository.query(
        `DELETE FROM store_menu_items WHERE menu_item_id = $1`,
        [id]
      );

      // Insert new associations
      for (const storeId of storeIds) {
        await this.menuItemRepository.query(
          `INSERT INTO store_menu_items (store_id, menu_item_id, is_available, created_at, updated_at)
           VALUES ($1, $2, true, NOW(), NOW())
           ON CONFLICT (store_id, menu_item_id) DO NOTHING`,
          [storeId, id]
        );
      }
    }

    // Update allergen associations if allergenIds provided
    if (allergenIds !== undefined && Array.isArray(allergenIds)) {
      // Delete existing allergen associations
      await this.menuItemRepository.query(
        `DELETE FROM menu_item_allergens WHERE menu_item_id = $1`,
        [id]
      );

      // Insert new allergen associations
      for (const allergenId of allergenIds) {
        await this.menuItemRepository.query(
          `INSERT INTO menu_item_allergens (menu_item_id, allergen_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (menu_item_id, allergen_id) DO NOTHING`,
          [id, allergenId]
        );
      }
    }

    // Return the updated item with store associations and allergens
    const storeAssociations = await this.menuItemRepository.query(
      `SELECT array_agg(store_id) as store_ids FROM store_menu_items WHERE menu_item_id = $1`,
      [id]
    );

    const allergenAssociations = await this.menuItemRepository.query(
      `SELECT array_agg(allergen_id) as allergen_ids FROM menu_item_allergens WHERE menu_item_id = $1`,
      [id]
    );

    // Enterprise-level: Use the reloaded item for the response to ensure fresh data
    const response = {
      id: reloadedItem.menuItemId,
      menuItemId: reloadedItem.menuItemId,
      name: reloadedItem.name,
      description: reloadedItem.description,
      basePrice: parseFloat(reloadedItem.basePrice.toString()),
      calories: reloadedItem.calories,
      imageUrl: reloadedItem.imageAssetId ? `/api/media/${reloadedItem.imageAssetId}` : null,
      categoryId: reloadedItem.categoryId,
      categoryName: reloadedItem.category?.name || 'Uncategorized',
      isActive: reloadedItem.isActive,
      toastItemId: reloadedItem.toastItemId,
      storeIds: storeAssociations[0]?.store_ids || [],
      allergenIds: allergenAssociations[0]?.allergen_ids || [],
      createdAt: reloadedItem.createdAt,
      updatedAt: reloadedItem.updatedAt,
    };

    // Enterprise-level: Final validation before returning
    if (updateData.categoryId && response.categoryId !== updateData.categoryId) {
      throw new Error(`Response validation failed: categoryId mismatch. Expected ${updateData.categoryId}, got ${response.categoryId}`);
    }

    return response;
  }

  async delete(id: string) {
    const menuItem = await this.menuItemRepository.findOne({
      where: { menuItemId: id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.menuItemRepository.remove(menuItem);
  }
}
