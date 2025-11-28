import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsInt, Min } from 'class-validator';

/**
 * DTO for tracking carousel events
 * 
 * Supports comprehensive event tracking including:
 * - Impressions, clicks, swipes, auto-advances
 * - Position tracking within carousel
 * - Time-on-slide metrics
 * - Swipe velocity for UX analysis
 * - Device and screen metrics
 * - Conversion tracking
 */
export class TrackCarouselEventDto {
  @ApiProperty({
    description: 'Carousel item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  carouselItemId: string;

  @ApiProperty({
    description: 'Carousel ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  carouselId: string;

  @ApiProperty({
    description: 'Event type',
    enum: [
      'impression',
      'click',
      'swipe_left',
      'swipe_right',
      'auto_advance',
      'manual_advance',
      'view_complete',
      'order',
      'add_to_cart',
    ],
    example: 'impression',
  })
  @IsEnum([
    'impression',
    'click',
    'swipe_left',
    'swipe_right',
    'auto_advance',
    'manual_advance',
    'view_complete',
    'order',
    'add_to_cart',
  ])
  eventType: string;

  @ApiProperty({
    description: 'Position of this item in the carousel (0-indexed)',
    example: 0,
  })
  @IsInt()
  @Min(0)
  positionInCarousel: number;

  @ApiProperty({
    description: 'Total number of items in the carousel',
    example: 5,
  })
  @IsInt()
  @Min(1)
  totalItemsInCarousel: number;

  @ApiPropertyOptional({
    description: 'User ID (if authenticated)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Device ID (for anonymous tracking)',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Store ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'User segment ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({
    description: 'A/B test experiment group',
    example: 'variant_a',
  })
  @IsOptional()
  @IsString()
  experimentGroup?: string;

  @ApiPropertyOptional({
    description: 'Time spent viewing this slide in seconds',
    example: 3.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeOnSlideSeconds?: number;

  @ApiPropertyOptional({
    description: 'Swipe velocity (pixels per second)',
    example: 450.5,
  })
  @IsOptional()
  @IsNumber()
  swipeVelocity?: number;

  @ApiPropertyOptional({
    description: 'Deeplink URL if carousel item has one',
    example: 'onlycoffee://menu/item/123',
  })
  @IsOptional()
  @IsString()
  deeplink?: string;

  @ApiPropertyOptional({
    description: 'Order ID (for conversion tracking)',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Revenue amount (for conversion tracking)',
    example: 15.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueAmount?: number;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Operating system type',
    enum: ['ios', 'android', 'web'],
    example: 'android',
  })
  @IsOptional()
  @IsEnum(['ios', 'android', 'web'])
  osType?: string;

  @ApiPropertyOptional({
    description: 'Device model',
    example: 'Pixel 7',
  })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({
    description: 'Screen width in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  screenWidth?: number;

  @ApiPropertyOptional({
    description: 'Screen height in pixels',
    example: 2400,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  screenHeight?: number;

  @ApiPropertyOptional({
    description: 'Connection type (wifi, cellular, etc.)',
    example: 'wifi',
  })
  @IsOptional()
  @IsString()
  connectionType?: string;
}

