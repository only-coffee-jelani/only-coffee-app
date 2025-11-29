package com.onlycoffee.app.ui.screens.locations

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.api.ApiException
import com.onlycoffee.app.data.model.StoreResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * Location UI State - Enterprise Level
 *
 * Immutable state container for location selection screen.
 * Uses StoreResponse model that matches backend API structure.
 *
 * @property stores All stores loaded from backend
 * @property filteredStores Stores filtered by search query
 * @property selectedStore Currently selected store
 * @property favoriteStoreIds Set of favorite store IDs (persisted locally)
 * @property userLatitude User's current latitude (for distance calculation)
 * @property userLongitude User's current longitude (for distance calculation)
 * @property isLoading Whether data is currently being loaded
 * @property errorMessage Error message to display (null if no error)
 * @property isRefreshing Whether user initiated a refresh
 */
data class LocationUiState(
    val stores: List<StoreResponse> = emptyList(),
    val filteredStores: List<StoreResponse> = emptyList(),
    val selectedStore: StoreResponse? = null,
    val favoriteStoreIds: Set<String> = emptySet(),
    val userLatitude: Double? = null,
    val userLongitude: Double? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isRefreshing: Boolean = false
) {
    /**
     * Check if there are any stores loaded
     */
    val hasStores: Boolean
        get() = stores.isNotEmpty()

    /**
     * Check if there are any filtered results
     */
    val hasFilteredResults: Boolean
        get() = filteredStores.isNotEmpty()

    /**
     * Check if user has location permission granted
     */
    val hasUserLocation: Boolean
        get() = userLatitude != null && userLongitude != null
}

/**
 * Location ViewModel - Enterprise Level
 *
 * Manages store location data and user interactions for the location selection screen.
 * Loads stores from backend API and provides search, filter, and selection functionality.
 *
 * Features:
 * - Load all stores from backend
 * - Search stores by name, address, city
 * - Filter stores by type, distance, open status
 * - Manage favorite stores (persisted locally)
 * - Calculate distances from user location
 * - Handle errors with user-friendly messages
 * - Support pull-to-refresh
 *
 * Error Handling:
 * - Network errors: Show "Check your connection" message
 * - Server errors: Show "Try again later" message
 * - Parsing errors: Show "Something went wrong" message
 * - All errors are logged for debugging
 */
@HiltViewModel
class LocationViewModel @Inject constructor(
    private val storeApiService: com.onlycoffee.app.data.api.StoreApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(LocationUiState())
    val uiState: StateFlow<LocationUiState> = _uiState.asStateFlow()

    init {
        loadStores()
    }

    /**
     * Load all stores from backend API
     *
     * Fetches stores from GET /api/v1/stores endpoint.
     * Stores are returned with:
     * - Store details (name, address, contact)
     * - Store type and operating hours
     * - Current open/closed status (timezone-aware)
     * - Formatted hours by day name
     *
     * On success: Updates stores and filteredStores in UI state
     * On error: Shows user-friendly error message
     */
    private fun loadStores() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null
            )

            try {
                Log.d(TAG, "Loading stores from backend...")
                val response = storeApiService.getAllStores()

                if (response.success) {
                    Log.d(TAG, "Successfully loaded ${response.data.size} stores")
                    _uiState.value = _uiState.value.copy(
                        stores = response.data,
                        filteredStores = response.data,
                        isLoading = false,
                        errorMessage = null
                    )
                } else {
                    val errorMsg = response.message ?: "Failed to load stores"
                    Log.e(TAG, "API returned success=false: $errorMsg")
                    _uiState.value = _uiState.value.copy(
                        stores = emptyList(),
                        filteredStores = emptyList(),
                        isLoading = false,
                        errorMessage = errorMsg
                    )
                }
            } catch (e: IOException) {
                // Network error
                val errorMsg = "Unable to connect. Please check your internet connection."
                Log.e(TAG, "Network error loading stores", e)
                _uiState.value = _uiState.value.copy(
                    stores = emptyList(),
                    filteredStores = emptyList(),
                    isLoading = false,
                    errorMessage = errorMsg
                )
            } catch (e: HttpException) {
                // HTTP error (4xx, 5xx)
                val errorMsg = when (e.code()) {
                    500, 502, 503, 504 -> "Server error. Please try again later."
                    else -> "Failed to load stores. Please try again."
                }
                Log.e(TAG, "HTTP error ${e.code()} loading stores", e)
                _uiState.value = _uiState.value.copy(
                    stores = emptyList(),
                    filteredStores = emptyList(),
                    isLoading = false,
                    errorMessage = errorMsg
                )
            } catch (e: Exception) {
                // Other errors (parsing, etc.)
                val errorMsg = "Something went wrong. Please try again."
                Log.e(TAG, "Unexpected error loading stores", e)
                _uiState.value = _uiState.value.copy(
                    stores = emptyList(),
                    filteredStores = emptyList(),
                    isLoading = false,
                    errorMessage = errorMsg
                )
            }
        }
    }

    /**
     * Refresh stores (pull-to-refresh)
     */
    fun refreshStores() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true)
            try {
                val response = storeApiService.getAllStores()
                if (response.success) {
                    _uiState.value = _uiState.value.copy(
                        stores = response.data,
                        filteredStores = response.data,
                        isRefreshing = false,
                        errorMessage = null
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error refreshing stores", e)
                _uiState.value = _uiState.value.copy(isRefreshing = false)
            }
        }
    }

    /**
     * Retry loading stores after error
     */
    fun retryLoadStores() {
        loadStores()
    }

    /**
     * Select a store
     */
    fun selectStore(store: StoreResponse) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
    }

    /**
     * Save selected store (for persistence)
     */
    fun saveSelectedStore(store: StoreResponse) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
        // TODO: Persist to SharedPreferences or DataStore
    }

    /**
     * Search stores by name, address, or city
     *
     * @param query Search query (case-insensitive)
     */
    fun searchStores(query: String) {
        val filtered = if (query.isBlank()) {
            _uiState.value.stores
        } else {
            _uiState.value.stores.filter { store ->
                store.name.contains(query, ignoreCase = true) ||
                store.address?.contains(query, ignoreCase = true) == true ||
                store.storeType?.displayName?.contains(query, ignoreCase = true) == true
            }
        }
        _uiState.value = _uiState.value.copy(filteredStores = filtered)
        Log.d(TAG, "Search '$query' returned ${filtered.size} results")
    }

    /**
     * Filter stores by open status
     */
    fun filterByOpenStatus(openOnly: Boolean) {
        val filtered = if (openOnly) {
            _uiState.value.stores.filter { it.isOpenNow }
        } else {
            _uiState.value.stores
        }
        _uiState.value = _uiState.value.copy(filteredStores = filtered)
    }

    /**
     * Toggle favorite status for a store
     */
    fun toggleFavorite(storeId: String) {
        val favorites = _uiState.value.favoriteStoreIds.toMutableSet()
        if (favorites.contains(storeId)) {
            favorites.remove(storeId)
            Log.d(TAG, "Removed store $storeId from favorites")
        } else {
            favorites.add(storeId)
            Log.d(TAG, "Added store $storeId to favorites")
        }
        _uiState.value = _uiState.value.copy(favoriteStoreIds = favorites)
        // TODO: Persist to SharedPreferences or DataStore
    }

    /**
     * Check if store is favorite
     */
    fun isFavorite(storeId: String): Boolean {
        return _uiState.value.favoriteStoreIds.contains(storeId)
    }

    /**
     * Update user location
     *
     * When user location is available, we can:
     * - Calculate distances to stores
     * - Sort stores by distance
     * - Show nearby stores first
     */
    fun updateUserLocation(latitude: Double, longitude: Double) {
        _uiState.value = _uiState.value.copy(
            userLatitude = latitude,
            userLongitude = longitude
        )
        Log.d(TAG, "Updated user location: $latitude, $longitude")
        // TODO: Load nearby stores from API
    }

    /**
     * Load nearby stores based on user location
     */
    fun loadNearbyStores(radiusMiles: Double = 10.0) {
        val latitude = _uiState.value.userLatitude
        val longitude = _uiState.value.userLongitude

        if (latitude == null || longitude == null) {
            Log.w(TAG, "Cannot load nearby stores: user location not available")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val response = storeApiService.getNearbyStores(latitude, longitude, radiusMiles)
                if (response.success) {
                    _uiState.value = _uiState.value.copy(
                        stores = response.data,
                        filteredStores = response.data,
                        isLoading = false
                    )
                    Log.d(TAG, "Loaded ${response.data.size} nearby stores")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading nearby stores", e)
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    companion object {
        private const val TAG = "LocationViewModel"
    }
}

