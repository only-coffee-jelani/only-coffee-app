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

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton

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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.ui.theme.BackgroundSecondary
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.BrandPrimary

import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.ComponentSize
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.Elevation
import com.onlycoffee.app.ui.theme.IconSize
import com.onlycoffee.app.ui.theme.OnlyCoffeeTextStyles
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.OverlayMedium
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.ui.theme.TextTertiary

@Composable
fun MenuItemCard(
    menuItem: MenuItem,
    onItemClick: (MenuItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(ComponentSize.menuItemCardWidth)
            .clickable { onItemClick(menuItem) },
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = Elevation.card)
    ) {
        Column {
            // Item Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
            ) {
                AsyncImage(
                    model = menuItem.imageUrl,
                    contentDescription = menuItem.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(topStart = CornerRadius.card, topEnd = CornerRadius.card)),
                    contentScale = ContentScale.Crop,
                    placeholder = painterResource(R.drawable.coffee_cup),
                    error = painterResource(R.drawable.coffee_cup)
                )
                
                // Unavailable Overlay
                if (!menuItem.isAvailable) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .background(
                                color = OverlayMedium,
                                shape = RoundedCornerShape(topStart = CornerRadius.card, topEnd = CornerRadius.card)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Unavailable",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                
                // Popular Badge
                if (menuItem.isPopular) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(Spacing.sm)
                            .background(
                                color = BrandAccent,
                                shape = RoundedCornerShape(Spacing.sm)
                            )
                            .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                    ) {
                        Text(
                            text = "Popular",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            // Item Details
            Column(
                modifier = Modifier.padding(Spacing.sm)
            ) {
                // Item Name
                Text(
                    text = menuItem.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(Spacing.xs))
                
                // Item Description
                Text(
                    text = menuItem.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(Spacing.sm))
                
                // Price
                Text(
                    text = menuItem.formattedPrice,
                    style = OnlyCoffeeTextStyles.PriceText,
                    color = BrandPrimary,
                    fontWeight = FontWeight.Bold
                )
                
                // Category and Prep Time
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(getCategoryIcon(menuItem.category.iconName)),
                            contentDescription = null,
                            tint = BrandAccent,
                            modifier = Modifier.size(IconSize.sm)
                        )
                        
                        Spacer(modifier = Modifier.width(Spacing.xs))
                        
                        Text(
                            text = menuItem.category.displayName,
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
fun MenuItemListCard(
    menuItem: MenuItem,
    onItemClick: (MenuItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onItemClick(menuItem) },
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = Elevation.card)
    ) {
        Box {
            Row(
                modifier = Modifier.padding(Spacing.md)
            ) {
            // Item Image
            Box {
                AsyncImage(
                    model = menuItem.imageUrl,
                    contentDescription = menuItem.name,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(CornerRadius.image)),
                    contentScale = ContentScale.Crop,
                    placeholder = painterResource(R.drawable.coffee_cup),
                    error = painterResource(R.drawable.coffee_cup)
                )
                
                // Unavailable Overlay
                if (!menuItem.isAvailable) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .background(
                                color = OverlayMedium,
                                shape = RoundedCornerShape(CornerRadius.image)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Out",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.width(Spacing.md))
            
            // Item Details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        text = menuItem.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f)
                    )
                    
                    Text(
                        text = menuItem.formattedPrice,
                        style = OnlyCoffeeTextStyles.PriceText,
                        color = BrandPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Spacer(modifier = Modifier.height(Spacing.xs))
                
                Text(
                    text = menuItem.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(Spacing.sm))
                
                // Category, Prep Time, and Customizable
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(getCategoryIcon(menuItem.category.iconName)),
                            contentDescription = null,
                            tint = BrandAccent,
                            modifier = Modifier.size(IconSize.sm)
                        )
                        
                        Spacer(modifier = Modifier.width(Spacing.xs))
                        
                        Text(
                            text = menuItem.category.displayName,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextTertiary
                        )
                    }
                    

                    

                }
            }


            }


        }
    }
}

private fun getCategoryIcon(iconName: String): Int {
    return when (iconName) {
        "coffee" -> R.drawable.ic_coffee
        "espresso" -> R.drawable.ic_espresso
        "tea" -> R.drawable.ic_tea
        "cold_brew" -> R.drawable.ic_cold_brew
        "frappuccino" -> R.drawable.ic_frappuccino
        "food" -> R.drawable.ic_food
        "pastry" -> R.drawable.ic_pastry
        "seasonal" -> R.drawable.ic_seasonal
        else -> R.drawable.ic_coffee
    }
}

@Preview(showBackground = true)
@Composable
fun MenuItemCardPreview() {
    OnlyCoffeeTheme {
        Column(
            modifier = Modifier
                .background(BackgroundSecondary)
                .padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.md)
        ) {
            MenuItemCard(
                menuItem = MenuItem.sampleItems[0],
                onItemClick = {}
            )

            MenuItemListCard(
                menuItem = MenuItem.sampleItems[0],
                onItemClick = {}
            )
        }
    }
}
