package com.onlycoffee.app.ui.screens.loyalty

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoyaltyDashboardScreen(
    viewModel: LoyaltyViewModel = hiltViewModel(),
    onNavigateToTokens: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Loyalty Rewards") },
                actions = {
                    IconButton(onClick = { viewModel.refreshData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            uiState.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Error Loading Loyalty Data",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = uiState.error ?: "Unknown error",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Button(onClick = { viewModel.refreshData() }) {
                            Text("Retry")
                        }
                    }
                }
            }

            uiState.dashboard != null -> {
                val dashboard = uiState.dashboard!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header with tier and points
                    LoyaltyHeaderCard(
                        tier = dashboard.tier.currentTier,
                        monthlyPoints = dashboard.streak.monthlyPoints
                    )

                    // Streak progress card
                    StreakProgressCard(
                        consecutiveDays = dashboard.streak.consecutiveDays,
                        longestStreak = dashboard.streak.longestStreak,
                        visitedToday = uiState.visitedToday
                    )

                    // Next milestone card
                    dashboard.nextMilestone.nextMilestone?.let { milestone ->
                        dashboard.nextMilestone.reward?.let { reward ->
                            NextMilestoneCard(
                                currentDay = dashboard.streak.consecutiveDays,
                                milestoneDay = milestone,
                                reward = reward
                            )
                        }
                    }

                    // Streak saver tokens
                    if (dashboard.streakSaverTokens > 0) {
                        StreakSaverTokensCard(
                            tokenCount = dashboard.streakSaverTokens,
                            onClick = onNavigateToTokens
                        )
                    }

                    // Tier progress
                    TierProgressCard(tierProgress = dashboard.tier)

                    // Tier perks
                    if (dashboard.perks.isNotEmpty()) {
                        TierPerksSection(perks = dashboard.perks)
                    }

                    // Anniversary
                    dashboard.nextAnniversary.nextAnniversaryDate?.let { date ->
                        dashboard.nextAnniversary.nextAnniversaryYear?.let { year ->
                            AnniversaryCard(
                                year = year,
                                daysUntil = dashboard.nextAnniversary.daysUntilAnniversary ?: 0
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}
