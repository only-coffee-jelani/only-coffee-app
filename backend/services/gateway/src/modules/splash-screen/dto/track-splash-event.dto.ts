import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsInt, IsNumber, IsString, Min } from 'class-validator';

export enum SplashEventType {
  IMPRESSION = 'impression',
  CLICK = 'click',
  SKIP = 'skip',
  COMPLETE = 'complete',
  ORDER = 'order',
}

export class TrackSplashEventDto {
  @ApiProperty({
    description: 'UUID of the splash screen',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsUUID()
  splashId: string;

  @ApiProperty({
    description: 'Type of event',
    enum: SplashEventType,
    example: SplashEventType.IMPRESSION,
  })
  @IsEnum(SplashEventType)
  eventType: SplashEventType;

  @ApiPropertyOptional({
    description: 'UUID of the user (optional for anonymous users)',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the device',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the store',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the user segment',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the session',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the order (for order events)',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Time spent viewing the splash screen in seconds',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  viewTimeSeconds?: number;

  @ApiPropertyOptional({
    description: 'Revenue amount for order events',
    example: 15.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueAmount?: number;

  @ApiPropertyOptional({
    description: 'Experiment group (for A/B testing)',
    example: 'control',
  })
  @IsOptional()
  @IsString()
  experimentGroup?: string;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'OS type',
    example: 'android',
  })
  @IsOptional()
  @IsString()
  osType?: string;

  @ApiPropertyOptional({
    description: 'Device model',
    example: 'Pixel 7',
  })
  @IsOptional()
  @IsString()
  deviceModel?: string;
}

