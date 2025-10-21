import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RedeemPromoCodeDto {
  @ApiProperty({
    description: 'Promo code to redeem',
    example: 'WELCOME2025',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate redemptions',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
