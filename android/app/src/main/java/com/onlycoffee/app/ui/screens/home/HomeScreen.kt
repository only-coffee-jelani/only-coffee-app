package com.onlycoffee.app.ui.screens.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.onlycoffee.app.R
import com.onlycoffee.app.ui.theme.BackgroundPrimary
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.BrandPrimary
import com.onlycoffee.app.ui.theme.CardBackground
import com.onlycoffee.app.ui.theme.CornerRadius
import com.onlycoffee.app.ui.theme.OnlyCoffeeTheme
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextPrimary
import com.onlycoffee.app.ui.theme.TextSecondary
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundPrimary),
        contentPadding = PaddingValues(top = Spacing.md, bottom = Spacing.lg)
    ) {
        item {
            // Promotional Carousel (No title, 5 slides)
            PromoCarousel()
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.md))
        }

        item {
            // Two Quick Action Cards (50% width each)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Spacing.screenPadding),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                QuickActionCard(
                    title = "Order Now",
                    icon = R.drawable.ic_location,
                    backgroundColor = BrandPrimary.copy(alpha = 0.1f),
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate("menu") }
                )

                QuickActionCard(
                    title = "Refer Friends",
                    icon = R.drawable.ic_profile,
                    backgroundColor = BrandAccent.copy(alpha = 0.1f),
                    modifier = Modifier.weight(1f),
                    onClick = { /* Handle refer friends */ }
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
                onButtonClick = { /* Handle share */ }
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
                onButtonClick = { navController.navigate("menu") }
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
                onButtonClick = { navController.navigate("menu") }
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
                onButtonClick = { navController.navigate("locations") }
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PromoCarousel() {
    val pagerState = rememberPagerState(pageCount = { 5 })

    // Auto-scroll
    LaunchedEffect(Unit) {
        while (true) {
            delay(3000)
            val nextPage = (pagerState.currentPage + 1) % 5
            pagerState.animateScrollToPage(nextPage)
        }
    }

    Column {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
        ) { page ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                BrandPrimary.copy(alpha = 0.7f),
                                BrandAccent.copy(alpha = 0.5f)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        painter = painterResource(R.drawable.ic_coffee),
                        contentDescription = null,
                        tint = TextOnPrimary,
                        modifier = Modifier.size(60.dp)
                    )

                    Spacer(modifier = Modifier.height(Spacing.md))

                    Text(
                        text = "Special Offer ${page + 1}",
                        style = MaterialTheme.typography.headlineSmall,
                        color = TextOnPrimary,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "Limited time only",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextOnPrimary.copy(alpha = 0.9f)
                    )
                }
            }
        }

        // Simple page indicator
        Row(
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .padding(Spacing.sm),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(5) { index ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(8.dp)
                        .background(
                            color = if (index == pagerState.currentPage) BrandPrimary else TextSecondary.copy(alpha = 0.3f),
                            shape = CircleShape
                        )
                )
            }
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

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    OnlyCoffeeTheme {
        HomeScreen(navController = rememberNavController())
    }
}
