package com.onlycoffee.app.ui.theme

import androidx.compose.ui.unit.dp

// Spacing system - 8pt grid
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
    val xxxl = 64.dp
    
    // Screen padding
    val screenPadding = md
    val screenPaddingLarge = lg
    
    // Component spacing
    val componentSpacing = sm
    val sectionSpacing = lg
    val cardPadding = md
    val buttonPadding = md
    val listItemPadding = md
}

// Corner radius
object CornerRadius {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 20.dp
    val xxl = 24.dp
    
    // Specific component radii
    val button = md
    val card = lg
    val image = sm
    val input = sm
    val sheet = xl
    val dialog = md
}

// Elevation/Shadow
object Elevation {
    val none = 0.dp
    val xs = 1.dp
    val sm = 2.dp
    val md = 4.dp
    val lg = 8.dp
    val xl = 12.dp
    val xxl = 16.dp
    
    // Component elevations
    val card = sm
    val button = xs
    val fab = md
    val appBar = sm
    val bottomBar = lg
    val dialog = xxl
    val sheet = xl
}

// Border widths
object BorderWidth {
    val thin = 0.5.dp
    val default = 1.dp
    val thick = 2.dp
    val focus = 2.dp
}

// Icon sizes
object IconSize {
    val xs = 12.dp
    val sm = 16.dp
    val md = 24.dp
    val lg = 32.dp
    val xl = 48.dp
    val xxl = 64.dp
    
    // Specific icon sizes
    val tab = md
    val button = sm
    val avatar = xl
    val logo = xxl
}

// Component dimensions
object ComponentSize {
    // Button heights
    val buttonSmall = 32.dp
    val buttonMedium = 44.dp
    val buttonLarge = 56.dp
    
    // Input heights
    val inputSmall = 36.dp
    val inputMedium = 44.dp
    val inputLarge = 52.dp
    
    // Card dimensions
    val cardMinHeight = 120.dp
    val storeCardWidth = 280.dp
    val menuItemCardWidth = 160.dp

    // Carousel dimensions
    val carouselHeight = 200.dp
    
    // Image dimensions
    val avatarSmall = 32.dp
    val avatarMedium = 48.dp
    val avatarLarge = 64.dp
    val thumbnailSmall = 60.dp
    val thumbnailMedium = 80.dp
    val thumbnailLarge = 120.dp
    
    // Bottom navigation
    val bottomNavHeight = 80.dp
    val tabBarHeight = 56.dp
    
    // App bar
    val appBarHeight = 64.dp
    val toolbarHeight = 56.dp
    
    // Floating action button
    val fabSize = 56.dp
    val fabSizeSmall = 40.dp
    val fabSizeLarge = 64.dp
}

// Animation durations (in milliseconds)
object AnimationDuration {
    const val fast = 150
    const val normal = 300
    const val slow = 500
    const val verySlow = 1000
    
    // Specific animations
    const val buttonPress = fast
    const val cardExpand = normal
    const val screenTransition = normal
    const val fadeIn = fast
    const val slideIn = normal
}

// Z-index values for layering
object ZIndex {
    const val background = 0f
    const val content = 1f
    const val card = 2f
    const val appBar = 3f
    const val fab = 4f
    const val bottomSheet = 5f
    const val dialog = 6f
    const val snackbar = 7f
    const val tooltip = 8f
    const val overlay = 9f
    const val modal = 10f
}

// Opacity values
object Opacity {
    const val disabled = 0.38f
    const val inactive = 0.6f
    const val pressed = 0.12f
    const val hover = 0.08f
    const val focus = 0.12f
    const val selected = 0.16f
    const val overlay = 0.4f
    const val scrim = 0.6f
}
