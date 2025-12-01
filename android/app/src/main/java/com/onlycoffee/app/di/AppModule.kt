package com.onlycoffee.app.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // PushNotificationManager is provided via @Inject constructor
    // No manual provider needed
}
