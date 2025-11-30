package com.onlycoffee.app.data.service

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.OrderItem
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Enterprise-level Cart Service
 * Handles all cart operations with persistence, validation, and business logic
 */
@Singleton
class CartService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    private val _cartItems = MutableStateFlow<List<OrderItem>>(emptyList())
    val cartItems: StateFlow<List<OrderItem>> = _cartItems.asStateFlow()
    
    private val _currentStoreId = MutableStateFlow<String?>(null)
    val currentStoreId: StateFlow<String?> = _currentStoreId.asStateFlow()
    
    companion object {
        private const val PREFS_NAME = "only_coffee_cart"
        private const val KEY_CART_ITEMS = "cart_items"
        private const val KEY_STORE_ID = "store_id"
        private const val TAX_RATE = 0.08 // 8% tax rate
    }
    
    init {
        loadCartFromStorage()
    }
    
    /**
     * Add item to cart with full customization support
     */
    fun addItem(
        menuItem: MenuItem,
        quantity: Int = 1,
        espressoShotCount: Int = 0,
        selectedMilkOption: String? = null,
        extraMilkShot: Boolean = false,
        customizations: List<String>? = null
    ): Result<Unit> {
        // Validate item availability
        if (!menuItem.isAvailable) {
            return Result.failure(Exception("This item is currently unavailable"))
        }
        
        val currentItems = _cartItems.value.toMutableList()
        
        // Check if identical item already exists
        val existingItemIndex = currentItems.indexOfFirst { item ->
            item.menuItemId == menuItem.id &&
            item.espressoShotCount == espressoShotCount &&
            item.selectedMilkOption == selectedMilkOption &&
            item.extraMilkShot == extraMilkShot &&
            item.customizations == customizations
        }
        
        if (existingItemIndex != -1) {
            // Update quantity of existing item
            val existingItem = currentItems[existingItemIndex]
            currentItems[existingItemIndex] = existingItem.copy(
                quantity = existingItem.quantity + quantity
            )
        } else {
            // Add new item
            val newItem = OrderItem(
                menuItemId = menuItem.id,
                name = menuItem.name,
                price = menuItem.basePrice,
                quantity = quantity,
                customizations = customizations,
                espressoShotCount = espressoShotCount,
                selectedMilkOption = selectedMilkOption,
                extraMilkShot = extraMilkShot
            )
            currentItems.add(newItem)
        }
        
        _cartItems.value = currentItems
        saveCartToStorage()
        
        return Result.success(Unit)
    }
    
    /**
     * Remove item from cart
     */
    fun removeItem(item: OrderItem) {
        _cartItems.value = _cartItems.value.filter { it != item }
        saveCartToStorage()
    }
    
    /**
     * Update item quantity
     */
    fun updateItemQuantity(item: OrderItem, newQuantity: Int) {
        if (newQuantity <= 0) {
            removeItem(item)
            return
        }
        
        _cartItems.value = _cartItems.value.map {
            if (it == item) it.copy(quantity = newQuantity) else it
        }
        saveCartToStorage()
    }
    
    /**
     * Update item customizations
     */
    fun updateItem(
        oldItem: OrderItem,
        espressoShotCount: Int,
        selectedMilkOption: String?,
        extraMilkShot: Boolean,
        quantity: Int
    ) {
        _cartItems.value = _cartItems.value.map {
            if (it == oldItem) {
                it.copy(
                    espressoShotCount = espressoShotCount,
                    selectedMilkOption = selectedMilkOption,
                    extraMilkShot = extraMilkShot,
                    quantity = quantity
                )
            } else {
                it
            }
        }
        saveCartToStorage()
    }
    
    /**
     * Clear entire cart
     */
    fun clearCart() {
        _cartItems.value = emptyList()
        _currentStoreId.value = null
        saveCartToStorage()
    }

    /**
     * Set current store ID
     * Returns true if cart was cleared due to store change
     */
    fun setStoreId(storeId: String): Boolean {
        val currentStore = _currentStoreId.value

        // If cart has items and store is different, need to clear cart
        if (currentStore != null && currentStore != storeId && _cartItems.value.isNotEmpty()) {
            return false // Caller should show confirmation dialog
        }

        _currentStoreId.value = storeId
        prefs.edit().putString(KEY_STORE_ID, storeId).apply()
        return true
    }

    /**
     * Confirm store change and clear cart
     */
    fun confirmStoreChangeAndClearCart(newStoreId: String) {
        clearCart()
        _currentStoreId.value = newStoreId
        prefs.edit().putString(KEY_STORE_ID, newStoreId).apply()
    }

    /**
     * Get cart item count
     */
    fun getItemCount(): Int {
        return _cartItems.value.sumOf { it.quantity }
    }

    /**
     * Calculate subtotal
     */
    fun getSubtotal(): Double {
        return _cartItems.value.sumOf { it.totalPrice }
    }

    /**
     * Calculate tax
     */
    fun getTax(): Double {
        return getSubtotal() * TAX_RATE
    }

    /**
     * Calculate total
     */
    fun getTotal(): Double {
        return getSubtotal() + getTax()
    }

    /**
     * Check if cart is empty
     */
    fun isEmpty(): Boolean {
        return _cartItems.value.isEmpty()
    }

    /**
     * Validate cart before checkout
     */
    fun validateCart(): Result<Unit> {
        if (_cartItems.value.isEmpty()) {
            return Result.failure(Exception("Cart is empty"))
        }

        if (_currentStoreId.value == null) {
            return Result.failure(Exception("No store selected"))
        }

        return Result.success(Unit)
    }

    /**
     * Save cart to persistent storage
     */
    private fun saveCartToStorage() {
        val json = gson.toJson(_cartItems.value)
        prefs.edit().putString(KEY_CART_ITEMS, json).apply()
    }

    /**
     * Load cart from persistent storage
     */
    private fun loadCartFromStorage() {
        val json = prefs.getString(KEY_CART_ITEMS, null)
        if (json != null) {
            try {
                val type = object : TypeToken<List<OrderItem>>() {}.type
                _cartItems.value = gson.fromJson(json, type) ?: emptyList()
            } catch (e: Exception) {
                _cartItems.value = emptyList()
            }
        }

        _currentStoreId.value = prefs.getString(KEY_STORE_ID, null)
    }
}

