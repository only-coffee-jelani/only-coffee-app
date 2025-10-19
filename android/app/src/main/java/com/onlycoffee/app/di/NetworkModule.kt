package com.onlycoffee.app.di

import com.onlycoffee.app.BuildConfig
import com.onlycoffee.app.data.api.SplashScreenApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit {
        val baseUrl = BuildConfig.API_BASE_URL
        val urlWithTrailingSlash = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

        return Retrofit.Builder()
            .baseUrl(urlWithTrailingSlash)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideSplashScreenApi(retrofit: Retrofit): SplashScreenApi {
        return retrofit.create(SplashScreenApi::class.java)
    }
}

