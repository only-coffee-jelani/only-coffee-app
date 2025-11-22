package com.onlycoffee.app.ui.screens.locations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.Store
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LocationUiState(
    val stores: List<Store> = emptyList(),
    val filteredStores: List<Store> = emptyList(),
    val selectedStore: Store? = null,
    val favoriteStoreIds: Set<String> = emptySet(),
    val userLatitude: Double? = null,
    val userLongitude: Double? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class LocationViewModel @Inject constructor(
    private val storeApiService: com.onlycoffee.app.data.api.StoreApiService
) : ViewModel() {
    private val _uiState = MutableStateFlow(LocationUiState())
    val uiState: StateFlow<LocationUiState> = _uiState.asStateFlow()

    init {
        loadStores()
    }

    private fun loadStores() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val response = storeApiService.getAllStores()
                _uiState.value = _uiState.value.copy(
                    stores = response.data,
                    filteredStores = response.data,
                    isLoading = false
                )
            } catch (e: Exception) {
                // Fallback to sample data if API fails
                _uiState.value = _uiState.value.copy(
                    stores = Store.sampleStores,
                    filteredStores = Store.sampleStores,
                    isLoading = false,
                    errorMessage = "Using offline stores. ${e.message}"
                )
            }
        }
    }

    fun selectStore(store: Store) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
    }

    fun saveSelectedStore(store: Store) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
    }

    fun searchStores(query: String) {
        val filtered = if (query.isBlank()) {
            _uiState.value.stores
        } else {
            _uiState.value.stores.filter {
                it.name.contains(query, ignoreCase = true) ||
                it.address.street.contains(query, ignoreCase = true) ||
                it.address.city.contains(query, ignoreCase = true)
            }
        }
        _uiState.value = _uiState.value.copy(filteredStores = filtered)
    }

    fun toggleFavorite(storeId: String) {
        val favorites = _uiState.value.favoriteStoreIds.toMutableSet()
        if (favorites.contains(storeId)) {
            favorites.remove(storeId)
        } else {
            favorites.add(storeId)
        }
        _uiState.value = _uiState.value.copy(favoriteStoreIds = favorites)
    }

    fun isFavorite(storeId: String): Boolean {
        return _uiState.value.favoriteStoreIds.contains(storeId)
    }

    fun updateUserLocation(latitude: Double, longitude: Double) {
        _uiState.value = _uiState.value.copy(
            userLatitude = latitude,
            userLongitude = longitude
        )
    }
}

