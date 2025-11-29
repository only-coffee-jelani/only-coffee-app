import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for store hours
 */
export class StoreHoursDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty({
    description: 'Opening time (HH:MM:SS format)',
    example: '06:00:00',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'openTime must be in HH:MM:SS format',
  })
  openTime: string;

  @ApiProperty({
    description: 'Closing time (HH:MM:SS format)',
    example: '20:00:00',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'closeTime must be in HH:MM:SS format',
  })
  closeTime: string;
}

/**
 * DTO for creating a new store with enterprise-level validation
 *
 * Location field requirements:
 * - North America + USA: address, city, state, zipCode required
 * - Other locations: address, city, country required (state/zipCode optional)
 */
export class CreateStoreDto {
  @ApiProperty({
    description: 'Store name',
    example: 'Only Coffee - Downtown',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Store type ID (UUID)',
    example: '4922da94-f130-4503-917b-152660f30b9b',
  })
  @IsOptional()
  @IsUUID()
  storeTypeId?: string;

  @ApiProperty({
    description: 'Street address',
    example: '1040 Esplanade Avenue',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'City name (required for all stores)',
    example: 'New Orleans',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({
    description: 'State/Province (required for USA, optional for other countries)',
    example: 'Louisiana',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  // Required if country is USA
  @ValidateIf((o) => o.countryCode === 'US' || o.country === 'United States')
  @IsString()
  @MinLength(2)
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP/Postal code (required for USA, optional for other countries)',
    example: '70116',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  // Required if country is USA
  @ValidateIf((o) => o.countryCode === 'US' || o.country === 'United States')
  @IsString()
  @MinLength(3)
  zipCode?: string;

  @ApiProperty({
    description: 'Country name (required for all stores)',
    example: 'United States',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be 2 uppercase letters (ISO 3166-1 alpha-2)' })
  countryCode: string;

  @ApiProperty({
    description: 'Continent name',
    example: 'North America',
    enum: ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica'],
  })
  @IsString()
  @IsIn(['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica'])
  continent: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 29.9656918,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -90.0635402,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '5044171010',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'store@only-coffee.us',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Toast POS location ID',
    example: 'TOAST-LOC-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  toastLocationId?: string;

  @ApiPropertyOptional({
    description: 'Store image URL',
    example: 'https://s3.amazonaws.com/only-coffee/stores/downtown.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  storeImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Store description',
    example: 'Cozy downtown location with outdoor seating',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone identifier',
    example: 'America/Chicago',
    default: 'America/Chicago',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Whether the store is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the store is accepting orders',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;

  @ApiPropertyOptional({
    description: 'Store operating hours (array of 7 entries for each day of week)',
    type: [StoreHoursDto],
    example: [
      { dayOfWeek: 0, openTime: '08:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 1, openTime: '06:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 2, openTime: '06:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 3, openTime: '06:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 4, openTime: '06:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 5, openTime: '06:00:00', closeTime: '20:00:00' },
      { dayOfWeek: 6, openTime: '08:00:00', closeTime: '20:00:00' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreHoursDto)
  storeHours?: StoreHoursDto[];
}

