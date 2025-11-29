package com.onlycoffee.app.ui.screens.stores

import androidx.lifecycle.ViewModel
import com.onlycoffee.app.data.model.StoreResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

/**
 * Store ViewModel
 *
 * Manages store selection state across the app.
 * Uses StoreResponse model from backend API.
 *
 * @property uiState Current UI state with selected store
 */
data class StoreUiState(
    val selectedStore: StoreResponse? = null
)

@HiltViewModel
class StoreViewModel @Inject constructor() : ViewModel() {
    private val _uiState = MutableStateFlow(StoreUiState())
    val uiState: StateFlow<StoreUiState> = _uiState.asStateFlow()

    /**
     * Select a store
     *
     * @param store Store to select
     */
    fun selectStore(store: StoreResponse) {
        _uiState.value = _uiState.value.copy(selectedStore = store)
    }
}

