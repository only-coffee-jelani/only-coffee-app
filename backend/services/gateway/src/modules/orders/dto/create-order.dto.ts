import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '@shared/database/entities';

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

  @ApiProperty({ enum: OrderType, required: false })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

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
}
