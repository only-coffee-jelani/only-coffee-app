package com.onlycoffee.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.StoreResponse
import com.onlycoffee.app.ui.theme.BackgroundSecondary
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.ComponentSize
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.Elevation
import com.onlycoffee.app.ui.theme.IconSize
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.StatusError
import com.onlycoffee.app.ui.theme.StatusSuccess
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.ui.theme.TextTertiary

@Composable
fun StoreCard(
    store: StoreResponse,
    onStoreClick: (StoreResponse) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(ComponentSize.storeCardWidth)
            .clickable { onStoreClick(store) },
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = Elevation.card)
    ) {
        Column {
            // Store Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
            ) {
                AsyncImage(
                    model = store.storeImageUrl?.takeIf { it.isNotBlank() },
                    contentDescription = store.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(topStart = CornerRadius.card, topEnd = CornerRadius.card)),
                    contentScale = ContentScale.Crop,
                    placeholder = painterResource(R.drawable.placeholder_store),
                    error = painterResource(R.drawable.placeholder_store)
                )

                // Store Type Badge
                store.storeType?.let { storeType ->
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(Spacing.sm)
                            .background(
                                color = BrandPrimary.copy(alpha = 0.9f),
                                shape = RoundedCornerShape(Spacing.sm)
                            )
                            .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                    ) {
                        Text(
                            text = storeType.displayName,
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
                
                // Open/Closed Status
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(Spacing.sm)
                        .background(
                            color = if (store.isOpenNow) StatusSuccess else StatusError,
                            shape = RoundedCornerShape(Spacing.sm)
                        )
                        .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                ) {
                    Text(
                        text = if (store.isOpenNow) "Open" else "Closed",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            // Store Details
            Column(
                modifier = Modifier.padding(Spacing.md)
            ) {
                // Store Name
                Text(
                    text = store.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1
                )
                
                Spacer(modifier = Modifier.height(Spacing.xs))
                
                // Address
                Text(
                    text = store.address ?: "Address not available",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 1
                )
                
                Spacer(modifier = Modifier.height(Spacing.sm))

                // Distance
                if (store.formattedDistance.isNotEmpty()) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_location),
                            contentDescription = null,
                            tint = BrandPrimary,
                            modifier = Modifier.size(IconSize.sm)
                        )

                        Spacer(modifier = Modifier.width(Spacing.xs))

                        Text(
                            text = store.formattedDistance,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StoreListCard(
    store: StoreResponse,
    onStoreClick: (StoreResponse) -> Unit,
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
        Row(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Store Image
            AsyncImage(
                model = store.storeImageUrl?.takeIf { it.isNotBlank() },
                contentDescription = store.name,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(CornerRadius.image)),
                contentScale = ContentScale.Crop,
                placeholder = painterResource(R.drawable.placeholder_store),
                error = painterResource(R.drawable.placeholder_store)
            )

            Spacer(modifier = Modifier.width(Spacing.md))

            // Store Details
            Column(
                modifier = Modifier.weight(1f)
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
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold
                        )

                        Text(
                            text = store.address ?: "Address not available",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            maxLines = 2
                        )
                    }
                    
                    // Open/Closed Status
                    Box(
                        modifier = Modifier
                            .background(
                                color = if (store.isOpenNow) StatusSuccess else StatusError,
                                shape = RoundedCornerShape(Spacing.sm)
                            )
                            .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                    ) {
                        Text(
                            text = if (store.isOpenNow) "Open" else "Closed",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(Spacing.sm))

                // Distance
                if (store.formattedDistance.isNotEmpty()) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_location),
                            contentDescription = null,
                            tint = BrandPrimary,
                            modifier = Modifier.size(IconSize.sm)
                        )

                        Spacer(modifier = Modifier.width(Spacing.xs))

                        Text(
                            text = store.formattedDistance,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary
                        )
                    }
                }
            }
        }
    }
}

// Preview removed - use real data from backend instead
