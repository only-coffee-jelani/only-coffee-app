import { IsDateString, IsNotEmpty } from 'class-validator';

export class UseTokenDto {
  @IsDateString()
  @IsNotEmpty()
  missedDate: string; // ISO date string for the missed date
}
