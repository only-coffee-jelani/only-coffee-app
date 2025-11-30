package com.onlycoffee.app.ui.screens.product

// Live reload test - updated at 2:35 AM

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
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
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.onlycoffee.app.ui.theme.StatusError
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import com.onlycoffee.app.ui.theme.TextTertiary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    menuItemId: String,
    storeId: String,
    navController: NavController,
    viewModel: ProductDetailViewModel = hiltViewModel(),
    cartViewModel: com.onlycoffee.app.ui.screens.cart.CartViewModel = hiltViewModel(),
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedModifiers by remember { mutableStateOf<List<SelectedModifier>>(emptyList()) }
    var quantity by remember { mutableIntStateOf(1) }
    var showNutritionInfo by remember { mutableStateOf(false) }
    var espressoShotCount by remember { mutableIntStateOf(0) }
    var selectedMilkOption by remember { mutableStateOf("Whole Milk") }
    var extraMilkShot by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Load menu item when screen is first displayed
    LaunchedEffect(menuItemId) {
        viewModel.loadMenuItem(menuItemId)
    }

    // Set the selected store ID in the view model
    LaunchedEffect(storeId) {
        viewModel.setStoreId(storeId)
    }

    // Show loading or error state
    if (uiState.isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            androidx.compose.material3.CircularProgressIndicator(color = BrandPrimary)
        }
        return
    }

    if (uiState.error != null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                Text(
                    text = uiState.error ?: "Unknown error",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextSecondary
                )
                Button(onClick = { viewModel.loadMenuItem(menuItemId) }) {
                    Text("Retry")
                }
            }
        }
        return
    }

    val menuItem = uiState.menuItem ?: return

    Box(modifier = modifier.fillMaxSize()) {
        // Main content
        Scaffold(
            topBar = { },
            snackbarHost = {
                SnackbarHost(hostState = snackbarHostState) { data ->
                    Snackbar(
                        snackbarData = data,
                        containerColor = BrandPrimary,
                        contentColor = androidx.compose.ui.graphics.Color.White,
                        actionColor = androidx.compose.ui.graphics.Color.White
                    )
                }
            },
            bottomBar = {
                val cartUiState by cartViewModel.uiState.collectAsState()
                ProductBottomBar(
                    basePrice = menuItem.basePrice,
                    selectedModifiers = selectedModifiers,
                    quantity = quantity,
                    selectedStoreId = uiState.selectedStoreId,
                    espressoShotCount = espressoShotCount,
                    selectedMilkOption = selectedMilkOption,
                    extraMilkShot = extraMilkShot,
                    cartItemCount = cartUiState.itemCount,
                    cartTotal = cartUiState.total,
                    onAddToOrder = {
                        // Enterprise-level store ID management:
                        // Pass store ID when adding item to ensure checkout works
                        val currentStoreId = uiState.selectedStoreId
                        if (currentStoreId != null) {
                            // Add item to cart with all customizations AND store ID
                            cartViewModel.addItem(
                                menuItem = menuItem,
                                quantity = quantity,
                                espressoShotCount = espressoShotCount,
                                selectedMilkOption = selectedMilkOption,
                                extraMilkShot = extraMilkShot,
                                customizations = null, // TODO: Map selectedModifiers to string list
                                storeId = currentStoreId // CRITICAL: Pass store ID for checkout
                            )

                            // Show success snackbar with action to view cart
                            scope.launch {
                                val result = snackbarHostState.showSnackbar(
                                    message = "✓ Added to cart",
                                    actionLabel = "View Cart",
                                    duration = androidx.compose.material3.SnackbarDuration.Short
                                )
                                when (result) {
                                    SnackbarResult.ActionPerformed -> {
                                        // Navigate to cart
                                        navController.navigate("cart")
                                    }
                                    SnackbarResult.Dismissed -> {
                                        // Navigate back to previous screen
                                        navController.popBackStack()
                                    }
                                }
                            }
                        } else {
                            // Store ID is missing - this should not happen in production
                            // Log error and show user feedback
                            android.util.Log.e("ProductDetailScreen", "Store ID is null when adding item")
                            scope.launch {
                                snackbarHostState.showSnackbar(
                                    message = "Error: Store not selected. Please select a store first.",
                                    duration = androidx.compose.material3.SnackbarDuration.Long
                                )
                            }
                        }
                    },
                    onViewCart = {
                        navController.navigate("cart")
                    }
                )
            }
        ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundPrimary),
            contentPadding = PaddingValues(bottom = paddingValues.calculateBottomPadding() + Spacing.lg)
        ) {
            item {
                // Back button in white space above product image
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BackgroundPrimary)
                        .padding(start = Spacing.xs, top = 4.dp, bottom = 0.dp)
                ) {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                }
            }

            item {
                // Product Image
                ProductImageSection(menuItem = menuItem)
            }
            
            item {
                // Product Info
                ProductInfoSection(
                    menuItem = menuItem,
                    selectedStoreId = uiState.selectedStoreId,
                    onShowNutritionInfo = { showNutritionInfo = !showNutritionInfo }
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

            // Only show Add-Ons section for coffee drinks (not for ice cream, hot chocolate, etc.)
            val shouldShowAddOns = shouldShowAddOnsForCategory(menuItem.categoryName)

            if (shouldShowAddOns) {
                item {
                    // Add-Ons Section
                    AddOnsSection(
                        menuItem = menuItem,
                        espressoShotCount = espressoShotCount,
                        selectedMilkOption = selectedMilkOption,
                        extraMilkShot = extraMilkShot,
                        onEspressoShotCountChanged = { espressoShotCount = it },
                        onMilkOptionSelected = { selectedMilkOption = it },
                        onExtraMilkShotChanged = { extraMilkShot = it }
                    )
                }
            }
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
            .height(220.dp)
            .background(BrandPrimary.copy(alpha = 0.1f)),
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = menuItem.imageUrl,
            contentDescription = menuItem.name,
            modifier = Modifier
                .size(160.dp),
            contentScale = ContentScale.Crop,
            placeholder = painterResource(R.drawable.coffee_cup),
            error = painterResource(R.drawable.coffee_cup)
        )
    }
}

@Composable
private fun ProductInfoSection(
    menuItem: MenuItem,
    selectedStoreId: String?,
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

        // Store availability warning - only show if no store is selected
        if (selectedStoreId.isNullOrEmpty()) {
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
private fun AddOnsSection(
    menuItem: MenuItem,
    espressoShotCount: Int,
    selectedMilkOption: String?,
    extraMilkShot: Boolean,
    onEspressoShotCountChanged: (Int) -> Unit,
    onMilkOptionSelected: (String) -> Unit,
    onExtraMilkShotChanged: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    // Check if drink contains milk allergen
    val MILK_ALLERGEN_ID = "5be67603-8533-431f-a17c-651dbf0aed80"
    val hasMilk = menuItem.allergens.contains(MILK_ALLERGEN_ID)

    // Debug logging
    android.util.Log.d("ProductDetail", "MenuItem: ${menuItem.name}")
    android.util.Log.d("ProductDetail", "Allergens: ${menuItem.allergens}")
    android.util.Log.d("ProductDetail", "Has Milk: $hasMilk")

    // Espresso shot price
    val ESPRESSO_SHOT_PRICE = 1.50

    // Milk prices
    val EXTRA_MILK_SHOT_PRICE = 0.50

    // Milk options with prices
    val milkOptions = listOf(
        "Whole Milk" to 0.0,
        "Oat Milk" to 0.50,
        "Soy Milk" to 0.50,
        "Coconut Milk" to 0.50,
        "Lactose-Free Milk" to 0.50
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.md)
    ) {
        Text(
            text = "Add-Ons",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(Spacing.md))

        // Espresso Shots
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(CornerRadius.card)
        ) {
            Column(
                modifier = Modifier.padding(Spacing.md)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Extra Espresso Shot",
                            style = MaterialTheme.typography.bodyLarge,
                            color = TextPrimary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "+$${"%.2f".format(ESPRESSO_SHOT_PRICE)} each",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
                    ) {
                        // Minus button
                        IconButton(
                            onClick = { if (espressoShotCount > 0) onEspressoShotCountChanged(espressoShotCount - 1) },
                            enabled = espressoShotCount > 0,
                            modifier = Modifier
                                .size(36.dp)
                                .background(
                                    color = if (espressoShotCount > 0) BrandPrimary else TextTertiary.copy(alpha = 0.3f),
                                    shape = CircleShape
                                )
                        ) {
                            Text(
                                text = "−",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Count
                        Text(
                            text = espressoShotCount.toString(),
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(24.dp),
                            textAlign = TextAlign.Center
                        )

                        // Plus button
                        IconButton(
                            onClick = { if (espressoShotCount < 2) onEspressoShotCountChanged(espressoShotCount + 1) },
                            enabled = espressoShotCount < 2,
                            modifier = Modifier
                                .size(36.dp)
                                .background(
                                    color = if (espressoShotCount < 2) BrandPrimary else TextTertiary.copy(alpha = 0.3f),
                                    shape = CircleShape
                                )
                        ) {
                            Text(
                                text = "+",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                if (espressoShotCount > 0) {
                    Spacer(modifier = Modifier.height(Spacing.xs))
                    Text(
                        text = "Max 2 shots",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextTertiary
                    )
                }
            }
        }

        // Milk Options (only show if drink contains milk)
        if (hasMilk) {
            Spacer(modifier = Modifier.height(Spacing.md))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(CornerRadius.card)
            ) {
                Column(
                    modifier = Modifier.padding(Spacing.md)
                ) {
                    Text(
                        text = "Milk Options",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(Spacing.sm))

                    milkOptions.forEach { (milkName, price) ->
                        MilkOptionItem(
                            name = milkName,
                            price = price,
                            isSelected = selectedMilkOption == milkName,
                            onClick = { onMilkOptionSelected(milkName) }
                        )
                    }

                    Spacer(modifier = Modifier.height(Spacing.md))

                    androidx.compose.material3.HorizontalDivider(
                        modifier = Modifier.fillMaxWidth(),
                        color = TextTertiary.copy(alpha = 0.2f)
                    )

                    Spacer(modifier = Modifier.height(Spacing.md))

                    // Extra Milk Shot
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Extra Milk Shot",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextPrimary,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "+$${"%.2f".format(EXTRA_MILK_SHOT_PRICE)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }

                        androidx.compose.material3.Switch(
                            checked = extraMilkShot,
                            onCheckedChange = onExtraMilkShotChanged,
                            colors = androidx.compose.material3.SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = BrandPrimary,
                                uncheckedThumbColor = Color.White,
                                uncheckedTrackColor = Color.LightGray
                            )
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MilkOptionItem(
    name: String,
    price: Double,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.xs),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
        ) {
            // Radio button
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .border(
                        width = 2.dp,
                        color = if (isSelected) BrandPrimary else TextTertiary,
                        shape = CircleShape
                    )
                    .background(
                        color = if (isSelected) BrandPrimary else Color.Transparent,
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isSelected) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(color = Color.White, shape = CircleShape)
                    )
                }
            }

            Text(
                text = name,
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary
            )
        }

        if (price > 0) {
            Text(
                text = "+$${"%.2f".format(price)}",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun ProductBottomBar(
    basePrice: Double,
    selectedModifiers: List<SelectedModifier>,
    quantity: Int,
    selectedStoreId: String?,
    espressoShotCount: Int,
    selectedMilkOption: String?,
    extraMilkShot: Boolean,
    cartItemCount: Int,
    cartTotal: Double,
    onAddToOrder: () -> Unit,
    onViewCart: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Calculate add-ons price
    val ESPRESSO_SHOT_PRICE = 1.50
    val EXTRA_MILK_SHOT_PRICE = 0.50
    val espressoPrice = espressoShotCount * ESPRESSO_SHOT_PRICE

    val milkPrice = when (selectedMilkOption) {
        "Oat Milk", "Soy Milk", "Coconut Milk", "Lactose-Free Milk" -> 0.50
        else -> 0.0
    }

    val extraMilkPrice = if (extraMilkShot) EXTRA_MILK_SHOT_PRICE else 0.0

    // Calculate total price including add-ons
    val totalPrice = (basePrice + espressoPrice + milkPrice + extraMilkPrice) * quantity

    // Determine if cart has items
    val hasCartItems = cartItemCount > 0

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BrandPrimary),
        shape = RoundedCornerShape(topStart = CornerRadius.card, topEnd = CornerRadius.card),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md)
        ) {
            // Store selection - only show if no store is selected
            if (selectedStoreId.isNullOrEmpty()) {
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
            }

            // Dynamic button layout based on cart state
            AnimatedContent(
                targetState = hasCartItems,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith
                            fadeOut(animationSpec = tween(300))
                },
                label = "bottom_bar_animation"
            ) { hasItems ->
                if (hasItems) {
                    // Split layout: Add to cart button + Cart button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Add to cart button (takes remaining space)
                        Button(
                            onClick = onAddToOrder,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = BrandPrimary
                            ),
                            shape = RoundedCornerShape(CornerRadius.button),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = Spacing.xs),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Add",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "$${"%.2f".format(totalPrice)}",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Cart button (fixed width)
                        Button(
                            onClick = onViewCart,
                            modifier = Modifier.width(120.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = BrandPrimary
                            ),
                            shape = RoundedCornerShape(CornerRadius.button),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = Spacing.xs),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                BadgedBox(
                                    badge = {
                                        Badge(
                                            containerColor = StatusError,
                                            contentColor = Color.White,
                                            modifier = Modifier.offset(x = (-4).dp, y = (-4).dp)
                                        ) {
                                            Text(
                                                text = if (cartItemCount > 99) "99+" else cartItemCount.toString(),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ShoppingCart,
                                        contentDescription = "View Cart",
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "$${"%.2f".format(cartTotal)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                } else {
                    // Full-width layout: Add to cart button only
                    Button(
                        onClick = onAddToOrder,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = BrandPrimary
                        ),
                        shape = RoundedCornerShape(CornerRadius.button),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = Spacing.xs),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Add to Cart",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$${"%.2f".format(totalPrice)}",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Enterprise-Level Helper Function
 * Determines if Add-Ons section should be displayed based on menu item category
 *
 * Add-Ons (espresso shots, milk options) are applicable to:
 * - Coffee drinks (Vienna Classics, Ethiopia, Coffee Cocktails, Summer Drinks)
 * - Hot Chocolate (can have milk options)
 *
 * Add-Ons are NOT applicable to:
 * - Ice cream products (Soft-Ice / Ice Cream category)
 *
 * @param categoryName The category name of the menu item from database
 * @return true if add-ons should be shown, false otherwise
 */
private fun shouldShowAddOnsForCategory(categoryName: String): Boolean {
    // Categories that should NOT show add-ons (only ice cream)
    val excludedCategories = setOf(
        "Soft-Ice / Ice Cream",
        "Ice Cream",
        "Soft Ice",
        "Soft-Ice"
    )

    // Case-insensitive check if category is in excluded list
    return excludedCategories.none { it.equals(categoryName, ignoreCase = true) }
}

// Preview removed - requires Hilt ViewModel injection
