import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemCouponDto {
  @ApiProperty({
    description: 'Coupon ID to redeem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  couponId: string;

  @ApiProperty({
    description: 'Order ID to apply coupon to',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}
