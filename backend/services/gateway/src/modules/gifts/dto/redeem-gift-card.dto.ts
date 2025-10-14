import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RedeemGiftCardDto {
  @ApiProperty({
    description: 'Gift card code',
    example: 'COFFEE2024ABCD1234',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Order ID to apply gift card to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Amount to redeem (for partial redemption of AMOUNT type)',
    example: 10.00,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  redeemAmount?: number;
}
