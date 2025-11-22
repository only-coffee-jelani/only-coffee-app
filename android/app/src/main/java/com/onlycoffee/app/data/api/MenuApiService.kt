package com.onlycoffee.app.data.api

import com.onlycoffee.app.data.model.MenuItem
import retrofit2.http.*

interface MenuApiService {
    @GET("menu-items")
    suspend fun getAllMenuItems(
        @Query("storeId") storeId: String? = null
    ): MenuItemsResponse
    
    @GET("menu-items/{id}")
    suspend fun getMenuItemById(@Path("id") itemId: String): MenuItemResponse
    
    @GET("menu-items/category/{category}")
    suspend fun getMenuItemsByCategory(
        @Path("category") category: String,
        @Query("storeId") storeId: String? = null
    ): MenuItemsResponse
    
    @GET("menu-items/featured")
    suspend fun getFeaturedItems(): MenuItemsResponse
    
    @GET("menu-items/popular")
    suspend fun getPopularItems(): MenuItemsResponse
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

