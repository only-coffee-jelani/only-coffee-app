import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Order ID for this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Amount in cents (e.g., 1050 = $10.50)',
    example: 1050,
  })
  @IsNumber()
  @Min(50) // Minimum $0.50
  amount: number;

  @ApiProperty({
    description: 'Payment method ID (optional for saved payment methods)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Description for the payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
