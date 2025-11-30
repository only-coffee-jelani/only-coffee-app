package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.CategoryDto
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.MenuItemDto
import retrofit2.http.*

/**
 * Enterprise-Level Menu API Service
 * Retrofit interface for menu-related API endpoints
 */
interface MenuApiService {
    /**
     * Get all categories from the database
     * Endpoint: GET /categories
     *
     * @return List of category DTOs from menu_categories table
     */
    @GET("categories")
    suspend fun getCategories(): List<CategoryDto>

    /**
     * Get all menu items with optional store filtering
     * Endpoint: GET /menu-items
     *
     * @param storeId Optional store ID to filter items
     * @return List of menu item DTOs
     */
    @GET("menu-items")
    suspend fun getAllMenuItems(
        @Query("storeId") storeId: String? = null
    ): List<MenuItemDto>

    /**
     * Get a specific menu item by ID
     * Endpoint: GET /menu-items/{id}
     *
     * @param itemId Menu item ID
     * @return Menu item DTO
     */
    @GET("menu-items/{id}")
    suspend fun getMenuItemById(@Path("id") itemId: String): MenuItemDto

    /**
     * Get menu items by category
     * Endpoint: GET /menu-items/category/{category}
     *
     * @param category Category name
     * @param storeId Optional store ID to filter items
     * @return List of menu item DTOs
     */
    @GET("menu-items/category/{category}")
    suspend fun getMenuItemsByCategory(
        @Path("category") category: String,
        @Query("storeId") storeId: String? = null
    ): List<MenuItemDto>

    /**
     * Get featured menu items
     * Endpoint: GET /menu-items/featured
     *
     * @return List of featured menu item DTOs
     */
    @GET("menu-items/featured")
    suspend fun getFeaturedItems(): List<MenuItemDto>

    /**
     * Get popular menu items
     * Endpoint: GET /menu-items/popular
     *
     * @return List of popular menu item DTOs
     */
    @GET("menu-items/popular")
    suspend fun getPopularItems(): List<MenuItemDto>
}

data class MenuItemsResponse(
    val success: Boolean,
    val data: List<MenuItem>,
    val count: Int
)

data class MenuItemResponse(
    val success: Boolean,
    val data: MenuItem
)

