package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.math.roundToInt

@Parcelize
@Serializable
data class Store(
    val id: String,
    val name: String,
    val address: Address,
    val phoneNumber: String,
    val storeType: StoreType,
    val operatingHours: List<OperatingHours>,
    val amenities: List<StoreAmenity>,
    val isOpen: Boolean,
    val estimatedWaitTime: Int, // minutes
    val distance: Double? = null, // miles
    val rating: Double = 4.5,
    val reviewCount: Int = 0,
    val imageUrl: String? = null,
    val timezone: String = "America/Chicago" // IANA timezone identifier
) : Parcelable {
    
    val formattedDistance: String
        get() = distance?.let { "${String.format("%.1f", it)} mi" } ?: ""
    
    val formattedWaitTime: String
        get() = "${estimatedWaitTime}-${estimatedWaitTime + 5} min"
    
    val formattedRating: String
        get() = String.format("%.1f", rating)
    
    val isOpenNow: Boolean
        get() {
            return try {
                // Use the STORE'S timezone, not the device's timezone
                val storeTimeZone = TimeZone.of(timezone)
                val now = Clock.System.now().toLocalDateTime(storeTimeZone)
                val currentDay = now.dayOfWeek
                val currentTime = now.time

                operatingHours.find { it.dayOfWeek == currentDay }?.let { hours ->
                    currentTime >= hours.openTime && currentTime <= hours.closeTime
                } ?: false
            } catch (e: Exception) {
                // If timezone is invalid, fall back to device timezone
                val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
                val currentDay = now.dayOfWeek
                val currentTime = now.time

                operatingHours.find { it.dayOfWeek == currentDay }?.let { hours ->
                    currentTime >= hours.openTime && currentTime <= hours.closeTime
                } ?: false
            }
        }
    
    companion object {
        val sampleStores = listOf(
            // ACTUAL ONLY COFFEE LOCATIONS
            Store(
                id = "french-quarter-nola",
                name = "Only Coffee - French Quarter",
                address = Address(
                    street = "636 St Ann",
                    city = "New Orleans",
                    state = "LA",
                    zipCode = "70116",
                    latitude = 29.9584,
                    longitude = -90.0644
                ),
                phoneNumber = "(504) 417-1010",
                storeType = StoreType.STORE,
                operatingHours = OperatingHours.defaultHours(),
                amenities = listOf(
                    StoreAmenity.WIFI,
                    StoreAmenity.SEATING,
                    StoreAmenity.RESTROOM,
                    StoreAmenity.OUTDOOR_SEATING,
                    StoreAmenity.LIVE_MUSIC
                ),
                isOpen = true,
                estimatedWaitTime = 8,
                distance = 0.3,
                rating = 4.8,
                reviewCount = 247,
                imageUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
                timezone = "America/Chicago" // New Orleans is in Central Time
            ),
            Store(
                id = "houston-galleria",
                name = "Only Coffee - Houston Galleria",
                address = Address(
                    street = "5085 Westheimer Rd (Galleria Mall Food Court)",
                    city = "Houston",
                    state = "TX",
                    zipCode = "77056",
                    latitude = 29.7372,
                    longitude = -95.4618
                ),
                phoneNumber = "(713) 555-0123",
                storeType = StoreType.KIOSK,
                operatingHours = OperatingHours.mallHours(),
                amenities = listOf(
                    StoreAmenity.MOBILE_ORDERING,
                    StoreAmenity.QUICK_SERVICE,
                    StoreAmenity.SEATING
                ),
                isOpen = true,
                estimatedWaitTime = 5,
                distance = 1.2,
                rating = 4.6,
                reviewCount = 189,
                imageUrl = "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&h=300&fit=crop",
                timezone = "America/Chicago" // Houston is in Central Time
            ),
            Store(
                id = "soho-nyc",
                name = "Only Coffee - SoHo",
                address = Address(
                    street = "433 Broadway",
                    city = "New York",
                    state = "NY",
                    zipCode = "10013",
                    latitude = 40.7205,
                    longitude = -74.0014
                ),
                phoneNumber = "(212) 555-0456",
                storeType = StoreType.STORE,
                operatingHours = OperatingHours.defaultHours(),
                amenities = listOf(
                    StoreAmenity.WIFI,
                    StoreAmenity.SEATING,
                    StoreAmenity.RESTROOM,
                    StoreAmenity.OUTDOOR_SEATING
                ),
                isOpen = true,
                estimatedWaitTime = 12,
                distance = 0.7,
                rating = 4.9,
                reviewCount = 342,
                imageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
                timezone = "America/New_York" // New York is in Eastern Time
            ),
            Store(
                id = "houston-mobile-bar",
                name = "Houston Mobile Coffee Bar",
                address = Address(
                    street = "Various Locations",
                    city = "Houston",
                    state = "TX",
                    zipCode = "77001",
                    latitude = 29.7604,
                    longitude = -95.3698
                ),
                phoneNumber = "(713) 555-0789",
                storeType = StoreType.TRUCK,
                operatingHours = OperatingHours.truckHours(),
                amenities = listOf(
                    StoreAmenity.MOBILE_ORDERING,
                    StoreAmenity.QUICK_SERVICE
                ),
                isOpen = true,
                estimatedWaitTime = 5,
                distance = 0.5,
                rating = 4.7,
                reviewCount = 92,
                imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
                timezone = "America/Chicago" // Houston is in Central Time
            )
        )
    }
}

@Parcelize
@Serializable
enum class StoreType(val displayName: String) : Parcelable {
    STORE("Store"),
    TRUCK("Coffee Truck"),
    KIOSK("Kiosk")
}

@Parcelize
@Serializable
data class Address(
    val street: String,
    val city: String,
    val state: String,
    val zipCode: String,
    val latitude: Double,
    val longitude: Double
) : Parcelable {
    
    val formattedAddress: String
        get() = "$street, $city, $state $zipCode"
    
    val shortAddress: String
        get() = "$city, $state"
}

@Parcelize
@Serializable
data class OperatingHours(
    val dayOfWeek: @kotlinx.parcelize.RawValue kotlinx.datetime.DayOfWeek,
    val openTime: @kotlinx.parcelize.RawValue kotlinx.datetime.LocalTime,
    val closeTime: @kotlinx.parcelize.RawValue kotlinx.datetime.LocalTime,
    val isClosed: Boolean = false
) : Parcelable {
    
    val formattedHours: String
        get() = if (isClosed) {
            "Closed"
        } else {
            "${openTime.toString().substring(0, 5)} - ${closeTime.toString().substring(0, 5)}"
        }
    
    companion object {
        fun defaultHours(): List<OperatingHours> {
            return listOf(
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.MONDAY,
                    kotlinx.datetime.LocalTime(6, 0),
                    kotlinx.datetime.LocalTime(20, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.TUESDAY,
                    kotlinx.datetime.LocalTime(6, 0),
                    kotlinx.datetime.LocalTime(20, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.WEDNESDAY,
                    kotlinx.datetime.LocalTime(6, 0),
                    kotlinx.datetime.LocalTime(20, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.THURSDAY,
                    kotlinx.datetime.LocalTime(6, 0),
                    kotlinx.datetime.LocalTime(20, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.FRIDAY,
                    kotlinx.datetime.LocalTime(6, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SATURDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SUNDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(19, 0)
                )
            )
        }
        
        fun truckHours(): List<OperatingHours> {
            return listOf(
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.MONDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(15, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.TUESDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(15, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.WEDNESDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(15, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.THURSDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(15, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.FRIDAY,
                    kotlinx.datetime.LocalTime(7, 0),
                    kotlinx.datetime.LocalTime(15, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SATURDAY,
                    kotlinx.datetime.LocalTime(8, 0),
                    kotlinx.datetime.LocalTime(14, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SUNDAY,
                    kotlinx.datetime.LocalTime(0, 0),
                    kotlinx.datetime.LocalTime(0, 0),
                    isClosed = true
                )
            )
        }

        fun mallHours(): List<OperatingHours> {
            return listOf(
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.MONDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.TUESDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.WEDNESDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.THURSDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(21, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.FRIDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(22, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SATURDAY,
                    kotlinx.datetime.LocalTime(10, 0),
                    kotlinx.datetime.LocalTime(22, 0)
                ),
                OperatingHours(
                    kotlinx.datetime.DayOfWeek.SUNDAY,
                    kotlinx.datetime.LocalTime(11, 0),
                    kotlinx.datetime.LocalTime(20, 0)
                )
            )
        }
    }
}

@Parcelize
@Serializable
enum class StoreAmenity(val displayName: String, val iconName: String) : Parcelable {
    WIFI("WiFi", "wifi"),
    PARKING("Parking", "parking"),
    DRIVE_THRU("Drive Thru", "drive_thru"),
    SEATING("Seating", "seating"),
    OUTDOOR_SEATING("Outdoor Seating", "outdoor_seating"),
    RESTROOM("Restroom", "restroom"),
    WHEELCHAIR_ACCESSIBLE("Wheelchair Accessible", "wheelchair"),
    PET_FRIENDLY("Pet Friendly", "pet"),
    LIVE_MUSIC("Live Music", "music"),
    MOBILE_ORDERING("Mobile Ordering", "mobile"),
    QUICK_SERVICE("Quick Service", "quick"),
    CATERING("Catering", "catering")
}
