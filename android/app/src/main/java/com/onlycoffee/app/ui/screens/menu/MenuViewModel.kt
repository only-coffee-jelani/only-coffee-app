package com.onlycoffee.app.ui.screens.menu

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.Category
import com.onlycoffee.app.data.model.MenuItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Enterprise-Level MenuViewModel
 * Manages menu items and categories loaded from the backend API
 *
 * Features:
 * - Dynamic category loading from database
 * - Automatic exclusion of "Add-Ons" category
 * - "All" category always first
 * - Real-time search and filtering
 * - Comprehensive error handling
 */
@HiltViewModel
class MenuViewModel @Inject constructor(
    private val menuApiService: com.onlycoffee.app.data.api.MenuApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(MenuUiState())
    val uiState: StateFlow<MenuUiState> = _uiState.asStateFlow()

    private var allMenuItems: List<MenuItem> = emptyList()

    init {
        loadData()
    }

    /**
     * Load both categories and menu items from the backend
     * Enterprise-level implementation with proper error handling
     */
    private fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                // Load categories from database
                val categoryDtos = menuApiService.getCategories()

                // Convert DTOs to Category models and filter out "Add-Ons"
                val categoriesFromDb = categoryDtos
                    .map { it.toCategory() }
                    .filter { !Category.shouldExclude(it.name) }
                    .sortedBy { it.sortOrder }

                // Add "All" category as the first item
                val allCategories = listOf(Category.ALL) + categoriesFromDb

                // Load all menu items from backend
                val menuItemDtos = menuApiService.getAllMenuItems(storeId = null)
                allMenuItems = menuItemDtos.map { it.toMenuItem() }

                // Update UI state with categories and filtered items
                _uiState.value = _uiState.value.copy(
                    categories = allCategories,
                    selectedCategory = Category.ALL,
                    isLoading = false
                )

                filterItems()
            } catch (e: Exception) {
                // Enterprise-level error handling - show meaningful error message
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load menu data: ${e.message}"
                )
            }
        }
    }

    /**
     * Select a category to filter menu items
     *
     * @param category The category to select
     */
    fun selectCategory(category: Category) {
        _uiState.value = _uiState.value.copy(
            selectedCategory = category
        )
        filterItems()
    }

    /**
     * Search menu items by query
     *
     * @param query Search query string
     */
    fun searchItems(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query
        )
        filterItems()
    }

    /**
     * Filter menu items based on selected category and search query
     * Enterprise-level implementation with multiple filter criteria
     */
    private fun filterItems() {
        val currentState = _uiState.value
        val filtered = allMenuItems.filter { item ->
            // Price filter - exclude items $1.50 and below (add-ons)
            val priceMatch = item.basePrice > 1.50

            // Category filter - match by category name (case-insensitive string comparison)
            // If "All" is selected, show all items
            val categoryMatch = currentState.selectedCategory.id == Category.ALL.id ||
                               item.categoryName.equals(currentState.selectedCategory.name, ignoreCase = true)

            // Search filter - search in name and description
            val searchMatch = currentState.searchQuery.isEmpty() ||
                             item.name.contains(currentState.searchQuery, ignoreCase = true) ||
                             item.description.contains(currentState.searchQuery, ignoreCase = true)

            priceMatch && categoryMatch && searchMatch
        }

        _uiState.value = currentState.copy(
            filteredItems = filtered
        )
    }
}

/**
 * UI State for MenuScreen
 *
 * @property isLoading Whether data is currently loading
 * @property categories List of available categories from database (with "All" first)
 * @property selectedCategory Currently selected category
 * @property searchQuery Current search query
 * @property filteredItems Filtered list of menu items
 * @property error Error message if loading failed
 */
data class MenuUiState(
    val isLoading: Boolean = true,
    val categories: List<Category> = listOf(Category.ALL),
    val selectedCategory: Category = Category.ALL,
    val searchQuery: String = "",
    val filteredItems: List<MenuItem> = emptyList(),
    val error: String? = null
)
