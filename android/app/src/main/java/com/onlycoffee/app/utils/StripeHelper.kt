package com.onlycoffee.app.utils

import android.content.Context
import android.util.Log
import com.stripe.android.PaymentConfiguration
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Helper class for Stripe payment operations
 * Enterprise-level: Handles all Stripe configuration with proper logging
 */
@Singleton
class StripeHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "StripeHelper"
    }
    
    /**
     * Initialize Stripe with publishable key
     * Enterprise-level: Logs initialization for debugging
     */
    fun initializeStripe(publishableKey: String) {
        Log.d(TAG, "Initializing Stripe with publishable key: ${publishableKey.take(20)}...")
        PaymentConfiguration.init(context, publishableKey)
        Log.d(TAG, "Stripe initialized successfully")
    }

    /**
     * Create PaymentSheet configuration
     * Enterprise-level: Enables Google Pay for faster checkout with comprehensive logging
     */
    fun createPaymentSheetConfiguration(
        merchantDisplayName: String = "Only Coffee",
        merchantCountryCode: String = "US"
    ): PaymentSheet.Configuration {
        Log.d(TAG, "Creating PaymentSheet configuration")
        Log.d(TAG, "  - Merchant: $merchantDisplayName")
        Log.d(TAG, "  - Country: $merchantCountryCode")
        Log.d(TAG, "  - Google Pay: ENABLED (Test environment)")

        val configuration = PaymentSheet.Configuration(
            merchantDisplayName = merchantDisplayName,
            allowsDelayedPaymentMethods = false,
            googlePay = PaymentSheet.GooglePayConfiguration(
                environment = PaymentSheet.GooglePayConfiguration.Environment.Test,
                countryCode = merchantCountryCode,
                currencyCode = "USD"
            )
        )

        Log.d(TAG, "PaymentSheet configuration created successfully")
        Log.i(TAG, "NOTE: Google Pay will only appear if:")
        Log.i(TAG, "  1. Google Play Services is installed")
        Log.i(TAG, "  2. User has Google Pay set up with at least one card")
        Log.i(TAG, "  3. Device location supports Google Pay")

        return configuration
    }
    
    /**
     * Handle payment sheet result
     */
    fun handlePaymentResult(
        result: PaymentSheetResult,
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
        onCanceled: () -> Unit
    ) {
        when (result) {
            is PaymentSheetResult.Completed -> {
                onSuccess()
            }
            is PaymentSheetResult.Canceled -> {
                onCanceled()
            }
            is PaymentSheetResult.Failed -> {
                val errorMessage = result.error.localizedMessage 
                    ?: "Payment failed. Please try again."
                onError(errorMessage)
            }
        }
    }
}

