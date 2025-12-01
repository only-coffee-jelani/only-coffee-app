/**
 * Enterprise-Level Category API Service
 * Handles all category-related API calls with proper error handling
 */

import { API_BASE } from '../config';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Category Service
 * Provides methods for CRUD operations on categories
 */
export class CategoryService {
  private static readonly ENDPOINT = `${API_BASE}/categories`;

  /**
   * Get all categories from the backend
   * @returns Promise<Category[]> - Array of categories sorted by sortOrder
   * @throws ApiError if the request fails
   */
  static async getAll(): Promise<Category[]> {
    try {
      const response = await fetch(this.ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Failed to fetch categories: ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      
      // Backend returns array directly
      const categories: Category[] = Array.isArray(data) ? data : (data.data || []);
      
      // Sort by sortOrder to ensure consistent display
      return categories.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error while fetching categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Create a new category
   * @param data - Category creation data
   * @returns Promise<Category> - The created category
   * @throws ApiError if the request fails
   */
  static async create(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Failed to create category: ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error while creating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Update an existing category
   * @param id - Category ID
   * @param data - Category update data
   * @returns Promise<Category> - The updated category
   * @throws ApiError if the request fails
   */
  static async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await fetch(`${this.ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Failed to update category: ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error while updating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Delete a category
   * @param id - Category ID
   * @returns Promise<void>
   * @throws ApiError if the request fails
   */
  static async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.ENDPOINT}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Failed to delete category: ${response.status}`,
          response.status,
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error while deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }
}

