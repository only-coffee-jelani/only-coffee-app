package com.onlycoffee.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * DTO for menu item response from backend API
 * Maps the backend response format to the app's MenuItem model
 */
data class MenuItemDto(
    @SerializedName("id")
    val id: String? = null,

    @SerializedName("menuItemId")
    val menuItemId: String? = null,

    @SerializedName("name")
    val name: String? = null,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("basePrice")
    val basePrice: Double? = null,

    @SerializedName("calories")
    val calories: Int? = null,

    @SerializedName("imageUrl")
    val imageUrl: String? = null,

    @SerializedName("categoryId")
    val categoryId: String? = null,

    @SerializedName("categoryName")
    val categoryName: String? = null,

    @SerializedName("isActive")
    val isActive: Boolean? = null,

    @SerializedName("toastItemId")
    val toastItemId: String? = null,

    @SerializedName("storeIds")
    val storeIds: List<String>? = null,

    @SerializedName("allergenIds")
    val allergenIds: List<String>? = null,

    @SerializedName("createdAt")
    val createdAt: String? = null,

    @SerializedName("updatedAt")
    val updatedAt: String? = null
) {
    /**
     * Convert DTO to MenuItem model with proper null handling and validation
     * This is an enterprise-level implementation with comprehensive error handling
     */
    fun toMenuItem(): MenuItem {
        // Validate required fields and provide meaningful error messages
        val itemId = id ?: menuItemId
            ?: throw IllegalStateException("Menu item must have either 'id' or 'menuItemId'")

        val itemName = name
            ?: throw IllegalStateException("Menu item with id '$itemId' is missing required field 'name'")

        val itemDescription = description
            ?: throw IllegalStateException("Menu item with id '$itemId' is missing required field 'description'")

        val itemPrice = basePrice
            ?: throw IllegalStateException("Menu item with id '$itemId' is missing required field 'basePrice'")

        // Validate business rules
        if (itemPrice < 0) {
            throw IllegalStateException("Menu item with id '$itemId' has invalid price: $itemPrice")
        }

        // Debug logging for allergenIds
        android.util.Log.d("MenuItemDto", "Converting DTO for: $itemName")
        android.util.Log.d("MenuItemDto", "AllergenIds from API: $allergenIds")

        return MenuItem(
            id = itemId,
            name = itemName,
            description = itemDescription,
            basePrice = itemPrice,
            imageUrl = imageUrl,
            categoryName = categoryName ?: "Other", // Store category name directly from database
            isAvailable = isActive ?: true, // Default to available
            modifiers = emptyList(), // TODO: Add modifiers support from backend
            nutritionInfo = calories?.let {
                NutritionInfo(
                    calories = it,
                    fat = 0.0,
                    saturatedFat = 0.0,
                    cholesterol = 0,
                    sodium = 0,
                    carbohydrates = 0.0,
                    fiber = 0.0,
                    sugar = 0.0,
                    protein = 0.0,
                    caffeine = 0
                )
            },
            allergens = allergenIds ?: emptyList(),
            preparationTime = 5, // Default value - TODO: Get from backend
            isCustomizable = true, // Default value - TODO: Get from backend
            isFeatured = false, // TODO: Add featured support from backend
            isPopular = false // TODO: Add popular support from backend
        )
    }
}

