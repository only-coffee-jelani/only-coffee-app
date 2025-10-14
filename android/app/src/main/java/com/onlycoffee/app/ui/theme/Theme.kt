package com.onlycoffee.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = BrandPrimary,
    onPrimary = TextOnPrimary,
    primaryContainer = BrandSecondary,
    onPrimaryContainer = TextOnSecondary,
    
    secondary = BrandAccent,
    onSecondary = TextPrimary,
    secondaryContainer = BrandAccent.copy(alpha = 0.1f),
    onSecondaryContainer = TextPrimary,
    
    tertiary = BrandAccent,
    onTertiary = TextPrimary,
    tertiaryContainer = BrandAccent.copy(alpha = 0.1f),
    onTertiaryContainer = TextPrimary,
    
    error = StatusError,
    onError = TextOnPrimary,
    errorContainer = StatusError.copy(alpha = 0.1f),
    onErrorContainer = StatusError,
    
    background = BackgroundPrimary,
    onBackground = TextPrimary,
    
    surface = CardBackground,
    onSurface = TextPrimary,
    surfaceVariant = BackgroundSecondary,
    onSurfaceVariant = TextSecondary,
    
    outline = BorderMedium,
    outlineVariant = BorderLight,
    
    scrim = OverlayDark,
    
    inverseSurface = TextPrimary,
    inverseOnSurface = BackgroundPrimary,
    inversePrimary = BrandSecondary,
    
    surfaceDim = BackgroundSecondary,
    surfaceBright = CardBackground,
    surfaceContainerLowest = BackgroundPrimary,
    surfaceContainerLow = BackgroundSecondary,
    surfaceContainer = CardBackground,
    surfaceContainerHigh = CardBackground,
    surfaceContainerHighest = BackgroundSecondary
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandAccent,
    onPrimary = TextPrimary,
    primaryContainer = BrandPrimary,
    onPrimaryContainer = DarkTextPrimary,
    
    secondary = BrandSecondary,
    onSecondary = TextPrimary,
    secondaryContainer = BrandSecondary.copy(alpha = 0.2f),
    onSecondaryContainer = DarkTextPrimary,
    
    tertiary = BrandAccent,
    onTertiary = TextPrimary,
    tertiaryContainer = BrandAccent.copy(alpha = 0.2f),
    onTertiaryContainer = DarkTextPrimary,
    
    error = StatusError,
    onError = TextOnPrimary,
    errorContainer = StatusError.copy(alpha = 0.2f),
    onErrorContainer = StatusError,
    
    background = DarkBackgroundPrimary,
    onBackground = DarkTextPrimary,
    
    surface = DarkCardBackground,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkBackgroundSecondary,
    onSurfaceVariant = DarkTextSecondary,
    
    outline = DarkTextTertiary,
    outlineVariant = DarkTextTertiary.copy(alpha = 0.5f),
    
    scrim = OverlayDark,
    
    inverseSurface = DarkTextPrimary,
    inverseOnSurface = DarkBackgroundPrimary,
    inversePrimary = BrandPrimary,
    
    surfaceDim = DarkBackgroundPrimary,
    surfaceBright = DarkCardBackground,
    surfaceContainerLowest = DarkBackgroundPrimary,
    surfaceContainerLow = DarkBackgroundSecondary,
    surfaceContainer = DarkCardBackground,
    surfaceContainerHigh = DarkCardBackground,
    surfaceContainerHighest = DarkBackgroundSecondary
)

@Composable
fun OnlyCoffeeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = OnlyCoffeeTypography,
        content = content
    )
}
