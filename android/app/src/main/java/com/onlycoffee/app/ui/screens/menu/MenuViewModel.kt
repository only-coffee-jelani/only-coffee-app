package com.onlycoffee.app.ui.screens.menu

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.MenuCategory
import com.onlycoffee.app.data.model.MenuItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MenuViewModel @Inject constructor(
    private val menuApiService: com.onlycoffee.app.data.api.MenuApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(MenuUiState())
    val uiState: StateFlow<MenuUiState> = _uiState.asStateFlow()

    private var allMenuItems: List<MenuItem> = emptyList()

    init {
        loadMenuItems()
    }

    private fun loadMenuItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = menuApiService.getAllMenuItems()
                allMenuItems = response.data
                filterItems()
                _uiState.value = _uiState.value.copy(isLoading = false)
            } catch (e: Exception) {
                // Fallback to sample data if API fails
                allMenuItems = MenuItem.sampleItems
                filterItems()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Using offline menu. ${e.message}"
                )
            }
        }
    }
    
    fun selectCategory(category: MenuCategory) {
        _uiState.value = _uiState.value.copy(
            selectedCategory = category
        )
        filterItems()
    }
    
    fun searchItems(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query
        )
        filterItems()
    }
    
    private fun filterItems() {
        val currentState = _uiState.value
        val filtered = allMenuItems.filter { item ->
            // Category filter
            val categoryMatch = currentState.selectedCategory == MenuCategory.ALL ||
                               item.category == currentState.selectedCategory

            // Search filter
            val searchMatch = currentState.searchQuery.isEmpty() ||
                             item.name.contains(currentState.searchQuery, ignoreCase = true) ||
                             item.description.contains(currentState.searchQuery, ignoreCase = true)

            categoryMatch && searchMatch
        }

        _uiState.value = currentState.copy(
            filteredItems = filtered
        )
    }
    
    // Removed addToCart functionality - customers must order through Orders tab by selecting a store first
}

data class MenuUiState(
    val isLoading: Boolean = true,
    val selectedCategory: MenuCategory = MenuCategory.ALL,
    val searchQuery: String = "",
    val filteredItems: List<MenuItem> = emptyList(),
    val error: String? = null
)
