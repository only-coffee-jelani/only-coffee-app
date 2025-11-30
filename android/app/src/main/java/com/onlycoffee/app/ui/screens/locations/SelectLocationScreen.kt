package com.onlycoffee.app.ui.screens.locations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.maps.model.LatLng
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.StoreResponse
import com.onlycoffee.app.ui.components.AppHeader
import com.onlycoffee.app.ui.components.StoreLocatorMap
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.utils.LocationUtils

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun SelectLocationScreen(
    navController: NavController,
    viewModel: LocationViewModel = hiltViewModel(),
    storeViewModel: com.onlycoffee.app.ui.screens.stores.StoreViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    // Location permission handling
    val fineLocationPermissionState = rememberPermissionState(
        android.Manifest.permission.ACCESS_FINE_LOCATION
    )

    val context = LocalContext.current

    // Request location permissions
    LaunchedEffect(fineLocationPermissionState.status.isGranted) {
        if (!fineLocationPermissionState.status.isGranted) {
            fineLocationPermissionState.launchPermissionRequest()
        } else {
            if (LocationUtils.isLocationEnabled(context)) {
                val location = LocationUtils.getCurrentLocation(context)
                location?.let {
                    viewModel.updateUserLocation(it.latitude, it.longitude)
                }
            }
        }
    }

    var searchText by remember { mutableStateOf("") }

    // Content
    LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundPrimary),
            contentPadding = PaddingValues(bottom = Spacing.lg)
        ) {
            item {
                // Search Bar
                OutlinedTextField(
                    value = searchText,
                    onValueChange = {
                        searchText = it
                        viewModel.searchStores(it)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = Spacing.screenPadding),
                    placeholder = {
                        Text(
                            text = "Search by city or zip code",
                            color = TextSecondary
                        )
                    },
                    leadingIcon = {
                        Icon(
                            painter = painterResource(R.drawable.ic_search),
                            contentDescription = null,
                            tint = TextSecondary
                        )
                    },
                    shape = RoundedCornerShape(CornerRadius.input)
                )
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.lg))
            }

            item {
                // Map View
                val userLat = uiState.userLatitude
                val userLng = uiState.userLongitude
                val userLocation = if (userLat != null && userLng != null) {
                    LatLng(userLat, userLng)
                } else null

                StoreLocatorMap(
                    stores = uiState.filteredStores,
                    userLocation = userLocation,
                    selectedStore = uiState.selectedStore,
                    onStoreSelected = { store ->
                        viewModel.selectStore(store)
                    },
                    modifier = Modifier.padding(horizontal = Spacing.screenPadding)
                )
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.lg))
            }

            // Tabs removed for simplicity

            item {
                Spacer(modifier = Modifier.height(Spacing.md))
            }

            // Store List
            items(uiState.filteredStores) { store ->
                SelectLocationCard(
                    store = store,
                    isSelected = uiState.selectedStore?.storeId == store.storeId,
                    onStoreClick = { viewModel.selectStore(it) },
                    onSelectClick = {
                        // Save selected store to both ViewModels
                        viewModel.saveSelectedStore(it)
                        storeViewModel.selectStore(it)
                        // Navigate to menu and clear the select_location from back stack
                        navController.navigate("menu") {
                            popUpTo("menu") { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    isFavorite = viewModel.isFavorite(store.storeId),
                    onFavoriteClick = { storeId ->
                        viewModel.toggleFavorite(storeId)
                    },
                    modifier = Modifier.padding(
                        horizontal = Spacing.screenPadding,
                        vertical = Spacing.xs
                    )
                )
            }
        }
}

@Composable
fun SelectLocationCard(
    store: StoreResponse,
    isSelected: Boolean,
    onStoreClick: (StoreResponse) -> Unit,
    onSelectClick: (StoreResponse) -> Unit,
    isFavorite: Boolean = false,
    onFavoriteClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    androidx.compose.material3.Card(
        modifier = modifier
            .fillMaxWidth(),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (isSelected) BrandPrimary.copy(alpha = 0.1f) else com.onlycoffee.app.ui.theme.CardBackground
        ),
        elevation = androidx.compose.material3.CardDefaults.cardElevation(defaultElevation = com.onlycoffee.app.ui.theme.Elevation.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Title row with heart icon on same line
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = store.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = com.onlycoffee.app.ui.theme.TextPrimary,
                    modifier = Modifier.weight(1f)
                )

                // Favorite heart icon on same line as title
                androidx.compose.material3.IconButton(
                    onClick = { onFavoriteClick(store.storeId) },
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = if (isFavorite) "Remove from favorites" else "Add to favorites",
                        tint = if (isFavorite) BrandPrimary else TextSecondary,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.xs))

            // Street address on first line
            Text(
                text = store.address ?: "Address not available",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            // City, state, zip on second line
            val cityStateZip = buildString {
                store.city?.let { append(it) }

                if (store.countryCode == "US") {
                    // USA format: City, State ZIP
                    if (store.state != null) {
                        if (isNotEmpty()) append(", ")
                        append(store.state)
                    }
                    if (store.zipCode != null) {
                        if (isNotEmpty()) append(" ")
                        append(store.zipCode)
                    }
                } else {
                    // International format: City, Country
                    if (store.country != null) {
                        if (isNotEmpty()) append(", ")
                        append(store.country)
                    }
                }
            }

            if (cityStateZip.isNotEmpty()) {
                Text(
                    text = cityStateZip,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(Spacing.sm))

            // Open/Closed status with better styling
            androidx.compose.foundation.layout.Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
            ) {
                // Distance badge (if available)
                if (store.formattedDistance.isNotEmpty()) {
                    androidx.compose.foundation.layout.Box(
                        modifier = Modifier
                            .background(
                                color = TextSecondary.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(Spacing.xs)
                            )
                            .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                    ) {
                        Text(
                            text = store.formattedDistance,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Open/Closed status badge with icon
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .background(
                            color = if (store.isOpenNow)
                                com.onlycoffee.app.ui.theme.StatusSuccess.copy(alpha = 0.15f)
                            else
                                com.onlycoffee.app.ui.theme.StatusError.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(Spacing.xs)
                        )
                        .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                ) {
                    androidx.compose.foundation.layout.Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        // Status indicator dot
                        androidx.compose.foundation.layout.Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(
                                    color = if (store.isOpenNow)
                                        com.onlycoffee.app.ui.theme.StatusSuccess
                                    else
                                        com.onlycoffee.app.ui.theme.StatusError,
                                    shape = CircleShape
                                )
                        )

                        Text(
                            text = if (store.isOpenNow) "Open" else "Closed",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (store.isOpenNow)
                                com.onlycoffee.app.ui.theme.StatusSuccess
                            else
                                com.onlycoffee.app.ui.theme.StatusError,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Store hours in user's local timezone
            if (store.todaysHoursInUserTimezone.isNotEmpty() &&
                store.todaysHoursInUserTimezone != "Closed" &&
                store.todaysHoursInUserTimezone != "Hours not available") {
                Spacer(modifier = Modifier.height(Spacing.xs))

                Text(
                    text = "Hours: ${store.todaysHoursInUserTimezone}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(Spacing.md))

            // Select Button
            Button(
                onClick = { onSelectClick(store) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandPrimary
                ),
                shape = RoundedCornerShape(CornerRadius.button)
            ) {
                Text(
                    text = "Select This Location",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = TextOnPrimary,
                    modifier = Modifier.padding(vertical = Spacing.xs)
                )
            }
        }
    }
}

// Preview removed - requires StoreViewModel which needs Hilt
