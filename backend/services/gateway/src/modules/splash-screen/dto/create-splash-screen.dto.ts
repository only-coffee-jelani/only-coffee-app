import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateSplashScreenDto {
  @ApiPropertyOptional({ description: 'Title of the splash screen', example: 'Welcome to Only Coffee' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Subtitle or description', example: 'Your favorite coffee, delivered fresh' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'UUID of the image asset', example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa' })
  @IsUUID()
  imageAssetId: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 3, default: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Start date/time (ISO 8601)', example: '2025-11-25T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: 'End date/time (ISO 8601)', example: '2026-02-28T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ description: 'Whether the splash screen is active', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Priority (higher = shown first)', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ description: 'Target user segment UUID', example: null })
  @IsOptional()
  @IsUUID()
  targetSegmentId?: string;

  @ApiPropertyOptional({ description: 'Target store UUID', example: null })
  @IsOptional()
  @IsUUID()
  targetStoreId?: string;

  @ApiPropertyOptional({ description: 'Deep link URL', example: '/menu/featured' })
  @IsOptional()
  @IsString()
  deeplink?: string;
}

