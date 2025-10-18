package com.onlycoffee.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.DefaultAlpha
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import coil.request.ImageRequest

/**
 * AsyncImage with built-in caching and offline support using Coil
 *
 * This composable automatically caches images to disk and memory,
 * and displays cached versions when offline.
 */
@Composable
fun CachedAsyncImage(
    url: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    placeholder: Painter? = null,
    error: Painter? = null,
    fallback: Painter? = error,
    onLoading: ((AsyncImagePainter.State.Loading) -> Unit)? = null,
    onSuccess: ((AsyncImagePainter.State.Success) -> Unit)? = null,
    onError: ((AsyncImagePainter.State.Error) -> Unit)? = null,
    alignment: Alignment = Alignment.Center,
    contentScale: ContentScale = ContentScale.Fit,
    alpha: Float = DefaultAlpha,
    colorFilter: ColorFilter? = null
) {
    val context = LocalContext.current

    val painter = rememberAsyncImagePainter(
        model = ImageRequest.Builder(context)
            .data(url)
            .crossfade(true)
            // Enable disk caching
            .diskCacheKey(url)
            // Enable memory caching
            .memoryCacheKey(url)
            .build(),
        onLoading = onLoading,
        onSuccess = onSuccess,
        onError = onError
    )

    Image(
        painter = when (painter.state) {
            is AsyncImagePainter.State.Loading -> placeholder ?: painter
            is AsyncImagePainter.State.Error -> error ?: painter
            is AsyncImagePainter.State.Empty -> fallback ?: painter
            is AsyncImagePainter.State.Success -> painter
        },
        contentDescription = contentDescription,
        modifier = modifier,
        alignment = alignment,
        contentScale = contentScale,
        alpha = alpha,
        colorFilter = colorFilter
    )
}

/**
 * Simplified version with content builders for placeholder and error states
 */
@Composable
fun CachedAsyncImage(
    url: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Fit,
    placeholder: @Composable (() -> Unit)? = null,
    error: @Composable (() -> Unit)? = null,
    content: @Composable ((AsyncImagePainter.State) -> Unit)? = null
) {
    val context = LocalContext.current

    val painter = rememberAsyncImagePainter(
        model = ImageRequest.Builder(context)
            .data(url)
            .crossfade(true)
            // Enable disk caching
            .diskCacheKey(url)
            // Enable memory caching
            .memoryCacheKey(url)
            .build()
    )

    if (content != null) {
        content(painter.state)
    } else {
        when (painter.state) {
            is AsyncImagePainter.State.Loading -> {
                placeholder?.invoke()
            }
            is AsyncImagePainter.State.Error -> {
                error?.invoke()
            }
            is AsyncImagePainter.State.Success, is AsyncImagePainter.State.Empty -> {
                Image(
                    painter = painter,
                    contentDescription = contentDescription,
                    modifier = modifier,
                    contentScale = contentScale
                )
            }
        }
    }
}
