/**
 * Enterprise-Level Category Type Definitions
 * Matches backend MenuCategory entity structure
 */

/**
 * Category entity from the database
 * Represents a menu category (Vienna Classics, Coffee Cocktails, etc.)
 */
export interface Category {
  categoryId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new category
 */
export interface CreateCategoryDto {
  name: string;
  displayName?: string;
  description?: string;
}

/**
 * DTO for updating a category
 */
export interface UpdateCategoryDto {
  displayName?: string;
  description?: string;
  sortOrder?: number;
}

/**
 * Category display helper
 * Formats category for UI display
 */
export class CategoryHelper {
  /**
   * Get display name for a category
   * Uses the name field as display name
   */
  static getDisplayName(category: Category): string {
    return category.name;
  }

  /**
   * Sort categories by sortOrder
   */
  static sortCategories(categories: Category[]): Category[] {
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Create a map of category name to category ID
   * Useful for form submissions
   */
  static createNameToIdMap(categories: Category[]): Map<string, string> {
    const map = new Map<string, string>();
    categories.forEach(cat => {
      map.set(cat.name, cat.categoryId);
    });
    return map;
  }

  /**
   * Create a map of category ID to category
   * Useful for lookups
   */
  static createIdToCategoryMap(categories: Category[]): Map<string, Category> {
    const map = new Map<string, Category>();
    categories.forEach(cat => {
      map.set(cat.categoryId, cat);
    });
    return map;
  }
}

