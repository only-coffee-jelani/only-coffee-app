import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';

export enum AnalyticsTimeRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  CUSTOM = 'custom',
}

export class GetSplashAnalyticsDto {
  @ApiPropertyOptional({
    description: 'UUID of the splash screen (optional, if not provided returns all)',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  splashId?: string;

  @ApiPropertyOptional({
    description: 'Time range for analytics',
    enum: AnalyticsTimeRange,
    example: AnalyticsTimeRange.LAST_7_DAYS,
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeRange)
  timeRange?: AnalyticsTimeRange;

  @ApiPropertyOptional({
    description: 'Start date for custom range (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom range (ISO 8601 format)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'UUID of the store to filter by',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the user segment to filter by',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;
}

