import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustPointsDto {
  @ApiProperty({
    description: 'Number of points to adjust (positive or negative)',
    example: 100,
  })
  @IsNumber()
  points: number;

  @ApiProperty({
    description: 'Reason for the adjustment',
    example: 'Compensation for delayed order',
  })
  @IsString()
  reason: string;
}
