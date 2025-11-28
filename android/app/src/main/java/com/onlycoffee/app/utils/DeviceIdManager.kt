package com.onlycoffee.app.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.util.UUID

/**
 * Manages a persistent unique device ID for analytics tracking.
 * The device ID is generated once and stored in SharedPreferences.
 */
object DeviceIdManager {
    private const val PREFS_NAME = "only_coffee_prefs"
    private const val KEY_DEVICE_ID = "device_id"
    
    private var deviceId: String? = null
    
    /**
     * Get or generate the unique device ID.
     * The ID is generated once and persists across app restarts.
     */
    fun getDeviceId(context: Context): String {
        // Return cached value if available
        deviceId?.let {
            Log.d("DeviceIdManager", "Returning cached device ID: $it")
            return it
        }

        // Get SharedPreferences
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Check if device ID already exists
        val existingId = prefs.getString(KEY_DEVICE_ID, null)
        if (existingId != null) {
            deviceId = existingId
            Log.d("DeviceIdManager", "Loaded existing device ID from prefs: $existingId")
            return existingId
        }

        // Generate new device ID
        val newId = UUID.randomUUID().toString()
        Log.d("DeviceIdManager", "Generated NEW device ID: $newId")

        // Save to SharedPreferences
        prefs.edit().putString(KEY_DEVICE_ID, newId).apply()

        // Cache and return
        deviceId = newId
        return newId
    }
    
    /**
     * Clear the device ID (for testing purposes only).
     */
    fun clearDeviceId(context: Context) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_DEVICE_ID).apply()
        deviceId = null
    }
}

