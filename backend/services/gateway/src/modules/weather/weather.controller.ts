import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Get current weather for coordinates
   * GET /api/v1/weather/current?lat=37.7749&lon=-122.4194
   */
  @Get('current')
  async getCurrentWeather(@Query('lat') lat: string, @Query('lon') lon: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates',
      };
    }

    const weather = await this.weatherService.getCurrentWeather(latitude, longitude);

    if (!weather) {
      return {
        success: false,
        error: 'Weather data not available',
      };
    }

    return {
      success: true,
      weather,
    };
  }

  /**
   * Get weather by city name
   * GET /api/v1/weather/city?name=San Francisco
   */
  @Get('city')
  async getWeatherByCity(@Query('name') city: string) {
    if (!city) {
      return {
        success: false,
        error: 'City name is required',
      };
    }

    const weather = await this.weatherService.getWeatherByCity(city);

    if (!weather) {
      return {
        success: false,
        error: 'Weather data not available',
      };
    }

    return {
      success: true,
      weather,
    };
  }

  /**
   * Get weather-based recommendations
   * GET /api/v1/weather/recommendations?lat=37.7749&lon=-122.4194
   */
  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Query('lat') lat: string, @Query('lon') lon: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates',
      };
    }

    const weather = await this.weatherService.getCurrentWeather(latitude, longitude);

    if (!weather) {
      return {
        success: false,
        error: 'Weather data not available',
      };
    }

    const recommendations = this.weatherService.getWeatherBasedRecommendations(weather);

    return {
      success: true,
      weather,
      recommendations,
    };
  }

  /**
   * Check if weather should trigger a promotion
   * GET /api/v1/weather/promotion-trigger?lat=37.7749&lon=-122.4194
   */
  @Get('promotion-trigger')
  async checkPromotionTrigger(@Query('lat') lat: string, @Query('lon') lon: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates',
      };
    }

    const weather = await this.weatherService.getCurrentWeather(latitude, longitude);

    if (!weather) {
      return {
        success: false,
        error: 'Weather data not available',
      };
    }

    const trigger = this.weatherService.shouldTriggerWeatherPromotion(weather);

    return {
      success: true,
      weather,
      trigger,
    };
  }

  /**
   * Get cache statistics (for debugging)
   * GET /api/v1/weather/cache-stats
   */
  @Get('cache-stats')
  getCacheStats() {
    const stats = this.weatherService.getCacheStats();
    return {
      success: true,
      stats,
    };
  }
}
