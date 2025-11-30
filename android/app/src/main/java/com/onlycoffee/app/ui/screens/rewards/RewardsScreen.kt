package com.onlycoffee.app.ui.screens.rewards

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.onlycoffee.app.data.model.UserTier
import com.onlycoffee.app.ui.screens.auth.AuthViewModel
import com.onlycoffee.app.ui.theme.BrandPrimary

@Composable
fun RewardsScreen(
    navController: NavController,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    if (uiState.isAuthenticated && uiState.currentUser != null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            AuthenticatedRewardsContent(uiState.currentUser!!)
        }
    } else {
        UnauthenticatedRewardsContent(navController)
    }
}

@Composable
private fun AuthenticatedRewardsContent(user: com.onlycoffee.app.data.model.User) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = getTierColor(user.loyaltyTier).copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = getTierColor(user.loyaltyTier),
                modifier = Modifier.size(60.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = user.loyaltyTier.displayName,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "{user.loyaltyPoints} points",
                style = MaterialTheme.typography.titleLarge,
                color = BrandPrimary
            )
        }
    }
    
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Text(
                text = "How it Works",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            InfoRow(Icons.Default.AttachMoney, "Earn 10 points per 1 spent")
            Spacer(modifier = Modifier.height(12.dp))
            InfoRow(Icons.Default.LocalCafe, "Redeem 500 points for 6 off")
            Spacer(modifier = Modifier.height(12.dp))
            InfoRow(Icons.Default.Star, "Unlock rewards with higher tiers")
        }
    }
    
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Text(
                text = "Tier Benefits",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            UserTier.values().forEachIndexed { index, tier ->
                TierRow(tier, tier == user.loyaltyTier)
                if (index < UserTier.values().size - 1) {
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
private fun UnauthenticatedRewardsContent(navController: NavController) {
    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = BrandPrimary,
                modifier = Modifier.size(80.dp)
            )
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "Sign In to View Rewards",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Access your loyalty points, tier benefits, and exclusive rewards",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = { navController.navigate("login") },
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .height(56.dp)
            ) {
                Text("Sign In", style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@Composable
private fun InfoRow(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = BrandPrimary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = text, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun TierRow(tier: UserTier, isCurrentTier: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = if (isCurrentTier) Icons.Default.CheckCircle else Icons.Default.Circle,
            contentDescription = null,
            tint = if (isCurrentTier) BrandPrimary else Color.Gray,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = tier.displayName,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = "{getTierPoints(tier)}+ pts",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun getTierColor(tier: UserTier): Color {
    return when (tier) {
        UserTier.BRONZE -> Color(0xFFCD7F32)
        UserTier.SILVER -> Color(0xFFC0C0C0)
        UserTier.GOLD -> Color(0xFFFFD700)
        UserTier.PLATINUM -> Color(0xFFE5E4E2)
        UserTier.BLACK -> Color(0xFF000000)
    }
}

private fun getTierPoints(tier: UserTier): Int {
    return when (tier) {
        UserTier.BRONZE -> 0
        UserTier.SILVER -> 500
        UserTier.GOLD -> 1500
        UserTier.PLATINUM -> 3000
        UserTier.BLACK -> 5000
    }
}
