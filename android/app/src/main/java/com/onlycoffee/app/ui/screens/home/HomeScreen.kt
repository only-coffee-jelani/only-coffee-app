package com.onlycoffee.app.ui.screens.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
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
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import coil.request.ImageRequest
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.R
import com.onlycoffee.app.managers.CarouselAnalyticsManager
import com.onlycoffee.app.ui.theme.AnimationDuration
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.ComponentSize
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.Elevation
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Opacity
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = hiltViewModel(),
    analyticsManager: CarouselAnalyticsManager
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val uiState by viewModel.uiState.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current

    // Share app function
    val shareApp = {
        val shareIntent = android.content.Intent().apply {
            action = android.content.Intent.ACTION_SEND
            type = "text/plain"
            putExtra(
                android.content.Intent.EXTRA_SUBJECT,
                "Join me on Only Coffee!"
            )
            putExtra(
                android.content.Intent.EXTRA_TEXT,
                "Hey! I've been using Only Coffee for my daily coffee fix and I love it! " +
                "Download the app and get a free drink when you sign up with my referral code. " +
                "No lines, no waiting - just great coffee! 🎉☕\n\n" +
                "Download here: https://onlycoffee.app"
            )
        }
        context.startActivity(
            android.content.Intent.createChooser(shareIntent, "Share Only Coffee")
        )
    }

    // Start carousel session when carousel items are loaded
    LaunchedEffect(uiState.carouselItems) {
        if (uiState.carouselItems.isNotEmpty()) {
            val firstCarousel = uiState.carouselItems.firstOrNull()?.carouselId
            if (firstCarousel != null) {
                analyticsManager.startCarouselSession(firstCarousel)
            }
        }
    }

    // End carousel session when leaving the screen
    androidx.compose.runtime.DisposableEffect(Unit) {
        onDispose {
            analyticsManager.endCarouselSession()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary),
        contentPadding = PaddingValues(top = Spacing.md, bottom = Spacing.lg)
    ) {
        item {
            // Promotional Carousel - fetched from backend with enterprise analytics
            PromoCarousel(
                carouselItems = uiState.carouselItems,
                analyticsManager = analyticsManager,
                onCarouselItemClick = { carouselItem, position, totalItems ->
                    // Track click event with analytics
                    analyticsManager.trackClick(
                        carouselItemId = carouselItem.id,
                        carouselId = carouselItem.carouselId,
                        position = position,
                        totalItems = totalItems,
                        deeplink = carouselItem.deeplink
                    )

                    navController.navigate("menu") {
                        // Pop up to the start destination to avoid building up a large stack
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        // Avoid multiple copies of the same destination
                        launchSingleTop = true
                        // Restore state when reselecting a previously selected item
                        restoreState = true
                    }
                }
            )
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.md))
        }

        item {
            // Two Quick Action Cards (50% width each) with S3 images
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Spacing.screenPadding),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                QuickActionCardWithImage(
                    title = "Order Now",
                    imageUrl = "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/order-now-card.webp",
                    modifier = Modifier.weight(1f),
                    onClick = {
                        navController.navigate("menu") {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )

                QuickActionCardWithImage(
                    title = "Refer Friends",
                    imageUrl = "https://only-coffee-assets.s3.us-east-1.amazonaws.com/promotions/refer-friends-card.webp",
                    modifier = Modifier.weight(1f),
                    onClick = { shareApp() }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.xl))
        }

        item {
            // Promotions Section Title
            Text(
                text = "Promotions",
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = Spacing.screenPadding)
            )
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.md))
        }

        item {
            // Promotion Card 1: Invite a friend
            PromotionCard(
                title = "Invite a friend, get a free coffee",
                description = "Share the love and earn rewards",
                buttonText = "Share Now",
                icon = R.drawable.ic_rewards,
                backgroundColor = BrandPrimary.copy(alpha = 0.1f),
                onButtonClick = { shareApp() }
            )
        }

        item {
            // Promotion Card 2: Join Daily Club
            PromotionCard(
                title = "Join the Daily Club",
                description = "Subscribe for daily coffee perks",
                buttonText = "Order Now",
                icon = R.drawable.ic_star,
                backgroundColor = BrandAccent.copy(alpha = 0.1f),
                onButtonClick = {
                    navController.navigate("menu") {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }

        item {
            // Promotion Card 3: Business Catering
            PromotionCard(
                title = "Business / Event Catering",
                description = "Perfect for your next meeting or event",
                buttonText = "Order Now",
                icon = R.drawable.ic_coffee,
                backgroundColor = CardBackground,
                onButtonClick = {
                    navController.navigate("menu") {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }

        item {
            // Locations Card
            PromotionCard(
                title = "Find a Location",
                description = "Discover Only Coffee stores near you",
                buttonText = "View Locations",
                icon = R.drawable.ic_location,
                backgroundColor = BrandAccent.copy(alpha = 0.15f),
                onButtonClick = {
                    navController.navigate("menu") {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
fun SignInCard(
    screenHeight: androidx.compose.ui.unit.Dp,
    onSignInClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(screenHeight * 0.3f)
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        BrandPrimary.copy(alpha = 0.8f),
                        BrandAccent.copy(alpha = 0.6f)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Background coffee cup icon
        Icon(
            painter = painterResource(R.drawable.ic_coffee),
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.2f),
            modifier = Modifier.size(200.dp)
        )

        // Sign In Content
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(Spacing.lg)
        ) {
            Text(
                text = "Join Only Coffee",
                style = MaterialTheme.typography.headlineLarge,
                color = TextOnPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp
            )

            Spacer(modifier = Modifier.height(Spacing.sm))

            Text(
                text = "Earn rewards on every order",
                style = MaterialTheme.typography.bodyLarge,
                color = TextOnPrimary.copy(alpha = 0.9f)
            )

            Spacer(modifier = Modifier.height(Spacing.lg))

            Button(
                onClick = onSignInClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = TextOnPrimary
                ),
                shape = RoundedCornerShape(25.dp),
                modifier = Modifier.padding(horizontal = Spacing.xl)
            ) {
                Text(
                    text = "Sign In / Join Now",
                    style = MaterialTheme.typography.labelLarge,
                    color = BrandPrimary,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.xs)
                )
            }
        }
    }
}

/**
 * PromoCarousel - Enterprise-level promotional carousel component with comprehensive analytics
 *
 * Features:
 * - Fixed height for consistent UI across all images
 * - Auto-scrolling with configurable interval
 * - Page indicators for multi-item carousels
 * - Smooth crossfade transitions
 * - Proper image scaling (Fit) to show entire image
 * - Clickable items with navigation support
 * - Material 3 design with elevation and rounded corners
 * - Accessibility support with content descriptions
 * - Error handling with fallback placeholder
 * - Enterprise-level analytics tracking (impressions, clicks, swipes, auto-advance, time-on-slide)
 *
 * @param carouselItems List of carousel items from backend API
 * @param analyticsManager Analytics manager for tracking carousel interactions
 * @param onCarouselItemClick Callback invoked when a carousel item is clicked (receives item, position, totalItems)
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PromoCarousel(
    carouselItems: List<com.onlycoffee.app.data.model.CarouselItem>,
    analyticsManager: CarouselAnalyticsManager? = null,
    onCarouselItemClick: (com.onlycoffee.app.data.model.CarouselItem, Int, Int) -> Unit = { _, _, _ -> }
) {
    // Early return if no items to display
    if (carouselItems.isEmpty()) {
        return
    }

    val pagerState = rememberPagerState(pageCount = { carouselItems.size })
    var previousPage by remember { mutableStateOf(0) }

    // Auto-scroll configuration
    val autoScrollDelayMillis = 3000L

    // Track impressions when page changes
    LaunchedEffect(pagerState.currentPage) {
        val currentItem = carouselItems.getOrNull(pagerState.currentPage)
        if (currentItem != null) {
            analyticsManager?.trackImpression(
                carouselItemId = currentItem.id,
                carouselId = currentItem.carouselId,
                position = pagerState.currentPage,
                totalItems = carouselItems.size
            )
        }
    }

    // Auto-scroll effect with analytics tracking
    LaunchedEffect(carouselItems.size) {
        if (carouselItems.size > 1) {
            while (true) {
                delay(autoScrollDelayMillis)

                // Track auto-advance event for current item before advancing
                val currentItem = carouselItems.getOrNull(pagerState.currentPage)
                if (currentItem != null) {
                    analyticsManager?.trackAutoAdvance(
                        carouselItemId = currentItem.id,
                        carouselId = currentItem.carouselId,
                        position = pagerState.currentPage,
                        totalItems = carouselItems.size
                    )
                }

                val nextPage = (pagerState.currentPage + 1) % carouselItems.size
                pagerState.animateScrollToPage(nextPage)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
    ) {
        // Carousel pager with fixed height and analytics tracking
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .height(ComponentSize.carouselHeight)
                .padding(horizontal = Spacing.screenPadding),
            pageSpacing = Spacing.md
        ) { page ->
            val carouselItem = carouselItems[page]
            CarouselCard(
                carouselItem = carouselItem,
                pageNumber = page + 1,
                onClick = {
                    onCarouselItemClick(carouselItem, page, carouselItems.size)
                }
            )
        }

        // Page indicators - only show for multiple items
        if (carouselItems.size > 1) {
            CarouselPageIndicator(
                pageCount = carouselItems.size,
                currentPage = pagerState.currentPage,
                modifier = Modifier
                    .align(Alignment.CenterHorizontally)
                    .padding(top = Spacing.sm, bottom = Spacing.xs)
            )
        }
    }
}

/**
 * CarouselCard - Individual carousel item card
 *
 * Displays a promotional image with:
 * - Fixed height container
 * - ContentScale.Fit to show entire image without cropping
 * - Clean borderless design
 * - Rounded corners for modern look
 * - Smooth image loading with crossfade
 * - Click handling for navigation
 *
 * @param carouselItem The carousel item data
 * @param pageNumber The page number for accessibility
 * @param onClick Callback invoked when the card is clicked
 */
@Composable
private fun CarouselCard(
    carouselItem: com.onlycoffee.app.data.model.CarouselItem,
    pageNumber: Int,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(ComponentSize.carouselHeight)
            .clip(RoundedCornerShape(CornerRadius.card))
            .background(Color.White)
            .clickable(
                onClick = onClick,
                role = androidx.compose.ui.semantics.Role.Button
            ),
        contentAlignment = Alignment.Center
    ) {
        coil.compose.AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(carouselItem.imageUrl)
                .crossfade(AnimationDuration.normal)
                .build(),
            contentDescription = carouselItem.title ?: "Promotion $pageNumber",
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(CornerRadius.card)),
            contentScale = ContentScale.Fit,
            placeholder = painterResource(R.drawable.ic_coffee),
            error = painterResource(R.drawable.ic_coffee)
        )
    }
}

/**
 * CarouselPageIndicator - Page indicator dots
 *
 * Displays dots to indicate current page position:
 * - Active page: Brand primary color
 * - Inactive pages: Muted secondary color
 * - Smooth color transitions
 *
 * @param pageCount Total number of pages
 * @param currentPage Current active page index
 * @param modifier Optional modifier
 */
@Composable
private fun CarouselPageIndicator(
    pageCount: Int,
    currentPage: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        repeat(pageCount) { index ->
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        color = if (index == currentPage) {
                            BrandPrimary
                        } else {
                            TextSecondary.copy(alpha = Opacity.inactive)
                        },
                        shape = CircleShape
                    )
            )
        }
    }
}

@Composable
fun QuickActionCard(
    title: String,
    icon: Int,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(100.dp),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(Spacing.md),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                painter = painterResource(icon),
                contentDescription = title,
                tint = BrandPrimary,
                modifier = Modifier.size(40.dp)
            )

            Spacer(modifier = Modifier.height(Spacing.sm))

            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun QuickActionCardWithImage(
    title: String,
    imageUrl: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(100.dp),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            coil.compose.AsyncImage(
                model = imageUrl,
                contentDescription = title,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(CornerRadius.card)),
                contentScale = ContentScale.Crop,
                placeholder = painterResource(R.drawable.ic_coffee),
                error = painterResource(R.drawable.ic_coffee)
            )
        }
    }
}

@Composable
fun PromotionCard(
    title: String,
    description: String,
    buttonText: String,
    icon: Int,
    backgroundColor: Color,
    onButtonClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screenPadding, vertical = Spacing.xs),
        shape = RoundedCornerShape(CornerRadius.card),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.lg)
        ) {
            Icon(
                painter = painterResource(icon),
                contentDescription = null,
                tint = BrandPrimary,
                modifier = Modifier.size(40.dp)
            )

            Spacer(modifier = Modifier.height(Spacing.md))

            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(Spacing.xs))

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(Spacing.md))

            Button(
                onClick = onButtonClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandPrimary
                ),
                shape = RoundedCornerShape(CornerRadius.button)
            ) {
                Text(
                    text = buttonText,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(vertical = Spacing.xs)
                )
            }
        }
    }
}

// Preview disabled - requires Hilt injection for CarouselAnalyticsManager
// @Preview(showBackground = true)
// @Composable
// fun HomeScreenPreview() {
//     OnlyCoffeeTheme {
//         HomeScreen(navController = rememberNavController())
//     }
// }
