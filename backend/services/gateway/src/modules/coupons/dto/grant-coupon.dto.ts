import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsObject,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@shared/database/entities';

export class GrantCouponDto {
  @ApiProperty({
    description: 'User ID to grant coupon to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type of coupon',
    enum: CouponType,
    example: CouponType.PERCENT_OFF,
  })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({
    description: 'Display label for coupon',
    example: '50% Off Drink',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({
    description: 'Coupon description',
    example: 'Get 50% off any drink',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Fixed amount value in cents (for FIXED_AMOUNT type)',
    example: 500,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  valueCents?: number;

  @ApiPropertyOptional({
    description: 'Percent off (for PERCENT_OFF type)',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  percentOff?: number;

  @ApiPropertyOptional({
    description: 'Price override in cents (for FIXED_PRICE type)',
    example: 199,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  priceOverrideCents?: number;

  @ApiPropertyOptional({
    description: 'Eligible/excluded items configuration',
    example: { exclude: ['waffolino', 'pistacchio'] },
  })
  @IsObject()
  @IsOptional()
  eligibleItems?: any;

  @ApiPropertyOptional({
    description: 'Redemption channels',
    example: 'both',
  })
  @IsString()
  @IsOptional()
  channels?: string;

  @ApiPropertyOptional({
    description: 'Days until expiration',
    example: 7,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  expiresInDays?: number;
}
