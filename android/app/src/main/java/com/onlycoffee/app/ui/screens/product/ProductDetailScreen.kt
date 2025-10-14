package com.onlycoffee.app.ui.screens.product

// Live reload test - updated at 2:35 AM

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Info

import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.onlycoffee.app.R
import com.onlycoffee.app.data.model.MenuItem
import com.onlycoffee.app.data.model.MenuModifier
import com.onlycoffee.app.data.model.ModifierOption
import com.onlycoffee.app.data.model.ModifierType
import com.onlycoffee.app.data.model.SelectedModifier
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.ui.theme.TextTertiary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    menuItem: MenuItem,
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var isFavorite by remember { mutableStateOf(false) }
    var selectedModifiers by remember { mutableStateOf<List<SelectedModifier>>(emptyList()) }
    var quantity by remember { mutableIntStateOf(1) }
    var selectedSize by remember { mutableStateOf("Grande") }
    var showNutritionInfo by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = TextPrimary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { isFavorite = !isFavorite }) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorite",
                            tint = if (isFavorite) BrandPrimary else TextSecondary
                        )
                    }
                    IconButton(onClick = { /* Share functionality */ }) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share",
                            tint = TextSecondary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        bottomBar = {
            ProductBottomBar(
                basePrice = menuItem.basePrice,
                selectedModifiers = selectedModifiers,
                quantity = quantity,
                onAddToOrder = { /* Add to order functionality */ }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundPrimary)
                .padding(paddingValues),
            contentPadding = PaddingValues(bottom = Spacing.lg)
        ) {
            item {
                // Product Image
                ProductImageSection(menuItem = menuItem)
            }
            
            item {
                // Product Info
                ProductInfoSection(
                    menuItem = menuItem,
                    onShowNutritionInfo = { showNutritionInfo = !showNutritionInfo }
                )
            }
            
            item {
                // Size Options
                SizeOptionsSection(
                    selectedSize = selectedSize,
                    onSizeSelected = { selectedSize = it }
                )
            }
            
            if (menuItem.modifiers.isNotEmpty()) {
                item {
                    // Customization Section
                    Text(
                        text = "What's Included",
                        style = MaterialTheme.typography.headlineSmall,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = Spacing.screenPadding, vertical = Spacing.md)
                    )
                }
                
                items(menuItem.modifiers) { modifier ->
                    ModifierSection(
                        modifier = modifier,
                        selectedModifiers = selectedModifiers,
                        onModifierChanged = { modifierId, optionId, quantity ->
                            selectedModifiers = selectedModifiers.toMutableList().apply {
                                removeAll { it.modifierId == modifierId }
                                add(SelectedModifier(modifierId, optionId, quantity))
                            }
                        }
                    )
                }
                
                item {
                    // Customize Button
                    OutlinedButton(
                        onClick = { /* Open customization modal */ },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.md),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White,
                            containerColor = BrandPrimary.copy(alpha = 0.8f)
                        ),
                        border = null,
                        shape = RoundedCornerShape(CornerRadius.button)
                    ) {
                        Icon(
                            painter = painterResource(R.drawable.ic_star),
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(Spacing.sm))
                        Text(
                            text = "Customize",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
            
            if (showNutritionInfo && menuItem.nutritionInfo != null) {
                item {
                    NutritionInfoSection(nutritionInfo = menuItem.nutritionInfo!!)
                }
            }
            
            item {
                // Product Description
                ProductDescriptionSection(menuItem = menuItem)
            }
        }
    }
}

@Composable
private fun ProductImageSection(
    menuItem: MenuItem,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(300.dp)
            .background(BrandPrimary.copy(alpha = 0.1f)),
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = menuItem.imageUrl,
            contentDescription = menuItem.name,
            modifier = Modifier
                .size(200.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop,
            placeholder = painterResource(R.drawable.coffee_cup),
            error = painterResource(R.drawable.coffee_cup)
        )
    }
}

@Composable
private fun ProductInfoSection(
    menuItem: MenuItem,
    onShowNutritionInfo: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(horizontal = Spacing.screenPadding, vertical = Spacing.md)
    ) {
        Text(
            text = menuItem.name,
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(Spacing.sm))
        
        // Calories info
        menuItem.nutritionInfo?.let { nutrition ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${nutrition.calories} calories",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                
                IconButton(
                    onClick = onShowNutritionInfo,
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Nutrition Info",
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(Spacing.md))
        
        // Store availability warning
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFFFFF3CD)
            ),
            shape = RoundedCornerShape(CornerRadius.card)
        ) {
            Row(
                modifier = Modifier.padding(Spacing.md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = Color(0xFF856404),
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(Spacing.sm))
                
                Text(
                    text = "Choose a store to see availability",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF856404)
                )
            }
        }
    }
}

@Composable
private fun SizeOptionsSection(
    selectedSize: String,
    onSizeSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(horizontal = Spacing.screenPadding, vertical = Spacing.md)
    ) {
        Text(
            text = "Size options",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(Spacing.md))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            SizeOption(
                size = "Tall",
                volume = "12 fl oz",
                isSelected = selectedSize == "Tall",
                onClick = { onSizeSelected("Tall") }
            )

            SizeOption(
                size = "Grande",
                volume = "16 fl oz",
                isSelected = selectedSize == "Grande",
                onClick = { onSizeSelected("Grande") }
            )

            SizeOption(
                size = "Venti",
                volume = "24 fl oz",
                isSelected = selectedSize == "Venti",
                onClick = { onSizeSelected("Venti") }
            )
        }
    }
}

@Composable
private fun SizeOption(
    size: String,
    volume: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.clickable { onClick() },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Cup icon with selection indicator
        Box(
            modifier = Modifier
                .size(60.dp)
                .border(
                    width = if (isSelected) 3.dp else 1.dp,
                    color = if (isSelected) BrandPrimary else TextTertiary,
                    shape = CircleShape
                )
                .background(
                    color = if (isSelected) BrandPrimary.copy(alpha = 0.1f) else Color.Transparent,
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = painterResource(R.drawable.coffee_cup),
                contentDescription = size,
                tint = if (isSelected) BrandPrimary else TextSecondary,
                modifier = Modifier.size(32.dp)
            )
        }

        Spacer(modifier = Modifier.height(Spacing.xs))

        Text(
            text = size,
            style = MaterialTheme.typography.labelMedium,
            color = if (isSelected) BrandPrimary else TextPrimary,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )

        Text(
            text = volume,
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary
        )
    }
}

@Composable
private fun ModifierSection(
    modifier: MenuModifier,
    selectedModifiers: List<SelectedModifier>,
    onModifierChanged: (String, String, Int) -> Unit,
    modifier2: Modifier = Modifier
) {
    val selectedModifier = selectedModifiers.find { it.modifierId == modifier.id }
    val selectedOption = modifier.options.find { it.id == selectedModifier?.optionId } ?: modifier.options.firstOrNull()

    Card(
        modifier = modifier2
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.xs),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        shape = RoundedCornerShape(CornerRadius.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Modifier header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = modifier.name,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.weight(1f)
                )

                if (modifier.type == ModifierType.QUANTITY && selectedOption != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                val newQuantity = maxOf(0, (selectedModifier?.quantity ?: 1) - 1)
                                if (newQuantity > 0) {
                                    onModifierChanged(modifier.id, selectedOption.id, newQuantity)
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                painter = painterResource(R.drawable.ic_clear),
                                contentDescription = "Decrease",
                                tint = BrandPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Text(
                            text = (selectedModifier?.quantity ?: 1).toString(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = Spacing.sm)
                        )

                        IconButton(
                            onClick = {
                                val newQuantity = (selectedModifier?.quantity ?: 1) + 1
                                onModifierChanged(modifier.id, selectedOption.id, newQuantity)
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Increase",
                                tint = BrandPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Selected option display
            selectedOption?.let { option ->
                Text(
                    text = option.name,
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
private fun NutritionInfoSection(
    nutritionInfo: com.onlycoffee.app.data.model.NutritionInfo,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.md),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        shape = RoundedCornerShape(CornerRadius.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            Text(
                text = "Nutrition Information",
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(Spacing.md))

            Text(
                text = "${nutritionInfo.calories} calories, ${nutritionInfo.sugar.toInt()}g sugar, ${nutritionInfo.fat.toInt()}g fat",
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(Spacing.sm))

            OutlinedButton(
                onClick = { /* Show full nutrition details */ },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = BrandPrimary
                ),
                shape = RoundedCornerShape(CornerRadius.button)
            ) {
                Text(
                    text = "Full nutrition & ingredient list",
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }
    }
}

@Composable
private fun ProductDescriptionSection(
    menuItem: MenuItem,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.md),
        colors = CardDefaults.cardColors(containerColor = BrandPrimary),
        shape = RoundedCornerShape(CornerRadius.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.lg)
        ) {
            // Points badge
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF4A5D23)
                ),
                shape = RoundedCornerShape(Spacing.md)
            ) {
                Text(
                    text = "200 ★ item",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = Spacing.sm, vertical = Spacing.xs)
                )
            }

            Spacer(modifier = Modifier.height(Spacing.md))

            Text(
                text = "Protein-Packed. Vanilla Rich.",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(Spacing.sm))

            Text(
                text = menuItem.description,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.9f)
            )
        }
    }
}

@Composable
private fun ProductBottomBar(
    basePrice: Double,
    selectedModifiers: List<SelectedModifier>,
    quantity: Int,
    onAddToOrder: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Calculate total price including modifiers
    val totalPrice = basePrice * quantity // Simplified calculation

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BrandPrimary),
        shape = RoundedCornerShape(topStart = CornerRadius.card, topEnd = CornerRadius.card)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Store selection
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "For item availability",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )

                Text(
                    text = "0",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .background(
                            color = Color.White.copy(alpha = 0.2f),
                            shape = CircleShape
                        )
                        .padding(horizontal = Spacing.md, vertical = Spacing.xs)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Choose a store",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White
                )

                Text(
                    text = "▼",
                    color = Color.White,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(Spacing.md))

            // Add to order button
            Button(
                onClick = onAddToOrder,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = BrandPrimary
                ),
                shape = RoundedCornerShape(CornerRadius.button)
            ) {
                Text(
                    text = "Add to order",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = Spacing.xs)
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun ProductDetailScreenPreview() {
    OnlyCoffeeTheme {
        ProductDetailScreen(
            menuItem = MenuItem.sampleItems.first { it.modifiers.isNotEmpty() },
            navController = rememberNavController()
        )
    }
}
