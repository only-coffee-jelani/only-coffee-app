import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsBoolean, IsInt, IsNumber, Min } from 'class-validator';

export class EndSplashSessionDto {
  @ApiProperty({
    description: 'UUID of the splash session',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Whether the splash was skipped',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wasSkipped?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the splash was clicked',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  wasClicked?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the splash auto-completed',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  autoCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user converted (made a purchase)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wasConverted?: boolean;

  @ApiPropertyOptional({
    description: 'UUID of the order (if converted)',
    example: '9b252f8e-b531-43c9-93e0-ae72a6a3e3fa',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Time spent viewing in seconds',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  viewTimeSeconds?: number;

  @ApiPropertyOptional({
    description: 'Revenue amount (if converted)',
    example: 15.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueAmount?: number;
}

