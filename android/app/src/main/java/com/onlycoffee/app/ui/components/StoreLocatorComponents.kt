package com.onlycoffee.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.Store
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.Elevation
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary

@Composable
fun StoreListCard(
    store: Store,
    onStoreClick: (Store) -> Unit,
    onOrderHereClick: (Store) -> Unit,
    isFavorite: Boolean = false,
    onFavoriteClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onStoreClick(store) },
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = Elevation.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Top row with heart in top right
            Box(
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = store.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(Spacing.xs))

                        Text(
                            text = store.address.formattedAddress,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(Spacing.xs))

                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = store.formattedDistance,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )

                            if (store.formattedDistance.isNotEmpty()) {
                                Text(
                                    text = " • ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }

                            Text(
                                text = if (store.isOpen) "Open until 9:00 PM" else "Closed",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (store.isOpen) BrandPrimary else TextSecondary
                            )
                        }
                    }


                }

                // Favorite heart icon positioned in top right
                IconButton(
                    onClick = { onFavoriteClick(store.id) },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(32.dp)
                        .offset(x = 8.dp, y = (-8).dp) // Slight offset to position nicely
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = if (isFavorite) "Remove from favorites" else "Add to favorites",
                        tint = if (isFavorite) BrandPrimary else TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(Spacing.md))
            
            // Order Here Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp)
                    .background(
                        color = BrandPrimary,
                        shape = RoundedCornerShape(CornerRadius.button)
                    )
                    .clickable { onOrderHereClick(store) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Order here",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = BackgroundPrimary
                )
            }
        }
    }
}

@Composable
fun OrderTypeToggle(
    isPickup: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .background(
                color = CardBackground,
                shape = RoundedCornerShape(CornerRadius.button)
            )
            .border(
                width = 1.dp,
                color = BrandPrimary.copy(alpha = 0.2f),
                shape = RoundedCornerShape(CornerRadius.button)
            )
            .padding(4.dp)
    ) {
        // Pickup Button
        Box(
            modifier = Modifier
                .weight(1f)
                .height(36.dp)
                .background(
                    color = if (isPickup) BrandPrimary else CardBackground,
                    shape = RoundedCornerShape(CornerRadius.button)
                )
                .clickable { if (!isPickup) onToggle() },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Pickup",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Medium,
                color = if (isPickup) BackgroundPrimary else TextPrimary
            )
        }
        
        Spacer(modifier = Modifier.width(4.dp))
        
        // Delivery Button
        Box(
            modifier = Modifier
                .weight(1f)
                .height(36.dp)
                .background(
                    color = if (!isPickup) BrandPrimary else CardBackground,
                    shape = RoundedCornerShape(CornerRadius.button)
                )
                .clickable { if (isPickup) onToggle() },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Delivery",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Medium,
                color = if (!isPickup) BackgroundPrimary else TextPrimary
            )
        }
    }
}

@Composable
fun StoreLocatorMap(
    stores: List<Store>,
    userLocation: LatLng?,
    selectedStore: Store?,
    onStoreSelected: (Store) -> Unit,
    modifier: Modifier = Modifier
) {
    // Default to New Orleans (where your stores are located)
    val defaultLocation = LatLng(29.9511, -90.0715) // New Orleans
    val centerLocation = userLocation ?: defaultLocation

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(centerLocation, if (userLocation != null) 15f else 12f)
    }

    // Update camera position when user location changes
    LaunchedEffect(userLocation) {
        userLocation?.let { location ->
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(location, 15f),
                1000 // Animation duration in milliseconds
            )
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(300.dp)
            .clip(RoundedCornerShape(CornerRadius.card))
    ) {
        GoogleMap(
            modifier = Modifier.fillMaxWidth(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(
                isMyLocationEnabled = true, // Always enable to show user location
                mapType = MapType.NORMAL
            ),
            uiSettings = MapUiSettings(
                zoomControlsEnabled = true,
                myLocationButtonEnabled = true, // Always show my location button
                mapToolbarEnabled = false,
                compassEnabled = true,
                rotationGesturesEnabled = true,
                scrollGesturesEnabled = true,
                tiltGesturesEnabled = true,
                zoomGesturesEnabled = true
            )
        ) {
            // Add user location marker if available
            userLocation?.let { location ->
                Marker(
                    state = MarkerState(position = location),
                    title = "Your Location",
                    snippet = "You are here"
                )
            }

            // Add store markers
            stores.forEach { store ->
                val storeLocation = LatLng(store.address.latitude, store.address.longitude)
                Marker(
                    state = MarkerState(position = storeLocation),
                    title = store.name,
                    snippet = "${store.address.street}, ${store.address.city}",
                    onClick = {
                        onStoreSelected(store)
                        true
                    }
                )
            }
        }
    }
}


