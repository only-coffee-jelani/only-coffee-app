import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Note: PromoType doesn't exist in new schema
// TODO: Refactor to use PromotionDiscountType
enum PromoType {
  PERCENT_OFF = 'PERCENT_OFF',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  MULTI_USE = 'MULTI_USE',
}

export class CreatePromoCodeDto {
  @ApiProperty({
    description: 'Promo code (will be normalized to uppercase)',
    example: 'WELCOME2025',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({
    description: 'Description of the promo code',
    example: 'Welcome offer for new customers',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of promo code',
    enum: PromoType,
    example: PromoType.MULTI_USE,
  })
  @IsEnum(PromoType)
  type: PromoType;

  @ApiPropertyOptional({
    description: 'Maximum number of uses (null for unlimited)',
    example: 500,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Expiration date/time (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({
    description: 'Configuration for coupons to generate',
    example: [
      {
        type: 'percent_off',
        percentOff: 50,
        label: '50% Off Drink',
        expiresInDays: 7,
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  couponConfig: any[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
