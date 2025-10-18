package com.onlycoffee.app.utils

import android.content.Context
import coil.ImageLoader
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.request.CachePolicy
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Manages image caching for offline support using Coil
 */
object ImageCacheManager {

    /**
     * Creates a configured ImageLoader with offline support
     */
    fun createImageLoader(context: Context): ImageLoader {
        // Configure disk cache
        val diskCache = DiskCache.Builder()
            .directory(context.cacheDir.resolve("image_cache"))
            .maxSizeBytes(100 * 1024 * 1024) // 100 MB
            .build()

        // Configure memory cache
        val memoryCache = MemoryCache.Builder(context)
            .maxSizePercent(0.25) // 25% of app memory
            .build()

        // Configure OkHttp with cache
        val okHttpClient = OkHttpClient.Builder()
            .cache(
                okhttp3.Cache(
                    directory = context.cacheDir.resolve("http_cache"),
                    maxSize = 50 * 1024 * 1024 // 50 MB
                )
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return ImageLoader.Builder(context)
            .memoryCache { memoryCache }
            .diskCache { diskCache }
            .okHttpClient { okHttpClient }
            // Enable disk caching
            .diskCachePolicy(CachePolicy.ENABLED)
            // Enable memory caching
            .memoryCachePolicy(CachePolicy.ENABLED)
            // Enable network caching
            .networkCachePolicy(CachePolicy.ENABLED)
            // Allow fetching from network when offline using cached data
            .respectCacheHeaders(false) // Ignore server cache headers for offline support
            .build()
    }

    /**
     * Clear all cached images
     */
    fun clearCache(context: Context, imageLoader: ImageLoader) {
        imageLoader.memoryCache?.clear()
        imageLoader.diskCache?.clear()
    }

    /**
     * Get cache size in bytes
     */
    fun getCacheSize(imageLoader: ImageLoader): Long {
        val diskCacheSize = imageLoader.diskCache?.size ?: 0L
        val memoryCacheSize = imageLoader.memoryCache?.size ?: 0
        return diskCacheSize + memoryCacheSize
    }
}
