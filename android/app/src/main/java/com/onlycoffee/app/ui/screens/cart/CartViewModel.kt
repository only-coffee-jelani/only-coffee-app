package com.onlycoffee.app.ui.screens.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onlycoffee.app.data.model.*
import com.onlycoffee.app.data.repository.CouponsRepository
import com.onlycoffee.app.data.repository.OrderRepository
import com.onlycoffee.app.data.repository.PaymentRepository
import com.onlycoffee.app.data.service.CartService
import com.onlycoffee.app.utils.NetworkResult
import com.onlycoffee.app.utils.StripeHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartService: CartService,
    private val couponsRepository: CouponsRepository,
    private val orderRepository: OrderRepository,
    private val paymentRepository: PaymentRepository,
    private val stripeHelper: StripeHelper,
    private val authenticationManager: com.onlycoffee.app.managers.AuthenticationManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CartUiState())
    val uiState: StateFlow<CartUiState> = _uiState.asStateFlow()

    private val _paymentState = MutableStateFlow<PaymentState>(PaymentState.Idle)
    val paymentState: StateFlow<PaymentState> = _paymentState.asStateFlow()

    // Tax rate (8% for simplicity)
    private val TAX_RATE = 0.08

    init {
        // Observe cart changes from service
        viewModelScope.launch {
            combine(
                cartService.cartItems,
                cartService.currentStoreId
            ) { items, storeId ->
                Pair(items, storeId)
            }.collect { (items, storeId) ->
                _uiState.update { currentState ->
                    currentState.copy(
                        items = items,
                        currentStoreId = storeId
                    ).let { recalculateTotals(it) }
                }
            }
        }
    }

    /**
     * Add item to cart with full customization support
     * Enterprise-level: Accepts optional store ID to ensure checkout works
     */
    fun addItem(
        menuItem: MenuItem,
        quantity: Int = 1,
        espressoShotCount: Int = 0,
        selectedMilkOption: String? = null,
        extraMilkShot: Boolean = false,
        customizations: List<String>? = null,
        storeId: String? = null
    ) {
        cartService.addItem(
            menuItem = menuItem,
            quantity = quantity,
            espressoShotCount = espressoShotCount,
            selectedMilkOption = selectedMilkOption,
            extraMilkShot = extraMilkShot,
            customizations = customizations,
            storeId = storeId
        )
    }

    /**
     * Remove item from cart
     */
    fun removeItem(item: OrderItem) {
        cartService.removeItem(item)
    }

    /**
     * Update item quantity
     */
    fun updateItemQuantity(item: OrderItem, quantity: Int) {
        cartService.updateItemQuantity(item, quantity)
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
        cartService.updateItem(
            oldItem = oldItem,
            espressoShotCount = espressoShotCount,
            selectedMilkOption = selectedMilkOption,
            extraMilkShot = extraMilkShot,
            quantity = quantity
        )
    }

    /**
     * Apply a coupon to the order
     */
    fun applyCoupon(coupon: Coupon) {
        _uiState.update { currentState ->
            currentState.copy(
                selectedCoupon = coupon
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Remove applied coupon
     */
    fun removeCoupon() {
        _uiState.update { currentState ->
            currentState.copy(
                selectedCoupon = null,
                discountAmount = 0.0
            ).also { recalculateTotals(it) }
        }
    }

    /**
     * Get authentication manager for UI components
     * Enterprise-level: Exposes authentication manager for phone auth dialog
     */
    fun getAuthenticationManager() = authenticationManager

    /**
     * Get StripeHelper instance for Payment Sheet configuration
     * Enterprise-level: Exposes StripeHelper to UI layer for Google Pay configuration
     */
    fun getStripeHelper() = stripeHelper

    /**
     * Clear the entire cart
     */
    fun clearCart() {
        cartService.clearCart()
    }

    /**
     * Set store ID with validation
     * Returns false if confirmation is needed
     */
    fun setStoreId(storeId: String): Boolean {
        return cartService.setStoreId(storeId)
    }

    /**
     * Confirm store change and clear cart
     */
    fun confirmStoreChangeAndClearCart(newStoreId: String) {
        cartService.confirmStoreChangeAndClearCart(newStoreId)
    }

    /**
     * Recalculate totals including discount and tax
     */
    private fun recalculateTotals(state: CartUiState): CartUiState {
        val subtotal = state.items.sumOf { it.totalPrice }
        val discountAmount = calculateDiscount(state.selectedCoupon, state.items, subtotal)
        val taxableAmount = (subtotal - discountAmount).coerceAtLeast(0.0)
        val tax = taxableAmount * TAX_RATE
        val total = taxableAmount + tax

        return state.copy(
            subtotal = subtotal,
            discountAmount = discountAmount,
            tax = tax,
            total = total
        ).also { newState ->
            _uiState.value = newState
        }
    }

    /**
     * Calculate discount based on coupon type
     */
    private fun calculateDiscount(coupon: Coupon?, items: List<OrderItem>, subtotal: Double): Double {
        if (coupon == null || !coupon.isActive) return 0.0

        // Get eligible items based on include/exclude rules
        val eligibleItems = getEligibleItems(items, coupon.eligibleItems)
        if (eligibleItems.isEmpty()) return 0.0

        val eligibleSubtotal = eligibleItems.sumOf { it.totalPrice }

        val discount = when (coupon.type) {
            CouponType.PERCENT_OFF -> {
                val percentOff = coupon.percentOff ?: 0
                eligibleSubtotal * (percentOff / 100.0)
            }

            CouponType.FIXED_AMOUNT -> {
                val amountCents = coupon.valueCents ?: 0
                (amountCents / 100.0).coerceAtMost(eligibleSubtotal)
            }

            CouponType.FIXED_PRICE -> {
                val priceCents = coupon.priceOverrideCents ?: 0
                val targetPrice = priceCents / 100.0
                (eligibleSubtotal - targetPrice).coerceAtLeast(0.0)
            }

            CouponType.FREE_ITEM -> {
                // Free item = 100% off eligible items
                eligibleSubtotal
            }
        }

        // Ensure discount doesn't exceed subtotal
        return discount.coerceAtMost(subtotal)
    }

    /**
     * Filter items based on eligibility rules
     */
    private fun getEligibleItems(
        items: List<OrderItem>,
        eligibility: Coupon.EligibleItems?
    ): List<OrderItem> {
        if (eligibility == null) return items

        return items.filter { item ->
            val isIncluded = eligibility.include?.contains(item.menuItemId) != false
            val isExcluded = eligibility.exclude?.contains(item.menuItemId) == true
            isIncluded && !isExcluded
        }
    }

    /**
     * Create order and initiate payment flow
     * Enterprise-level: Checks authentication before proceeding
     */
    fun placeOrder(storeId: String, specialInstructions: String? = null) {
        viewModelScope.launch {
            try {
                // Guest checkout is now supported - no authentication required
                android.util.Log.i("CartViewModel", "Creating order (guest checkout enabled)")

                _paymentState.value = PaymentState.CreatingOrder

                // Create order request
                val orderRequest = createOrderRequest(storeId, specialInstructions)

                // Create order on backend
                val orderResult = orderRepository.createOrder(orderRequest)

                when (orderResult) {
                    is NetworkResult.Success -> {
                        val order = orderResult.data

                        // Calculate amount in cents
                        val amountInCents = (order.total * 100).toInt()

                        // Create payment intent
                        _paymentState.value = PaymentState.CreatingPaymentIntent

                        val paymentResult = paymentRepository.createPaymentIntent(
                            orderId = order.id,
                            amount = amountInCents,
                            description = "Only Coffee Order"
                        )

                        paymentResult.onSuccess { paymentData ->
                            // Initialize Stripe with publishable key
                            paymentData.publishableKey?.let { key ->
                                stripeHelper.initializeStripe(key)
                            }

                            _paymentState.value = PaymentState.PaymentSheetReady(
                                clientSecret = paymentData.clientSecret,
                                paymentIntentId = paymentData.paymentIntentId,
                                orderId = order.id
                            )
                        }.onFailure { error ->
                            _paymentState.value = PaymentState.Error(
                                error.message ?: "Failed to create payment intent"
                            )
                        }
                    }
                    is NetworkResult.Error -> {
                        _paymentState.value = PaymentState.Error(
                            orderResult.exception.message ?: "Failed to create order"
                        )
                    }
                    is NetworkResult.Loading -> {
                        // Should not happen in this flow
                    }
                }
            } catch (e: Exception) {
                _paymentState.value = PaymentState.Error(
                    e.message ?: "An unexpected error occurred"
                )
            }
        }
    }

    /**
     * Confirm payment after successful Stripe payment
     */
    fun confirmPayment(paymentIntentId: String, orderId: String) {
        viewModelScope.launch {
            try {
                _paymentState.value = PaymentState.ConfirmingPayment

                val result = paymentRepository.confirmPayment(
                    paymentIntentId = paymentIntentId,
                    orderId = orderId
                )

                result.onSuccess { confirmData ->
                    _paymentState.value = PaymentState.Success(
                        orderId = confirmData.orderId,
                        order = confirmData.order
                    )

                    // Clear cart after successful payment
                    cartService.clearCart()
                }.onFailure { error ->
                    _paymentState.value = PaymentState.Error(
                        error.message ?: "Failed to confirm payment"
                    )
                }
            } catch (e: Exception) {
                _paymentState.value = PaymentState.Error(
                    e.message ?: "An unexpected error occurred"
                )
            }
        }
    }

    /**
     * Handle payment cancellation
     */
    fun onPaymentCanceled() {
        _paymentState.value = PaymentState.Canceled
    }

    /**
     * Reset payment state
     */
    fun resetPaymentState() {
        _paymentState.value = PaymentState.Idle
    }

    /**
     * Retry payment after error
     */
    fun retryPayment() {
        val currentState = _paymentState.value
        if (currentState is PaymentState.Error) {
            // Get the last order details from state if available
            val storeId = _uiState.value.currentStoreId
            if (storeId != null) {
                placeOrder(storeId)
            } else {
                _paymentState.value = PaymentState.Error("Store information not available. Please try again.")
            }
        }
    }

    /**
     * Create order request from current cart state
     * Enterprise-level: Builds request matching backend DTO exactly
     */
    fun createOrderRequest(storeId: String, specialInstructions: String? = null): CreateOrderRequest {
        val currentState = _uiState.value

        return CreateOrderRequest(
            storeId = storeId,
            items = currentState.items.map { item ->
                CreateOrderItem(
                    menuItemId = item.menuItemId,
                    itemName = item.name,  // Required: Item name
                    quantity = item.quantity,
                    basePrice = item.price,  // Required: Base price per item
                    modifiersPrice = null,  // TODO: Calculate modifiers price if customizations exist
                    totalPrice = item.price * item.quantity,  // Required: Total price
                    modifiers = null,  // TODO: Map customizations to modifiers if needed
                    specialInstructions = null  // Item-specific instructions (if needed)
                )
            },
            orderType = "PICKUP",  // Default to pickup
            pickupTime = "ASAP",  // Required: Default to ASAP
            specialInstructions = specialInstructions,
            couponId = currentState.selectedCoupon?.id
        )
    }

    /**
     * Load available coupons for selection
     */
    fun loadAvailableCoupons() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingCoupons = true, couponsError = null) }

            couponsRepository.getMyCoupons()
                .onSuccess { couponsData ->
                    _uiState.update {
                        it.copy(
                            availableCoupons = couponsData.active,
                            isLoadingCoupons = false
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoadingCoupons = false,
                            couponsError = error.message ?: "Failed to load coupons"
                        )
                    }
                }
        }
    }

    /**
     * Calculate estimated discount for a coupon preview
     */
    fun getEstimatedDiscount(coupon: Coupon): String {
        val currentState = _uiState.value
        val discount = calculateDiscount(coupon, currentState.items, currentState.subtotal)
        return String.format("-$%.2f", discount)
    }
}

data class CartUiState(
    val items: List<OrderItem> = emptyList(),
    val subtotal: Double = 0.0,
    val discountAmount: Double = 0.0,
    val tax: Double = 0.0,
    val total: Double = 0.0,
    val selectedCoupon: Coupon? = null,
    val availableCoupons: List<Coupon> = emptyList(),
    val isLoadingCoupons: Boolean = false,
    val couponsError: String? = null,
    val currentStoreId: String? = null
) {
    val itemCount: Int
        get() = items.sumOf { it.quantity }

    val isEmpty: Boolean
        get() = items.isEmpty()

    val hasDiscount: Boolean
        get() = discountAmount > 0.0
}

/**
 * Payment state for tracking payment flow
 * Enterprise-level: Includes authentication state
 */
sealed class PaymentState {
    object Idle : PaymentState()
    object AuthenticationRequired : PaymentState()
    object CreatingOrder : PaymentState()
    object CreatingPaymentIntent : PaymentState()
    data class PaymentSheetReady(
        val clientSecret: String,
        val paymentIntentId: String,
        val orderId: String
    ) : PaymentState()
    object ConfirmingPayment : PaymentState()
    data class Success(
        val orderId: String,
        val order: Order?
    ) : PaymentState()
    data class Error(val message: String) : PaymentState()
    object Canceled : PaymentState()
}
