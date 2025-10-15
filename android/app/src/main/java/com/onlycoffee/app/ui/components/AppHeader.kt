package com.onlycoffee.app.ui.components

// Live reload test - app relaunch

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.onlycoffee.app.R
import com.onlycoffee.app.ui.theme.BrandAccent
import com.onlycoffee.app.ui.theme.GradientEnd
import com.onlycoffee.app.ui.theme.GradientStart
import com.onlycoffee.app.ui.theme.Spacing
import com.onlycoffee.app.ui.theme.TextOnPrimary
import com.onlycoffee.app.ui.theme.TextPrimary

@Composable
fun AppHeader(
    title: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(GradientStart, GradientEnd)
                )
            )
            .padding(horizontal = Spacing.md, vertical = Spacing.sm)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Centered Logo (like iOS)
            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(R.drawable.logo),
                    contentDescription = "Only Coffee Logo",
                    modifier = Modifier.size(40.dp)
                )
            }

            // Profile button on the right (like iOS)
            Icon(
                painter = painterResource(R.drawable.ic_profile),
                contentDescription = "Profile",
                tint = TextOnPrimary,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}
