package com.onlycoffee.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OnlyCoffeeApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // Order updates channel
            val orderChannel = NotificationChannel(
                CHANNEL_ORDER_UPDATES,
                "Order Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications about your order status"
                enableVibration(true)
                setShowBadge(true)
            }
            
            // Promotions channel
            val promoChannel = NotificationChannel(
                CHANNEL_PROMOTIONS,
                "Promotions & Offers",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Special offers and promotions"
                enableVibration(false)
                setShowBadge(false)
            }
            
            // Rewards channel
            val rewardsChannel = NotificationChannel(
                CHANNEL_REWARDS,
                "Rewards & Loyalty",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Loyalty points and rewards updates"
                enableVibration(false)
                setShowBadge(true)
            }
            
            notificationManager.createNotificationChannels(
                listOf(orderChannel, promoChannel, rewardsChannel)
            )
        }
    }
    
    companion object {
        const val CHANNEL_ORDER_UPDATES = "order_updates"
        const val CHANNEL_PROMOTIONS = "promotions"
        const val CHANNEL_REWARDS = "rewards"
    }
}
