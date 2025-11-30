package com.onlycoffee.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Enterprise-Level Category Data Transfer Object
 * Maps to the backend API response for categories
 * 
 * Backend API: GET /categories
 * Response format from menu_categories table
 */
data class CategoryDto(
    @SerializedName("categoryId")
    val categoryId: String? = null,
    
    @SerializedName("name")
    val name: String? = null,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("sortOrder")
    val sortOrder: Int? = null,
    
    @SerializedName("createdAt")
    val createdAt: String? = null,
    
    @SerializedName("updatedAt")
    val updatedAt: String? = null
) {
    /**
     * Convert DTO to Category domain model
     * Enterprise-level implementation with comprehensive validation and error handling
     * 
     * @return Category domain model
     * @throws IllegalStateException if required fields are missing
     */
    fun toCategory(): Category {
        // Validate required fields
        val id = categoryId
            ?: throw IllegalStateException("Category must have 'categoryId'")
        
        val categoryName = name
            ?: throw IllegalStateException("Category with id '$id' is missing required field 'name'")
        
        // Validate sort order (default to 0 if not provided)
        val order = sortOrder ?: 0
        
        return Category(
            id = id,
            name = categoryName,
            description = description,
            sortOrder = order
        )
    }
}

