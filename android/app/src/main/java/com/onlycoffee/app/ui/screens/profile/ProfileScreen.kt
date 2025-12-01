package com.onlycoffee.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.LoyaltyLedgerEntry
import com.onlycoffee.app.data.model.RewardsSummary
import com.onlycoffee.app.data.model.User
import com.onlycoffee.app.data.model.UserTier
import com.onlycoffee.app.ui.theme.BrandPrimary
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ProfileScreen(
    navController: NavController,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()

    // Show loading state while initializing (loading user data on app start)
    if (uiState.isInitializing) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(color = BrandPrimary)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Loading profile...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    } else if (uiState.isAuthenticated && uiState.currentUser != null) {
        // Authenticated state - use scrollable column with padding
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            val user = uiState.currentUser!!

            // Profile Header
            ProfileHeader(user = user)

            Spacer(modifier = Modifier.height(24.dp))

            // Rewards Section
            RewardsSection(
                user = user,
                rewardsSummary = uiState.rewardsSummary,
                isLoading = uiState.isLoadingRewards,
                error = uiState.rewardsError,
                onRetry = { viewModel.loadRewardsData() },
                onDismissError = { viewModel.clearRewardsError() }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Activity
            if (uiState.recentActivity.isNotEmpty()) {
                RecentActivitySection(
                    activities = uiState.recentActivity
                )
                Spacer(modifier = Modifier.height(24.dp))
            }

            // Settings Sections
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    SettingsItem(Icons.Default.Person, "Account Settings") {
                        // Navigate to account settings
                    }
                    Divider()
                    SettingsItem(Icons.Default.LocalOffer, "My Coupons") {
                        // Navigate to coupons
                    }
                    Divider()
                    SettingsItem(Icons.Default.Payment, "Payment Methods") {
                        // Navigate to payment methods
                    }
                    Divider()
                    SettingsItem(Icons.Default.LocationOn, "Saved Addresses") {
                        // Navigate to addresses
                    }
                }
            }

            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    SettingsItem(Icons.Default.Notifications, "Notifications") {
                        // Navigate to notifications settings
                    }
                    Divider()
                    SettingsItem(Icons.Default.Security, "Privacy & Security") {
                        // Navigate to privacy settings
                    }
                }
            }

            // Sign Out Button
            Button(
                onClick = { viewModel.signOut() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(Icons.Default.Logout, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", style = MaterialTheme.typography.titleMedium)
            }
        }
    } else {
        // Unauthenticated state - use Box for proper centering
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(80.dp)
                )
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "Sign In to View Profile",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Access your account settings, orders, and preferences",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = {
                        navController.navigate("login")
                    },
                    modifier = Modifier
                        .fillMaxWidth(0.7f)
                        .height(56.dp)
                ) {
                    Text("Sign In", style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}

/**
 * Profile Header Component
 * Shows user avatar, name, email
 */
@Composable
private fun ProfileHeader(user: User) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier.size(80.dp),
            shape = CircleShape,
            color = BrandPrimary.copy(alpha = 0.1f)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(40.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = user.fullName,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = user.email,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Rewards Section Component
 * Shows rewards card with points, tier, and progress
 */
@Composable
private fun RewardsSection(
    user: User,
    rewardsSummary: RewardsSummary?,
    isLoading: Boolean,
    error: String?,
    onRetry: () -> Unit,
    onDismissError: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = getTierColor(user.loyaltyTier).copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Rewards",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = getTierIcon(user.loyaltyTier),
                    contentDescription = null,
                    tint = getTierColor(user.loyaltyTier),
                    modifier = Modifier.size(32.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Loading State
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = BrandPrimary)
                }
            }
            // Error State
            else if (error != null) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row {
                        TextButton(onClick = onRetry) {
                            Text("Retry")
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        TextButton(onClick = onDismissError) {
                            Text("Dismiss")
                        }
                    }
                }
            }
            // Success State
            else if (rewardsSummary != null) {
                // Points Display
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "${rewardsSummary.currentPoints}",
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                            color = getTierColor(user.loyaltyTier)
                        )
                        Text(
                            text = "Points",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = getTierColor(user.loyaltyTier).copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = rewardsSummary.currentTier.uppercase(),
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = getTierColor(user.loyaltyTier),
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Progress to Next Tier
                if (rewardsSummary.nextTier != null && rewardsSummary.pointsToNextTier != null) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Next: ${rewardsSummary.nextTier.uppercase()}",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "${rewardsSummary.pointsToNextTier} pts to go",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = rewardsSummary.progressToNextTier,
                            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                            color = getTierColor(user.loyaltyTier),
                            trackColor = getTierColor(user.loyaltyTier).copy(alpha = 0.2f)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Expiring Points Warning
                if (rewardsSummary.hasExpiringPoints) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.errorContainer
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "${rewardsSummary.expiringPointsNext30Days} points expiring in 30 days",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Redemption Value
                Text(
                    text = "Your points are worth $${String.format("%.2f", rewardsSummary.redemptionValue)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                // How it Works
                Column {
                    Text(
                        text = "How it Works",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(Icons.Default.AttachMoney, "Earn 10 points per $1 spent")
                    Spacer(modifier = Modifier.height(4.dp))
                    InfoRow(Icons.Default.LocalCafe, "Redeem 500 points for $6 off")
                }
            }
        }
    }
}

/**
 * Recent Activity Section
 * Shows recent loyalty transactions
 */
@Composable
private fun RecentActivitySection(activities: List<LoyaltyLedgerEntry>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Recent Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            activities.take(5).forEach { activity ->
                ActivityItem(activity)
                if (activity != activities.last()) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

/**
 * Activity Item Component
 */
@Composable
private fun ActivityItem(activity: LoyaltyLedgerEntry) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = activity.displayReason,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = dateFormat.format(activity.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Text(
            text = activity.formattedPoints,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = if (activity.isEarned) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
        )
    }
}

/**
 * Info Row Component
 */
@Composable
private fun InfoRow(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = BrandPrimary,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

/**
 * Settings Item Component
 */
@Composable
private fun SettingsItem(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = BrandPrimary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Get tier color
 * Enterprise-level: Handle null tier gracefully with default
 */
private fun getTierColor(tier: UserTier?): Color {
    return when (tier) {
        UserTier.BRONZE, null -> Color(0xFFCD7F32) // Default to BRONZE if null
        UserTier.SILVER -> Color(0xFFC0C0C0)
        UserTier.GOLD -> Color(0xFFFFD700)
        UserTier.PLATINUM -> Color(0xFFE5E4E2)
        UserTier.BLACK -> Color(0xFF000000)
    }
}

/**
 * Get tier icon
 * Enterprise-level: Handle null tier gracefully with default
 */
private fun getTierIcon(tier: UserTier?): ImageVector {
    return when (tier) {
        UserTier.BRONZE, null -> Icons.Default.Shield // Default to BRONZE if null
        UserTier.SILVER -> Icons.Default.Star
        UserTier.GOLD -> Icons.Default.EmojiEvents
        UserTier.PLATINUM -> Icons.Default.Diamond
        UserTier.BLACK -> Icons.Default.AutoAwesome
    }
}
