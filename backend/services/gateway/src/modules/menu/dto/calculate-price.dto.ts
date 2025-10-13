import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ModifierDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class CalculatePriceDto {
  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty({ type: [ModifierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  modifiers: ModifierDto[];
}
