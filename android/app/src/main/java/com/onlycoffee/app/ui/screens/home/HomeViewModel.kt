package com.onlycoffee.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.Store
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    // TODO: Inject repositories when backend is ready
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        loadHomeData()
    }
    
    private fun loadHomeData() {
        viewModelScope.launch {
            // TODO: Replace with actual API calls
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                userName = "Coffee Lover",
                loyaltyPoints = 1250,
                nearbyStores = Store.sampleStores,
                featuredItems = MenuItem.sampleItems.filter { it.isFeatured }
            )
        }
    }
    
    fun addToCart(menuItem: MenuItem) {
        viewModelScope.launch {
            // TODO: Implement cart functionality
            // For now, just show a success message or navigate to customization
        }
    }
    
    fun refreshData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            loadHomeData()
        }
    }
}

data class HomeUiState(
    val isLoading: Boolean = true,
    val userName: String = "",
    val loyaltyPoints: Int = 0,
    val nearbyStores: List<Store> = emptyList(),
    val featuredItems: List<MenuItem> = emptyList(),
    val error: String? = null
)
