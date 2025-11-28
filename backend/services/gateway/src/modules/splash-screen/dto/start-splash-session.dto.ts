import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class StartSplashSessionDto {
  @ApiProperty({
    description: 'UUID of the splash screen',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsUUID()
  splashId: string;

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

