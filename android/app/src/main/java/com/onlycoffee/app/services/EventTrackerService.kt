package com.onlycoffee.app.services

import android.content.Context
import android.util.Log
import com.onlycoffee.app.managers.AuthenticationManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.ConcurrentLinkedQueue
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Service for tracking user events and analytics.
 * Batches events and sends them to the backend.
 */
@Singleton
class EventTrackerService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val authManager: AuthenticationManager
) {
    companion object {
        private const val TAG = "EventTrackerService"
        private const val MAX_BATCH_SIZE = 20
        private const val BATCH_INTERVAL_MS = 30000L // 30 seconds
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val eventQueue = ConcurrentLinkedQueue<Event>()

    /**
     * Track a screen view event
     */
    fun trackScreenView(screenName: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.SCREEN_VIEW,
            eventName = "screen_view",
            properties = properties + mapOf("screen_name" to screenName)
        )
    }

    /**
     * Track a button click event
     */
    fun trackButtonClick(buttonName: String, screenName: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.BUTTON_CLICK,
            eventName = "button_click",
            properties = properties + mapOf(
                "button_name" to buttonName,
                "screen_name" to screenName
            )
        )
    }

    /**
     * Track a purchase event
     */
    fun trackPurchase(
        orderId: String,
        amount: Double,
        currency: String = "USD",
        items: List<Map<String, Any>> = emptyList(),
        properties: Map<String, Any> = emptyMap()
    ) {
        trackEvent(
            eventType = EventType.PURCHASE,
            eventName = "purchase",
            properties = properties + mapOf(
                "order_id" to orderId,
                "amount" to amount,
                "currency" to currency,
                "items" to items
            )
        )
    }

    /**
     * Track an item view event
     */
    fun trackItemView(itemId: String, itemName: String, category: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.ITEM_VIEW,
            eventName = "item_view",
            properties = properties + mapOf(
                "item_id" to itemId,
                "item_name" to itemName,
                "category" to category
            )
        )
    }

    /**
     * Track an add to cart event
     */
    fun trackAddToCart(itemId: String, itemName: String, price: Double, quantity: Int, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.ADD_TO_CART,
            eventName = "add_to_cart",
            properties = properties + mapOf(
                "item_id" to itemId,
                "item_name" to itemName,
                "price" to price,
                "quantity" to quantity
            )
        )
    }

    /**
     * Track a search event
     */
    fun trackSearch(query: String, resultsCount: Int, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.SEARCH,
            eventName = "search",
            properties = properties + mapOf(
                "query" to query,
                "results_count" to resultsCount
            )
        )
    }

    /**
     * Track a login event
     */
    fun trackLogin(method: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.LOGIN,
            eventName = "login",
            properties = properties + mapOf("method" to method)
        )
    }

    /**
     * Track a signup event
     */
    fun trackSignup(method: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.SIGNUP,
            eventName = "signup",
            properties = properties + mapOf("method" to method)
        )
    }

    /**
     * Track a custom event
     */
    fun trackCustomEvent(eventName: String, properties: Map<String, Any> = emptyMap()) {
        trackEvent(
            eventType = EventType.CUSTOM,
            eventName = eventName,
            properties = properties
        )
    }

    /**
     * Internal method to track an event
     */
    private fun trackEvent(eventType: EventType, eventName: String, properties: Map<String, Any>) {
        val event = Event(
            type = eventType,
            name = eventName,
            properties = properties,
            timestamp = System.currentTimeMillis(),
            userId = authManager.currentUser.value?.id
        )

        eventQueue.offer(event)
        Log.d(TAG, "Event tracked: $eventName")

        // Send batch if queue is full
        if (eventQueue.size >= MAX_BATCH_SIZE) {
            sendBatch()
        }
    }

    /**
     * Send batched events to backend
     */
    private fun sendBatch() {
        scope.launch {
            val events = mutableListOf<Event>()
            repeat(MAX_BATCH_SIZE.coerceAtMost(eventQueue.size)) {
                eventQueue.poll()?.let { events.add(it) }
            }

            if (events.isNotEmpty()) {
                try {
                    // TODO: Send to backend API
                    Log.d(TAG, "Sending batch of ${events.size} events")
                    // For now, just log the events
                    events.forEach { event ->
                        Log.d(TAG, "Event: ${event.name}, Properties: ${event.properties}")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send events batch", e)
                    // Re-queue events on failure
                    events.forEach { eventQueue.offer(it) }
                }
            }
        }
    }

    /**
     * Flush all pending events
     */
    fun flush() {
        sendBatch()
    }
}

/**
 * Event types
 */
enum class EventType {
    SCREEN_VIEW,
    BUTTON_CLICK,
    PURCHASE,
    ITEM_VIEW,
    ADD_TO_CART,
    SEARCH,
    LOGIN,
    SIGNUP,
    CUSTOM
}

/**
 * Event data class
 */
data class Event(
    val type: EventType,
    val name: String,
    val properties: Map<String, Any>,
    val timestamp: Long,
    val userId: String?
)

