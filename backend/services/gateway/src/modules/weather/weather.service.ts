import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export enum WeatherCondition {
  CLEAR = 'Clear',
  CLOUDS = 'Clouds',
  RAIN = 'Rain',
  DRIZZLE = 'Drizzle',
  THUNDERSTORM = 'Thunderstorm',
  SNOW = 'Snow',
  MIST = 'Mist',
  FOG = 'Fog',
  HAZE = 'Haze',
}

export interface WeatherData {
  temperature: number; // Celsius
  temperatureFahrenheit: number;
  feelsLike: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCoverage: number;
  isHot: boolean; // > 25°C / 77°F
  isCold: boolean; // < 10°C / 50°F
  isRaining: boolean;
  isSunny: boolean;
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
    city?: string;
  };
}

interface WeatherCache {
  data: WeatherData;
  expiresAt: Date;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly cache = new Map<string, WeatherCache>();
  private readonly cacheDuration = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn(
        'WEATHER_API_KEY not set. Weather features will be disabled. Get a free API key from https://openweathermap.org/api',
      );
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    if (!this.apiKey) {
      this.logger.debug('Weather API key not configured, skipping weather fetch');
      return null;
    }

    // Check cache first
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`Weather cache hit for ${cacheKey}`);
      return cached.data;
    }

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'metric', // Celsius
        },
        timeout: 5000, // 5 second timeout
      });

      const weatherData = this.parseWeatherResponse(response.data, latitude, longitude);

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        expiresAt: new Date(Date.now() + this.cacheDuration),
      });

      // Clean up old cache entries (simple LRU)
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      this.logger.log(
        `Weather fetched: ${weatherData.temperature}°C, ${weatherData.condition} at (${latitude}, ${longitude})`,
      );

      return weatherData;
    } catch (error) {
      this.logger.error(`Failed to fetch weather data: ${error.message}`);
      return null;
    }
  }

  /**
   * Get weather by city name
   */
  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
        },
        timeout: 5000,
      });

      const weatherData = this.parseWeatherResponse(
        response.data,
        response.data.coord.lat,
        response.data.coord.lon,
      );

      return weatherData;
    } catch (error) {
      this.logger.error(`Failed to fetch weather for city ${city}: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse OpenWeatherMap API response
   */
  private parseWeatherResponse(data: any, lat: number, lon: number): WeatherData {
    const tempCelsius = data.main.temp;
    const tempFahrenheit = (tempCelsius * 9) / 5 + 32;
    const condition = data.weather[0].main as WeatherCondition;

    return {
      temperature: Math.round(tempCelsius * 10) / 10,
      temperatureFahrenheit: Math.round(tempFahrenheit * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      condition,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      cloudCoverage: data.clouds.all,
      isHot: tempCelsius > 25, // > 77°F
      isCold: tempCelsius < 10, // < 50°F
      isRaining: [
        WeatherCondition.RAIN,
        WeatherCondition.DRIZZLE,
        WeatherCondition.THUNDERSTORM,
      ].includes(condition),
      isSunny: condition === WeatherCondition.CLEAR && data.clouds.all < 20,
      timestamp: new Date(),
      location: {
        lat,
        lon,
        city: data.name,
      },
    };
  }

  /**
   * Get weather-based product recommendations
   */
  getWeatherBasedRecommendations(weather: WeatherData): {
    recommendedCategories: string[];
    reasoning: string;
  } {
    const recommendations: string[] = [];
    let reasoning = '';

    if (weather.isHot) {
      recommendations.push('iced_coffee', 'cold_brew', 'iced_tea', 'refreshers');
      reasoning = `Hot weather (${weather.temperatureFahrenheit}°F) - recommend cold drinks`;
    } else if (weather.isCold) {
      recommendations.push('hot_coffee', 'hot_chocolate', 'tea', 'lattes');
      reasoning = `Cold weather (${weather.temperatureFahrenheit}°F) - recommend hot drinks`;
    } else {
      recommendations.push('coffee', 'lattes', 'specialty_drinks');
      reasoning = `Moderate weather (${weather.temperatureFahrenheit}°F) - general recommendations`;
    }

    if (weather.isRaining) {
      recommendations.push('pastries', 'comfort_food');
      reasoning += '; Rainy day - add comfort items';
    }

    return {
      recommendedCategories: recommendations,
      reasoning,
    };
  }

  /**
   * Determine if weather conditions warrant a promotion
   */
  shouldTriggerWeatherPromotion(weather: WeatherData): {
    shouldTrigger: boolean;
    promotionType: string | null;
    reason: string;
  } {
    // Extreme heat - promote iced drinks
    if (weather.temperature > 30) {
      // > 86°F
      return {
        shouldTrigger: true,
        promotionType: 'extreme_heat_iced_drinks',
        reason: `Extreme heat (${weather.temperatureFahrenheit}°F) - promote iced drinks`,
      };
    }

    // Cold weather - promote hot drinks
    if (weather.temperature < 5) {
      // < 41°F
      return {
        shouldTrigger: true,
        promotionType: 'cold_weather_hot_drinks',
        reason: `Very cold (${weather.temperatureFahrenheit}°F) - promote hot drinks`,
      };
    }

    // Rainy day - comfort promo
    if (weather.isRaining) {
      return {
        shouldTrigger: true,
        promotionType: 'rainy_day_comfort',
        reason: `Rainy day - promote comfort drinks and pastries`,
      };
    }

    // Hot summer day
    if (weather.temperature > 25 && weather.isSunny) {
      return {
        shouldTrigger: true,
        promotionType: 'summer_refresher',
        reason: `Hot sunny day (${weather.temperatureFahrenheit}°F) - promote refreshers`,
      };
    }

    return {
      shouldTrigger: false,
      promotionType: null,
      reason: 'No extreme weather conditions',
    };
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Weather cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
