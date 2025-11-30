import { ApiProperty } from '@nestjs/swagger';

/**
 * Enterprise-level: Simplified order data for payment confirmation response
 * Avoids circular references and includes only essential order information
 */
export class OrderSummaryDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'User ID (null for guest orders)', nullable: true })
  userId: string | null;

  @ApiProperty({ description: 'Store ID' })
  storeId: string;

  @ApiProperty({ description: 'Order status ID' })
  orderStatusId: string;

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  tax: number;

  @ApiProperty({ description: 'Discount total' })
  discountTotal: number;

  @ApiProperty({ description: 'Total amount' })
  total: number;

  @ApiProperty({ description: 'Pickup time', nullable: true })
  pickupTime: Date | null;

  @ApiProperty({ description: 'Order placed timestamp' })
  placedAt: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

/**
 * Enterprise-level: Payment confirmation response
 */
export class ConfirmPaymentResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Payment intent ID' })
  paymentIntentId: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;

  @ApiProperty({ description: 'Order summary', type: OrderSummaryDto })
  order: OrderSummaryDto;
}

