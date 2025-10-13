import { IsNumber, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty({
    description: 'Number of points to redeem (must be multiple of 500)',
    example: 500,
    minimum: 500,
  })
  @IsNumber()
  @Min(500)
  points: number;

  @ApiProperty({
    description: 'Order ID to apply redemption to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Optional description for the redemption',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
