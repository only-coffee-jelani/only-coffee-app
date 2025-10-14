package com.onlycoffee.app.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object LocationUtils {
    
    suspend fun getCurrentLocation(context: Context): Location? {
        return suspendCancellableCoroutine { continuation ->
            if (!hasLocationPermission(context)) {
                continuation.resume(null)
                return@suspendCancellableCoroutine
            }

            if (!isLocationEnabled(context)) {
                continuation.resume(null)
                return@suspendCancellableCoroutine
            }

            val fusedLocationClient: FusedLocationProviderClient =
                LocationServices.getFusedLocationProviderClient(context)

            val cancellationTokenSource = CancellationTokenSource()

            continuation.invokeOnCancellation {
                cancellationTokenSource.cancel()
            }

            try {
                // First try to get current location with high accuracy
                fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    cancellationTokenSource.token
                ).addOnSuccessListener { location ->
                    if (location != null) {
                        continuation.resume(location)
                    } else {
                        // If current location is null, try to get last known location
                        try {
                            fusedLocationClient.lastLocation.addOnSuccessListener { lastLocation ->
                                continuation.resume(lastLocation)
                            }.addOnFailureListener {
                                continuation.resume(null)
                            }
                        } catch (e: SecurityException) {
                            continuation.resume(null)
                        }
                    }
                }.addOnFailureListener {
                    // If getCurrentLocation fails, try last known location
                    try {
                        fusedLocationClient.lastLocation.addOnSuccessListener { lastLocation ->
                            continuation.resume(lastLocation)
                        }.addOnFailureListener {
                            continuation.resume(null)
                        }
                    } catch (e: SecurityException) {
                        continuation.resume(null)
                    }
                }
            } catch (e: SecurityException) {
                continuation.resume(null)
            }
        }
    }
    
    private fun hasLocationPermission(context: Context): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    fun isLocationEnabled(context: Context): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
               locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
}
