import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Payment intent ID to confirm',
    example: 'pi_1234567890abcdef',
  })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Order ID associated with this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Payment method ID (if not already attached)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
