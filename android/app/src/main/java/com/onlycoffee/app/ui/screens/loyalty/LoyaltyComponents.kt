package com.onlycoffee.app.ui.screens.loyalty

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.onlycoffee.app.data.model.*

// MARK: - Loyalty Header Card
@Composable
fun LoyaltyHeaderCard(
    tier: UserTier,
    monthlyPoints: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TierBadge(tier = tier, size = 60.dp)

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "$monthlyPoints pts",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "this month",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// MARK: - Tier Badge
@Composable
fun TierBadge(
    tier: UserTier,
    size: androidx.compose.ui.unit.Dp
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(brush = getTierGradient(tier)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = getTierIcon(tier),
                contentDescription = "${tier.displayName} tier",
                modifier = Modifier.size(size * 0.5f),
                tint = Color.White
            )
        }

        Text(
            text = tier.displayName,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun getTierGradient(tier: UserTier): Brush {
    return when (tier) {
        UserTier.BRONZE -> Brush.linearGradient(
            colors = listOf(Color(0xFFCC8866), Color(0xFF996633))
        )
        UserTier.SILVER -> Brush.linearGradient(
            colors = listOf(Color(0xFFC0C0C0), Color(0xFF808080))
        )
        UserTier.GOLD -> Brush.linearGradient(
            colors = listOf(Color(0xFFFFD700), Color(0xFFDAA520))
        )
        UserTier.PLATINUM -> Brush.linearGradient(
            colors = listOf(Color(0xFFE5F3FF), Color(0xFF99BBDD))
        )
        UserTier.BLACK -> Brush.linearGradient(
            colors = listOf(Color(0xFF333333), Color.Black)
        )
    }
}

@Composable
private fun getTierIcon(tier: UserTier): ImageVector {
    return when (tier) {
        UserTier.BRONZE -> Icons.Default.Shield
        UserTier.SILVER -> Icons.Default.Star
        UserTier.GOLD -> Icons.Default.EmojiEvents  // Crown/trophy
        UserTier.PLATINUM -> Icons.Default.Diamond
        UserTier.BLACK -> Icons.Default.AutoAwesome  // Sparkles
    }
}

// MARK: - Streak Progress Card
@Composable
fun StreakProgressCard(
    consecutiveDays: Int,
    longestStreak: Int,
    visitedToday: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Main streak counter
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = "Streak flame",
                    modifier = Modifier.size(40.dp),
                    tint = Color(0xFFFF6B35)
                )

                Text(
                    text = "$consecutiveDays",
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "day${if (consecutiveDays == 1) "" else "s"}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 16.dp)
                )
            }

            Text(
                text = "Current Streak",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Visit status badge
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = if (visitedToday)
                    Color(0xFF4CAF50).copy(alpha = 0.1f)
                else
                    MaterialTheme.colorScheme.surfaceVariant
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (visitedToday) Icons.Default.CheckCircle else Icons.Default.Circle,
                        contentDescription = null,
                        tint = if (visitedToday) Color(0xFF4CAF50) else MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Text(
                        text = if (visitedToday) "Visited today!" else "Visit today to keep your streak",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (visitedToday) Color(0xFF4CAF50) else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Longest streak
            if (longestStreak > 0) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.EmojiEvents,
                        contentDescription = "Trophy",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(20.dp)
                    )

                    Text(
                        text = "Longest: $longestStreak day${if (longestStreak == 1) "" else "s"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// MARK: - Next Milestone Card
@Composable
fun NextMilestoneCard(
    currentDay: Int,
    milestoneDay: Int,
    reward: StreakReward
) {
    val daysRemaining = (milestoneDay - currentDay).coerceAtLeast(0)
    val progress = currentDay.toFloat() / milestoneDay.toFloat()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Next Reward",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Text(
                    text = "Day $milestoneDay",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFFFF6B35)
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.CardGiftcard,
                    contentDescription = "Gift",
                    modifier = Modifier.size(32.dp),
                    tint = Color(0xFFFF6B35)
                )

                Column {
                    Text(
                        text = reward.label,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Medium
                    )

                    reward.description?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Progress bar
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "$daysRemaining day${if (daysRemaining == 1) "" else "s"} to go",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                LinearProgressIndicator(
                    progress = progress.coerceIn(0f, 1f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = Color(0xFFFF6B35),
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
            }
        }
    }
}

// MARK: - Streak Saver Tokens Card
@Composable
fun StreakSaverTokensCard(
    tokenCount: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = "Shield",
                    modifier = Modifier.size(32.dp),
                    tint = Color(0xFF2196F3)
                )

                Column {
                    Text(
                        text = "Streak Saver Tokens",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )

                    Text(
                        text = "$tokenCount available",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Navigate",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// MARK: - Tier Progress Card
@Composable
fun TierProgressCard(tierProgress: TierProgress) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Tier Progress",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            if (tierProgress.nextTier != null) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    TierBadge(tier = tierProgress.currentTier, size = 50.dp)

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Next: ${tierProgress.nextTier.displayName}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )

                        // Progress metrics
                        ProgressMetric(
                            label = "Monthly Visits",
                            current = tierProgress.progress.monthlyVisits.current,
                            required = tierProgress.progress.monthlyVisits.required
                        )

                        ProgressMetric(
                            label = "Tier XP",
                            current = tierProgress.progress.tierXP.current,
                            required = tierProgress.progress.tierXP.required
                        )
                    }
                }
            } else {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TierBadge(tier = tierProgress.currentTier, size = 50.dp)

                    Text(
                        text = "Maximum tier reached!",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF4CAF50)
                    )
                }
            }
        }
    }
}

@Composable
private fun ProgressMetric(
    label: String,
    current: Int,
    required: Int
) {
    val progress = if (required > 0) (current.toFloat() / required).coerceAtMost(1f) else 0f

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = "$current/$required",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium
            )
        }

        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp)),
            color = Color(0xFF2196F3),
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
    }
}

// MARK: - Tier Perks Section
@Composable
fun TierPerksSection(perks: List<TierPerk>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Your Perks",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        perks.forEach { perk ->
            PerkRow(perk = perk)
        }
    }
}

@Composable
private fun PerkRow(perk: TierPerk) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.secondaryContainer
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Star,  // Default icon
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = Color(0xFF2196F3)
            )

            Column {
                Text(
                    text = perk.perkName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )

                Text(
                    text = perk.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// MARK: - Anniversary Card
@Composable
fun AnniversaryCard(
    year: Int,
    daysUntil: Int
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF9C27B0).copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Cake,
                contentDescription = "Anniversary",
                modifier = Modifier.size(32.dp),
                tint = Color(0xFF9C27B0)
            )

            Column {
                Text(
                    text = "$year Year Anniversary",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Text(
                    text = "In $daysUntil day${if (daysUntil == 1) "" else "s"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
