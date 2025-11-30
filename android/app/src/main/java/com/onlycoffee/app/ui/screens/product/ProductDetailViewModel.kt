package com.onlycoffee.app.ui.screens.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.repository.MenuRepository
import com.onlycoffee.app.utils.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    private val menuRepository: MenuRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProductDetailUiState())
    val uiState: StateFlow<ProductDetailUiState> = _uiState.asStateFlow()

    fun loadMenuItem(menuItemId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            when (val result = menuRepository.getMenuItemById(menuItemId)) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        menuItem = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.exception.message ?: "Failed to load menu item"
                    )
                }
                is NetworkResult.Loading -> {
                    _uiState.value = _uiState.value.copy(isLoading = true)
                }
            }
        }
    }

    fun setStoreId(storeId: String) {
        _uiState.value = _uiState.value.copy(selectedStoreId = storeId)
    }
}

data class ProductDetailUiState(
    val menuItem: MenuItem? = null,
    val selectedStoreId: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

