package com.onlycoffee.app.di

import com.onlycoffee.app.managers.CarouselAnalyticsManager
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * Entry point for accessing CarouselAnalyticsManager from Compose
 */
@EntryPoint
@InstallIn(SingletonComponent::class)
interface CarouselAnalyticsEntryPoint {
    fun carouselAnalyticsManager(): CarouselAnalyticsManager
}

