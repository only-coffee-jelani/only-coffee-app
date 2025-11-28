import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId: string;

  @ApiProperty()
  @IsString()
  itemName: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  basePrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  modifiersPrice?: number;

  @ApiProperty()
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  modifiers?: Array<{ name: string; value: string; price: number }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false, description: 'Order type (pickup, delivery, etc.)' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiProperty({
    description: 'Either "ASAP" or ISO date string',
    example: '2024-10-13T14:30:00Z',
  })
  @IsString()
  pickupTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ required: false, description: 'Optional coupon ID to apply to the order' })
  @IsOptional()
  @IsString()
  couponId?: string;
}
