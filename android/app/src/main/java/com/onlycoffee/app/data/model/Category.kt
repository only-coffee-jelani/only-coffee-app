package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

/**
 * Enterprise-Level Category Domain Model
 * Represents a menu category in the application
 * 
 * This is the domain model used throughout the app.
 * Immutable and Parcelable for safe passing between components.
 */
@Parcelize
@Serializable
data class Category(
    val id: String,
    val name: String,
    val description: String? = null,
    val sortOrder: Int = 0
) : Parcelable {
    
    /**
     * Get display name for the category
     * Formats the category name for UI display
     */
    val displayName: String
        get() = name
    
    companion object {
        /**
         * Special "ALL" category for showing all menu items
         * This is always the first category in the list
         */
        val ALL = Category(
            id = "all",
            name = "All",
            description = "View all menu items",
            sortOrder = -1
        )
        
        /**
         * Check if a category should be excluded from display
         * Currently excludes "Add-Ons" category
         */
        fun shouldExclude(categoryName: String): Boolean {
            return categoryName.equals("Add-Ons", ignoreCase = true) ||
                   categoryName.equals("Add Ons", ignoreCase = true) ||
                   categoryName.equals("add_ons", ignoreCase = true)
        }
    }
}

