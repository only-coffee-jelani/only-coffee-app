package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.datetime.*
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

/**
 * Store Response Model - Enterprise Level
 * 
 * This model represents the store data structure returned from the backend API.
 * It matches the backend's Store entity structure exactly for seamless deserialization.
 * 
 * Backend API: GET /api/v1/stores
 * Response Format: { success: Boolean, data: List<StoreResponse>, count: Int }
 * 
 * @property storeId Unique identifier (UUID) from backend
 * @property name Store display name
 * @property storeTypeId Foreign key to store type
 * @property address Full street address (flat string)
 * @property city City name (required for all stores)
 * @property state State/Province (required for USA, optional for others)
 * @property zipCode ZIP/Postal code (required for USA, optional for others)
 * @property country Country name (required for all stores)
 * @property countryCode ISO 3166-1 alpha-2 country code (e.g., "US", "CA", "GB")
 * @property continent Continent name (North America, Europe, Asia, etc.)
 * @property latitude Geographic coordinate (string from PostgreSQL NUMERIC)
 * @property longitude Geographic coordinate (string from PostgreSQL NUMERIC)
 * @property phone Contact phone number
 * @property email Contact email address
 * @property toastLocationId Integration ID for Toast POS system
 * @property isActive Whether store is currently active
 * @property acceptingOrders Whether store is accepting orders
 * @property storeImageUrl URL to store image
 * @property description Store description
 * @property timezone IANA timezone identifier (e.g., "America/Chicago")
 * @property openedAt Date when store opened (nullable)
 * @property createdAt Record creation timestamp
 * @property updatedAt Record last update timestamp
 * @property storeType Store type details (relation)
 * @property storeHours Operating hours for each day (relation)
 * @property isOpen Computed field - whether store is currently open
 * @property formattedHours Computed field - formatted hours by day name
 * @property distance Distance from user location in miles (only for nearby endpoint)
 */
@Parcelize
@Serializable
data class StoreResponse(
    @SerialName("storeId")
    val storeId: String,
    
    val name: String,
    
    @SerialName("storeTypeId")
    val storeTypeId: String?,

    val address: String?,

    val city: String?,

    val state: String?,

    @SerialName("zipCode")
    val zipCode: String?,

    val country: String?,

    @SerialName("countryCode")
    val countryCode: String?,

    val continent: String?,

    val latitude: String?,

    val longitude: String?,
    
    val phone: String?,
    
    val email: String?,
    
    @SerialName("toastLocationId")
    val toastLocationId: String?,
    
    @SerialName("isActive")
    val isActive: Boolean = true,
    
    @SerialName("acceptingOrders")
    val acceptingOrders: Boolean = true,
    
    @SerialName("storeImageUrl")
    val storeImageUrl: String?,
    
    val description: String?,
    
    val timezone: String = "America/Chicago",
    
    @SerialName("openedAt")
    val openedAt: String?,
    
    @SerialName("createdAt")
    val createdAt: String,
    
    @SerialName("updatedAt")
    val updatedAt: String,
    
    @SerialName("storeType")
    val storeType: StoreTypeResponse?,
    
    @SerialName("storeHours")
    val storeHours: List<StoreHoursResponse>?,
    
    @SerialName("isOpen")
    val isOpen: Boolean = false,
    
    @SerialName("formattedHours")
    val formattedHours: Map<String, String>?,
    
    val distance: Double? = null
) : Parcelable {
    
    /**
     * Get latitude as Double for calculations
     * PostgreSQL NUMERIC type is returned as string
     */
    val latitudeDouble: Double?
        get() = latitude?.toDoubleOrNull()
    
    /**
     * Get longitude as Double for calculations
     * PostgreSQL NUMERIC type is returned as string
     */
    val longitudeDouble: Double?
        get() = longitude?.toDoubleOrNull()
    
    /**
     * Format distance for display
     */
    val formattedDistance: String
        get() = distance?.let { 
            when {
                it < 0.1 -> "< 0.1 mi"
                it < 10 -> String.format("%.1f mi", it)
                else -> "${it.roundToInt()} mi"
            }
        } ?: ""
    
    /**
     * Format phone number for display
     * Backend stores phone as digits only (e.g., "5044171010")
     */
    val formattedPhone: String
        get() = phone?.let {
            when (it.length) {
                10 -> "(${it.substring(0, 3)}) ${it.substring(3, 6)}-${it.substring(6)}"
                11 -> "+${it.substring(0, 1)} (${it.substring(1, 4)}) ${it.substring(4, 7)}-${it.substring(7)}"
                else -> it
            }
        } ?: ""

    /**
     * Check if store is currently open based on timezone-aware calculation
     * Uses the store's timezone, not the device's timezone
     */
    val isOpenNow: Boolean
        get() {
            if (storeHours.isNullOrEmpty()) return false

            return try {
                val storeTimeZone = TimeZone.of(timezone)
                val now = Clock.System.now().toLocalDateTime(storeTimeZone)
                val currentDayOfWeek = now.dayOfWeek.value % 7 // Convert to 0-6 (Sunday=0)

                storeHours.find { it.dayOfWeek == currentDayOfWeek }?.let { hours ->
                    hours.isOpenAt(now.time)
                } ?: false
            } catch (e: Exception) {
                // Fallback to backend's isOpen field if timezone calculation fails
                isOpen
            }
        }

    /**
     * Get today's operating hours formatted
     */
    val todaysHours: String
        get() {
            if (storeHours.isNullOrEmpty()) return "Hours not available"

            return try {
                val storeTimeZone = TimeZone.of(timezone)
                val now = Clock.System.now().toLocalDateTime(storeTimeZone)
                val currentDayOfWeek = now.dayOfWeek.value % 7

                storeHours.find { it.dayOfWeek == currentDayOfWeek }?.let { hours ->
                    "${hours.formattedOpenTime} - ${hours.formattedCloseTime}"
                } ?: "Closed"
            } catch (e: Exception) {
                "Hours not available"
            }
        }

    /**
     * Get today's operating hours in user's local timezone with timezone abbreviation
     * Example: "7:00 AM - 5:00 PM CST" (if user is in Central Time)
     * Example: "8:00 AM - 6:00 PM EST" (if user is in Eastern Time and store is in Central)
     */
    val todaysHoursInUserTimezone: String
        get() {
            if (storeHours.isNullOrEmpty()) return "Hours not available"

            return try {
                // Get store timezone
                val storeTimeZone = TimeZone.of(timezone)

                // Get user's local timezone
                val userTimeZone = TimeZone.currentSystemDefault()

                // Get current time in store timezone to determine which day's hours to show
                val now = Clock.System.now()
                val storeNow = now.toLocalDateTime(storeTimeZone)
                val currentDayOfWeek = storeNow.dayOfWeek.value % 7

                // Find today's hours for the store
                storeHours.find { it.dayOfWeek == currentDayOfWeek }?.let { hours ->
                    // Parse store times
                    val openParts = hours.openTime.split(":")
                    val closeParts = hours.closeTime.split(":")

                    // Create LocalDateTime for open and close times in store timezone
                    val storeOpenDateTime = LocalDateTime(
                        storeNow.year,
                        storeNow.month,
                        storeNow.dayOfMonth,
                        openParts[0].toInt(),
                        openParts[1].toInt(),
                        openParts.getOrNull(2)?.toInt() ?: 0
                    )

                    val storeCloseDateTime = LocalDateTime(
                        storeNow.year,
                        storeNow.month,
                        storeNow.dayOfMonth,
                        closeParts[0].toInt(),
                        closeParts[1].toInt(),
                        closeParts.getOrNull(2)?.toInt() ?: 0
                    )

                    // Convert to Instant and then to user's timezone
                    val openInstant = storeOpenDateTime.toInstant(storeTimeZone)
                    val closeInstant = storeCloseDateTime.toInstant(storeTimeZone)

                    val userOpenTime = openInstant.toLocalDateTime(userTimeZone)
                    val userCloseTime = closeInstant.toLocalDateTime(userTimeZone)

                    // Format times in user's timezone
                    val formattedOpenTime = formatTimeForDisplay(userOpenTime.time)
                    val formattedCloseTime = formatTimeForDisplay(userCloseTime.time)

                    // Get timezone abbreviation
                    val timezoneAbbr = getTimezoneAbbreviation(userTimeZone.id)

                    "$formattedOpenTime - $formattedCloseTime $timezoneAbbr"
                } ?: "Closed"
            } catch (e: Exception) {
                "Hours not available"
            }
        }

    /**
     * Format LocalTime for display (e.g., "7:00 AM", "5:30 PM")
     */
    private fun formatTimeForDisplay(time: LocalTime): String {
        val hour = time.hour
        val minute = time.minute
        val amPm = if (hour < 12) "AM" else "PM"
        val displayHour = when {
            hour == 0 -> 12
            hour > 12 -> hour - 12
            else -> hour
        }
        val displayMinute = if (minute == 0) "" else ":${minute.toString().padStart(2, '0')}"
        return "$displayHour$displayMinute $amPm"
    }

    /**
     * Get timezone abbreviation from IANA timezone ID
     * Examples: America/New_York -> EST/EDT, America/Chicago -> CST/CDT
     */
    private fun getTimezoneAbbreviation(timezoneId: String): String {
        return when {
            // US Timezones
            timezoneId.contains("New_York") || timezoneId.contains("Detroit") ||
            timezoneId.contains("Toronto") -> "EST"
            timezoneId.contains("Chicago") || timezoneId.contains("Mexico_City") -> "CST"
            timezoneId.contains("Denver") || timezoneId.contains("Phoenix") -> "MST"
            timezoneId.contains("Los_Angeles") || timezoneId.contains("Vancouver") -> "PST"
            timezoneId.contains("Anchorage") -> "AKST"
            timezoneId.contains("Honolulu") -> "HST"

            // International
            timezoneId.contains("London") -> "GMT"
            timezoneId.contains("Paris") || timezoneId.contains("Berlin") ||
            timezoneId.contains("Rome") -> "CET"
            timezoneId.contains("Tokyo") -> "JST"
            timezoneId.contains("Sydney") -> "AEDT"
            timezoneId.contains("Auckland") -> "NZDT"

            // Default: extract last part of timezone ID
            else -> timezoneId.split("/").lastOrNull()?.take(3)?.uppercase() ?: "UTC"
        }
    }

    /**
     * Get store status text for display
     */
    val statusText: String
        get() = when {
            !isActive -> "Temporarily Closed"
            !acceptingOrders -> "Not Accepting Orders"
            isOpenNow -> "Open Now"
            else -> "Closed"
        }

    /**
     * Get store type display name
     */
    val storeTypeDisplayName: String
        get() = storeType?.displayName ?: "Store"

    /**
     * Get formatted full address with city, state, zip, country
     * For USA: "123 Main St, New Orleans, Louisiana 70116"
     * For International: "123 Main St, London, United Kingdom"
     */
    val formattedFullAddress: String
        get() = buildString {
            // Add street address
            address?.let { append(it) }

            // Add city
            if (city != null) {
                if (isNotEmpty()) append(", ")
                append(city)
            }

            // For USA, add state and zip code
            if (countryCode == "US" && state != null) {
                if (isNotEmpty()) append(", ")
                append(state)
                if (zipCode != null) {
                    append(" ")
                    append(zipCode)
                }
            }

            // For non-USA, just add country
            if (countryCode != "US" && country != null) {
                if (isNotEmpty()) append(", ")
                append(country)
            }
        }

    /**
     * Get short location text (city, state/country)
     * For USA: "New Orleans, LA"
     * For International: "London, UK"
     */
    val shortLocation: String
        get() = buildString {
            city?.let { append(it) }

            if (countryCode == "US" && state != null) {
                if (isNotEmpty()) append(", ")
                // Try to get state abbreviation (first 2 letters uppercase)
                append(state.take(2).uppercase())
            } else if (countryCode != null) {
                if (isNotEmpty()) append(", ")
                append(countryCode)
            }
        }
}

/**
 * Store Type Response Model
 *
 * @property storeTypeId Unique identifier
 * @property code Store type code (coffee_shop, kiosk, food_truck, popup)
 * @property description Store type description
 * @property createdAt Record creation timestamp
 */
@Parcelize
@Serializable
data class StoreTypeResponse(
    @SerialName("storeTypeId")
    val storeTypeId: String,

    val code: String,

    val description: String?,

    @SerialName("createdAt")
    val createdAt: String
) : Parcelable {

    /**
     * Convert code to display name
     */
    val displayName: String
        get() = when (code) {
            "coffee_shop" -> "Coffee Shop"
            "kiosk" -> "Kiosk"
            "food_truck" -> "Food Truck"
            "popup" -> "Pop-up"
            else -> code.replace("_", " ").split(" ")
                .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
        }

    /**
     * Get icon emoji for store type
     */
    val icon: String
        get() = when (code) {
            "coffee_shop" -> "☕"
            "kiosk" -> "🏪"
            "food_truck" -> "🚚"
            "popup" -> "🎪"
            else -> "📍"
        }
}

/**
 * Store Hours Response Model
 *
 * @property storeHoursId Unique identifier
 * @property storeId Foreign key to store
 * @property dayOfWeek Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @property openTime Opening time in HH:mm:ss format
 * @property closeTime Closing time in HH:mm:ss format
 * @property createdAt Record creation timestamp
 */
@Parcelize
@Serializable
data class StoreHoursResponse(
    @SerialName("storeHoursId")
    val storeHoursId: String,

    @SerialName("storeId")
    val storeId: String,

    @SerialName("dayOfWeek")
    val dayOfWeek: Int, // 0=Sunday, 1=Monday, ..., 6=Saturday

    @SerialName("openTime")
    val openTime: String, // HH:mm:ss format

    @SerialName("closeTime")
    val closeTime: String, // HH:mm:ss format

    @SerialName("createdAt")
    val createdAt: String
) : Parcelable {

    /**
     * Get day name
     */
    val dayName: String
        get() = when (dayOfWeek) {
            0 -> "Sunday"
            1 -> "Monday"
            2 -> "Tuesday"
            3 -> "Wednesday"
            4 -> "Thursday"
            5 -> "Friday"
            6 -> "Saturday"
            else -> "Unknown"
        }

    /**
     * Format open time for display (e.g., "7:00 AM")
     */
    val formattedOpenTime: String
        get() = formatTime(openTime)

    /**
     * Format close time for display (e.g., "5:00 PM")
     */
    val formattedCloseTime: String
        get() = formatTime(closeTime)

    /**
     * Check if store is open at given time
     */
    fun isOpenAt(time: LocalTime): Boolean {
        val open = parseTime(openTime)
        val close = parseTime(closeTime)
        return time >= open && time <= close
    }

    private fun parseTime(timeString: String): LocalTime {
        val parts = timeString.split(":")
        return LocalTime(
            hour = parts[0].toInt(),
            minute = parts[1].toInt(),
            second = parts.getOrNull(2)?.toInt() ?: 0
        )
    }

    private fun formatTime(timeString: String): String {
        return try {
            val time = parseTime(timeString)
            val hour = time.hour
            val minute = time.minute
            val amPm = if (hour < 12) "AM" else "PM"
            val displayHour = when {
                hour == 0 -> 12
                hour > 12 -> hour - 12
                else -> hour
            }
            val displayMinute = if (minute == 0) "" else ":${minute.toString().padStart(2, '0')}"
            "$displayHour$displayMinute $amPm"
        } catch (e: Exception) {
            timeString
        }
    }
}

